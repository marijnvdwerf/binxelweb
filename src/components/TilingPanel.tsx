// Tiling control panel component - Figma-style design
import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Preset, TwiddleMode } from '../types';
import { ByteBitInput } from './ByteBitInput';

interface TilingPanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
}

export function TilingPanel({ preset, onPresetChange }: TilingPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div className="panel">
      <div
        className={`panel-header collapsible ${isCollapsed ? 'collapsed' : ''}`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronRight size={14} className={`collapse-chevron ${isCollapsed ? '' : 'expanded'}`} />
        Tiling
      </div>
      {!isCollapsed && <div className="panel-content">
        {/* Tile size - 2 column grid */}
        <div className="field-label">Size</div>
        <div className="tiling-grid">
          <div className="tiling-input">
            <span className="tiling-label">X</span>
            <input
              type="number"
              value={preset.tileSizeX}
              min={0}
              onChange={(e) => onPresetChange({ tileSizeX: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>
          <div className="tiling-input">
            <span className="tiling-label">Y</span>
            <input
              type="number"
              value={preset.tileSizeY}
              min={0}
              onChange={(e) => onPresetChange({ tileSizeY: Math.max(0, parseInt(e.target.value) || 0) })}
            />
          </div>
        </div>

        {/* Tile stride - 2 column grid with ByteBitInput */}
        <div className="field-label">Stride</div>
        <div className="tiling-grid">
          <ByteBitInput
            byteValue={preset.tileStrideByteX}
            bitValue={preset.tileStrideBitX}
            onChange={(byte, bit) => onPresetChange({ tileStrideByteX: byte, tileStrideBitX: bit })}
            label="X"
          />
          <ByteBitInput
            byteValue={preset.tileStrideByteY}
            bitValue={preset.tileStrideBitY}
            onChange={(byte, bit) => onPresetChange({ tileStrideByteY: byte, tileStrideBitY: bit })}
            label="Y"
          />
        </div>

        {/* Pattern (Twiddle mode) */}
        <div className="field-label">Pattern</div>
        <div className="toggle-group">
          <button
            className={`toggle-btn ${preset.twiddle === TwiddleMode.NONE ? 'active' : ''}`}
            onClick={() => onPresetChange({ twiddle: TwiddleMode.NONE })}
          >
            Linear
          </button>
          <button
            className={`toggle-btn ${preset.twiddle === TwiddleMode.Z ? 'active' : ''}`}
            onClick={() => onPresetChange({ twiddle: TwiddleMode.Z })}
            title="Z-order / Morton curve"
          >
            Z-Order
          </button>
          <button
            className={`toggle-btn ${preset.twiddle === TwiddleMode.N ? 'active' : ''}`}
            onClick={() => onPresetChange({ twiddle: TwiddleMode.N })}
            title="N-order pattern"
          >
            N-Order
          </button>
        </div>
      </div>}
    </div>
  );
}
