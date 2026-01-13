# Original Binxelview C# Codebase Documentation

This document describes the original C# Binxelview application (version 1.6.6.0), its architecture, and implementation details. The source code is located in `temp/binxelview/`.

## Overview

Binxelview is a binary image explorer tool for visually analyzing data in binary files. It's designed to find and visualize data organized in grids - particularly uncompressed graphics, tile-based video game maps, or other structured binary data.

**Key capabilities:**
- View binary data as pixels with configurable bit depths (1-32 bpp)
- Support for both chunky (contiguous bits) and planar (separated bit planes) formats
- Tiling support for complex memory layouts
- Morton/Z-order "twiddle" for GPU texture formats
- Custom and automatic palettes
- Preset system for common retro console formats

## File Structure

```
temp/binxelview/
├── BinxelviewForm.cs          # Main application logic (~2800 lines)
├── BinxelviewForm.Designer.cs # Windows Forms UI layout (~1560 lines)
├── BinxelviewForm.resx        # UI resources
├── Program.cs                 # Application entry point
├── Dialogs/
│   ├── ViewForm.cs            # Split view window
│   ├── ViewForm.Designer.cs
│   └── BinaryChunkExportForm.cs # Binary export dialog
├── Properties/
│   └── AssemblyInfo.cs        # Assembly metadata
├── presets/                   # Built-in preset files (.bxp)
└── readme.txt                 # User documentation
```

## Core Constants

Found at the top of `BinxelviewForm.cs`:

```csharp
const int MAX_BPP = 32;           // Maximum bits per pixel
const int PRESET_VERSION = 3;     // Current preset file format version
const int PALETTE_BITS = 16;      // Max bpp for custom palettes (65536 colors)
const int PALETTE_SIZE = 65536;   // Size of palette arrays
const int ZOOM_MAX = 32;          // Maximum zoom level
const int PALETTEBOX_DIM = 64;    // Palette preview box dimensions
```

## Data Structures

### Preset Class

The `Preset` class stores all pixel format configuration. Key fields:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Preset name |
| `little_endian` | bool | If false, reverses bit order within bytes |
| `chunky` | bool | If true, pixel bits are contiguous |
| `bpp` | int | Bits per pixel (1-32) |
| `width` | int | Image width in pixels |
| `height` | int | Image height in pixels |
| `pixel_stride_byte/bit` | int | Distance between pixels |
| `row_stride_byte/bit` | int | Distance between rows |
| `next_stride_byte/bit` | int | Distance between images |
| `pixel/row/next_stride_auto` | bool | Auto-calculate stride |
| `twiddle` | int | 0=none, 1=Z-order, 2=N-order |
| `tile_size_x/y` | int | Sub-tile dimensions (0=disabled) |
| `tile_stride_byte/bit_x/y` | int | Distance between sub-tiles |
| `bit_stride_byte[32]` | int[] | Per-bit byte offsets (planar mode) |
| `bit_stride_bit[32]` | int[] | Per-bit bit offsets (planar mode) |

### PaletteMode Enum

```csharp
enum PaletteMode {
    PALETTE_CUSTOM,    // User-defined palette
    PALETTE_RGB,       // Auto RGB (bits split R>=G>=B)
    PALETTE_RANDOM,    // Random hash-based colors
    PALETTE_GREY,      // Greyscale gradient
    PALETTE_CUBEHELIX  // Dave Green's cubehelix gradient
}
```

## Preset File Format (.bxp)

Version 3 format (9+ lines):

```
Line 1:  version (3)
Line 2:  endian chunky twiddle
Line 3:  bpp width height
Line 4:  pixel_stride_byte row_stride_byte next_stride_byte
Line 5:  pixel_stride_bit row_stride_bit next_stride_bit
Line 6:  pixel_stride_auto row_stride_auto next_stride_auto
Line 7:  tile_size_x tile_stride_byte_x tile_stride_bit_x
Line 8:  tile_size_y tile_stride_byte_y tile_stride_bit_y
Line 9+: bit_stride_byte bit_stride_bit (one per bit, if not chunky)
```

