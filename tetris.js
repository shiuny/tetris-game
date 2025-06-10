const canvas = document.getElementById('tetris');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const playPauseButton = document.getElementById('play-pause');
const helpButton = document.getElementById('help');
const helpModal = document.getElementById('help-modal');
const closeHelpButton = document.getElementById('close-help');

const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const BLOCK_SIZE = canvas.width / GRID_WIDTH;
let score = 0;
let isPlaying = false;
let board = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
let currentPiece = null;
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 1000;

const PIECES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 1, 1], [0, 0, 1]], // J
  [[1, 1, 1], [1, 0, 0]]  // L
];

const COLORS = ['#00f', '#ff0', '#f0f', '#0ff', '#f00', '#00a', '#a00'];

function createPiece() {
  const index = Math.floor(Math.random() * PIECES.length);
  return {
    shape: PIECES[index],
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
    scoreElement.textContent = score;
  }
}

function rotatePiece(clockwise) {
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
    currentPiece.shape = oldShape; // 回転できない場合は元に戻す
  }
}

function dropPiece() {
  if (!currentPiece) {
    currentPiece = createPiece();
    if (collides()) {
      isPlaying = false;
      playPauseButton.textContent = '▶️';
      alert('Game Over!');
      board = Array(GRID_HEIGHT).fill().map(() => Array(GRID_WIDTH).fill(0));
      score = 0;
      scoreElement.textContent = score;
    }
  }
  currentPiece.y++;
  if (collides()) {
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
  }
}

function update(time = 0) {
  if (isPlaying) {
    const deltaTime = time - lastTime;
    lastTime = time;
    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
      dropPiece();
      dropCounter = 0;
    }
    draw();
    requestAnimationFrame(update);
  }
}

let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  if (e.touches.length === 1) {
    const rect = canvas.getBoundingClientRect();
    if (touch.clientX < rect.left + rect.width / 2) {
      rotatePiece(false); // 左タップで反時計回り
    } else {
      rotatePiece(true); // 右タップで時計回り
    }
  }
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 50 && currentPiece) {
    currentPiece.x += deltaX > 0 ? 1 : -1;
    if (collides()) currentPiece.x -= deltaX > 0 ? 1 : -1;
    touchStartX = touch.clientX;
  }
  if (deltaY > 50 && currentPiece) {
    if (e.touches.length === 2) {
      while (!collides()) currentPiece.y++;
      currentPiece.y--;
      merge();
      clearLines();
      currentPiece = null;
    } else {
      dropInterval = 100;
    }
  }
});

canvas.addEventListener('touchend', () => {
  dropInterval = 1000;
});

document.addEventListener('keydown', (e) => {
  if (!currentPiece || !isPlaying) return;
  if (e.key === 'ArrowLeft') {
    currentPiece.x--;
    if (collides()) currentPiece.x++;
  }
  if (e.key === 'ArrowRight') {
    currentPiece.x++;
    if (collides()) currentPiece.x--;
  }
  if (e.key === 'ArrowUp') {
    rotatePiece(true); // ↑で時計回り回転
  }
  if (e.key === 'ArrowDown') {
    currentPiece.y++; // ↓で1マス下に移動
    if (collides()) currentPiece.y--;
    dropCounter = 0; // 自然落下をリセット
  }
  if (e.key === ' ') {
    while (!collides()) currentPiece.y++; // スペースで即時落下
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') dropInterval = 1000;
});

playPauseButton.addEventListener('click', () => {
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying && !currentPiece) currentPiece = createPiece();
  if (isPlaying) update();
});

helpButton.addEventListener('click', () => {
  helpModal.classList.remove('hidden');
});

closeHelpButton.addEventListener('click', () => {
  helpModal.classList.add('hidden');
});

draw();