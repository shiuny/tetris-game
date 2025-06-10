const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const playPauseButton = document.getElementById('play-pause');
const resetButton = document.getElementById('reset');
const helpButton = document.getElementById('help');
const helpModal = document.getElementById('help-modal');
const closeHelpButton = document.getElementById('close-help');

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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
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
}

function drawNextPiece() {
  nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
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
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  board = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
  currentPiece = null;
  nextPiece = createPiece();
  score = 0;
  dropCounter = 0;
  scoreElement.textContent = score;
  highScoreElement.textContent = highScore;
  isPlaying = false;
  playPauseButton.textContent = '▶️';
  draw();
}

function update(time = 0) {
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
  console.log('Play/Pause clicked');
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying) {
    if (!currentPiece) {
      currentPiece = nextPiece;
      nextPiece = createPiece();
    }
    lastTime = performance.now();
    dropCounter = 0;
    if (!animationFrameId) {
      animationFrameId = requestAnimationFrame(update);
    }
  } else {
    if (animationFrameId) {
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
let touchCount = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchCount = e.touches.length;
  console.log(`Touch start: ${touchCount} finger(s)`); // デバッグ
  if (touchCount !== 1) {
    isSwiping = true; // 2本指以上はスワイプ扱い
    return;
  }
  isSwiping = false;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (touchCount !== 1) return; // 1本指のみ処理
  isSwiping = true;
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 30 && currentPiece) {
    currentPiece.x += deltaX > 0 ? 1 : -1;
    if (collides()) currentPiece.x -= deltaX > 0 ? 1 : -1;
    touchStartX = touch.clientX;
    console.log(`Swipe move: x=${currentPiece.x}`);
  }
  if (deltaY > 30 && currentPiece) {
    if (e.touches.length === 2) {
      console.log('Two-finger swipe: Instant drop');
      while (!collides()) currentPiece.y++;
      currentPiece.y--;
      merge();
      clearLines();
      currentPiece = null;
    } else {
      dropInterval = 100;
      console.log('Single swipe down: Faster drop');
    }
  }
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isSwiping = false; // 状態リセット
  const touchDuration = Date.now() - touchStartTime;
  console.log(`Touch end: duration=${touchDuration}ms, touches=${e.changedTouches.length}`); // デバッグ
  if (touchCount === 1 && touchDuration < 250 && currentPiece) {
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    const direction = touch.clientX < rect.left + rect.width / 2 ? 'counterclockwise' : 'clockwise';
    console.log(`Tap: ${direction}`); // デバッグ
    if (touch.clientX < rect.left + rect.width / 2) {
      rotatePiece(false);
    } else {
      rotatePiece(true);
    }
  }
  dropInterval = 1000;
  touchCount = 0;
  draw();
});

// キーイベント
document.addEventListener('keydown', e => {
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
  } else if (e.key === ' ') {
    console.log('Spacebar: Instant drop');
    while (!collides()) currentPiece.y++;
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
    draw();
    return;
  } else if (e.key === 'p') {
    console.log('P: Toggle play/pause');
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
    if (isPlaying) {
      if (!currentPiece) {
        currentPiece = nextPiece;
        nextPiece = createPiece();
      }
      lastTime = performance.now();
      dropCounter = 0;
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(update);
      }
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  } else if (e.key === 'r') {
    resetGame();
  }
  draw();
});

document.addEventListener('keyup', e => {
  if (e.key === 'ArrowDown') dropInterval = 1000;
});

// 初期化
highScoreElement.textContent = highScore;
nextPiece = createPiece();
draw();