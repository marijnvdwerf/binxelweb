// Packing control panel component
import React from 'react';
import { Preset, MAX_BPP } from '../types';
import { BUILT_IN_PRESETS } from '../presets';

interface PackingPanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
  onPresetSelect: (name: string) => void;
  onAdvancePixel: (delta: number) => void;
  onAdvanceRow: (delta: number) => void;
  onAdvanceNext: (delta: number) => void;
}

export function PackingPanel({
  preset,
  onPresetChange,
  onPresetSelect,
  onAdvancePixel,
  onAdvanceRow,
  onAdvanceNext,
}: PackingPanelProps) {
  return (
    <div className="panel packing-panel">
      <div className="panel-header">Packing</div>

      {/* Mode checkboxes */}
      <div className="control-row">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={!preset.littleEndian}
            onChange={(e) => onPresetChange({ littleEndian: !e.target.checked })}
          />
          Reverse Byte
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={preset.chunky}
            onChange={(e) => onPresetChange({ chunky: e.target.checked })}
          />
          Chunky
        </label>
      </div>

      {/* BPP, Width, Height */}
      <div className="control-row labels">
        <span>BPP</span>
        <span>Width</span>
        <span>Height</span>
      </div>
      <div className="control-row">
        <input
          type="number"
          className="input-number"
          value={preset.bpp}
          min={1}
          max={MAX_BPP}
          onChange={(e) => onPresetChange({ bpp: Math.max(1, Math.min(MAX_BPP, parseInt(e.target.value) || 1)) })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.width}
          min={1}
          max={65536}
          onChange={(e) => onPresetChange({ width: Math.max(1, parseInt(e.target.value) || 1) })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.height}
          min={1}
          onChange={(e) => onPresetChange({ height: Math.max(1, parseInt(e.target.value) || 1) })}
        />
      </div>

      {/* Advance buttons */}
      <div className="control-row">
        <button
          className="btn btn-sm"
          onClick={() => onAdvancePixel(1)}
          onContextMenu={(e) => { e.preventDefault(); onAdvancePixel(-1); }}
          title="Advance by pixel stride"
        >
          Pixel
        </button>
        <button
          className="btn btn-sm"
          onClick={() => onAdvanceRow(1)}
          onContextMenu={(e) => { e.preventDefault(); onAdvanceRow(-1); }}
          title="Advance by row stride"
        >
          Row
        </button>
        <button
          className="btn btn-sm"
          onClick={() => onAdvanceNext(1)}
          onContextMenu={(e) => { e.preventDefault(); onAdvanceNext(-1); }}
          title="Advance by next stride"
        >
          Next
        </button>
      </div>

      {/* Stride Byte row */}
      <div className="control-row">
        <input
          type="number"
          className="input-number"
          value={preset.pixelStrideByte}
          disabled={preset.pixelStrideAuto}
          onChange={(e) => onPresetChange({ pixelStrideByte: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.rowStrideByte}
          disabled={preset.rowStrideAuto}
          onChange={(e) => onPresetChange({ rowStrideByte: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number"
          value={preset.nextStrideByte}
          disabled={preset.nextStrideAuto}
          onChange={(e) => onPresetChange({ nextStrideByte: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Stride Bit row */}
      <div className="control-row">
        <input
          type="number"
          className="input-number bit-input"
          value={preset.pixelStrideBit}
          disabled={preset.pixelStrideAuto}
          onChange={(e) => onPresetChange({ pixelStrideBit: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number bit-input"
          value={preset.rowStrideBit}
          disabled={preset.rowStrideAuto}
          onChange={(e) => onPresetChange({ rowStrideBit: parseInt(e.target.value) || 0 })}
        />
        <input
          type="number"
          className="input-number bit-input"
          value={preset.nextStrideBit}
          disabled={preset.nextStrideAuto}
          onChange={(e) => onPresetChange({ nextStrideBit: parseInt(e.target.value) || 0 })}
        />
      </div>

      {/* Auto checkboxes */}
      <div className="control-row">
        <label className="checkbox-label small">
          <input
            type="checkbox"
            checked={preset.pixelStrideAuto}
            onChange={(e) => onPresetChange({ pixelStrideAuto: e.target.checked })}
          />
          Auto
        </label>
        <label className="checkbox-label small">
          <input
            type="checkbox"
            checked={preset.rowStrideAuto}
            onChange={(e) => onPresetChange({ rowStrideAuto: e.target.checked })}
          />
          Auto
        </label>
        <label className="checkbox-label small">
          <input
            type="checkbox"
            checked={preset.nextStrideAuto}
            onChange={(e) => onPresetChange({ nextStrideAuto: e.target.checked })}
          />
          Auto
        </label>
      </div>

      {/* Preset selector */}
      <div className="control-row">
        <select
          className="preset-select"
          value={preset.name}
          onChange={(e) => onPresetSelect(e.target.value)}
        >
          <option value="">-- Select Preset --</option>
          {BUILT_IN_PRESETS.map((p) => (
            <option key={p.name} value={p.name}>{p.name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
