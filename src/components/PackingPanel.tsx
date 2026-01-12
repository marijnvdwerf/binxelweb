// Packing control panel component - Figma-style design
import React from 'react';
import { Preset, MAX_BPP } from '../types';
import { BUILT_IN_PRESETS } from '../presets';
import { ByteIcon, BitIcon } from './Icons';

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
    <div className="panel">
      <div className="panel-header">Packing</div>
      <div className="panel-content">
        {/* Preset dropdown - full width */}
        <div className="field-row">
          <select
            className="select-input"
            value={preset.name}
            onChange={(e) => onPresetSelect(e.target.value)}
          >
            <option value="">Custom</option>
            {BUILT_IN_PRESETS.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Format checkboxes */}
        <div className="field-row">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={!preset.littleEndian}
              onChange={(e) => onPresetChange({ littleEndian: !e.target.checked })}
            />
            Reverse Byte
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={preset.chunky}
              onChange={(e) => onPresetChange({ chunky: e.target.checked })}
            />
            Chunky
          </label>
        </div>

        {/* BPP, W, H - three columns with labels */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">BPP</div>
            <div className="input-group">
              <input
                type="number"
                value={preset.bpp}
                min={1}
                max={MAX_BPP}
                onChange={(e) => onPresetChange({ bpp: Math.max(1, Math.min(MAX_BPP, parseInt(e.target.value) || 1)) })}
              />
            </div>
          </div>
          <div className="field-half">
            <div className="field-label">W</div>
            <div className="input-group">
              <input
                type="number"
                value={preset.width}
                min={1}
                max={65536}
                onChange={(e) => onPresetChange({ width: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
          </div>
          <div className="field-half">
            <div className="field-label">H</div>
            <div className="input-group">
              <input
                type="number"
                value={preset.height}
                min={1}
                onChange={(e) => onPresetChange({ height: Math.max(1, parseInt(e.target.value) || 1) })}
              />
            </div>
          </div>
        </div>

        {/* Pixel stride - with header label */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Pixel</div>
            <div className="byte-bit-field">
              <div
                className={`byte-field ${preset.pixelStrideAuto ? 'disabled' : ''}`}
                onClick={() => !preset.pixelStrideAuto && onAdvancePixel(1)}
                onContextMenu={(e) => { e.preventDefault(); !preset.pixelStrideAuto && onAdvancePixel(-1); }}
                style={{ cursor: preset.pixelStrideAuto ? 'default' : 'pointer' }}
              >
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.pixelStrideByte}
                  disabled={preset.pixelStrideAuto}
                  onChange={(e) => onPresetChange({ pixelStrideByte: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={`bit-field ${preset.pixelStrideAuto ? 'disabled' : ''}`}>
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.pixelStrideBit}
                  disabled={preset.pixelStrideAuto}
                  onChange={(e) => onPresetChange({ pixelStrideBit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <label className="auto-checkbox" title="Auto">
            <input
              type="checkbox"
              checked={preset.pixelStrideAuto}
              onChange={(e) => onPresetChange({ pixelStrideAuto: e.target.checked })}
            />
          </label>
        </div>

        {/* Row stride */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Row</div>
            <div className="byte-bit-field">
              <div
                className={`byte-field ${preset.rowStrideAuto ? 'disabled' : ''}`}
                onClick={() => !preset.rowStrideAuto && onAdvanceRow(1)}
                onContextMenu={(e) => { e.preventDefault(); !preset.rowStrideAuto && onAdvanceRow(-1); }}
                style={{ cursor: preset.rowStrideAuto ? 'default' : 'pointer' }}
              >
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.rowStrideByte}
                  disabled={preset.rowStrideAuto}
                  onChange={(e) => onPresetChange({ rowStrideByte: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={`bit-field ${preset.rowStrideAuto ? 'disabled' : ''}`}>
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.rowStrideBit}
                  disabled={preset.rowStrideAuto}
                  onChange={(e) => onPresetChange({ rowStrideBit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <label className="auto-checkbox" title="Auto">
            <input
              type="checkbox"
              checked={preset.rowStrideAuto}
              onChange={(e) => onPresetChange({ rowStrideAuto: e.target.checked })}
            />
          </label>
        </div>

        {/* Next stride */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Next</div>
            <div className="byte-bit-field">
              <div
                className={`byte-field ${preset.nextStrideAuto ? 'disabled' : ''}`}
                onClick={() => !preset.nextStrideAuto && onAdvanceNext(1)}
                onContextMenu={(e) => { e.preventDefault(); !preset.nextStrideAuto && onAdvanceNext(-1); }}
                style={{ cursor: preset.nextStrideAuto ? 'default' : 'pointer' }}
              >
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.nextStrideByte}
                  disabled={preset.nextStrideAuto}
                  onChange={(e) => onPresetChange({ nextStrideByte: parseInt(e.target.value) || 0 })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className={`bit-field ${preset.nextStrideAuto ? 'disabled' : ''}`}>
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={preset.nextStrideBit}
                  disabled={preset.nextStrideAuto}
                  onChange={(e) => onPresetChange({ nextStrideBit: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
          <label className="auto-checkbox" title="Auto">
            <input
              type="checkbox"
              checked={preset.nextStrideAuto}
              onChange={(e) => onPresetChange({ nextStrideAuto: e.target.checked })}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
