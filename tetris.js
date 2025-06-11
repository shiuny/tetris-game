const canvas = document.getElementById('tetris');
const ctx = canvas ? canvas.getContext('2d') : null;
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas ? nextCanvas.getContext('2d') : null;
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const playPauseButton = document.getElementById('play-pause');
const resetButton = document.getElementById('reset');
const helpButton = document.getElementById('help');
const helpModal = document.getElementById('help-modal');
const closeHelpButton = document.getElementById('close-help');

if (!canvas || !ctx || !nextCanvas || !nextCtx || !scoreElement || !highScoreElement || !playPauseButton || !resetButton || !helpButton || !helpModal || !closeHelpButton) {
  console.error('Initialization failed: Missing DOM elements or context');
  alert('Error: Unable to initialize game. Check browser compatibility or DOM elements.');
  throw new Error('Initialization failed');
}

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = canvas.width / GRID_WIDTH;
const NEXT_BLOCK_SIZE = nextCanvas.width / 4;
let score = 0;
let highScore = localStorage.getItem('highScore') || 0;
let isPlaying = false;
let board = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
let currentPiece = null;
let nextPiece = null;
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;
let animationFrameId = null;

const PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 1], [1, 0, 0]]  // L
];

const COLORS = ['#00b7eb', '#ff0', '#f0f', '#0ff', '#f00', '#00a', '#a00'];

function createPiece() {
  const index = Math.floor(Math.random() * PIECES.length);
  return {
    shape: PIECES[index].map(row => [...row]),
    color: COLORS[index],
    x: Math.floor(GRID_WIDTH / 2) - Math.floor(PIECES[index][0].length / 2),
    y: 0
  };
}

function draw() {
  try {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log('Cleared main canvas');
    for (let y = 0; y < GRID_HEIGHT; y++) {
      for (let x = 0; x < GRID_WIDTH; x++) {
        if (board[y][x]) {
          ctx.fillStyle = board[y][x];
          ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          ctx.strokeStyle = '#fff';
          ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
        }
      }
    }
    if (currentPiece) {
      ctx.fillStyle = currentPiece.color;
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            ctx.fillRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect((currentPiece.x + x) * BLOCK_SIZE, (currentPiece.y + y) * BLOCK_SIZE, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
          }
        }
      }
    }
    drawNextPiece();
  } catch (e) {
    console.error('Draw error:', e);
  }
}

function drawNextPiece() {
  try {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    console.log('Drawing next piece to nextCanvas');
    if (nextPiece) {
      nextCtx.fillStyle = nextPiece.color;
      const offsetX = (4 - nextPiece.shape[0].length) / 2;
      const offsetY = (4 - nextPiece.shape.length) / 2;
      for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
          if (nextPiece.shape[y][x]) {
            nextCtx.fillRect((x + offsetX) * NEXT_BLOCK_SIZE, (y + offsetY) * NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE - 1, NEXT_BLOCK_SIZE - 1);
            nextCtx.strokeStyle = '#fff';
            nextCtx.strokeRect((x + offsetX) * NEXT_BLOCK_SIZE, (y + offsetY) * NEXT_BLOCK_SIZE, NEXT_BLOCK_SIZE - 1, NEXT_BLOCK_SIZE - 1);
          }
        }
      }
    }
  } catch (e) {
    console.error('Draw next piece error:', e);
  }
}