### Example: NES CHR 8px preset

```
2                    # version 2 (older format)
0 0                  # endian=0 (little), chunky=0 (planar)
2 8 8                # 2bpp, 8x8 pixels
0 1 16               # pixel=0 bytes, row=1 byte, next=16 bytes
1 0 0                # pixel=1 bit, row=0 bits, next=0 bits
0 1 0                # pixel manual, row auto, next manual
0 0 0                # no X tiling
0 0 0                # no Y tiling
0 0                  # bit 0: offset 0 bytes, 0 bits
8 0                  # bit 1: offset 8 bytes, 0 bits
```

## Rendering Pipeline

### Location: `BinxelviewForm.cs` lines 656-966

### 1. Bit Stride Preparation (`prepareBitStride()`)

Lines 673-689. Sets up the `bit_stride[]` array that maps each pixel bit to its offset:

```csharp
if (preset.chunky) {
    // Chunky: bits are contiguous
    for (int i = 0; i < preset.bpp; ++i)
        bit_stride[i] = i;
} else {
    // Planar: use custom offsets
    for (int i = 0; i < preset.bpp; ++i)
        bit_stride[i] = preset.bit_stride_bit[i] + (preset.bit_stride_byte[i] * 8);
}
```

### 2. Twiddle Cache (`twiddleCacheCheck()`)

Lines 691-730. Builds Morton/Z-order lookup table for GPU texture formats:

```csharp
// Interleave X and Y bits for Z-order (Morton) curve
while (twx > 0 || twy > 0) {
    twxy |= ((twx >> bit) & 1) << (bit * 2 + 0) |
            ((twy >> bit) & 1) << (bit * 2 + 1);
    twx &= ~(1 << bit);
    twy &= ~(1 << bit);
    bit += 1;
}
```

### 3. Pixel Building (`buildPixel()`)

Lines 732-748. Reads a single pixel value by collecting bits from data:

```csharp
unsafe long buildPixel(long pos, int bpp, bool little_endian,
                       int length, byte* data_raw, int* bit_stride_raw) {
    uint p = 0;
    for (int b = 0; b < bpp; ++b) {
        long bpos = pos + bit_stride_raw[b];
        long dpos_byte = bpos >> 3;
        if (dpos_byte < 0 || dpos_byte >= length) return -1;

        int dpos_bit = (int)(bpos & 7);
        if (!little_endian) dpos_bit = 7 - dpos_bit;  // Reverse bit order

        p |= (uint)((data_raw[dpos_byte] >> dpos_bit) & 1) << b;
    }
    return (long)p;
}
```

**Key insight:** The `little_endian` flag controls bit numbering within bytes:
- `true` (default): bit 0 = LSB (rightmost, value 1)
- `false` ("Reverse Byte"): bit 0 = MSB (leftmost, value 128)

### 4. Tile Rendering (`renderTile()`)

Lines 765-806. Renders one image tile to the pixel buffer:

```csharp
for (int y = 0; y < h; ++y) {
    for (int x = 0; x < w; ++x) {
        if (twiddle_raw != null) {
            // Apply Morton ordering
            int twxy = twiddle_raw[x + (y * w)];
            pos_pixel = pos + (twy * row_stride) + (twx * pixel_stride);
        }

        render_row[x] = buildPixel(pos_pixel, bpp, little_endian, ...);
        pos_pixel += pixel_stride;

        // Handle sub-tiling
        if (++plane_x >= tile_size_x) {
            plane_x = 0;
            pos_pixel += tile_shift_x;
        }
    }
    pos_row += row_stride;
    // Handle Y sub-tiling similarly
}
```

### 5. Grid Rendering (`renderGrid()`)

Lines 808-908. Renders the full grid of tiles:

1. Calculate grid dimensions based on view size
2. Allocate pixel and color buffers
3. Compute stride values (with auto-calculation if enabled)
4. Render each tile with position advancing by `next_stride`
5. Convert pixel values to colors using palette

### 6. Bitmap Output (`renderGridColorToBitmap()`)

