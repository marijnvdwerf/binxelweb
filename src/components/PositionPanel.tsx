// Position control panel component - Figma-style design
import { Minus, Plus } from 'lucide-react';
import { ZOOM_MAX } from '../types';
import { ByteBitInput } from './ByteBitInput';

interface PositionPanelProps {
  posByte: number;
  posBit: number;
  zoom: number;
  onPositionChange: (byte: number, bit: number) => void;
  onZoomChange: (zoom: number) => void;
}

export function PositionPanel({
  posByte,
  posBit,
  zoom,
  onPositionChange,
  onZoomChange,
}: PositionPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">Position</div>
      <div className="panel-content">
        <div className="position-grid">
          {/* Offset column */}
          <div className="position-column">
            <div className="field-label">Offset</div>
            <ByteBitInput
              byteValue={posByte}
              bitValue={posBit}
              onChange={onPositionChange}
            />
          </div>

          {/* Zoom column */}
          <div className="position-column">
            <div className="field-label">Zoom</div>
            <div className="zoom-control">
              <button
                className="zoom-btn"
                onClick={() => onZoomChange(Math.max(1, zoom - 1))}
                disabled={zoom <= 1}
                title="Zoom out"
              >
                <Minus size={12} />
              </button>
              <input
                type="number"
                className="zoom-input"
                value={zoom}
                min={1}
                max={ZOOM_MAX}
                onChange={(e) => onZoomChange(Math.max(1, Math.min(ZOOM_MAX, parseInt(e.target.value) || 1)))}
              />
              <button
                className="zoom-btn"
                onClick={() => onZoomChange(Math.min(ZOOM_MAX, zoom + 1))}
                disabled={zoom >= ZOOM_MAX}
                title="Zoom in"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
