// Palette control panel component
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PaletteMode, PALETTE_MODE_NAMES, PALETTE_BITS } from '../types';
import { generatePalettePreview, getPaletteIndexFromPosition, PaletteContext } from '../palette';

interface PalettePanelProps {
  bpp: number;
  paletteMode: PaletteMode;
  customPalette: string[];
  randomSeed: number;
  background: string;
  onPaletteModeChange: (mode: PaletteMode) => void;
  onCustomColorChange: (index: number, color: string) => void;
  onBackgroundChange: (color: string) => void;
  onRegenerateRandom: () => void;
  onLoadPalette: (palette: string[]) => void;
}

export function PalettePanel({
  bpp,
  paletteMode,
  customPalette,
  randomSeed,
  background,
  onPaletteModeChange,
  onCustomColorChange,
  onBackgroundChange,
  onRegenerateRandom,
  onLoadPalette,
}: PalettePanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paletteInfo, setPaletteInfo] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PREVIEW_SIZE = 128;

  // Draw palette preview
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paletteCtx: PaletteContext = {
      mode: paletteMode,
      bpp,
      customPalette,
      randomSeed,
    };

    const imageData = generatePalettePreview(paletteCtx, PREVIEW_SIZE);
    ctx.putImageData(imageData, 0, 0);
  }, [bpp, paletteMode, customPalette, randomSeed]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (PREVIEW_SIZE / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (PREVIEW_SIZE / rect.height));

    if (x < 0 || x >= PREVIEW_SIZE || y < 0 || y >= PREVIEW_SIZE) return;

    const index = getPaletteIndexFromPosition(x, y, PREVIEW_SIZE, bpp);
    const color = customPalette[index] || '#808080';
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    setPaletteInfo(`${index} = ${r},${g},${b}\n0x${index.toString(16).toUpperCase()} = ${color.slice(1).toUpperCase()}`);
  }, [bpp, customPalette]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (bpp > PALETTE_BITS) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (PREVIEW_SIZE / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (PREVIEW_SIZE / rect.height));

    if (x < 0 || x >= PREVIEW_SIZE || y < 0 || y >= PREVIEW_SIZE) return;

    const index = getPaletteIndexFromPosition(x, y, PREVIEW_SIZE, bpp);
    const currentColor = customPalette[index] || '#808080';

    // Create a color input and trigger it
    const input = document.createElement('input');
    input.type = 'color';
    input.value = currentColor;
    input.onchange = () => {
      onCustomColorChange(index, input.value);
    };
    input.click();
  }, [bpp, customPalette, onCustomColorChange]);

  const handleLoadPalette = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const buffer = await file.arrayBuffer();
    const data = new Uint8Array(buffer);

    // Parse as RGB24 palette
    const palette: string[] = [];
    for (let i = 0; i < data.length - 2; i += 3) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      palette.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`);
    }

    if (palette.length > 0) {
      onLoadPalette(palette);
    }

    // Reset file input
    e.target.value = '';
  }, [onLoadPalette]);

  const handleSavePalette = useCallback(() => {
    const count = 1 << Math.min(bpp, PALETTE_BITS);
    const data = new Uint8Array(count * 3);

    for (let i = 0; i < count; i++) {
      const hex = customPalette[i] || '#808080';
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      data[i * 3] = r;
      data[i * 3 + 1] = g;
      data[i * 3 + 2] = b;
    }

    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'palette.pal';
    a.click();
    URL.revokeObjectURL(url);
  }, [bpp, customPalette]);

  return (
    <div className="panel palette-panel">
      <div className="panel-header">Palette</div>

      <div className="palette-content">
        <canvas
          ref={canvasRef}
          width={PREVIEW_SIZE}
          height={PREVIEW_SIZE}
          className="palette-preview"
          onMouseMove={handleCanvasMove}
          onClick={handleCanvasClick}
        />

        <div className="palette-controls">
          <div className="control-row">
            <div
              className="color-box"
              style={{ backgroundColor: background }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'color';
                input.value = background;
                input.onchange = () => onBackgroundChange(input.value);
                input.click();
              }}
              title="Click to change background color"
            />
            <span>Background</span>
          </div>

          <div className="control-row">
            <button
              className="btn btn-sm"
              onClick={onRegenerateRandom}
              disabled={paletteMode !== PaletteMode.RANDOM}
            >
              Auto
            </button>
            <select
              className="palette-mode-select"
              value={paletteMode}
              onChange={(e) => onPaletteModeChange(parseInt(e.target.value) as PaletteMode)}
            >
              {PALETTE_MODE_NAMES.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>
          </div>

          <div className="control-row">
            <button
              className="btn btn-sm"
              onClick={handleLoadPalette}
              disabled={bpp > PALETTE_BITS}
            >
              Load...
            </button>
            <button
              className="btn btn-sm"
              onClick={handleSavePalette}
              disabled={bpp > PALETTE_BITS}
            >
              Save...
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pal,.bin,*"
            onChange={handleFileChange}
          />

          <div className="palette-info">{paletteInfo || '(hover for info)'}</div>
        </div>
      </div>
    </div>
  );
}
