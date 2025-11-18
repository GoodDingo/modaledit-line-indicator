# Images Directory

This directory contains visual assets for the extension documentation.

## Required Screenshots for v0.1.3 Release

Before publishing to marketplace, create and add the following images:

### 1. Mode Screenshots (PNG format, ~800x400px recommended)
- **normal-mode.png**: Show current line with green dotted border
  - Setup: Open a file, press Esc to enter normal mode
  - Capture: Current line with visible green dotted decoration

- **insert-mode.png**: Show current line with red solid border
  - Setup: Press `i` to enter insert mode
  - Capture: Current line with visible red solid decoration

- **visual-mode.png**: Show current line with blue dashed border
  - Setup: Press `v` to enter visual mode
  - Capture: Current line with visible blue dashed decoration

- **search-mode.png**: Show current line with yellow solid border
  - Setup: Press `/` to enter search mode
  - Capture: Current line with visible yellow solid decoration

### 2. Animated Demo (GIF format, 3-5 seconds, optimized <1MB)
- **mode-switching.gif**: Show mode transitions
  - Sequence: Normal (Esc) → Insert (i) → Visual (v) → back to Normal (Esc)
  - Duration: 3-5 seconds total
  - Show clear border color/style changes
  - Tools: Use LICEcap, ScreenToGif, or Peek

### 3. UI Screenshots (PNG format)
- **settings-ui.png**: VS Code settings showing configuration
  - Navigate to: Settings → Search "modaledit-line-indicator"
  - Capture: Settings panel with at least one mode configuration visible

- **output-channel.png**: Output channel with logs
  - Open: View → Output → Select "ModalEdit Line Indicator"
  - Capture: Output panel showing sample log entries (mode changes, theme detection)
  - Tip: Set logLevel to "info" or "debug" for more output

## Image Guidelines

- **Resolution**: Use 2x retina resolution, but optimize file size
- **Format**: PNG for screenshots, GIF for animations
- **Size**: Keep each image <500KB (GIF <1MB)
- **Theme**: Use a popular theme (e.g., Dark+ or Light+) for consistency
- **Code**: Show TypeScript/JavaScript code for familiarity
- **Privacy**: No sensitive code, personal info, or proprietary content

## Tools

- **Screenshots**: Built-in OS tools or ShareX (Windows), Screenshot.app (macOS)
- **GIF recording**: LICEcap, ScreenToGif, Peek, or Kap
- **Optimization**: TinyPNG, ImageOptim, or gifsicle

## After Creating Images

1. Place all images in this directory
2. Uncomment the image references in README.md (lines 27, 31, 35, 39, 43, 47, 51)
3. Remove TODO placeholders
4. Test: View README.md in VS Code preview to verify images load
5. Verify images included in package: `vsce package && unzip -l *.vsix | grep images/`
