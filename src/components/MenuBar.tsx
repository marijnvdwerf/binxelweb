// Menu bar component
import React, { useRef, useCallback } from 'react';
import { PanelLeft, PanelLeftClose } from 'lucide-react';

interface MenuBarProps {
  dataFile: string;
  hideGrid: boolean;
  decimalPosition: boolean;
  snapScroll: boolean;
  horizontalLayout: boolean;
  sidebarCollapsed: boolean;
  onOpenFile: (file: File) => void;
  onReload: () => void;
  onSaveImage: () => void;
  onToggleGrid: () => void;
  onToggleDecimalPosition: () => void;
  onToggleSnapScroll: () => void;
  onToggleHorizontalLayout: () => void;
  onToggleSidebar: () => void;
}

export function MenuBar({
  dataFile,
  hideGrid,
  decimalPosition,
  snapScroll,
  horizontalLayout,
  sidebarCollapsed,
  onOpenFile,
  onReload,
  onSaveImage,
  onToggleGrid,
  onToggleDecimalPosition,
  onToggleSnapScroll,
  onToggleHorizontalLayout,
  onToggleSidebar,
}: MenuBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
    e.target.value = '';
  }, [onOpenFile]);

  return (
    <div className="menu-bar">
      <button
        className="icon-btn sidebar-toggle"
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Show sidebar (Ctrl+B)' : 'Hide sidebar (Ctrl+B)'}
      >
        {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
      </button>

      <div className="menu-item">
        <span className="menu-label">File</span>
        <div className="menu-dropdown">
          <button onClick={handleOpenClick}>Open... <span className="shortcut">Ctrl+O</span></button>
          <button onClick={onReload} disabled={!dataFile}>Reload <span className="shortcut">Ctrl+R</span></button>
          <div className="menu-separator" />
          <button onClick={onSaveImage} disabled={!dataFile}>Save Image...</button>
        </div>
      </div>

      <div className="menu-item">
        <span className="menu-label">Options</span>
        <div className="menu-dropdown">
          <button onClick={onToggleGrid}>
            {hideGrid ? '[ ]' : '[x]'} Show Grid
          </button>
          <button onClick={onToggleSnapScroll}>
            {snapScroll ? '[x]' : '[ ]'} Snap Scroll
          </button>
          <div className="menu-separator" />
          <button onClick={onToggleDecimalPosition}>
            {decimalPosition ? '[x]' : '[ ]'} Decimal Position
          </button>
          <button onClick={onToggleDecimalPosition}>
            {!decimalPosition ? '[x]' : '[ ]'} Hexadecimal Position
          </button>
          <div className="menu-separator" />
          <button onClick={onToggleHorizontalLayout}>
            {!horizontalLayout ? '[x]' : '[ ]'} Vertical Layout
          </button>
          <button onClick={onToggleHorizontalLayout}>
            {horizontalLayout ? '[x]' : '[ ]'} Horizontal Layout
          </button>
        </div>
      </div>

      <div className="menu-item">
        <span className="menu-label">Help</span>
        <div className="menu-dropdown">
          <button onClick={() => window.open('https://github.com/bbbradsmith/binxelview', '_blank')}>
            About Binxelview
          </button>
        </div>
      </div>

      {dataFile && (
        <div className="file-name">
          {dataFile}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );
}
