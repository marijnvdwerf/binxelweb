// Main state management hook for Binxelview
import { useState, useCallback, useRef, useEffect } from 'react';
import { Preset, PaletteMode, createEmptyPreset, copyPreset, ZOOM_MAX } from '../types';
import { BUILT_IN_PRESETS } from '../presets';
import { createPaletteLookup, createDefaultCustomPalette, generateRandomSeed, hexToArgb } from '../palette';

export interface BinxelviewState {
  // File data
  data: Uint8Array;
  dataFile: string;

  // Position
  posByte: number;
  posBit: number;

  // Display settings
  zoom: number;
  hideGrid: boolean;
  background: string;
  decimalPosition: boolean;
  snapScroll: boolean;
  horizontalLayout: boolean;

  // Preset
  preset: Preset;

  // Palette
  paletteMode: PaletteMode;
  customPalette: string[];
  randomSeed: number;
}

export interface BinxelviewActions {
  // File actions
  loadFile: (file: File) => Promise<void>;
  loadData: (data: Uint8Array, fileName: string) => void;

  // Position actions
  setPosition: (byte: number, bit: number) => void;
  advanceByte: (delta: number) => void;
  advanceBit: (delta: number) => void;
  advancePixel: (delta: number) => void;
  advanceRow: (delta: number) => void;
  advanceNext: (delta: number) => void;

  // Display actions
  setZoom: (zoom: number) => void;
  toggleGrid: () => void;
  setBackground: (color: string) => void;
  toggleDecimalPosition: () => void;
  toggleSnapScroll: () => void;
  toggleHorizontalLayout: () => void;

  // Preset actions
  setPreset: (preset: Preset) => void;
  loadPresetByName: (name: string) => void;
  updatePreset: (updates: Partial<Preset>) => void;

  // Palette actions
  setPaletteMode: (mode: PaletteMode) => void;
  setCustomPaletteColor: (index: number, color: string) => void;
  loadCustomPalette: (palette: string[]) => void;
  regenerateRandomPalette: () => void;

  // Computed values
  getPaletteColor: (index: number) => number;
  getBackgroundColor: () => number;
  getNextIncrement: () => { byte: number; bit: number };
}

const DEFAULT_STATE: BinxelviewState = {
  data: new Uint8Array(0),
  dataFile: '',
  posByte: 0,
  posBit: 0,
  zoom: 2,
  hideGrid: false,
  background: '#c0c0c0',
  decimalPosition: false,
  snapScroll: true,
  horizontalLayout: false,
  preset: createEmptyPreset(),
  paletteMode: PaletteMode.RGB,
  customPalette: createDefaultCustomPalette(),
  randomSeed: generateRandomSeed(),
};