Lines 910-966. Copies color buffer to bitmap with zoom:

```csharp
// Zoom by repeating pixels
for (int y = 0; y < h; ++y) {
    if (zy <= 0) {
        // New source row
        for (int x = 0; x < w; ++x) {
            if (zx <= 0) {
                out_row[x] = color_row[cx++];
                zx = zoom;
            } else {
                out_row[x] = out_row[x - 1];  // Repeat previous
            }
            zx--;
        }
        zy = zoom;
    } else {
        // Copy from previous row
        memcpy(out_row, prev_row, w * 4);
    }
    zy--;
}
```

## Palette System

### Location: Lines 1018-1170

### Auto Palette Setup (`autoPaletteSetup()`)

Lines 1033-1051. Calculates bit ranges for RGB mode:

```csharp
int rb = preset.bpp / 3;           // Blue gets fewest bits
int rr = (preset.bpp - rb) / 2;    // Red gets middle
int rg = preset.bpp - (rr + rb);   // Green gets most bits
```

### Palette Modes

| Mode | Implementation |
|------|----------------|
| RGB | Splits pixel value into R/G/B based on bpp |
| Random | MurmurHash3-based deterministic hash |
| Greyscale | Linear gradient 0 = black, max = white |
| Cubehelix | Dave Green's perceptually uniform gradient |

### Random Color Hash (`randomColorHash()`)

Lines 1087-1119. Uses MurmurHash3 for deterministic random colors:

```csharp
// Seeded hash for consistent random palette
uint h = random_seed;
uint k = (uint)x * 0xCC9E2D51;
k = rotl(k, 15) * 0x1B873593;
h ^= k;
// ... finalization mix ...
return (int)h | 0xFF000000;  // 24-bit color with full alpha
```

## UI Components

### Main Window Layout

The UI is defined in `BinxelviewForm.Designer.cs`. Key panels:

1. **Position Panel** (top-left)
   - Byte position (hex/decimal)
   - Bit position (0-7)
   - Zoom level
   - Advance buttons: Byte, Bit, Pixel, Row, Next

2. **Packing Panel** (left side)
   - Reverse Byte checkbox (`checkEndian`)
   - Chunky checkbox (`checkChunky`)
   - BPP spinner
   - Width/Height spinners
   - Stride controls (Pixel/Row/Next) with Auto checkboxes

3. **Bit Planes Table** (`dataGridPixel`)
   - Shows bit → offset mapping
   - Editable when not in chunky mode
   - Columns: Bit#, Byte offset, Bit offset

4. **Tiling Panel**
   - Tile Size X/Y
   - Tile Stride Byte/Bit X/Y

5. **Palette Panel** (left side, lower)
   - Palette mode dropdown
   - 64x64 palette preview box
   - Background color picker
   - Load/Save palette buttons

6. **Pixel View** (main area, right side)
   - `pixelBox` - PictureBox for rendering
   - `pixelScroll` - Vertical scrollbar
   - Context menu for save/export

### Event Handlers

Key UI event handlers (lines 1752-2806):

| Handler | Function |
|---------|----------|
| `checkEndian_CheckedChanged` | Toggle bit order |
| `checkChunky_CheckedChanged` | Toggle chunky/planar |
| `numericBPP_ValueChanged` | Update bpp, regenerate palette |
| `numericWidth_ValueChanged` | Update width |
| `pixelBox_Resize` | Recalculate grid, redraw |
| `pixelBox_MouseMove` | Show pixel info on hover |
| `pixelScroll_Scroll` | Handle scrolling (with snap option) |

### Keyboard Shortcuts

From `handleHotkeys()` and `ProcessCmdKey()`:

| Key | Action |
|-----|--------|
| Ctrl+O | Open file |
| Ctrl+R | Reload file |
| Ctrl+W | Toggle split view |
| Alt+0 | Go to position 0 |
| Alt+B | Advance 1 byte |
| Alt+I | Advance 1 bit |
| Alt+X | Advance 1 pixel |
| Alt+R | Advance 1 row |
| Alt+N | Advance 1 image |

