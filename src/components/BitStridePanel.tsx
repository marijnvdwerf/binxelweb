// Bit stride panel - register-style layout inspired by ARM documentation
import React, { useMemo } from 'react';
import { Preset } from '../types';

interface BitStridePanelProps {
  preset: Preset;
  onPresetChange: (updates: Partial<Preset>) => void;
}

export function BitStridePanel({ preset, onPresetChange }: BitStridePanelProps) {
  // Calculate auto (chunky) values - just bit offsets
  const autoValues = useMemo(() => {
    const offsets: number[] = [];
    for (let i = 0; i < preset.bpp; i++) {
      offsets.push(i);
    }
    return offsets;
  }, [preset.bpp]);

  // Convert byte.bit to total bit offset
  const toBitOffset = (byte: number, bit: number) => byte * 8 + bit;

  // Convert total bit offset to byte.bit
  const fromBitOffset = (offset: number) => ({
    byte: Math.floor(offset / 8),
    bit: offset % 8,
  });

  const handleBitOffsetChange = (bitIndex: number, newOffset: number) => {
    const { byte, bit } = fromBitOffset(Math.max(0, newOffset));
    const newBitStrideByte = [...preset.bitStrideByte];
    const newBitStrideBit = [...preset.bitStrideBit];
    newBitStrideByte[bitIndex] = byte;
    newBitStrideBit[bitIndex] = bit;
    onPresetChange({ bitStrideByte: newBitStrideByte, bitStrideBit: newBitStrideBit });
  };

  // Get display offset for each bit (auto values when chunky)
  const getDisplayOffset = (bitIndex: number) => {
    if (preset.chunky) {
      return autoValues[bitIndex];
    }
    return toBitOffset(preset.bitStrideByte[bitIndex], preset.bitStrideBit[bitIndex]);
  };

  // Group bits into rows of 8, with bit indices in descending order (7-0, 15-8, etc.)
  const rows = useMemo(() => {
    const result: { inputBit: number; displayBit: number }[][] = [];
    const numRows = Math.ceil(preset.bpp / 8);

    for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
      const row: { inputBit: number; displayBit: number }[] = [];
      const rowStartBit = rowIdx * 8;
      const rowEndBit = Math.min(rowStartBit + 8, preset.bpp);
      const bitsInRow = rowEndBit - rowStartBit;

      // Always 8 columns, right-aligned - pad with empty slots on the left
      for (let col = 0; col < 8; col++) {
        const bitWithinRow = 7 - col; // Descending: 7, 6, 5, 4, 3, 2, 1, 0
        if (bitWithinRow < bitsInRow) {
          const inputBit = rowStartBit + bitWithinRow;
          row.push({ inputBit, displayBit: rowStartBit + 7 - col });
        } else {
          row.push({ inputBit: -1, displayBit: rowStartBit + 7 - col }); // Empty slot
        }
      }
      result.push(row);
    }
    return result;
  }, [preset.bpp]);

  return (
    <div className="panel">
      <div className="panel-header">Bit Planes</div>
      <div className="panel-content">
        {/* Chunky/Planar toggle */}
        <div className="toggle-group" style={{ marginBottom: 8 }}>
          <button
            className={`toggle-btn ${preset.chunky ? 'active' : ''}`}
            onClick={() => onPresetChange({ chunky: true })}
          >
            Chunky
          </button>
          <button
            className={`toggle-btn ${!preset.chunky ? 'active' : ''}`}
            onClick={() => onPresetChange({ chunky: false })}
          >
            Planar
          </button>
        </div>

        {/* Register-style bit plane table */}
        <div className="register-table">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="register-row-group">
              {/* Header row: input bit indices (descending: 7-0, 15-8, etc.) */}
              <div className="register-header">
                {row.map((cell, colIdx) => (
                  <span key={colIdx} className="register-cell header">
                    {cell.inputBit >= 0 ? cell.displayBit : ''}
                  </span>
                ))}
              </div>
              {/* Value row: output bit offsets */}
              <div className="register-values">
                {row.map((cell, colIdx) => (
                  <div key={colIdx} className="register-cell-group">
                    {cell.inputBit >= 0 ? (
                      <input
                        type="number"
                        className="register-output"
                        value={getDisplayOffset(cell.inputBit)}
                        disabled={preset.chunky}
                        onChange={(e) => {
                          const newOffset = parseInt(e.target.value) || 0;
                          handleBitOffsetChange(cell.inputBit, newOffset);
                        }}
                      />
                    ) : (
                      <span className="register-empty" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
