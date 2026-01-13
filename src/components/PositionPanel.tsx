// Position control panel component - Figma-style design
import { Minus, Plus, ArrowDown, ArrowRight, Grid3x3, Link } from 'lucide-react';
import { ZOOM_MAX } from '../types';
import { ByteBitInput } from './ByteBitInput';

interface PositionPanelProps {
  posByte: number;
  posBit: number;
  zoom: number;
  hideGrid: boolean;
  snapScroll: boolean;
  horizontalLayout: boolean;
  onPositionChange: (byte: number, bit: number) => void;
  onZoomChange: (zoom: number) => void;
  onToggleGrid: () => void;
  onToggleSnapScroll: () => void;
  onToggleHorizontalLayout: () => void;
}

export function PositionPanel({
  posByte,
  posBit,
  zoom,
  hideGrid,
  snapScroll,
  horizontalLayout,
  onPositionChange,
  onZoomChange,
  onToggleGrid,
  onToggleSnapScroll,
  onToggleHorizontalLayout,
}: PositionPanelProps) {
  return (
    <div className="panel">
      <div className="panel-header">
        Position
        <div className="panel-header-actions">
          <button
            className="auto-toggle-btn"
            onClick={onToggleHorizontalLayout}
            title={horizontalLayout ? 'Horizontal layout (row-major)' : 'Vertical layout (column-major)'}
          >
            {horizontalLayout ? <ArrowRight size={14} /> : <ArrowDown size={14} />}
          </button>
          <button
            className={`icon-btn toggle ${!hideGrid ? 'active' : ''}`}
            onClick={onToggleGrid}
            title={hideGrid ? 'Show grid padding' : 'Hide grid padding'}
          >
            <Grid3x3 size={14} />
          </button>
          <button
            className={`icon-btn toggle ${snapScroll ? 'active' : ''}`}
            onClick={onToggleSnapScroll}
            title={snapScroll ? 'Snap scroll enabled' : 'Free scroll'}
          >
            <Link size={14} />
          </button>
        </div>
      </div>
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
