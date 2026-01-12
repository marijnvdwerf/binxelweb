// Packing control panel component - Figma-style design
import React, { useMemo } from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { Preset, MAX_BPP } from '../types';
import { ByteBitInput } from './ByteBitInput';

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
}: PackingPanelProps) {
  // Calculate auto stride values
  const autoStrides = useMemo(() => {
    const bitsPerPixel = preset.bpp;
    const pixelByte = Math.floor(bitsPerPixel / 8);
    const pixelBit = bitsPerPixel % 8;
    const rowBits = preset.width * bitsPerPixel;
    const rowByte = Math.floor(rowBits / 8);
    const rowBit = rowBits % 8;
    const nextBits = preset.width * preset.height * bitsPerPixel;
    const nextByte = Math.floor(nextBits / 8);
    const nextBit = nextBits % 8;
    return {
      pixelByte, pixelBit,
      rowByte, rowBit,
      nextByte, nextBit,
    };
  }, [preset.bpp, preset.width, preset.height]);

  return (
    <div className="panel">
      <div className="panel-header">Format</div>
      <div className="panel-content">
        {/* BPP row: value | link | pixel stride */}
        <div className="field-label">BPP</div>
        <div className="format-row">
          <div className="format-value">
            <input
              type="number"
              value={preset.bpp}
              min={1}
              max={MAX_BPP}
              onChange={(e) => onPresetChange({ bpp: Math.max(1, Math.min(MAX_BPP, parseInt(e.target.value) || 1)) })}
            />
          </div>
          <button
            className={`auto-toggle-btn ${preset.pixelStrideAuto ? 'linked' : ''}`}
            onClick={() => onPresetChange({ pixelStrideAuto: !preset.pixelStrideAuto })}
            title={preset.pixelStrideAuto ? 'Auto-calculated (click to set manually)' : 'Manual (click to auto-calculate)'}
          >
            {preset.pixelStrideAuto ? <Link2 size={14} /> : <Link2Off size={14} />}
          </button>
          <ByteBitInput
            byteValue={preset.pixelStrideByte}
            bitValue={preset.pixelStrideBit}
            onChange={(byte, bit) => onPresetChange({ pixelStrideByte: byte, pixelStrideBit: bit })}
            disabled={preset.pixelStrideAuto}
            autoByteValue={autoStrides.pixelByte}
            autoBitValue={autoStrides.pixelBit}
            isAuto={preset.pixelStrideAuto}
          />
        </div>

        {/* Width row: value | link | row stride */}
        <div className="field-label">Width</div>
        <div className="format-row">
          <div className="format-value">
            <input
              type="number"
              value={preset.width}
              min={1}
              max={65536}
              onChange={(e) => onPresetChange({ width: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
          <button
            className={`auto-toggle-btn ${preset.rowStrideAuto ? 'linked' : ''}`}
            onClick={() => onPresetChange({ rowStrideAuto: !preset.rowStrideAuto })}
            title={preset.rowStrideAuto ? 'Auto-calculated (click to set manually)' : 'Manual (click to auto-calculate)'}
          >
            {preset.rowStrideAuto ? <Link2 size={14} /> : <Link2Off size={14} />}
          </button>
          <ByteBitInput
            byteValue={preset.rowStrideByte}
            bitValue={preset.rowStrideBit}
            onChange={(byte, bit) => onPresetChange({ rowStrideByte: byte, rowStrideBit: bit })}
            disabled={preset.rowStrideAuto}
            autoByteValue={autoStrides.rowByte}
            autoBitValue={autoStrides.rowBit}
            isAuto={preset.rowStrideAuto}
          />
        </div>

        {/* Height row: value | link | next stride */}
        <div className="field-label">Height</div>
        <div className="format-row">
          <div className="format-value">
            <input
              type="number"
              value={preset.height}
              min={1}
              onChange={(e) => onPresetChange({ height: Math.max(1, parseInt(e.target.value) || 1) })}
            />
          </div>
          <button
            className={`auto-toggle-btn ${preset.nextStrideAuto ? 'linked' : ''}`}
            onClick={() => onPresetChange({ nextStrideAuto: !preset.nextStrideAuto })}
            title={preset.nextStrideAuto ? 'Auto-calculated (click to set manually)' : 'Manual (click to auto-calculate)'}
          >
            {preset.nextStrideAuto ? <Link2 size={14} /> : <Link2Off size={14} />}
          </button>
          <ByteBitInput
            byteValue={preset.nextStrideByte}
            bitValue={preset.nextStrideBit}
            onChange={(byte, bit) => onPresetChange({ nextStrideByte: byte, nextStrideBit: bit })}
            disabled={preset.nextStrideAuto}
            autoByteValue={autoStrides.nextByte}
            autoBitValue={autoStrides.nextBit}
            isAuto={preset.nextStrideAuto}
          />
        </div>
      </div>
    </div>
  );
}
