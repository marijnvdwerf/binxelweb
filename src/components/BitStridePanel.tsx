// Bit stride panel for planar graphics configuration - Figma-style design
import React from 'react';
import { Preset } from '../types';
import { ByteIcon, BitIcon } from './Icons';

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
      <div className="panel">
        <div className="panel-header">Bit Planes</div>
        <div className="disabled-message">
          Disable chunky mode for planar bit planes
        </div>
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="panel-header">Bit Planes</div>
      <div className="panel-content">
        <div className="bit-stride-list">
          {Array.from({ length: preset.bpp }, (_, i) => (
            <div key={i} className="field-row" style={{ marginBottom: 4 }}>
              <div className="field-half">
                <div className="field-label">{i}</div>
                <div className="byte-bit-field">
                  <div className="byte-field">
                    <ByteIcon size={12} className="field-icon" />
                    <input
                      type="number"
                      value={preset.bitStrideByte[i]}
                      onChange={(e) => handleBitStrideByteChange(i, parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bit-field">
                    <BitIcon size={12} className="field-icon" />
                    <input
                      type="number"
                      value={preset.bitStrideBit[i]}
                      onChange={(e) => handleBitStrideBitChange(i, parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
