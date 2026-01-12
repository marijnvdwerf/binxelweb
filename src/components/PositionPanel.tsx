// Position control panel component
import React from 'react';
import { ZOOM_MAX } from '../types';

interface PositionPanelProps {
  posByte: number;
  posBit: number;
  zoom: number;
  decimalPosition: boolean;
  pixelInfo: string;
  onPositionChange: (byte: number, bit: number) => void;
  onAdvanceByte: (delta: number) => void;
  onAdvanceBit: (delta: number) => void;
  onZoomChange: (zoom: number) => void;
  onReset: () => void;
}

export function PositionPanel({
  posByte,
  posBit,
  zoom,
  decimalPosition,
  pixelInfo,
  onPositionChange,
  onAdvanceByte,
  onAdvanceBit,
  onZoomChange,
  onReset,
}: PositionPanelProps) {
  const formatByte = (value: number) => {
    if (decimalPosition) return value.toString();
    return value.toString(16).toUpperCase().padStart(8, '0');
  };

  const parseByte = (value: string) => {
    if (decimalPosition) return parseInt(value, 10) || 0;
    return parseInt(value, 16) || 0;
  };

  return (
    <div className="panel position-panel">
      <div className="panel-header">Position</div>

      <div className="control-row">
        <button
          className="btn btn-sm"
          onClick={() => onAdvanceByte(1)}
          onContextMenu={(e) => { e.preventDefault(); onAdvanceByte(-1); }}
          title="Left click: +1 byte, Right click: -1 byte"
        >
          Byte
        </button>
        <input
          type="text"
          className={`input-number ${!decimalPosition ? 'hex' : ''}`}
          value={formatByte(posByte)}
          onChange={(e) => onPositionChange(parseByte(e.target.value), posBit)}
        />
      </div>

      <div className="control-row">
        <button
          className="btn btn-sm"
          onClick={() => onAdvanceBit(1)}
          onContextMenu={(e) => { e.preventDefault(); onAdvanceBit(-1); }}
          title="Left click: +1 bit, Right click: -1 bit"
        >
          Bit
        </button>
        <input
          type="number"
          className="input-number bit-input"
          value={posBit}
          min={0}
          max={7}
          onChange={(e) => onPositionChange(posByte, parseInt(e.target.value) || 0)}
        />
      </div>

      <div className="control-row">
        <button
          className="btn btn-sm"
          onClick={() => onZoomChange(zoom + 1)}
          onContextMenu={(e) => { e.preventDefault(); onZoomChange(zoom - 1); }}
          title="Left click: zoom in, Right click: zoom out"
        >
          Zoom
        </button>
        <input
          type="number"
          className="input-number"
          value={zoom}
          min={1}
          max={ZOOM_MAX}
          onChange={(e) => onZoomChange(parseInt(e.target.value) || 1)}
        />
      </div>

      <div className="control-row">
        <button className="btn btn-sm" onClick={onReset} title="Reset position to 0">
          0
        </button>
        <div className="pixel-info">{pixelInfo || '(hover for info)'}</div>
      </div>
    </div>
  );
}
