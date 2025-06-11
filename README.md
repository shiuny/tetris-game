# Tetris

A simple Tetris game built with HTML, CSS, and JavaScript. Playable on smartphones, tablets, and PCs.

## Features
- **Responsive**: Optimized for mobile (21:9), tablets (iPadOS 15/18), and desktop with unified row layout.
- **Controls**:
  - **Mobile/Tablet**: Single-tap left/right for rotation, single-swipe left/right to move, single-swipe down for faster drop, two-finger swipe down for instant drop.
  - **PC**: Arrow keys (←/→ move, ↑ rotate, ↓ faster drop), spacebar for instant drop, P for play/pause, R for reset, Esc to close help.
- **UI**: Score, high score, play/pause (▶️/⏸️), reset (🔄), help (❓), next piece (right-aligned).
- **Design**: Flex row layout, dark grey canvas, high-contrast pieces with white borders.
- **Persistence**: High score via `localStorage`.

## Deployment
1. Save `index.html`, `style.css`, `tetris.js`, `README.md` in a folder.
2. Upload files via GitHub's web interface.
3. Go to **Settings > Pages**, set branch to `main`, folder to `root`.
4. Visit `https://<username>.github.io/tetris-game`.

## Local Testing
1. Save `index.html`, `style.css`, `tetris.js` in a folder.
2. Run `python3 -m http.server 8000` in the folder.
3. Open `http://localhost:8000` in Chrome/Safari.
4. Clear cache with **Command + Shift + R**.

## License
MIT