## Redraw System

### Location: Lines 1522-1746

Three main redraw functions coordinate UI updates:

### `redrawPixels()`

Lines 1526-1570. Renders the pixel view:

1. Calculate view dimensions
2. Determine grid size (tiles that fit)
3. Call `renderGrid()` with current position
4. Call `renderGridColorToBitmap()` with zoom
5. Assign bitmap to `view_box.Image`

### `redrawPreset()`

Lines 1572-1659. Updates preset UI controls:

1. Apply auto-stride calculations
2. Update all spinners and checkboxes
3. Rebuild bit stride table
4. Update preset menu checkmarks

### `redrawPalette()`

Lines 1661-1692. Updates palette display:

1. Regenerate auto palette if needed
2. Render palette to 64x64 preview
3. Update UI enable states

## Position and Scrolling

### Location: Lines 1172-1241

### Position Normalization

```csharp
void normalizePos() {
    int nb = pos_bit / 8;
    pos_byte += nb;
    pos_bit -= nb * 8;
    updatePos();
}
```

### Snap Scroll

Lines 2563-2589. Keeps scroll aligned to tile boundaries:

```csharp
if (snap_scroll) {
    int next_stride = preset.next_stride_bit + (preset.next_stride_byte * 8);
    long snap_old = old_pos / next_stride;
    long snap_off = old_pos % next_stride;  // Preserve sub-tile offset
    long snap_new = target_pos / next_stride;
    new_pos = (snap_new * next_stride) + snap_off;
}
```

## File I/O

### Binary File Loading (`openFile()`)

Lines 1246-1271:

```csharp
bool openFile(string path) {
    byte[] read_data = File.ReadAllBytes(path);
    data = read_data;
    if (pos_byte >= data.Length) pos_byte = 0;
    pos_bit = 0;
    scrollRange();
    redrawPixels();
}
```

### Palette Loading (`loadPalette()`)

Lines 1346-1490. Supports:

- **Type 0**: RGB24 (3 bytes per color)
- **Type 1**: Image palette (BMP, GIF, PNG, TIF)
- **Type 2**: VGA RGB18 (6 bits per channel)
- **Type 3**: Microsoft RIFF PAL format

### INI File System

Lines 537-654. Options saved/loaded include:

- Preset directory and current preset
- Palette mode and custom palette path
- Background color, zoom, grid visibility
- Position display mode (hex/decimal)
- Snap scroll, split view, horizontal layout

## Mouse Interaction

### Pixel Info (`pixelBox_MouseMove()`)

Lines 2485-2561. On hover:

1. Convert screen coords to grid position
2. Find tile and local pixel position
3. Apply twiddle transformation if active
4. Calculate bit position in file
5. Read pixel value using `readPixel()`
6. Display: `"position+bit = value"` in dec and hex

### Context Menu Actions

- **Save Image**: Export single tile as PNG
- **Save All Visible**: Export entire view as PNG
- **Position to Pixel**: Jump to hovered pixel's position
- **Pixels to Palette**: Extract palette from pixel data

## Comparison to Web Implementation

| Feature | C# Location | Web Location |
|---------|-------------|--------------|
| Preset structure | `Preset` class | `src/types.ts` |
| Rendering | `renderGrid()` | `src/renderer.ts` |
| State management | Form fields | `src/hooks/useBinxelview.ts` |
| Main UI | `BinxelviewForm` | `src/routes/index.tsx` |
| Bit planes | `dataGridPixel` | `src/components/BitStridePanel.tsx` |
| Position panel | Various numerics | `src/components/PositionPanel.tsx` |
| Packing panel | Various controls | `src/components/PackingPanel.tsx` |
| Tiling panel | Tiling group | `src/components/TilingPanel.tsx` |
| Palette panel | Palette group | `src/components/PalettePanel.tsx` |
| Pixel viewer | `pixelBox` | `src/components/PixelViewer.tsx` |
| Palette functions | Various | `src/palette.ts` |
| Presets | .bxp files | `src/presets.ts` |
