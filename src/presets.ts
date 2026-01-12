// Built-in presets for Binxelview
import { parsePreset, Preset } from './types';

// Raw preset data from original Binxelview
const PRESET_DATA: Record<string, string> = {
  '1bpp': `2
0 1
1 8 1
0 1 1
1 0 0
1 1 1
0 0 0
0 0 0`,

  '8bpp': `2
1 1
8 8 1
1 8 8
0 0 0
1 1 1
0 0 0
0 0 0`,

  '16bpp': `2
1 1
16 8 1
2 16 16
0 0 0
1 1 1
0 0 0
0 0 0`,

  '24bpp': `2
1 1
24 8 1
3 24 24
0 0 0
1 1 1
0 0 0
0 0 0`,

  '32bpp': `2
1 1
32 8 1
4 32 32
0 0 0
1 1 1
0 0 0
0 0 0`,

  'NES CHR 8px': `2
0 0
2 8 8
0 1 16
1 0 0
0 1 0
0 0 0
0 0 0
0 0
8 0`,

  'NES CHR 8px 16w': `2
0 0
2 8 8
0 1 16
1 0 0
0 1 0
0 0 0
0 0 0
0 0
8 0`,

  'NES CHR 16px': `2
0 0
2 16 16
0 1 64
1 0 0
0 1 0
8 16 0
8 32 0
0 0
8 0`,

  'NES CHR 16px 16w': `2
0 0
2 16 16
0 1 64
1 0 0
0 1 0
8 16 0
8 32 0
0 0
8 0`,

  'GB CHR 8px': `2
0 0
2 8 8
0 2 16
1 0 0
1 1 1
0 0 0
0 0 0
0 0
0 1`,

  'SNES 2bpp': `2
0 0
2 8 8
0 2 16
1 0 0
0 0 0
0 0 0
0 0 0
0 0
0 1`,

  'SNES 4bpp': `2
0 0
4 8 8
0 2 32
1 0 0
0 0 0
0 0 0
0 0 0
0 0
1 0
16 0
17 0`,

  'SNES 8bpp': `2
0 0
8 8 8
0 2 64
1 0 0
0 0 0
0 0 0
0 0 0
0 0
1 0
16 0
17 0
32 0
33 0
48 0
49 0`,

  'Genesis 4bpp 8px': `3
0 1 0
4 8 8
0 4 32
4 0 0
1 1 1
0 0 0
0 0 0`,

  'SMS 4bpp 8px': `2
0 0
4 8 8
0 4 32
4 0 0
1 1 1
0 0 0
0 0 0`,

  'SMS 4bpp 8px 16w': `2
0 0
4 8 8
0 4 32
4 0 0
1 1 1
0 0 0
0 0 0`,

  'PCe 4bpp 8px': `2
0 0
4 8 8
0 1 32
1 0 0
0 1 0
0 0 0
0 0 0
0 0
16 0
32 0
48 0`,

  'PCe 4bpp 16px': `2
0 0
4 16 16
0 1 128
1 0 0
0 1 0
8 32 0
8 64 0
0 0
16 0
32 0
48 0`,

  'MSX 1bpp 16px': `2
0 1
1 16 16
0 1 32
1 0 0
1 0 0
8 16 0
0 0 0`,

  'MSX2 2bpp 16px': `2
0 1
2 16 16
0 1 32
1 0 0
1 0 0
8 32 0
0 0 0
0 0
16 0`,

  'MSX2 4bpp 8px': `2
0 1
4 8 8
0 1 32
1 0 0
1 0 0
0 0 0
0 0 0
0 0
8 0
16 0
24 0`,

  'Atari ST 1bpp': `2
0 0
1 320 1
0 40 40
1 0 0
0 0 1
16 2 0
0 0 0`,

  'Atari ST 2bpp': `2
0 0
2 320 1
0 80 80
1 0 0
0 0 1
16 4 0
0 0 0
0 0
2 0`,

  'Atari ST 4bpp': `2
0 0
4 320 1
0 160 160
1 0 0
0 0 1
16 8 0
0 0 0
0 0
2 0
4 0
6 0`,

  'ZX 1bpp 8px': `2
0 0
1 8 8
0 1 8
1 0 0
1 1 1
0 0 0
0 0 0`,

  'PS1 4bpp': `2
0 1
4 8 8
0 4 32
4 0 0
1 1 1
0 0 0
0 0 0`,

  'PS1 15bpp': `2
1 1
15 8 1
2 16 16
0 0 0
1 1 1
0 0 0
0 0 0`,

  'ARGB 1555': `2
1 1
16 8 1
2 16 16
0 0 0
1 1 1
0 0 0
0 0 0`,

  'BMP BGR 24bpp': `2
1 1
24 8 1
3 24 24
0 0 0
1 1 1
0 0 0
0 0 0`,

  'VGA Palette': `2
1 1
24 16 1
3 48 48
0 0 0
1 1 1
0 0 0
0 0 0`,
};

// Parse all presets
export const BUILT_IN_PRESETS: Preset[] = Object.entries(PRESET_DATA)
  .map(([name, data]) => parsePreset(name, data))
  .filter((p): p is Preset => p !== null)
  .sort((a, b) => a.name.localeCompare(b.name));

export function getPresetByName(name: string): Preset | undefined {
  return BUILT_IN_PRESETS.find(p => p.name === name);
}
