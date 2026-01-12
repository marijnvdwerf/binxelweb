// Pixel rendering engine for Binxelview
import { Preset, MAX_BPP, TwiddleMode } from './types';

export interface RenderContext {
  data: Uint8Array;
  preset: Preset;
  posByte: number;
  posBit: number;
  getPaletteColor: (index: number) => number; // Returns ARGB as number
  backgroundColor: number;
}

// Prepare bit stride array based on preset settings
function prepareBitStride(preset: Preset): number[] {
  const bitStride: number[] = new Array(MAX_BPP);
  if (preset.chunky) {
    for (let i = 0; i < preset.bpp; i++) {
      bitStride[i] = i;
    }
  } else {
    for (let i = 0; i < preset.bpp; i++) {
      bitStride[i] = preset.bitStrideBit[i] + preset.bitStrideByte[i] * 8;
    }
  }
  return bitStride;
}

// Build twiddle cache for Morton ordering
function buildTwiddleCache(w: number, h: number, mode: TwiddleMode): Int32Array {
  const cache = new Int32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let twx = mode === TwiddleMode.N ? y : x;
      let twy = mode === TwiddleMode.N ? x : y;
      let bit = 0;
      let twxy = 0;
      while (twx > 0 || twy > 0) {
        twxy |=
          ((twx >> bit) & 1) << (bit * 2 + 0) |
          ((twy >> bit) & 1) << (bit * 2 + 1);
        twx &= ~(1 << bit);
        twy &= ~(1 << bit);
        bit++;
      }
      cache[x + y * w] = twxy;
    }
  }
  return cache;
}

// Read a single pixel value from the data
function buildPixel(
  pos: number,
  bpp: number,
  littleEndian: boolean,
  data: Uint8Array,
  bitStride: number[]
): number {
  let p = 0;
  for (let b = 0; b < bpp; b++) {
    const bpos = pos + bitStride[b];
    const dposByte = bpos >> 3;
    if (dposByte < 0 || dposByte >= data.length) {
      return -1;
    }
    let dposBit = bpos & 7;
    if (!littleEndian) dposBit = 7 - dposBit;
    p |= ((data[dposByte] >> dposBit) & 1) << b;
  }
  return p;
}

// Render a single tile of pixels
function renderTile(
  pos: number,
  preset: Preset,
  data: Uint8Array,
  bitStride: number[],
  pixelStride: number,
  rowStride: number,
  tileShiftX: number,
  tileShiftY: number,
  twiddleCache: Int32Array | null,
  output: Int32Array,
  outputOffset: number,
  outputStride: number
): void {
  const { bpp, littleEndian, width: w, height: h, tileSizeX, tileSizeY } = preset;

  let posRow = pos;
  let planeY = 0;

  for (let y = 0; y < h; y++) {
    let planeX = 0;
    let posPixel = posRow;
    const outRow = outputOffset + y * outputStride;

    for (let x = 0; x < w; x++) {
      if (twiddleCache) {
        const twxy = twiddleCache[x + y * w];
        const twy = Math.floor(twxy / w);
        const twx = twxy % w;
        posPixel = pos + twy * rowStride + twx * pixelStride;
      }

      output[outRow + x] = buildPixel(posPixel, bpp, littleEndian, data, bitStride);
      posPixel += pixelStride;
      planeX++;

      if (tileSizeX > 0 && planeX >= tileSizeX) {
        planeX = 0;
        posPixel += tileShiftX;
      }
    }

    posRow += rowStride;
    planeY++;

    if (tileSizeY > 0 && planeY >= tileSizeY) {
      planeY = 0;
      posRow += tileShiftY;
    }
  }
}

export interface GridRenderResult {
  pixelBuffer: Int32Array;
  colorBuffer: Uint32Array;
  width: number;
  height: number;
  gridX: number;
  gridY: number;
  padX: number;
  padY: number;
  tileWidthPadded: number;
  tileHeightPadded: number;
}

