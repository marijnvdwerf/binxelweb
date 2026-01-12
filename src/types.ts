// Core types for Binxelview

export const MAX_BPP = 32;
export const PALETTE_BITS = 16;
export const PALETTE_SIZE = 1 << PALETTE_BITS;
export const ZOOM_MAX = 32;

export enum PaletteMode {
  CUSTOM = 0,
  RGB = 1,
  RANDOM = 2,
  GREYSCALE = 3,
  CUBEHELIX = 4,
}

export const PALETTE_MODE_NAMES = ['Custom', 'RGB', 'Random', 'Greyscale', 'Cubehelix'];

export enum TwiddleMode {
  NONE = 0,
  Z = 1,
  N = 2,
}

export interface Preset {
  name: string;
  littleEndian: boolean;
  chunky: boolean;
  bpp: number;
  width: number;
  height: number;
  pixelStrideByte: number;
  pixelStrideBit: number;
  pixelStrideAuto: boolean;
  rowStrideByte: number;
  rowStrideBit: number;
  rowStrideAuto: boolean;
  nextStrideByte: number;
  nextStrideBit: number;
  nextStrideAuto: boolean;
  twiddle: TwiddleMode;
  tileSizeX: number;
  tileStrideBitX: number;
  tileStrideByteX: number;
  tileSizeY: number;
  tileStrideBitY: number;
  tileStrideByteY: number;
  bitStrideByte: number[];
  bitStrideBit: number[];
}

export interface AppState {
  data: Uint8Array;
  dataPath: string;
  dataFile: string;
  posByte: number;
  posBit: number;
  zoom: number;
  hideGrid: boolean;
  background: string;
  paletteMode: PaletteMode;
  decimalPosition: boolean;
  snapScroll: boolean;
  horizontalLayout: boolean;
  preset: Preset;
  customPalette: string[];
  randomSeed: number;
}

export function createEmptyPreset(): Preset {
  const bitStrideByte: number[] = [];
  const bitStrideBit: number[] = [];
  for (let i = 0; i < MAX_BPP; i++) {
    bitStrideByte.push(Math.floor(i / 8));
    bitStrideBit.push(i % 8);
  }

  return {
    name: '',
    littleEndian: true,
    chunky: true,
    bpp: 8,
    width: 8,
    height: 1,
    pixelStrideByte: 1,
    pixelStrideBit: 0,
    pixelStrideAuto: true,
    rowStrideByte: 8,
    rowStrideBit: 0,
    rowStrideAuto: true,
    nextStrideByte: 8,
    nextStrideBit: 0,
    nextStrideAuto: true,
    twiddle: TwiddleMode.NONE,
    tileSizeX: 0,
    tileStrideBitX: 0,
    tileStrideByteX: 0,
    tileSizeY: 0,
    tileStrideBitY: 0,
    tileStrideByteY: 0,
    bitStrideByte,
    bitStrideBit,
  };
}

export function copyPreset(preset: Preset): Preset {
  return {
    ...preset,
    bitStrideByte: [...preset.bitStrideByte],
    bitStrideBit: [...preset.bitStrideBit],
  };
}

export function parsePreset(name: string, content: string): Preset | null {
  const lines = content.trim().split('\n').map(l => l.trim());
  if (lines.length < 8) return null;

  try {
    const version = parseInt(lines[0]);
    if (version < 1 || version > 3) return null;

    const line1 = lines[1].split(' ').map(Number);
    const line2 = lines[2].split(' ').map(Number);
    const line3 = lines[3].split(' ').map(Number);
    const line4 = lines[4].split(' ').map(Number);
    const line5 = lines[5].split(' ').map(Number);
    const line6 = lines[6].split(' ').map(Number);
    const line7 = lines[7].split(' ').map(Number);

    const preset = createEmptyPreset();
    preset.name = name;
    preset.littleEndian = line1[0] !== 0;
    preset.chunky = line1[1] !== 0;
    preset.twiddle = version >= 3 ? (line1[2] as TwiddleMode) : TwiddleMode.NONE;
    if (preset.twiddle < 0 || preset.twiddle > 2) preset.twiddle = TwiddleMode.NONE;

    preset.bpp = Math.max(1, line2[0]);
    preset.width = Math.max(1, line2[1]);
    preset.height = Math.max(1, line2[2]);

    preset.pixelStrideByte = line3[0];
    preset.rowStrideByte = line3[1];
    preset.nextStrideByte = line3[2];

    preset.pixelStrideBit = line4[0];
    preset.rowStrideBit = line4[1];
    preset.nextStrideBit = line4[2];

    preset.pixelStrideAuto = line5[0] !== 0;
    preset.rowStrideAuto = line5[1] !== 0;
    preset.nextStrideAuto = line5[2] !== 0;

    preset.tileSizeX = line6[0];
    preset.tileStrideByteX = line6[1];
    preset.tileStrideBitX = line6[2];

    preset.tileSizeY = line7[0];
    preset.tileStrideByteY = line7[1];
    preset.tileStrideBitY = line7[2];

    // Read bit stride table if not chunky
    if (!preset.chunky) {
      for (let i = 0; i < preset.bpp && i + 8 < lines.length; i++) {
        const parts = lines[i + 8].split(' ').map(Number);
        preset.bitStrideByte[i] = parts[0];
        preset.bitStrideBit[i] = parts[1];
      }
    }

    // Version 1 tile stride conversion
    if (version === 1) {
      let tileStrideX = preset.tileStrideBitX + preset.tileStrideByteX * 8;
      let tileStrideY = preset.tileStrideBitY + preset.tileStrideByteY * 8;
      const strideX = preset.pixelStrideBit + preset.pixelStrideByte * 8;
      const strideY = preset.rowStrideBit + preset.rowStrideByte * 8;

      if (tileStrideX === 0) {
        preset.tileSizeX = 0;
      } else {
        tileStrideX += strideX * preset.tileSizeX;
        preset.tileStrideByteX = tileStrideX >> 3;
        preset.tileStrideBitX = tileStrideX & 7;
      }

      if (tileStrideY === 0) {
        preset.tileSizeY = 0;
      } else {
        tileStrideY += strideY * preset.tileSizeY;
        preset.tileStrideByteY = tileStrideY >> 3;
        preset.tileStrideBitY = tileStrideY & 7;
      }
    }

    return preset;
  } catch {
    return null;
  }
}

export function serializePreset(preset: Preset): string {
  const lines: string[] = [
    '3', // version
    `${preset.littleEndian ? 0 : 1} ${preset.chunky ? 1 : 0} ${preset.twiddle}`,
    `${preset.bpp} ${preset.width} ${preset.height}`,
    `${preset.pixelStrideByte} ${preset.rowStrideByte} ${preset.nextStrideByte}`,
    `${preset.pixelStrideBit} ${preset.rowStrideBit} ${preset.nextStrideBit}`,
    `${preset.pixelStrideAuto ? 1 : 0} ${preset.rowStrideAuto ? 1 : 0} ${preset.nextStrideAuto ? 1 : 0}`,
    `${preset.tileSizeX} ${preset.tileStrideByteX} ${preset.tileStrideBitX}`,
    `${preset.tileSizeY} ${preset.tileStrideByteY} ${preset.tileStrideBitY}`,
  ];

  if (!preset.chunky) {
    for (let i = 0; i < preset.bpp; i++) {
      lines.push(`${preset.bitStrideByte[i]} ${preset.bitStrideBit[i]}`);
    }
  }

  return lines.join('\n');
}
