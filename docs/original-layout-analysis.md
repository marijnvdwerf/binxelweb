# Binxelview Original Layout Analysis

Analysis of the Windows Forms layout from `BinxelviewForm.Designer.cs`.

## ASCII Art Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ File   Preset   Advanced   Options   Help                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│ ┌─ Position ─────────┐ ┌─ Packing ─────────────────────────┐ ┌─ Palette ──────┐│
│ │                    │ │                                   │ │                ││
│ │ [Byte][0x00000000] │ │ [x]Reverse Byte  [x]Chunky        │ │ ┌──────────┐   ││
│ │ [Bit ][    0     ] │ │                                   │ │ │          │   ││
│ │                    │ │   BPP      Width    Height        │ │ │ Palette  │[bg]││
│ │ [0]  (Pixel Info)  │ │  [ 8 ]    [ 8 ]    [ 1 ]         │ │ │ Preview  │Back││
│ │         [Zoom][ 2] │ │                                   │ │ │ 130x130  │grnd││
│ └────────────────────┘ │ [Pixel]  [Row ]   [Next]          │ │ │          │   ││
│                        │ [ 1   ]  [ 8  ]   [ 8  ] ←Byte    │ │ └──────────┘   ││
│ ┌─ Tiling ───────────┐ │ [ 0   ]  [ 0  ]   [ 0  ] ←Bit     │ │                ││
│ │        X      Y    │ │ [x]Auto  [x]Auto  [x]Auto         │ │ [Auto][Palette▾]││
│ │ Size  [0]    [0]   │ │                                   │ │ [Load..][Save..]││
│ │       ┌────────────┤ │ [Load...] [Save...]               │ │                ││
│ │ Stride│ Byte  Bit  │ │ ┌─────────────────────┐           │ │ (Palette Info) ││
│ │   X   │[ 0 ] [ 0 ]│ │ │ Order │ Byte │ Bit  │           │ │                ││
│ │   Y   │[ 0 ] [ 0 ]│ │ │   0   │  0   │  0   │           │ └────────────────┘│
│ └───────┴────────────┘ │ │   1   │  0   │  1   │           │                   │
│                        │ │   2   │  0   │  2   │           │                   │
│                        │ │  ...  │ ...  │ ...  │           │                   │
│                        │ └─────────────────────┘           │                   │
│                        └───────────────────────────────────┘                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                              [▲]│
│                                                                              [ ]│
│                         ┌─────────────────────┐                              [ ]│
│                         │                     │                              [ ]│
│                         │   Pixel Viewer      │                              [ ]│
│                         │   (Main Canvas)     │                              [ ]│
│                         │                     │                              [ ]│
│                         └─────────────────────┘                              [ ]│
│                                                                              [▼]│
└─────────────────────────────────────────────────────────────────────────────────┘
```

## Detailed Packing Panel Layout

```
┌─ Packing ──────────────────────────────────────────────────────────────────────┐
│                                                                                │
│  (6,19)                    (98,19)                                             │
│  [x] Reverse Byte          [x] Chunky                                          │
│                                                                                │
│     (6,39)      (65,39)      (122,39)                                          │
│      BPP         Width        Height       ← Labels centered above inputs      │
│     (7,66)      (65,66)      (122,66)                                          │
│    [ 8    ]    [ 8    ]     [ 1    ]       ← 51px wide NumericUpDown           │
│                                                                                │
│     (6,89)      (64,89)      (121,89)                                          │
│    [Pixel ]    [ Row  ]     [ Next ]       ← Buttons 53x24px                   │
│                                                                                │
│     (7,116)     (65,116)     (122,116)                                         │
│    [   1  ]    [   8  ]     [   8  ]       ← Byte stride (black text)          │
│     (7,142)     (65,142)     (122,142)                                         │
│    [   0  ]    [   0  ]     [   0  ]       ← Bit stride (BLUE text)            │
│                                                                                │
│     (9,168)     (65,168)     (122,168)                                         │
│    [x]Auto     [x]Auto      [x]Auto        ← Auto checkboxes                   │
│                                                                                │
│            (36,191)  (93,191)                     (179,19)                      │
│           [Load...] [Save...]               ┌─────────────────────┐            │
│                                             │Order│Byte│Bit│      │            │
│                                             │  0  │ 0  │ 0 │      │            │
│                                             │  1  │ 0  │ 1 │      │            │
│                                             │ ... │... │...│      │            │
│                                             └─────────────────────┘            │
│                                              DataGridView 147x196px            │
│                                              (disabled when Chunky)            │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Reverse Engineering the Design Thinking

### 1. Functional Grouping by Task

The layout divides controls into four logical groups based on what the user is trying to accomplish:

| Group | Purpose | Mental Model |
|-------|---------|--------------|
| **Position** | "Where am I in the file?" | Navigation |
| **Packing** | "How are pixels encoded?" | Data format |
| **Tiling** | "How are sprites arranged?" | Spatial layout |
| **Palette** | "What colors do I see?" | Visualization |

This mirrors the user's workflow: load file → configure format → navigate → adjust colors.

### 2. The "Three Column" Stride Pattern

The Packing panel uses a consistent **Pixel / Row / Next** column pattern:

```
         Pixel    Row     Next
         ─────    ───     ────
Button   [Pixel] [Row]   [Next]    ← Click to advance
Byte     [  1  ] [  8 ]  [  8 ]    ← Byte offset
Bit      [  0  ] [  0 ]  [  0 ]    ← Bit offset (blue = different)
Auto     [x]     [x]     [x]       ← Auto-calculate
```