function collides(piece = currentPiece) {
  for (let y = 0; y < piece.shape.length; y++) {
    for (let x = 0; x < piece.shape[y].length; x++) {
      if (piece.shape[y][x]) {
        const boardX = piece.x + x;
        const boardY = piece.y + y;
        if (
          boardX < 0 || boardX >= GRID_WIDTH ||
          boardY >= GRID_HEIGHT ||
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function merge() {
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (currentPiece.shape[y][x]) {
        board[currentPiece.y + y][currentPiece.x + x] = currentPiece.color;
      }
    }
  }
}

function clearLines() {
  let linesCleared = 0;
  for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
    if (board[y].every(cell => cell !== 0)) {
      board.splice(y, 1);
      board.unshift(Array(GRID_WIDTH).fill(0));
      linesCleared++;
      y++;
    }
  }
  if (linesCleared > 0) {
    score += linesCleared * 100;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('highScore', highScore);
      highScoreElement.textContent = highScore;
    }
    scoreElement.textContent = score;
  }
}

function rotatePiece(clockwise = true) {
  const newShape = Array(currentPiece.shape[0].length).fill().map(() => Array(currentPiece.shape.length).fill(0));
  for (let y = 0; y < currentPiece.shape.length; y++) {
    for (let x = 0; x < currentPiece.shape[y].length; x++) {
      if (clockwise) {
        newShape[x][currentPiece.shape.length - 1 - y] = currentPiece.shape[y][x];
      } else {
        newShape[currentPiece.shape[0].length - 1 - x][y] = currentPiece.shape[y][x];
      }
    }
  }
  const oldShape = currentPiece.shape;
  currentPiece.shape = newShape;
  if (collides()) {
    currentPiece.shape = oldShape;
  }
}

function dropPiece() {
  console.log('dropPiece called');
  if (!currentPiece) {
    currentPiece = nextPiece || createPiece();
    nextPiece = createPiece();
    if (collides()) {
      isPlaying = false;
      playPauseButton.textContent = '▶️';
      alert('Game Over!');
      resetGame();
      return;
    }
  }
  currentPiece.y++;
  if (collides()) {
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
  }
  draw();
}

function resetGame() {
  console.log('resetGame called');
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  board = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
  currentPiece = null;
  nextPiece = createPiece();
  score = 0;
  dropCounter = 0;
  lastTime = 0;
  isPlaying = false;
  playPauseButton.textContent = '▶️';
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
  draw();
}

function update(time = 0) {
  console.log('update called, isPlaying:', isPlaying);
  if (!isPlaying) return;
  const deltaTime = time - lastTime;
  lastTime = time;
  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    dropPiece();
    dropCounter = 0;
  }
  draw();
  animationFrameId = requestAnimationFrame(update);
}

