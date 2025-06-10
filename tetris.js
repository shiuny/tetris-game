canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchCount = e.touches.length;
  isSwiping = false;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  isSwiping = true;
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 40 && currentPiece) {
    currentPiece.x += deltaX > 0 ? 1 : -1;
    if (collides()) currentPiece.x -= deltaX > 0 ? 1 : -1;
    touchStartX = touch.clientX;
  }
  if (deltaY > 40 && currentPiece) {
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

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touchDuration = performance.now() - touchStartTime;
  if (!isSwiping && touchDuration < 200 && touchCount === 1 && currentPiece) {
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    if (touch.clientX < rect.left + rect.width / 2) {
      rotatePiece(false);
    } else {
      rotatePiece(true);
    }
  }
  dropInterval = 1000;
  isSwiping = false;
  touchCount = 0;
  draw();
});

document.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.key === 'Escape') {
    helpModal.classList.add('hidden');
    return;
  }
  if (!currentPiece && e.key !== 'p' && e.key !== 'r') return;
  if (e.key === 'ArrowLeft') {
    currentPiece.x--;
    if (collides()) currentPiece.x++;
  }
  if (e.key === 'ArrowRight') {
    currentPiece.x++;
    if (collides()) currentPiece.x--;
  }
  if (e.key === 'ArrowUp') {
    rotatePiece(true);
  }
  if (e.key === 'ArrowDown') {
    currentPiece.y++;
    if (collides()) currentPiece.y--;
    dropCounter = 0;
  }
  if (e.key === ' ') {
    while (!collides()) currentPiece.y++;
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
  }
  if (e.key === 'p') {
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
    if (isPlaying) {
      if (!currentPiece) {
        currentPiece = nextPiece;
        nextPiece = createPiece();
      }
      if (!animationFrameId) {
        lastTime = performance.now();
        dropCounter = 0;
        update();
      }
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    draw();
  }
  if (e.key === 'r') {
    resetGame();
  }
  draw();
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') dropInterval = 1000;
});

function handleButtonTouch(e) {
  e.preventDefault();
  console.log(`Button touched: ${this.id}`); // デバッグ用
  this.click();
}

playPauseButton.addEventListener('click', () => {
  console.log('Play/Pause clicked'); // デバッグ用
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying) {
    if (!currentPiece) {
      currentPiece = nextPiece;
      nextPiece = createPiece();
    }
    if (!animationFrameId) {
      lastTime = performance.now();
      dropCounter = 0;
      update();
    }
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
  draw();
});
playPauseButton.addEventListener('touchstart', handleButtonTouch);

resetButton.addEventListener('click', () => {
  console.log('Reset clicked'); // デバッグ用
  resetGame();
});
resetButton.addEventListener('touchstart', handleButtonTouch);

helpButton.addEventListener('click', () => {
  console.log('Help clicked'); // デバッグ用
  helpModal.classList.remove('hidden');
});
helpButton.addEventListener('touchstart', handleButtonTouch);

closeHelpButton.addEventListener('click', () => {
  console.log('Close Help clicked'); // デバッグ用
  helpModal.classList.add('hidden');
});
closeHelpButton.addEventListener('touchstart', handleButtonTouch);

highScoreElement.textContent = highScore;
nextPiece = createPiece();
draw();
canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  touchCount = e.touches.length;
  isSwiping = false;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = performance.now();
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  isSwiping = true;
  const touch = e.touches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  if (Math.abs(deltaX) > 40 && currentPiece) {
    currentPiece.x += deltaX > 0 ? 1 : -1;
    if (collides()) currentPiece.x -= deltaX > 0 ? 1 : -1;
    touchStartX = touch.clientX;
  }
  if (deltaY > 40 && currentPiece) {
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

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  const touchDuration = performance.now() - touchStartTime;
  if (!isSwiping && touchDuration < 200 && touchCount === 1 && currentPiece) {
    const touch = e.changedTouches[0];
    const rect = canvas.getBoundingClientRect();
    if (touch.clientX < rect.left + rect.width / 2) {
      rotatePiece(false);
    } else {
      rotatePiece(true);
    }
  }
  dropInterval = 1000;
  isSwiping = false;
  touchCount = 0;
  draw();
});

document.addEventListener('keydown', (e) => {
  e.preventDefault();
  if (e.key === 'Escape') {
    helpModal.classList.add('hidden');
    return;
  }
  if (!currentPiece && e.key !== 'p' && e.key !== 'r') return;
  if (e.key === 'ArrowLeft') {
    currentPiece.x--;
    if (collides()) currentPiece.x++;
  }
  if (e.key === 'ArrowRight') {
    currentPiece.x++;
    if (collides()) currentPiece.x--;
  }
  if (e.key === 'ArrowUp') {
    rotatePiece(true);
  }
  if (e.key === 'ArrowDown') {
    currentPiece.y++;
    if (collides()) currentPiece.y--;
    dropCounter = 0;
  }
  if (e.key === ' ') {
    while (!collides()) currentPiece.y++;
    currentPiece.y--;
    merge();
    clearLines();
    currentPiece = null;
  }
  if (e.key === 'p') {
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
    if (isPlaying) {
      if (!currentPiece) {
        currentPiece = nextPiece;
        nextPiece = createPiece();
      }
      if (!animationFrameId) {
        lastTime = performance.now();
        dropCounter = 0;
        update();
      }
    } else {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
    draw();
  }
  if (e.key === 'r') {
    resetGame();
  }
  draw();
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowDown') dropInterval = 1000;
});

function handleButtonTouch(e) {
  e.preventDefault();
  console.log(`Button touched: ${this.id}`); // デバッグ用
  this.click();
}

playPauseButton.addEventListener('click', () => {
  console.log('Play/Pause clicked'); // デバッグ用
  isPlaying = !isPlaying;
  playPauseButton.textContent = isPlaying ? '⏸️' : '▶️';
  if (isPlaying) {
    if (!currentPiece) {
      currentPiece = nextPiece;
      nextPiece = createPiece();
    }
    if (!animationFrameId) {
      lastTime = performance.now();
      dropCounter = 0;
      update();
    }
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
  draw();
});
playPauseButton.addEventListener('touchstart', handleButtonTouch);

resetButton.addEventListener('click', () => {
  console.log('Reset clicked'); // デバッグ用
  resetGame();
});
resetButton.addEventListener('touchstart', handleButtonTouch);

helpButton.addEventListener('click', () => {
  console.log('Help clicked'); // デバッグ用
  helpModal.classList.remove('hidden');
});
helpButton.addEventListener('touchstart', handleButtonTouch);

closeHelpButton.addEventListener('click', () => {
  console.log('Close Help clicked'); // デバッグ用
  helpModal.classList.add('hidden');
});
closeHelpButton.addEventListener('touchstart', handleButtonTouch);

highScoreElement.textContent = highScore;
nextPiece = createPiece();
draw();