**Why this works:**
- **Spatial consistency**: Same position = same type of value
- **Visual grouping**: Three related concepts treated as a unit
- **Color coding**: Blue text for bit values distinguishes them from byte values
- **Buttons as labels**: "Pixel", "Row", "Next" buttons double as labels AND advancement controls

### 3. The "Byte + Bit" Dual Input Pattern

Every offset in the app uses the same pattern:
```
[Byte value] [Bit value]
   (black)     (blue)
```

This appears in:
- Position: `numericPosByte` + `numericPosBit`
- Pixel stride: `numericPixelStrideByte` + `numericPixelStrideBit`
- Row stride: `numericRowStrideByte` + `numericRowStrideBit`
- Next stride: `numericNextStrideByte` + `numericNextStrideBit`
- Tile stride X: `numericTileStrideByteX` + `numericTileStrideBitX`
- Tile stride Y: `numericTileStrideByteY` + `numericTileStrideBitY`
- Bit plane offsets: DataGridView columns `offByte` + `offBit`

**Design rationale:**
- Binary data isn't byte-aligned, so you need sub-byte precision
- Blue color (MenuHighlight) creates instant visual distinction
- Consistent left-right ordering (byte first, bit second) builds muscle memory

### 4. Button-as-Label-and-Action Pattern

```
[Byte] [0x00000000]     ← Button "Byte" + input field
[Bit ] [    0     ]     ← Button "Bit" + input field
```

The buttons serve triple duty:
1. **Label**: Tells you what the field is
2. **Advance action**: Left-click increments
3. **Retreat action**: Right-click/Shift-click decrements

This is documented in tooltips:
```
"Left click to advance byte\r\nRight/shift click to retreat"
```

**Why this is clever:**
- Saves horizontal space (no separate label)
- Provides quick adjustment without typing
- Consistent interaction model throughout the app

### 5. The DataGridView for Bit Planes

```
┌─────────────────────┐
│ Order │ Byte │ Bit  │
├───────┼──────┼──────┤
│   0   │  0   │  0   │  ← Bit plane 0 offset
│   1   │  0   │  1   │  ← Bit plane 1 offset
│   2   │  0   │  2   │  ← Bit plane 2 offset
│  ...  │ ...  │ ...  │
└─────────────────────┘
```

**Why a DataGridView?**
- Variable number of rows (1-32 BPP)
- Editable cells for each plane's offset
- Compact representation of planar graphics formats
- Disabled when `Chunky` mode is on (chunky = interleaved, planar = separated)

### 6. The Tiling Panel's Grid Layout

```
            X        Y
           ───      ───
Size      [ 0 ]   [ 0 ]    ← Tile dimensions

Stride    [ 0 ]   [ 0 ]    ← Byte offset
          [ 0 ]   [ 0 ]    ← Bit offset
```

This creates a 2D mental model:
- **Rows** = property type (Size vs Stride)
- **Columns** = dimension (X vs Y)

The stride section implicitly continues the byte/bit pattern from Packing.

### 7. TableLayoutPanel Nesting Strategy

```
tableBase (2 rows)
├── tableTop (3 columns)
│   ├── tablePosPlane (2 rows)
│   │   ├── groupPosition
│   │   └── groupTile
│   ├── groupPacking
│   └── groupPalette
└── tableBottom (2 columns)
    ├── pixelBox
    └── pixelScroll
```

**Why this hierarchy?**
- `tableBase` separates controls from viewer (vertical split)
- `tableTop` arranges control panels horizontally
- `tablePosPlane` stacks Position and Tiling vertically (they're related to navigation)
- `tableBottom` keeps scrollbar attached to viewer

### 8. The "Auto" Checkbox Pattern

Every stride has an Auto checkbox. When checked:
- The stride is auto-calculated based on BPP, width, etc.
- The input fields become read-only
- User doesn't have to do math

This is a **progressive disclosure** pattern:
- Beginners: Leave Auto checked, it just works
- Experts: Uncheck to manually configure exotic formats

### 9. Palette Panel's Asymmetric Layout

```
┌──────────────────────────────────────────┐
│ ┌──────────┐                             │
│ │          │  [bg]  Background           │
│ │ Palette  │                             │
│ │ Preview  │  [Auto] [Palette Mode ▾]    │
│ │ 130x130  │  [Load...]  [Save...]       │
│ │          │                             │
│ └──────────┘                             │
│                                          │
│        (Palette Info Label)              │
└──────────────────────────────────────────┘
```

The large preview dominates, with controls arranged beside it. This prioritizes:
1. Visual feedback (the preview)
2. Quick mode switching
3. Load/Save for custom palettes

### 10. Key Design Principles Extracted

| Principle | Implementation |
|-----------|----------------|
| **Consistency** | Byte+Bit pattern everywhere |
| **Color coding** | Blue = bit values |
| **Dual-purpose controls** | Buttons = labels + actions |
| **Spatial grouping** | Pixel/Row/Next columns |
| **Progressive disclosure** | Auto checkboxes for beginners |
| **Context sensitivity** | DataGrid disabled when Chunky |
| **Compact information density** | Everything visible at once |

### 11. What We Kept vs Changed in React Port

| Original | React Port | Reasoning |
|----------|------------|-----------|
| GroupBox with title | Panel with header | Same concept, modern styling |
| Byte/Bit dual inputs | ByteIcon/BitIcon fields | More visual distinction |
| Button-as-label | Field labels above | Clearer for new users |
| Three column stride | Section headers per row | Better for narrow sidebar |
| DataGridView | Scrollable list | Simpler implementation |
| Blue ForeColor | CSS accent-color | Same visual cue |

The original design is actually quite thoughtful - it packs a lot of functionality into a small space while maintaining consistency. The main weakness is discoverability (you have to know to right-click buttons), which modern Figma-style UI addresses with more explicit controls.
