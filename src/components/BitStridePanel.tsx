// Bit stride panel for planar graphics configuration
import React from 'react';
import { Preset, MAX_BPP } from '../types';

interface BitStridePanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
}

export function BitStridePanel({ preset, onPresetChange }: BitStridePanelProps) {
  const handleBitStrideByteChange = (index: number, value: number) => {
    const newBitStrideByte = [...preset.bitStrideByte];
    newBitStrideByte[index] = value;
    onPresetChange({ bitStrideByte: newBitStrideByte });
  };

  const handleBitStrideBitChange = (index: number, value: number) => {
    const newBitStrideBit = [...preset.bitStrideBit];
    newBitStrideBit[index] = value;
    onPresetChange({ bitStrideBit: newBitStrideBit });
  };

  if (preset.chunky) {
    return (
      <div className="panel bit-stride-panel">
        <div className="panel-header">Bit Planes</div>
        <div className="disabled-message">
          (Enable planar mode by unchecking "Chunky")
        </div>
      </div>
    );
  }

  return (
    <div className="panel bit-stride-panel">
      <div className="panel-header">Bit Planes</div>
      <div className="bit-stride-table">
        <div className="bit-stride-header">
          <span>#</span>
          <span>Byte</span>
          <span>Bit</span>
        </div>
        <div className="bit-stride-rows">
          {Array.from({ length: preset.bpp }, (_, i) => (
            <div key={i} className="bit-stride-row">
              <span className="bit-index">{i}</span>
              <input
                type="number"
                className="input-number"
                value={preset.bitStrideByte[i]}
                onChange={(e) => handleBitStrideByteChange(i, parseInt(e.target.value) || 0)}
              />
              <input
                type="number"
                className="input-number bit-input"
                value={preset.bitStrideBit[i]}
                onChange={(e) => handleBitStrideBitChange(i, parseInt(e.target.value) || 0)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
