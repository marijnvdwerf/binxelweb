// Palette system for Binxelview
import { PaletteMode, PALETTE_SIZE, PALETTE_BITS } from './types';

// Convert RGB to ARGB number (for canvas rendering)
export function rgbToArgb(r: number, g: number, b: number): number {
  return 0xFF000000 | (b << 16) | (g << 8) | r;
}

// Convert hex color string to ARGB
export function hexToArgb(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return rgbToArgb(r, g, b);
}

// Convert ARGB to hex color string
export function argbToHex(argb: number): string {
  const r = argb & 0xFF;
  const g = (argb >> 8) & 0xFF;
  const b = (argb >> 16) & 0xFF;
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// MurmurHash3-based random color generation
function randomColorHash(x: number, seed: number): number {
  const C1 = 0xCC9E2D51;
  const C2 = 0x1B873593;
  const C3 = 0xE6546B64;
  const C4 = 0x85EBCA6B;
  const C5 = 0xC2B2AE35;

  let h = seed >>> 0;
  let k = x >>> 0;

  k = Math.imul(k, C1);
  k = (k << 15) | (k >>> 17);
  k = Math.imul(k, C2);

  h ^= k;
  h = (h << 13) | (h >>> 19);
  h = Math.imul(h, 5) + C3;

  h ^= h >>> 16;
  h = Math.imul(h, C4);
  h ^= h >>> 13;
  h = Math.imul(h, C5);
  h ^= h >>> 16;

  return (h & 0x00FFFFFF) | 0xFF000000;
}

// Cubehelix palette generation (Dave Green's algorithm)
function cubeHelix(x: number, maxValue: number): number {
  const fract = x / maxValue;
  const start = 0.5;
  const rotations = -2.0;
  const saturation = 1.8;

  const angle = 2.0 * Math.PI * (start / 3.0 + 1.0 + rotations * fract);
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const amp = 255.0 * saturation * fract * ((1.0 - fract) / 2.0);
  const fractScaled = fract * 255.0;

  let rf = fractScaled + amp * (-0.14861 * cos + 1.78277 * sin);
  let gf = fractScaled + amp * (-0.29227 * cos - 0.90649 * sin);
  let bf = fractScaled + amp * (1.97294 * cos);

  rf = Math.max(0, Math.min(255, rf));
  gf = Math.max(0, Math.min(255, gf));
  bf = Math.max(0, Math.min(255, bf));

  return rgbToArgb(Math.floor(rf), Math.floor(gf), Math.floor(bf));
}

export interface PaletteContext {
  mode: PaletteMode;
  bpp: number;
  customPalette: string[]; // Hex colors
  randomSeed: number;
}

// Generate a new random seed
export function generateRandomSeed(): number {
  return Math.floor(Math.random() * 0xFFFFFFFF);
}

// Calculate RGB range parameters for auto palette
function getRgbRangeParams(bpp: number) {
  const rb = Math.floor(bpp / 3);
  const rr = Math.floor((bpp - rb) / 2);
  const rg = bpp - (rr + rb);

  return {
    rShift: 0,
    gShift: rr,
    bShift: rr + rg,
    rMask: Math.max(1, (1 << rr) - 1),
    gMask: Math.max(1, (1 << rg) - 1),
    bMask: Math.max(1, (1 << rb) - 1),
  };
}

// Get auto palette color
function getAutoPaletteColor(
  index: number,
  mode: PaletteMode,
  bpp: number,
  randomSeed: number
): number {
  const maxValue = (1 << bpp) - 1;

  switch (mode) {
    case PaletteMode.RGB: {
      const params = getRgbRangeParams(bpp);
      const r = Math.floor(((index >> params.rShift) & params.rMask) * 255 / params.rMask);
      const g = Math.floor(((index >> params.gShift) & params.gMask) * 255 / params.gMask);
      const b = Math.floor(((index >> params.bShift) & params.bMask) * 255 / params.bMask);
      return rgbToArgb(r, g, b);
    }

    case PaletteMode.RANDOM:
      return randomColorHash(index, randomSeed);

    case PaletteMode.GREYSCALE: {
      const grey = Math.floor((index * 255) / maxValue);
      return rgbToArgb(grey, grey, grey);
    }

    case PaletteMode.CUBEHELIX:
      return cubeHelix(index, maxValue);

    default:
      return rgbToArgb(128, 128, 128);
  }
}

// Create a palette lookup function
export function createPaletteLookup(ctx: PaletteContext): (index: number) => number {
  const { mode, bpp, customPalette, randomSeed } = ctx;

  // For high BPP, always use auto palette
  if (bpp > PALETTE_BITS) {
    return (index: number) => getAutoPaletteColor(index, mode === PaletteMode.CUSTOM ? PaletteMode.RGB : mode, bpp, randomSeed);
  }

  // For custom palette mode
  if (mode === PaletteMode.CUSTOM) {
    // Pre-convert custom palette to ARGB values
    const paletteSize = 1 << bpp;
    const lookup = new Uint32Array(paletteSize);
    for (let i = 0; i < paletteSize; i++) {
      if (i < customPalette.length && customPalette[i]) {
        lookup[i] = hexToArgb(customPalette[i]);
      } else {
        // Default grey stripes for unset colors
        const v = (i & 1) ? 0x84 : 0x74;
        lookup[i] = rgbToArgb(v, v, v);
      }
    }
    return (index: number) => lookup[index & (paletteSize - 1)] ?? 0xFF808080;
  }

  // For auto palette modes, pre-generate the palette
  const paletteSize = 1 << bpp;
  const lookup = new Uint32Array(paletteSize);
  for (let i = 0; i < paletteSize; i++) {
    lookup[i] = getAutoPaletteColor(i, mode, bpp, randomSeed);
  }
  return (index: number) => lookup[index] ?? 0xFF808080;
}

// Generate palette as array of hex color strings
export function generatePalette(ctx: PaletteContext): string[] {
  const { mode, bpp, customPalette, randomSeed } = ctx;
  const effectiveBpp = Math.min(bpp, PALETTE_BITS);
  const paletteSize = 1 << effectiveBpp;
  const result: string[] = [];

  if (mode === PaletteMode.CUSTOM) {
    for (let i = 0; i < paletteSize; i++) {
      if (i < customPalette.length && customPalette[i]) {
        result.push(customPalette[i]);
      } else {
        result.push(getDefaultCustomColor(i));
      }
    }
  } else {
    for (let i = 0; i < paletteSize; i++) {
      const argb = getAutoPaletteColor(i, mode, effectiveBpp, randomSeed);
      result.push(argbToHex(argb));
    }
  }

  return result;
}

// Initialize a default custom palette (empty - generated on demand)
export function createDefaultCustomPalette(): string[] {
  return []; // Return empty array - colors generated on-demand
}

// Get default custom palette color (grey stripes)
export function getDefaultCustomColor(index: number): string {
  const v = (index & 1) ? 0x84 : 0x74;
  return `#${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}${v.toString(16).padStart(2, '0')}`;
}

// Load palette from RGB24 binary data
export function loadPaletteRgb24(data: Uint8Array): string[] {
  const palette: string[] = [];
  for (let i = 0; i < data.length - 2; i += 3) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    palette.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    if (palette.length >= PALETTE_SIZE) break;
  }
  return palette;
}

