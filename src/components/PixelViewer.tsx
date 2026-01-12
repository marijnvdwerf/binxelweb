// Pixel viewer canvas component with virtual scrolling
import React, { useRef, useEffect, useCallback, useState, useMemo, useLayoutEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Preset, TwiddleMode, PaletteMode } from '../types';
import { renderGrid, renderToCanvas, readPixelAt, getPixelPosition, GridRenderResult } from '../renderer';
import { createPaletteLookup, hexToArgb } from '../palette';

interface PixelViewerProps {
  data: Uint8Array;
  preset: Preset;
  zoom: number;
  hideGrid: boolean;
  horizontalLayout: boolean;
  paletteMode: PaletteMode;
  customPalette: string[];
  randomSeed: number;
  background: string;
  onPixelHover: (info: string) => void;
}

export function PixelViewer({
  data,
  preset,
  zoom,
  hideGrid,
  horizontalLayout,
  paletteMode,
  customPalette,
  randomSeed,
  background,
  onPixelHover,
}: PixelViewerProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastRenderResultRef = useRef<GridRenderResult | null>(null);
  const [containerWidth, setContainerWidth] = useState(512);

  // Create palette lookup - memoized based on palette settings
  const getPaletteColor = useMemo(() => {
    return createPaletteLookup({
      mode: paletteMode,
      bpp: preset.bpp,
      customPalette,
      randomSeed,
    });
  }, [paletteMode, preset.bpp, customPalette, randomSeed]);

  const backgroundColor = useMemo(() => hexToArgb(background), [background]);

  // Calculate tile dimensions
  const tileWidth = preset.width;
  const tileHeight = preset.height;
  const padX = (tileWidth === 1 || hideGrid) ? 0 : 1;
  const padY = (tileHeight === 1 || hideGrid) ? 0 : 1;
  const tileWidthPadded = (padX + tileWidth) * zoom;
  const tileHeightPadded = (padY + tileHeight) * zoom;

  // Calculate bytes per tile
  const bitsPerTile = preset.nextStrideByte * 8 + preset.nextStrideBit;
  const bytesPerTile = Math.ceil(bitsPerTile / 8) || 1;

  // Calculate tiles per row based on container width
  const tilesPerRow = Math.max(1, Math.floor(containerWidth / tileWidthPadded));

  // Calculate bytes per row of tiles
  const bytesPerRow = bytesPerTile * tilesPerRow;

  // Calculate total number of rows based on data size
  const totalRows = data.length > 0 ? Math.ceil(data.length / bytesPerRow) : 0;

  // Update container width on resize
  useEffect(() => {
    const parent = parentRef.current;
    if (!parent) return;

    const updateWidth = () => {
      const width = parent.clientWidth - 20; // Account for scrollbar
      setContainerWidth(width);
    };

    updateWidth();

    const observer = new ResizeObserver(updateWidth);
    observer.observe(parent);
    return () => observer.disconnect();
  }, []);

  // Create virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => tileHeightPadded,
    overscan: 5,
  });

  // Calculate actual canvas dimensions based on visible area
  const canvasWidth = tilesPerRow * tileWidthPadded + padX * zoom;
  const visibleRows = rowVirtualizer.getVirtualItems();
  const canvasHeight = visibleRows.length > 0
    ? visibleRows.length * tileHeightPadded + padY * zoom
    : tileHeightPadded + padY * zoom;

  // Get the starting row index for rendering
  const startRowIndex = visibleRows.length > 0 ? visibleRows[0].index : 0;
  const startByte = startRowIndex * bytesPerRow;

  // Render visible tiles to canvas
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0 || visibleRows.length === 0) return;

    const result = renderGrid(
      {
        data,
        preset,
        posByte: startByte,
        posBit: 0,
        getPaletteColor,
        backgroundColor,
      },
      canvasWidth,
      canvasHeight,
      zoom,
      hideGrid,
      horizontalLayout
    );

    lastRenderResultRef.current = result;
    renderToCanvas(canvas, result, zoom);
  }, [data, preset, startByte, zoom, hideGrid, horizontalLayout, getPaletteColor, backgroundColor, canvasWidth, canvasHeight, visibleRows.length, tilesPerRow]);

  // Handle mouse move for pixel info
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const lastRenderResult = lastRenderResultRef.current;
    if (!canvas || !lastRenderResult || data.length === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / zoom);
    const y = Math.floor((e.clientY - rect.top) / zoom);

    const { gridX, gridY, padX, padY, tileWidthPadded: twp, tileHeightPadded: thp } = lastRenderResult;
    const tw = preset.width;
    const th = preset.height;

    // Find which tile we're in
    const tx = Math.floor(x / twp);
    const ty = Math.floor(y / thp);

    if (tx >= gridX || ty >= gridY || tx < 0 || ty < 0) {
      onPixelHover('');
      return;
    }

    // Calculate tile index
    let tile: number;
    if (horizontalLayout) {
      tile = ty * gridX + tx;
    } else {
      tile = tx * gridY + ty;
    }

    // Calculate local position within tile
    const ox = (x - tx * twp) - padX;
    const oy = (y - ty * thp) - padY;

    if (ox < 0 || ox >= tw || oy < 0 || oy >= th) {
      onPixelHover('');
      return;
    }

    // Handle twiddle
    let localX = ox;
    let localY = oy;
    if (preset.twiddle !== TwiddleMode.NONE) {
      let twx = preset.twiddle === TwiddleMode.N ? localY : localX;
      let twy = preset.twiddle === TwiddleMode.N ? localX : localY;
      let bit = 0;
      let twxy = 0;
      while (twx > 0 || twy > 0) {
        twxy |= ((twx >> bit) & 1) << (bit * 2 + 0) | ((twy >> bit) & 1) << (bit * 2 + 1);
        twx &= ~(1 << bit);
        twy &= ~(1 << bit);
        bit++;
      }
      localY = Math.floor(twxy / tw);
      localX = twxy % tw;
    }

    // Calculate bit position using startByte
    const pos = getPixelPosition(preset, startByte, 0, tile, localX, localY);
    const pixelValue = readPixelAt(data, preset, pos);

    if (pixelValue < 0) {
      onPixelHover('');
      return;
    }

    const posByteDisplay = pos >> 3;
    const posBitDisplay = pos & 7;
    onPixelHover(
      `${posByteDisplay}+${posBitDisplay} = ${pixelValue}\n` +
      `${posByteDisplay.toString(16).toUpperCase().padStart(8, '0')}+${posBitDisplay} = ${pixelValue.toString(16).toUpperCase()}`
    );
  }, [data, preset, startByte, zoom, horizontalLayout, onPixelHover]);

  return (
    <div
      ref={parentRef}
      className="pixel-viewer"
      style={{ overflow: 'auto', position: 'relative' }}
    >
      {data.length === 0 ? (
        <div className="drop-hint">
          Drop a file here or press Ctrl+O
        </div>
      ) : (
        <>
          {/* Fixed canvas that doesn't move with scroll */}
          <canvas
            ref={canvasRef}
            className="pixel-canvas"
            style={{
              position: 'sticky',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => onPixelHover('')}
          />
          {/* Spacer div to create scrollable area */}
          <div
            style={{
              height: rowVirtualizer.getTotalSize() - canvasHeight,
              width: canvasWidth,
              pointerEvents: 'none',
            }}
          />
        </>
      )}
    </div>
  );
}
