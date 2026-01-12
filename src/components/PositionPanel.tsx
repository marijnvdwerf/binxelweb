// Position control panel component - Figma-style design
import React from 'react';
import { RotateCcw, ZoomIn } from 'lucide-react';
import { ZOOM_MAX } from '../types';
import { ByteIcon, BitIcon } from './Icons';

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
    <div className="panel">
      <div className="panel-header">
        Position
        <div className="panel-header-actions">
          <button
            className="icon-btn"
            onClick={onReset}
            title="Reset to 0"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>
      <div className="panel-content">
        {/* Offset - byte and bit side by side */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Offset</div>
            <div className="byte-bit-field">
              <div
                className="byte-field"
                onClick={() => onAdvanceByte(1)}
                onContextMenu={(e) => { e.preventDefault(); onAdvanceByte(-1); }}
                title="Click +1, Right-click -1"
                style={{ cursor: 'pointer' }}
              >
                <ByteIcon size={12} className="field-icon" />
                <input
                  type="text"
                  value={formatByte(posByte)}
                  onChange={(e) => onPositionChange(parseByte(e.target.value), posBit)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
              <div
                className="bit-field"
                onClick={() => onAdvanceBit(1)}
                onContextMenu={(e) => { e.preventDefault(); onAdvanceBit(-1); }}
                title="Click +1, Right-click -1"
                style={{ cursor: 'pointer', flex: '0 0 50px' }}
              >
                <BitIcon size={12} className="field-icon" />
                <input
                  type="number"
                  value={posBit}
                  min={0}
                  max={7}
                  onChange={(e) => onPositionChange(posByte, parseInt(e.target.value) || 0)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Zoom */}
        <div className="field-row">
          <div className="field-half">
            <div className="field-label">Zoom</div>
            <div
              className="input-group"
              onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + 1))}
              onContextMenu={(e) => { e.preventDefault(); onZoomChange(Math.max(1, zoom - 1)); }}
              title="Click +1, Right-click -1"
              style={{ cursor: 'pointer' }}
            >
              <ZoomIn size={14} className="input-icon" />
              <input
                type="number"
                value={zoom}
                min={1}
                max={ZOOM_MAX}
                onChange={(e) => onZoomChange(parseInt(e.target.value) || 1)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className="input-suffix">×</span>
            </div>
          </div>
        </div>

        {/* Cursor info */}
        <div className="info-box">
          {pixelInfo || 'Hover over pixels'}
        </div>
      </div>
    </div>
  );
}
