// Tiling control panel component
import React from 'react';
import { Preset, TwiddleMode } from '../types';

interface TilingPanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
}

export function TilingPanel({ preset, onPresetChange }: TilingPanelProps) {
  return (
    <div className="panel tiling-panel">
      <div className="panel-header">Tiling</div>

      {/* Column headers */}
      <div className="control-row labels">
        <span></span>
        <span>X</span>
        <span>Y</span>
      </div>

      {/* Tile Size */}
      <div className="control-row">
        <span className="label">Size</span>
        <input
          type="number"
          className="input-number"
          value={preset.tileSizeX}
          min={0}
          onChange={(e) => onPresetChange({ tileSizeX: Math.max(0, parseInt(e.target.value) || 0) })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.tileSizeY}
          min={0}
          onChange={(e) => onPresetChange({ tileSizeY: Math.max(0, parseInt(e.target.value) || 0) })}
        />
      </div>

      {/* Stride Byte */}
      <div className="control-row">
        <span className="label">Stride</span>
        <input
          type="number"
          className="input-number"
          value={preset.tileStrideByteX}
          onChange={(e) => onPresetChange({ tileStrideByteX: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.tileStrideByteY}
          onChange={(e) => onPresetChange({ tileStrideByteY: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Stride Bit */}
      <div className="control-row">
        <span className="label"></span>
        <input
          type="number"
          className="input-number bit-input"
          value={preset.tileStrideBitX}
          onChange={(e) => onPresetChange({ tileStrideBitX: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number bit-input"
          value={preset.tileStrideBitY}
          onChange={(e) => onPresetChange({ tileStrideBitY: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Twiddle options */}
      <div className="control-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preset.twiddle === TwiddleMode.Z}
            onChange={(e) => onPresetChange({
              twiddle: e.target.checked ? TwiddleMode.Z :
                (preset.twiddle === TwiddleMode.Z ? TwiddleMode.NONE : preset.twiddle)
            })}
          />
          Twiddle Z
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preset.twiddle === TwiddleMode.N}
            onChange={(e) => onPresetChange({
              twiddle: e.target.checked ? TwiddleMode.N :
                (preset.twiddle === TwiddleMode.N ? TwiddleMode.NONE : preset.twiddle)
            })}
          />
          Twiddle N
        </label>
      </div>
    </div>
  );
}
