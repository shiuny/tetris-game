# Tetris

A simple Tetris game built with HTML5, CSS, and JavaScript. Playable on smartphones, tablets, and PCs with swipe/tap and keyboard controls.

## Features
- **Responsive**: Optimized for mobile (21:9), tablet (4:3), and desktop with dynamic canvas sizing and pixel ratio adjustment.
- **Controls**:
  - **Mobile/Tablet**: Swipe left/right to move, tap left/right to rotate (counterclockwise/clockwise), swipe down for faster drop, two-finger swipe down for instant drop.
  - **PC**: Arrow keys (←/→ for left/right, ↑ for rotation, ↓ for faster drop), spacebar for instant drop, P for play/pause, R for reset, Esc to close help modal.
- **UI**: Score and high score display, play/pause button (▶️/⏸️), reset button (🔄), help button (❓) with control instructions in a popup modal, next piece preview.
- **Design**: 3D-like blocks with shadows, optimized layout for all devices.
- **Persistence**: High score saved via localStorage.

## Deployment
1. Upload files via GitHub's web interface.
2. Go to **Settings > Pages** in your repository.
3. Set the branch to `main` and folder to `root`.
4. Access the game at `https://<username>.github.io/<repository-name>`.

## License
MIT
