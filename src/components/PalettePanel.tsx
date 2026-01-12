// Palette control panel component - Figma-style design
import React, { useRef, useEffect, useCallback } from 'react';
import { RefreshCw, Download, Upload } from 'lucide-react';
import { PaletteMode, PALETTE_MODE_NAMES, PALETTE_BITS } from '../types';
import { generatePalettePreview, getPaletteIndexFromPosition, type PaletteContext } from '../palette';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const PREVIEW_SIZE = 100;

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
    <div className="panel">
      <div className="panel-header">
        Palette
        <div className="panel-header-actions">
          <button
            className="icon-btn"
            onClick={onRegenerateRandom}
            disabled={paletteMode !== PaletteMode.RANDOM}
            title="Regenerate random palette"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        <div className="input-row">
          <select
            className="select-input"
            value={paletteMode}
            onChange={(e) => onPaletteModeChange(parseInt(e.target.value) as PaletteMode)}
          >
            {PALETTE_MODE_NAMES.map((name, i) => (
              <option key={i} value={i}>{name}</option>
            ))}
          </select>
        </div>

        <div className="palette-layout">
          <div className="palette-preview-container">
            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="palette-preview"
              onClick={handleCanvasClick}
              title={bpp <= PALETTE_BITS ? "Click to edit color" : ""}
            />
          </div>

          <div className="palette-controls">
            {/* Background color */}
            <div className="color-picker-row">
              <div
                className="color-swatch"
                style={{ backgroundColor: background }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'color';
                  input.value = background;
                  input.onchange = () => onBackgroundChange(input.value);
                  input.click();
                }}
                title="Click to change background"
              />
              <span className="color-label">Background</span>
            </div>

            {/* Load/Save buttons */}
            <div className="input-row">
              <button
                className="icon-btn"
                onClick={handleLoadPalette}
                disabled={bpp > PALETTE_BITS}
                title="Load palette"
              >
                <Upload size={14} />
              </button>
              <button
                className="icon-btn"
                onClick={handleSavePalette}
                disabled={bpp > PALETTE_BITS}
                title="Save palette"
              >
                <Download size={14} />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".pal,.bin,*"
              onChange={handleFileChange}
            />

          </div>
        </div>
      </div>
    </div>
  );
}