// Render the full grid of tiles
export function renderGrid(
  ctx: RenderContext,
  viewWidth: number,
  viewHeight: number,
  zoom: number,
  hideGrid: boolean,
  horizontalLayout: boolean
): GridRenderResult {
  const { data, preset, posByte, posBit, getPaletteColor, backgroundColor } = ctx;

  // Calculate grid dimensions
  const tw = preset.width;
  const th = preset.height;
  const padX = (tw === 1 || hideGrid) ? 0 : 1;
  const padY = (th === 1 || hideGrid) ? 0 : 1;
  const twp = padX + tw;
  const thp = padY + th;

  // Calculate how many tiles fit in the view
  const sx = Math.ceil(viewWidth / zoom);
  const sy = Math.ceil(viewHeight / zoom);

  let gx: number, gy: number;
  if (horizontalLayout) {
    gx = Math.floor(sx / twp) || 1;
    gy = Math.ceil(sy / thp) || 1;
  } else {
    gx = Math.ceil(sx / twp) || 1;
    gy = Math.floor(sy / thp) || 1;
  }

  // Calculate pixel buffer dimensions
  const pixelsW = gx * twp + padX;
  const pixelsH = gy * thp + padY;
  const pixelsNeeded = pixelsW * pixelsH;

  const pixelBuffer = new Int32Array(pixelsNeeded);
  const colorBuffer = new Uint32Array(pixelsNeeded);

  // Initialize pixel buffer to -1 (invalid)
  pixelBuffer.fill(-1);

  // Prepare rendering parameters
  const bitStride = prepareBitStride(preset);
  const pixelStride = preset.pixelStrideBit + preset.pixelStrideByte * 8;
  const rowStride = preset.rowStrideBit + preset.rowStrideByte * 8;
  const nextStride = preset.nextStrideBit + preset.nextStrideByte * 8;
  const tileSizeX = preset.tileSizeX;
  const tileSizeY = preset.tileSizeY;
  const tileShiftX = tileSizeX > 0
    ? (preset.tileStrideBitX + preset.tileStrideByteX * 8) - tileSizeX * pixelStride
    : 0;
  const tileShiftY = tileSizeY > 0
    ? (preset.tileStrideBitY + preset.tileStrideByteY * 8) - tileSizeY * rowStride
    : 0;

  // Build twiddle cache if needed
  const twiddleCache = preset.twiddle !== TwiddleMode.NONE
    ? buildTwiddleCache(tw, th, preset.twiddle)
    : null;

  // Starting position in bits
  let pos = posByte * 8 + posBit;

  // Render grid
  const rgx = horizontalLayout ? gy : gx;
  const rgy = horizontalLayout ? gx : gy;

  for (let tx = 0; tx < rgx; tx++) {
    for (let ty = 0; ty < rgy; ty++) {
      let sx_: number, sy_: number;
      if (horizontalLayout) {
        sx_ = padX + twp * ty;
        sy_ = padY + thp * tx;
      } else {
        sx_ = padX + twp * tx;
        sy_ = padY + thp * ty;
      }

      renderTile(
        pos,
        preset,
        data,
        bitStride,
        pixelStride,
        rowStride,
        tileShiftX,
        tileShiftY,
        twiddleCache,
        pixelBuffer,
        sx_ + sy_ * pixelsW,
        pixelsW
      );

      pos += nextStride;
    }
  }

  // Convert pixel values to colors
  for (let i = 0; i < pixelsNeeded; i++) {
    const p = pixelBuffer[i];
    colorBuffer[i] = p < 0 ? backgroundColor : getPaletteColor(p);
  }

  return {
    pixelBuffer,
    colorBuffer,
    width: pixelsW,
    height: pixelsH,
    gridX: gx,
    gridY: gy,
    padX,
    padY,
    tileWidthPadded: twp,
    tileHeightPadded: thp,
  };
}

// Render the color buffer to a canvas with zoom
export function renderToCanvas(
  canvas: HTMLCanvasElement,
  result: GridRenderResult,
  zoom: number
): void {
  const { colorBuffer, width, height } = result;
  const canvasWidth = width * zoom;
  const canvasHeight = height * zoom;

  if (canvas.width !== canvasWidth || canvas.height !== canvasHeight) {
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.createImageData(canvasWidth, canvasHeight);
  const pixels = new Uint32Array(imageData.data.buffer);

  let cy = 0;
  let zy = 0;

  for (let y = 0; y < canvasHeight; y++) {
    const outRow = y * canvasWidth;

    if (zy <= 0) {
      const colorRow = cy * width;
      cy++;

      let cx = 0;
      let zx = 0;

      for (let x = 0; x < canvasWidth; x++) {
        if (zx <= 0) {
          pixels[outRow + x] = colorBuffer[colorRow + cx];
          cx++;
          zx = zoom;
        } else {
          pixels[outRow + x] = pixels[outRow + x - 1];
        }
        zx--;
      }
      zy = zoom;
    } else {
      // Copy from previous row
      const prevRow = (y - 1) * canvasWidth;
      for (let x = 0; x < canvasWidth; x++) {
        pixels[outRow + x] = pixels[prevRow + x];
      }
    }
    zy--;
  }

  ctx.putImageData(imageData, 0, 0);
}

// Read a single pixel value at a given bit position (for info display)
export function readPixelAt(
  data: Uint8Array,
  preset: Preset,
  posBits: number
): number {
  const bitStride = prepareBitStride(preset);
  return buildPixel(posBits, preset.bpp, preset.littleEndian, data, bitStride);
}

// Calculate the bit position for a specific pixel in the grid
export function getPixelPosition(
  preset: Preset,
  posByte: number,
  posBit: number,
  tile: number,
  localX: number,
  localY: number
): number {
  const rowStride = preset.rowStrideByte * 8 + preset.rowStrideBit;
  const pixelStride = preset.pixelStrideByte * 8 + preset.pixelStrideBit;
  const nextStride = preset.nextStrideByte * 8 + preset.nextStrideBit;

  let pos = posByte * 8 + posBit + nextStride * tile + rowStride * localY + pixelStride * localX;

  if (preset.tileSizeX !== 0) {
    pos += Math.floor(localX / preset.tileSizeX) *
      ((preset.tileStrideByteX * 8 + preset.tileStrideBitX) - preset.tileSizeX * pixelStride);
  }
  if (preset.tileSizeY !== 0) {
    pos += Math.floor(localY / preset.tileSizeY) *
      ((preset.tileStrideByteY * 8 + preset.tileStrideBitY) - preset.tileSizeY * rowStride);
  }

  return pos;
}
