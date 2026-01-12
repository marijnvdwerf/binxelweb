import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useBinxelview } from '../hooks/useBinxelview'
import { PositionPanel } from '../components/PositionPanel'
import { PackingPanel } from '../components/PackingPanel'
import { TilingPanel } from '../components/TilingPanel'
import { PalettePanel } from '../components/PalettePanel'
import { BitStridePanel } from '../components/BitStridePanel'
import { PixelViewer } from '../components/PixelViewer'
import { PixelInfoPanel } from '../components/PixelInfoPanel'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  const [state, actions] = useBinxelview()
  const [pixelInfo, setPixelInfo] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if focused on an input
      const isInputFocused =
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'o':
            e.preventDefault()
            fileInputRef.current?.click()
            break
          case 'r':
            e.preventDefault()
            if (lastFileRef.current) {
              actions.loadFile(lastFileRef.current)
            }
            break
        }
      } else if (!isInputFocused) {
        // Shortcuts that only work when not in an input
        switch (e.key) {
          case 'ArrowLeft':
            e.preventDefault()
            actions.advancePixel(-1)
            break
          case 'ArrowRight':
            e.preventDefault()
            actions.advancePixel(1)
            break
          case 'ArrowUp':
            e.preventDefault()
            actions.advanceRow(-1)
            break
          case 'ArrowDown':
            e.preventDefault()
            actions.advanceRow(1)
            break
          case 'PageUp':
            e.preventDefault()
            actions.advanceNext(-1)
            break
          case 'PageDown':
            e.preventDefault()
            actions.advanceNext(1)
            break
          case '+':
          case '=':
            e.preventDefault()
            actions.setZoom(Math.min(32, state.zoom + 1))
            break
          case '-':
            e.preventDefault()
            actions.setZoom(Math.max(1, state.zoom - 1))
            break
          case 'g':
            e.preventDefault()
            actions.toggleGrid()
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [actions, state.zoom])

  // Drag and drop
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const file = e.dataTransfer?.files[0]
      if (file) {
        lastFileRef.current = file
        actions.loadFile(file)
      }
    }

    container.addEventListener('dragover', handleDragOver)
    container.addEventListener('drop', handleDrop)

    return () => {
      container.removeEventListener('dragover', handleDragOver)
      container.removeEventListener('drop', handleDrop)
    }
  }, [actions])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        lastFileRef.current = file
        actions.loadFile(file)
      }
      e.target.value = ''
    },
    [actions]
  )

  return (
    <div className="app" ref={containerRef}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="main-content">
        <div className="sidebar">
          <PositionPanel
            posByte={state.posByte}
            posBit={state.posBit}
            zoom={state.zoom}
            onPositionChange={actions.setPosition}
            onZoomChange={actions.setZoom}
          />

          <PackingPanel
            preset={state.preset}
            onPresetChange={actions.updatePreset}
            onPresetSelect={actions.loadPresetByName}
            onAdvancePixel={actions.advancePixel}
            onAdvanceRow={actions.advanceRow}
            onAdvanceNext={actions.advanceNext}
          />

          <BitStridePanel
            preset={state.preset}
            onPresetChange={actions.updatePreset}
          />

          <TilingPanel
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

          {/* Pixel info at bottom */}
          <PixelInfoPanel pixelInfo={pixelInfo} />
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
  )
}