export function useBinxelview(): [BinxelviewState, BinxelviewActions] {
  const [state, setState] = useState<BinxelviewState>(DEFAULT_STATE);

  // Memoized palette lookup stored in ref for stable callback
  const paletteLookupRef = useRef<(index: number) => number>(() => 0xFF808080);
  const backgroundArgbRef = useRef<number>(0xFFC0C0C0);

  // Update refs when palette changes
  useEffect(() => {
    paletteLookupRef.current = createPaletteLookup({
      mode: state.paletteMode,
      bpp: state.preset.bpp,
      customPalette: state.customPalette,
      randomSeed: state.randomSeed,
    });
  }, [state.paletteMode, state.preset.bpp, state.customPalette, state.randomSeed]);

  useEffect(() => {
    backgroundArgbRef.current = hexToArgb(state.background);
  }, [state.background]);

  // Stable callbacks that read from refs
  const getPaletteColor = useCallback((index: number) => {
    return paletteLookupRef.current(index);
  }, []);

  const getBackgroundColor = useCallback(() => {
    return backgroundArgbRef.current;
  }, []);

  // Helper to normalize position (convert excess bits to bytes)
  const normalizePosition = useCallback((byte: number, bit: number): { byte: number; bit: number } => {
    const totalBits = byte * 8 + bit;
    return {
      byte: Math.floor(totalBits / 8),
      bit: ((totalBits % 8) + 8) % 8,
    };
  }, []);

  // Helper to apply auto strides
  const applyAutoStrides = useCallback((preset: Preset): Preset => {
    const p = copyPreset(preset);

    if (p.pixelStrideAuto) {
      p.pixelStrideByte = p.bpp >> 3;
      p.pixelStrideBit = p.bpp & 7;
    }
    if (p.rowStrideAuto) {
      const bits = (p.pixelStrideBit + p.pixelStrideByte * 8) * p.width;
      p.rowStrideByte = bits >> 3;
      p.rowStrideBit = bits & 7;
    }
    if (p.nextStrideAuto) {
      const bits = (p.rowStrideBit + p.rowStrideByte * 8) * p.height;
      p.nextStrideByte = bits >> 3;
      p.nextStrideBit = bits & 7;
    }

    return p;
  }, []);

  // Actions
  const loadFile = useCallback(async (file: File) => {
    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);
    setState(s => ({
      ...s,
      data,
      dataFile: file.name,
      posByte: s.posByte >= data.length ? 0 : s.posByte,
      posBit: 0,
    }));
  }, []);

  const loadData = useCallback((data: Uint8Array, fileName: string) => {
    setState(s => ({
      ...s,
      data,
      dataFile: fileName,
      posByte: s.posByte >= data.length ? 0 : s.posByte,
      posBit: 0,
    }));
  }, []);

  const setPosition = useCallback((byte: number, bit: number) => {
    const normalized = normalizePosition(byte, bit);
    setState(s => ({
      ...s,
      posByte: normalized.byte,
      posBit: normalized.bit,
    }));
  }, [normalizePosition]);

  const advanceByte = useCallback((delta: number) => {
    setState(s => {
      const normalized = normalizePosition(s.posByte + delta, s.posBit);
      return { ...s, posByte: normalized.byte, posBit: normalized.bit };
    });
  }, [normalizePosition]);

  const advanceBit = useCallback((delta: number) => {
    setState(s => {
      const normalized = normalizePosition(s.posByte, s.posBit + delta);
      return { ...s, posByte: normalized.byte, posBit: normalized.bit };
    });
  }, [normalizePosition]);

  const advancePixel = useCallback((delta: number) => {
    setState(s => {
      const preset = applyAutoStrides(s.preset);
      const bits = delta * (preset.pixelStrideByte * 8 + preset.pixelStrideBit);
      const normalized = normalizePosition(s.posByte, s.posBit + bits);
      return { ...s, posByte: normalized.byte, posBit: normalized.bit };
    });
  }, [normalizePosition, applyAutoStrides]);

  const advanceRow = useCallback((delta: number) => {
    setState(s => {
      const preset = applyAutoStrides(s.preset);
      const bits = delta * (preset.rowStrideByte * 8 + preset.rowStrideBit);
      const normalized = normalizePosition(s.posByte, s.posBit + bits);
      return { ...s, posByte: normalized.byte, posBit: normalized.bit };
    });
  }, [normalizePosition, applyAutoStrides]);

  const advanceNext = useCallback((delta: number) => {
    setState(s => {
      const preset = applyAutoStrides(s.preset);
      const multiplier = preset.height === 1 ? 16 : 1;
      const bits = delta * multiplier * (preset.nextStrideByte * 8 + preset.nextStrideBit);
      const normalized = normalizePosition(s.posByte, s.posBit + bits);
      return { ...s, posByte: normalized.byte, posBit: normalized.bit };
    });
  }, [normalizePosition, applyAutoStrides]);

  const setZoom = useCallback((zoom: number) => {
    setState(s => ({ ...s, zoom: Math.max(1, Math.min(ZOOM_MAX, zoom)) }));
  }, []);

  const toggleGrid = useCallback(() => {
    setState(s => ({ ...s, hideGrid: !s.hideGrid }));
  }, []);

  const setBackground = useCallback((color: string) => {
    setState(s => ({ ...s, background: color }));
  }, []);

  const toggleDecimalPosition = useCallback(() => {
    setState(s => ({ ...s, decimalPosition: !s.decimalPosition }));
  }, []);

  const toggleSnapScroll = useCallback(() => {
    setState(s => ({ ...s, snapScroll: !s.snapScroll }));
  }, []);

  const toggleHorizontalLayout = useCallback(() => {
    setState(s => ({ ...s, horizontalLayout: !s.horizontalLayout }));
  }, []);

  const setPreset = useCallback((preset: Preset) => {
    setState(s => ({ ...s, preset: applyAutoStrides(preset) }));
  }, [applyAutoStrides]);

  const loadPresetByName = useCallback((name: string) => {
    const preset = BUILT_IN_PRESETS.find(p => p.name === name);
    if (preset) {
      setState(s => ({ ...s, preset: applyAutoStrides(copyPreset(preset)) }));
    }
  }, [applyAutoStrides]);

  const updatePreset = useCallback((updates: Partial<Preset>) => {
    setState(s => {
      const newPreset = { ...s.preset, ...updates };
      return { ...s, preset: applyAutoStrides(newPreset) };
    });
  }, [applyAutoStrides]);

  const setPaletteMode = useCallback((mode: PaletteMode) => {
    setState(s => ({ ...s, paletteMode: mode }));
  }, []);

  const setCustomPaletteColor = useCallback((index: number, color: string) => {
    setState(s => {
      const newPalette = [...s.customPalette];
      newPalette[index] = color;
      return { ...s, customPalette: newPalette, paletteMode: PaletteMode.CUSTOM };
    });
  }, []);

  const loadCustomPalette = useCallback((palette: string[]) => {
    setState(s => ({
      ...s,
      customPalette: palette,
      paletteMode: PaletteMode.CUSTOM,
    }));
  }, []);

  const regenerateRandomPalette = useCallback(() => {
    setState(s => ({ ...s, randomSeed: generateRandomSeed() }));
  }, []);

  const getNextIncrement = useCallback(() => {
    const preset = applyAutoStrides(state.preset);
    const multiplier = preset.height === 1 ? 16 : 1;
    let byte = preset.nextStrideByte * multiplier;
    let bit = preset.nextStrideBit * multiplier;
    const nb = Math.floor(bit / 8);
    byte += nb;
    bit -= nb * 8;
    return { byte, bit };
  }, [state.preset, applyAutoStrides]);

  const actions: BinxelviewActions = {
    loadFile,
    loadData,
    setPosition,
    advanceByte,
    advanceBit,
    advancePixel,
    advanceRow,
    advanceNext,
    setZoom,
    toggleGrid,
    setBackground,
    toggleDecimalPosition,
    toggleSnapScroll,
    toggleHorizontalLayout,
    setPreset,
    loadPresetByName,
    updatePreset,
    setPaletteMode,
    setCustomPaletteColor,
    loadCustomPalette,
    regenerateRandomPalette,
    getPaletteColor,
    getBackgroundColor,
    getNextIncrement,
  };

  return [state, actions];
}
