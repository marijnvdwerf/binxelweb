// Status bar component - shows position, pixel info, zoom, dimensions
import React from 'react';
import { Grid3X3 } from 'lucide-react';

interface StatusBarProps {
  posByte: number;
  posBit: number;
  pixelInfo: string;
  zoom: number;
  width: number;
  height: number;
  presetName: string;
  hideGrid: boolean;
}

export function StatusBar({
  posByte,
  posBit,
  pixelInfo,
  zoom,
  width,
  height,
  presetName,
  hideGrid,
}: StatusBarProps) {
  // Format position as "0x00001234 + 3 bits"
  const formatPosition = () => {
    const hex = posByte.toString(16).toUpperCase().padStart(8, '0');
    if (posBit === 0) {
      return `0x${hex}`;
    }
    return `0x${hex} + ${posBit}b`;
  };

  // Parse pixel info to extract key details
  const parsePixelInfo = () => {
    if (!pixelInfo) return null;
    // Format: "Pos (X,Y)\nPixel N = R,G,B\n..."
    const lines = pixelInfo.split('\n');
    const posMatch = lines[0]?.match(/Pos \((\d+),(\d+)\)/);
    const pixelMatch = lines[1]?.match(/Pixel (\d+)/);
    const colorMatch = lines[1]?.match(/= (\d+),(\d+),(\d+)/);

    if (posMatch && pixelMatch && colorMatch) {
      const x = posMatch[1] || '0';
      const y = posMatch[2] || '0';
      const index = pixelMatch[1] || '0';
      const r = colorMatch[1] || '0';
      const g = colorMatch[2] || '0';
      const b = colorMatch[3] || '0';
      const hex = `#${parseInt(r, 10).toString(16).padStart(2, '0')}${parseInt(g, 10).toString(16).padStart(2, '0')}${parseInt(b, 10).toString(16).padStart(2, '0')}`.toUpperCase();
      return { x, y, index, r, g, b, hex };
    }
    return null;
  };

  const pixel = parsePixelInfo();

  return (
    <div className="status-bar">
      <div className="status-section">
        <span className="status-label">Pos</span>
        <span className="status-value mono">{formatPosition()}</span>
      </div>

      {pixel ? (
        <>
          <div className="status-separator" />
          <div className="status-section">
            <span className="status-label">({pixel.x},{pixel.y})</span>
            <span
              className="status-color-swatch"
              style={{ backgroundColor: pixel.hex }}
            />
            <span className="status-value mono">#{pixel.index}</span>
            <span className="status-value muted">{pixel.hex}</span>
          </div>
        </>
      ) : null}

      <div className="status-spacer" />

      <div className="status-section">
        <span className="status-value">{width}×{height}</span>
      </div>

      <div className="status-separator" />

      <div className="status-section">
        <span className="status-value">{zoom}×</span>
      </div>

      {!hideGrid && (
        <>
          <div className="status-separator" />
          <div className="status-section">
            <Grid3X3 size={12} className="status-icon" />
          </div>
        </>
      )}

      {presetName && (
        <>
          <div className="status-separator" />
          <div className="status-section">
            <span className="status-value preset-name">{presetName}</span>
          </div>
        </>
      )}
    </div>
  );
}