// ボタンイベント
playPauseButton.addEventListener('click', () => {
  console.log('Play/Pause clicked, isPlaying:', isPlaying);
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying) {
    if (!currentPiece) {
      currentPiece = nextPiece || createPiece();
      nextPiece = createPiece();
      console.log('New piece created:', currentPiece);
    }
    lastTime = performance.now();
    dropCounter = 0;
    if (!animationFrameId) {
      console.log('Starting animation frame');
      animationFrameId = requestAnimationFrame(update);
    }
  } else {
    if (animationFrameId) {
      console.log('Canceling animation frame');
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
  draw();
});

resetButton.addEventListener('click', () => {
  console.log('Reset clicked');
  resetGame();
});

helpButton.addEventListener('click', () => {
  console.log('Help clicked');
  helpModal.classList.remove('hidden');
});

closeHelpButton.addEventListener('click', () => {
  console.log('Close Help clicked');
  helpModal.classList.add('hidden');
});

// タッチイベント
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
let isSwiping = false;
let startTouchCount = 0;
let touchMovedDistance = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  startTouchCount = e.touches.length;
  console.log(`Touch start: ${startTouchCount} finger(s), x=${e.touches[0].clientX}, y=${e.touches[0].clientY}`);
  if (startTouchCount > 2) return;
  isSwiping = false;
  touchMovedDistance = 0;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touchCount = e.touches.length;
  const rect = canvas.getBoundingClientRect();
  const touch = e.touches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;
  const isInsideCanvas = touchX >= rect.left && touchX <= rect.right &&
                        touchY >= rect.top && touchY <= rect.bottom;
  const deltaX = touchX - touchStartX;
  const deltaY = touchY - touchStartY;
  touchMovedDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  console.log(`Touch move: ${touchCount} finger(s), x=${touchX}, y=${touchY}, inside=${isInsideCanvas}, moved=${touchMovedDistance.toFixed(2)}px`);
  if (!isInsideCanvas) return;
  isSwiping = touchMovedDistance > 10;
  if (touchCount === 1 && currentPiece && startTouchCount === 1) {
    if (Math.abs(deltaX) > 30) {
      currentPiece.x += deltaX > 0 ? 1 : -1;
      if (collides()) currentPiece.x -= deltaX > 0 ? 1 : -1;
      touchStartX = touchX;
      console.log(`Single swipe: x=${currentPiece.x}`);
    }
    if (deltaY > 20) {
      dropInterval = 100;
      console.log('Single swipe down: Faster drop');
    }
  } else if (touchCount === 2 && currentPiece && startTouchCount === 2) {
    if (deltaY > 20) {
      console.log('Two-finger swipe: Instant drop');
      while (!collides()) currentPiece.y++;
      currentPiece.y--;
      merge();
      clearLines();
      currentPiece = null;
    }
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touchCount = e.changedTouches.length;
  const touchDuration = Date.now() - touchStartTime;
  const touch = e.changedTouches[0];
  const touchX = touch.clientX;
  const touchY = touch.clientY;
  const rect = canvas.getBoundingClientRect();
  const isInsideCanvas = touchX >= rect.left && touchX <= rect.right &&
                        touchY >= rect.top && touchY <= rect.bottom;
  console.log(`Touch end: ${touchCount} finger(s), duration=${touchDuration}ms, x=${touchX}, y=${touchY}, inside=${isInsideCanvas}, moved=${touchMovedDistance.toFixed(2)}px`);
  if (!isSwiping && startTouchCount === 1 && touchDuration <= 500 && isInsideCanvas && currentPiece) {
    const direction = touchX < rect.left + rect.width / 2 ? 'counterclockwise' : 'clockwise';
    console.log(`Tap: ${direction}`);
    if (direction === 'counterclockwise') {
      rotatePiece(false);
    } else {
      rotatePiece(true);
    }
  }
  dropInterval = 1000;
  isSwiping = false;
  startTouchCount = 0;
  touchMovedDistance = 0;
  draw();
});

// キーイベント
document.addEventListener('keydown', (e) => {
  e.preventDefault();
  console.log(`Key pressed: ${e.key}`);
  if (e.key === 'Escape') {
    helpModal.classList.add('hidden');
    return;
  }
  if (!currentPiece && e.key !== 'p' && e.key !== 'r') return;
  if (e.key === 'ArrowLeft') {
    currentPiece.x--;
    if (collides()) currentPiece.x++;
  } else if (e.key === 'ArrowRight') {
    currentPiece.x++;
    if (collides()) currentPiece.x--;
  } else if (e.key === 'ArrowUp') {
    rotatePiece(true);
  } else if (e.key === 'ArrowDown') {
    currentPiece.y++;
    if (collides()) currentPiece.y--;
    dropCounter = 0;
    console.log('Key: Faster drop');
  } else if (e.key === ' ') {
    console.log('Spacebar: Instant drop');
    while (!collides()) {
      currentPiece.y++;
    }
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
    draw();
    return;
  } else if (e.key === 'p') {
    console.log('P: Toggle play/pause, isPlaying:', isPlaying);
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
    if (isPlaying) {
      if (!currentPiece) {
        currentPiece = nextPiece || createPiece();
        nextPiece = createPiece();
        console.log('New piece created:', currentPiece);
      }
      lastTime = performance.now();
      dropCounter = 0;
      if (!animationFrameId) {
        console.log('Starting animation frame');
        animationFrameId = requestAnimationFrame(update);
      }
    } else {
      if (animationFrameId) {
        console.log('Canceling animation frame');
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  } else if (e.key === 'r') {
    console.log('R: Reset');
    resetGame();
  }
  draw();
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') dropInterval = 1000;
});

// 初期化
highScoreElement.textContent = highScore;
scoreElement.textContent = score;
nextPiece = createPiece();
draw();