// Load VGA palette (6-bit RGB18)
export function loadPaletteVga(data: Uint8Array): string[] {
  const palette: string[] = [];
  for (let i = 0; i < data.length - 2; i += 3) {
    let r = Math.min(255, Math.floor(data[i] * 255 / 63));
    let g = Math.min(255, Math.floor(data[i + 1] * 255 / 63));
    let b = Math.min(255, Math.floor(data[i + 2] * 255 / 63));
    palette.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    if (palette.length >= PALETTE_SIZE) break;
  }
  return palette;
}

// Export palette to RGB24 binary data
export function exportPaletteRgb24(palette: string[], bpp: number): Uint8Array {
  const count = 1 << bpp;
  const data = new Uint8Array(count * 3);
  for (let i = 0; i < count; i++) {
    const hex = palette[i] || '#808080';
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    data[i * 3] = r;
    data[i * 3 + 1] = g;
    data[i * 3 + 2] = b;
  }
  return data;
}

// Generate palette preview image data for display
export function generatePalettePreview(
  ctx: PaletteContext,
  size: number
): ImageData {
  const imageData = new ImageData(size, size);
  const pixels = new Uint32Array(imageData.data.buffer);
  const lookup = createPaletteLookup(ctx);

  const bx = Math.floor(ctx.bpp / 2);
  const by = ctx.bpp - bx;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = Math.floor((x * (1 << bx)) / size);
      const py = Math.floor((y * (1 << by)) / size);
      const index = px + py * (1 << bx);
      pixels[y * size + x] = lookup(index);
    }
  }

  return imageData;
}

// Get palette index from preview position
export function getPaletteIndexFromPosition(
  x: number,
  y: number,
  size: number,
  bpp: number
): number {
  const bx = Math.floor(bpp / 2);
  const by = bpp - bx;
  const px = Math.floor((x * (1 << bx)) / size);
  const py = Math.floor((y * (1 << by)) / size);
  return px + py * (1 << bx);
}
