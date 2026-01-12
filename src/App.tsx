// Main Binxelview application component
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useBinxelview } from './hooks/useBinxelview';
import { MenuBar } from './components/MenuBar';
import { PositionPanel } from './components/PositionPanel';
import { PackingPanel } from './components/PackingPanel';
import { TilingPanel } from './components/TilingPanel';
import { PalettePanel } from './components/PalettePanel';
import { BitStridePanel } from './components/BitStridePanel';
import { PixelViewer } from './components/PixelViewer';
import './styles.css';

export function App() {
  const [state, actions] = useBinxelview();
  const [pixelInfo, setPixelInfo] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFileRef = useRef<File | null>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'o':
            e.preventDefault();
            document.querySelector<HTMLInputElement>('input[type="file"]')?.click();
            break;
          case 'r':
            e.preventDefault();
            if (lastFileRef.current) {
              actions.loadFile(lastFileRef.current);
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);

  // Drag and drop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer?.files[0];
      if (file) {
        lastFileRef.current = file;
        actions.loadFile(file);
      }
    };

    container.addEventListener('dragover', handleDragOver);
    container.addEventListener('drop', handleDrop);

    return () => {
      container.removeEventListener('dragover', handleDragOver);
      container.removeEventListener('drop', handleDrop);
    };
  }, [actions]);

  const handleOpenFile = useCallback((file: File) => {
    lastFileRef.current = file;
    actions.loadFile(file);
  }, [actions]);

  const handleReload = useCallback(() => {
    if (lastFileRef.current) {
      actions.loadFile(lastFileRef.current);
    }
  }, [actions]);

  const handleSaveImage = useCallback(() => {
    // Get canvas and save as PNG
    const canvas = document.querySelector<HTMLCanvasElement>('.pixel-canvas');
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${state.dataFile || 'image'}.${state.posByte.toString(16).padStart(8, '0')}.${state.posBit}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, [state.dataFile, state.posByte, state.posBit]);

  return (
    <div className="app" ref={containerRef}>
      <MenuBar
        dataFile={state.dataFile}
        hideGrid={state.hideGrid}
        decimalPosition={state.decimalPosition}
        snapScroll={state.snapScroll}
        horizontalLayout={state.horizontalLayout}
        onOpenFile={handleOpenFile}
        onReload={handleReload}
        onSaveImage={handleSaveImage}
        onToggleGrid={actions.toggleGrid}
        onToggleDecimalPosition={actions.toggleDecimalPosition}
        onToggleSnapScroll={actions.toggleSnapScroll}
        onToggleHorizontalLayout={actions.toggleHorizontalLayout}
      />

      <div className="main-content">
        <div className="sidebar">
          <PositionPanel
            posByte={state.posByte}
            posBit={state.posBit}
            zoom={state.zoom}
            decimalPosition={state.decimalPosition}
            pixelInfo={pixelInfo}
            onPositionChange={actions.setPosition}
            onAdvanceByte={actions.advanceByte}
            onAdvanceBit={actions.advanceBit}
            onZoomChange={actions.setZoom}
            onReset={actions.resetPosition}
          />

          <PackingPanel
            preset={state.preset}
            onPresetChange={actions.updatePreset}
            onPresetSelect={actions.loadPresetByName}
            onAdvancePixel={actions.advancePixel}
            onAdvanceRow={actions.advanceRow}
            onAdvanceNext={actions.advanceNext}
          />

          <TilingPanel
            preset={state.preset}
            onPresetChange={actions.updatePreset}
          />

          <BitStridePanel
            preset={state.preset}
            onPresetChange={actions.updatePreset}
          />

          <PalettePanel
            bpp={state.preset.bpp}
            paletteMode={state.paletteMode}
            customPalette={state.customPalette}
            randomSeed={state.randomSeed}
            background={state.background}
            onPaletteModeChange={actions.setPaletteMode}
            onCustomColorChange={actions.setCustomPaletteColor}
            onBackgroundChange={actions.setBackground}
            onRegenerateRandom={actions.regenerateRandomPalette}
            onLoadPalette={actions.loadCustomPalette}
          />
        </div>

        <div className="viewer-container">
          <PixelViewer
            data={state.data}
            preset={state.preset}
            zoom={state.zoom}
            hideGrid={state.hideGrid}
            horizontalLayout={state.horizontalLayout}
            paletteMode={state.paletteMode}
            customPalette={state.customPalette}
            randomSeed={state.randomSeed}
            background={state.background}
            onPixelHover={setPixelInfo}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
