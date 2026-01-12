// Tiling control panel component - Figma-style design
import React from 'react';
import { Preset, TwiddleMode } from '../types';
import { ByteIcon, BitIcon } from './Icons';

interface TilingPanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
}

export function TilingPanel({ preset, onPresetChange }: TilingPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">Tiling</div>
      <div className="panel-content">
        {/* Tile size - X and Y side by side with labels above */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">X</div>
            <div className="input-group">
              <input
                type="number"
                value={preset.tileSizeX}
                min={0}
                onChange={(e) => onPresetChange({ tileSizeX: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
          </div>
          <div className="field-half">
            <div className="field-label">Y</div>
            <div className="input-group">
              <input
                type="number"
                value={preset.tileSizeY}
                min={0}
                onChange={(e) => onPresetChange({ tileSizeY: Math.max(0, parseInt(e.target.value) || 0) })}
              />
            </div>
          </div>
        </div>

        {/* Tile stride X - with byte/bit fields */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Stride X</div>
            <div className="byte-bit-field">
              <div className="byte-field">
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.tileStrideByteX}
                  onChange={(e) => onPresetChange({ tileStrideByteX: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="bit-field">
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.tileStrideBitX}
                  onChange={(e) => onPresetChange({ tileStrideBitX: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tile stride Y */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Stride Y</div>
            <div className="byte-bit-field">
              <div className="byte-field">
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.tileStrideByteY}
                  onChange={(e) => onPresetChange({ tileStrideByteY: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="bit-field">
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.tileStrideBitY}
                  onChange={(e) => onPresetChange({ tileStrideBitY: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Twiddle mode toggle */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Twiddle</div>
            <div className="toggle-group">
              <button
                className={`toggle-btn ${preset.twiddle === TwiddleMode.NONE ? 'active' : ''}`}
                onClick={() => onPresetChange({ twiddle: TwiddleMode.NONE })}
              >
                None
              </button>
              <button
                className={`toggle-btn ${preset.twiddle === TwiddleMode.Z ? 'active' : ''}`}
                onClick={() => onPresetChange({ twiddle: TwiddleMode.Z })}
                title="Z-order (Morton) twiddle"
              >
                Z
              </button>
              <button
                className={`toggle-btn ${preset.twiddle === TwiddleMode.N ? 'active' : ''}`}
                onClick={() => onPresetChange({ twiddle: TwiddleMode.N })}
                title="N-order twiddle"
              >
                N
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
