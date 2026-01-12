// Pixel info panel - displays hover info at bottom of sidebar
import React from 'react';

interface PixelInfoPanelProps {
  pixelInfo: string;
}

export function PixelInfoPanel({ pixelInfo }: PixelInfoPanelProps) {
  if (!pixelInfo) return null;

  return (
    <div className="pixel-info-panel">
      {pixelInfo}
    </div>
  );
}
