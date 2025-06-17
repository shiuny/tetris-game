// --- tetris.js (ライン消去エフェクト統合版) ---

class Tetris {
  constructor(canvas, nextCanvas, scoreElement, highScoreElement, playPauseButton) {
    this.canvas = canvas;
    this.gameArea = canvas.parentElement; // シェイクエフェクト用
    this.ctx = canvas.getContext('2d');
    this.nextCanvas = nextCanvas;
    this.nextCtx = nextCanvas.getContext('2d');
    this.scoreElement = scoreElement;
    this.highScoreElement = highScoreElement;
    this.playPauseButton = playPauseButton;

    this.GRID_WIDTH = 10;
    this.GRID_HEIGHT = 20;
    this.BLOCK_SIZE = this.canvas.width / this.GRID_WIDTH;
    this.NEXT_BLOCK_SIZE = this.nextCanvas.width / 4;

    this.PIECES = [
      { shape: [[1, 1, 1, 1]], color: '#00b7eb' }, // I
      { shape: [[1, 1], [1, 1]], color: '#f7d308' },   // O
      { shape: [[0, 1, 0], [1, 1, 1]], color: '#ab47bc' }, // T
      { shape: [[0, 1, 1], [1, 1, 0]], color: '#4caf50' }, // S
      { shape: [[1, 1, 0], [0, 1, 1]], color: '#f44336' }, // Z
      { shape: [[1, 0, 0], [1, 1, 1]], color: '#1976d2' }, // J
      { shape: [[0, 0, 1], [1, 1, 1]], color: '#f9a825' }  // L
    ];
    
    this.state = {};
    this.resetGame();
    this.touchState = {};
    this._initEventListeners();
  }
  
  resetGame() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.state = {
      board: Array(this.GRID_HEIGHT).fill().map(() => Array(this.GRID_WIDTH).fill(0)),
      currentPiece: null,
      nextPiece: this._createPiece(),
      score: 0,
      highScore: localStorage.getItem('tetrisHighScore') || 0,
      isPlaying: false,
      isGameOver: false,
      isAnimating: false, // ★演出中フラグ
      clearingLines: [],   // ★演出対象のライン
      particles: [],     // ★パーティクル配列
      lastTime: 0,
      dropCounter: 0,
      dropInterval: 1000,
      linesCleared: 0,
    };
    this.playPauseButton.textContent = '▶️';
    this.scoreElement.textContent = this.state.score;
    this.highScoreElement.textContent = this.state.highScore;
    this._draw();
  }

  // ★演出のためゲームループを更新
  _update(time = 0) {
    // 演出中はピースの落下を停止
    if (this.state.isAnimating) {
        this._updateParticles();
        this._draw();
        this.animationFrameId = requestAnimationFrame(this._update.bind(this));
        return;
    }
      
    if (!this.state.isPlaying) return;

    const deltaTime = time - this.state.lastTime;
    this.state.lastTime = time;
    this.state.dropCounter += deltaTime;
    if (this.state.dropCounter > this.state.dropInterval) {
      this._dropPiece();
      this.state.dropCounter = 0;
    }

    this._updateParticles(); // パーティクルを常に更新
    this._draw();
    this.animationFrameId = requestAnimationFrame(this._update.bind(this));
  }
  
  _togglePlayPause() {
    if (this.state.isGameOver) { this.resetGame(); return; }
    if (this.state.isAnimating) return; // 演出中は操作不可

    this.state.isPlaying = !this.state.isPlaying;
    this.playPauseButton.textContent = this.state.isPlaying ? '⏸️' : '▶️';
    if (this.state.isPlaying) {
      if (!this.state.currentPiece) this._spawnNewPiece();
      this.state.lastTime = performance.now();
      if (!this.animationFrameId) {
        this.animationFrameId = requestAnimationFrame(this._update.bind(this));
      }
    } else {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
      this._draw();
    }
  }

  _createPiece() { /* 変更なし */ return { shape: this.PIECES[Math.floor(Math.random() * this.PIECES.length)].shape.map(r=>[...r]), color: this.PIECES[Math.floor(Math.random() * this.PIECES.length)].color, x: Math.floor(this.GRID_WIDTH/2) - 1, y: 0 }; }
  _createPiece() {
    const pieceData = this.PIECES[Math.floor(Math.random() * this.PIECES.length)];
    return {
      shape: pieceData.shape.map(row => [...row]),
      color: pieceData.color,
      x: Math.floor(this.GRID_WIDTH / 2) - Math.floor(pieceData.shape[0].length / 2),
      y: 0
    };
  }

  // ★asyncに変更
  async _dropPiece() {
    if (this.state.isAnimating) return;
    if (!this.state.currentPiece) {
        this._spawnNewPiece();
        if (this.state.isGameOver) { this._draw(); return; }
    }
    this.state.currentPiece.y++;
    if (this._collides()) {
      this.state.currentPiece.y--;
      this._merge();
      await this._clearLines(); // awaitで演出が終わるのを待つ
      this._spawnNewPiece();
    }
    this.state.dropCounter = 0;
  }
  
  // ★asyncに変更
  async _hardDrop() {
      if (!this.state.currentPiece || !this.state.isPlaying || this.state.isAnimating) return;
      while (!this._collides()) this.state.currentPiece.y++;
      this.state.currentPiece.y--;
      this._merge();
      await this._clearLines(); // awaitで演出が終わるのを待つ
      this._spawnNewPiece();
      this._draw();
  }

  _move(direction) {
    if (!this.state.currentPiece || !this.state.isPlaying || this.state.isAnimating) return;
    this.state.currentPiece.x += direction;
    if (this._collides()) this.state.currentPiece.x -= direction;
    this._draw();
  }
  
  _rotate() {
    if (!this.state.currentPiece || !this.state.isPlaying || this.state.isAnimating) return;
    const originalShape = this.state.currentPiece.shape;
    const newShape = originalShape[0].map((_, colIndex) => originalShape.map(row => row[colIndex]).reverse());
    this.state.currentPiece.shape = newShape;
    const originalX = this.state.currentPiece.x;
    let offset = 1;
    while(this._collides()) {
        this.state.currentPiece.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (Math.abs(offset) > 2) {
            this.state.currentPiece.shape = originalShape;
            this.state.currentPiece.x = originalX;
            return;
        }
    }
    this._draw();
  }
  
  // ★★★ ライン消去演出のメインロジック ★★★
  async _clearLines() {
    let linesToClear = [];
    for (let y = this.GRID_HEIGHT - 1; y >= 0; y--) {
      if (this.state.board[y].every(cell => cell !== 0)) {
        linesToClear.push(y);
      }
    }

    if (linesToClear.length > 0) {
      this.state.isAnimating = true;
      this.state.clearingLines = linesToClear;

      // エフェクト生成
      this._shakeScreen();
      linesToClear.forEach(y => this._createParticles(y));

      await this._sleep(300); // 演出時間

      // 実際のライン削除処理
      for (const y of linesToClear) {
        this.state.board.splice(y, 1);
      }
      for (let i = 0; i < linesToClear.length; i++) {
        this.state.board.unshift(Array(this.GRID_WIDTH).fill(0));
      }

      // スコア計算など
      const scorePoints = [0, 100, 300, 500, 800];
      this.state.score += scorePoints[linesToClear.length] * (1 + Math.floor(this.state.linesCleared / 10)); // レベルボーナス
      this.scoreElement.textContent = this.state.score;
      if (this.state.score > this.state.highScore) {
        this.state.highScore = this.state.score;
        this.highScoreElement.textContent = this.state.highScore;
        localStorage.setItem('tetrisHighScore', this.state.highScore);
      }
      this.state.linesCleared += linesToClear.length;
      const newLevel = Math.floor(this.state.linesCleared / 10);
      this.state.dropInterval = Math.max(150, 1000 - newLevel * 70);

      // 状態をリセット
      this.state.clearingLines = [];
      this.state.isAnimating = false;
    }
  }

  // ★★★ 演出用ヘルパーメソッド群 ★★★
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _shakeScreen() {
    this.gameArea.classList.add('shake');
    setTimeout(() => {
      this.gameArea.classList.remove('shake');
    }, 400);
  }

  _createParticles(lineY) {
    for (let i = 0; i < this.GRID_WIDTH * 3; i++) { // 1ラインあたり30個のパーティクル
      this.state.particles.push({
        x: Math.random() * this.canvas.width,
        y: (lineY + 0.5) * this.BLOCK_SIZE,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4 - 2, // 少し上向きに
        life: Math.random() * 50 + 20, // 寿命
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
      });
    }
  }

  _updateParticles() {
    for (let i = this.state.particles.length - 1; i >= 0; i--) {
      const p = this.state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1; // 重力
      p.life--;
      if (p.life <= 0) {
        this.state.particles.splice(i, 1);
      }
    }
  }

  // ★★★ 描画関連の更新 ★★★
  _draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this._drawBoard();
    if (!this.state.isAnimating && this.state.currentPiece) {
        this._drawGhostPiece();
        this._drawPiece(this.state.currentPiece, this.ctx, this.BLOCK_SIZE);
    }
    this._drawNextPiece();
    this._drawParticles(); // パーティクル描画を追加
    this._drawOverlay();
  }

  _drawBoard() {
    const animationProgress = Date.now() % 400 / 400; // 0から1に変化する値
    this.state.board.forEach((row, y) => {
      // 消去中のラインは特別に描画
      if (this.state.clearingLines.includes(y)) {
        this.ctx.fillStyle = `rgba(255, 255, 255, ${1 - animationProgress})`; // フェードアウト
        this.ctx.fillRect(0, y * this.BLOCK_SIZE, this.canvas.width, this.BLOCK_SIZE);
      } else {
        row.forEach((color, x) => {
          if (color) this._drawBlock(this.ctx, x, y, color, this.BLOCK_SIZE);
        });
      }
    });
  }

  _drawParticles() {
    this.state.particles.forEach(p => {
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.random() * 2 + 1, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  // ----- ここから下は前回のコードとほぼ同じ（async対応の修正のみ） -----
  // _spawnNewPiece, _merge, _collides, _drawBlock, _adjustColor, _drawPiece, _drawGhostPiece,
  // _drawNextPiece, _drawOverlay, _showTextOnCanvas は変更なし

  // イベントハンドラは async/await に対応させる
  _initEventListeners() {
    this.playPauseButton.addEventListener('click', () => this._togglePlayPause());
    document.getElementById('reset').addEventListener('click', () => this.resetGame());
    const helpModal = document.getElementById('help-modal');
    document.getElementById('help').addEventListener('click', () => helpModal.classList.remove('hidden'));
    document.getElementById('close-help').addEventListener('click', () => helpModal.classList.add('hidden'));

    document.addEventListener('keydown', async (e) => { // ★async
        if (e.key === 'Escape') { helpModal.classList.add('hidden'); return; }
        if (this.state.isAnimating) return;
        if (!this.state.isPlaying && !['p', 'r'].includes(e.key.toLowerCase())) return;
        
        // スペースキー以外はpreventDefaultしないことで、他のキー操作を妨げないようにする
        if(['arrowleft','arrowright','arrowup','arrowdown', ' '].includes(e.key.toLowerCase())) e.preventDefault();
        
        switch (e.key.toLowerCase()) {
            case 'arrowleft': this._move(-1); break;
            case 'arrowright': this._move(1); break;
            case 'arrowdown': await this._dropPiece(); break; // ★await
            case 'arrowup': this._rotate(); break;
            case ' ': await this._hardDrop(); break; // ★await
            case 'p': this._togglePlayPause(); break;
            case 'r': this.resetGame(); break;
        }
    });
    
    // タッチハンドラも async/await に対応
    this.canvas.addEventListener('touchstart', e => this._handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', e => this._handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', e => this._handleTouchEnd(e), { passive: false });
  }
  
  _handleTouchStart(e) { /* 変更なし */ }
  async _handleTouchMove(e) { // ★async
    e.preventDefault();
    if (!this.touchState.startX || e.touches.length !== this.touchState.fingerCount || this.state.isAnimating) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchState.lastMoveX;
    const deltaY = touch.clientY - this.touchState.startY;
    if(Math.abs(touch.clientX - this.touchState.startX) > 10 || Math.abs(deltaY) > 10) this.touchState.moved = true;
    if (this.touchState.fingerCount === 1) {
        if (Math.abs(deltaX) > this.BLOCK_SIZE * 0.8) {
            this._move(deltaX > 0 ? 1 : -1);
            this.touchState.lastMoveX = touch.clientX; 
        }
        if (deltaY > this.BLOCK_SIZE) {
            await this._dropPiece(); // ★await
            this.touchState.startY = touch.clientY; 
        }
    }
  }
  async _handleTouchEnd(e) { // ★async
    e.preventDefault();
    if (!this.touchState.startX || this.state.isAnimating) return;
    const touchDuration = Date.now() - this.touchState.startTime;
    if (!this.touchState.moved && touchDuration < 250 && this.touchState.fingerCount === 1) this._rotate();
    if (this.touchState.moved && this.touchState.fingerCount === 2) {
        const touch = e.changedTouches[0];
        if (touch.clientY - this.touchState.startY > 50) await this._hardDrop(); // ★await
    }
    this.touchState = {};
  }
}

// 以下の部分は変更がないため、簡潔にするために省略します。
// 実際のファイルでは、前回のコードからこれらのメソッドをコピーしてください。
// _spawnNewPiece, _merge, _collides, _drawBlock, _adjustColor, _drawPiece,
// _drawGhostPiece, _drawNextPiece, _drawOverlay, _showTextOnCanvas,
// _handleTouchStart, そしてゲーム起動のロジック

// ----- ここに前回のコードから変更のないメソッドと起動ロジックをペースト -----
// (↓再掲します)
Object.assign(Tetris.prototype, {
  _spawnNewPiece() {
    this.state.currentPiece = this.state.nextPiece;
    this.state.nextPiece = this._createPiece();
    if (this._collides()) {
        this.state.isPlaying = false;
        this.state.isGameOver = true;
        this.playPauseButton.textContent = '🔄';
    }
  },
  _merge() {
    const { shape, color, x, y } = this.state.currentPiece;
    shape.forEach((row, rowIdx) => {
      row.forEach((value, colIdx) => {
        if (value && y + rowIdx >= 0) {
          this.state.board[y + rowIdx][x + colIdx] = color;
        }
      });
    });
  },
  _collides(piece = this.state.currentPiece) {
    if (!piece) return false;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.x + x;
          const boardY = piece.y + y;
          if ( boardX < 0 || boardX >= this.GRID_WIDTH || boardY >= this.GRID_HEIGHT || (boardY >= 0 && this.state.board[boardY][boardX]) ) {
            return true;
          }
        }
      }
    }
    return false;
  },
  _drawBlock(ctx, x, y, color, blockSize) {
      const depth = blockSize * 0.15;
      const mainX = x * blockSize;
      const mainY = y * blockSize;
      const lighterColor = this._adjustColor(color, 30);
      const darkerColor = this._adjustColor(color, -60);
      ctx.fillStyle = darkerColor;
      ctx.fillRect(mainX, mainY, blockSize, blockSize);
      ctx.fillStyle = lighterColor;
      ctx.fillRect(mainX, mainY, blockSize - depth, blockSize - depth);
      ctx.fillStyle = color;
      ctx.fillRect(mainX + depth, mainY, blockSize - depth * 2, blockSize - depth);
      const innerShadowColor = this._adjustColor(color, -20);
      ctx.fillStyle = innerShadowColor;
      ctx.fillRect(mainX + depth, mainY + blockSize - depth * 2, blockSize - depth * 2, depth);
  },
  _adjustColor(hex, amount) {
    let usePound = false;
    if (hex[0] === "#") { hex = hex.slice(1); usePound = true; }
    const num = parseInt(hex, 16);
    let r = (num >> 16) + amount; if (r > 255) r = 255; else if (r < 0) r = 0;
    let g = ((num >> 8) & 0x00FF) + amount; if (g > 255) g = 255; else if (g < 0) g = 0;
    let b = (num & 0x0000FF) + amount; if (b > 255) b = 255; else if (b < 0) b = 0;
    const newHex = (b | (g << 8) | (r << 16)).toString(16).padStart(6, '0');
    return (usePound ? "#" : "") + newHex;
  },
  _drawPiece(piece, context, blockSize) {
      piece.shape.forEach((row, y) => {
          row.forEach((value, x) => {
              if (value && piece.y + y >= 0) {
                  this._drawBlock(context, piece.x + x, piece.y + y, piece.color, blockSize);
              }
          });
      });
  },
  _drawGhostPiece() {
      if (!this.state.currentPiece || !this.state.isPlaying) return;
      const ghost = JSON.parse(JSON.stringify(this.state.currentPiece));
      while (!this._collides(ghost)) ghost.y++;
      ghost.y--;
      ghost.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if(value && ghost.y + y >= 0) {
            const ghostX = (ghost.x + x) * this.BLOCK_SIZE;
            const ghostY = (ghost.y + y) * this.BLOCK_SIZE;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            this.ctx.fillRect(ghostX, ghostY, this.BLOCK_SIZE, this.BLOCK_SIZE);
          }
        });
      });
  },
  _drawNextPiece() {
    this.nextCtx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
    if (this.state.nextPiece) {
      const { shape, color } = this.state.nextPiece;
      const offsetX = (4 - shape[0].length) / 2;
      const offsetY = (4 - shape.length) / 2;
      shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) this._drawBlock(this.nextCtx, x + offsetX, y + offsetY, color, this.NEXT_BLOCK_SIZE);
        });
      });
    }
  },
  _drawOverlay() {
      if (this.state.isGameOver) {
          this._showTextOnCanvas("GAME OVER");
      } else if (!this.state.isPlaying && this.state.score > 0) {
          this._showTextOnCanvas("PAUSED");
      }
  },
  _showTextOnCanvas(text) {
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      this.ctx.fillRect(0, this.canvas.height / 2 - 30, this.canvas.width, 60);
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 24px "Segoe UI"';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2);
  },
  _handleTouchStart(e) {
      e.preventDefault();
      if (!this.state.isPlaying || e.touches.length > 2 || this.state.isAnimating) return;
      const touch = e.touches[0];
      this.touchState = {
          startX: touch.clientX,
          startY: touch.clientY,
          startTime: Date.now(),
          moved: false,
          fingerCount: e.touches.length,
          lastMoveX: touch.clientX,
      };
  },
});

const canvas = document.getElementById('tetris');
const nextCanvas = document.getElementById('next-piece');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const playPauseButton = document.getElementById('play-pause');
if (!canvas || !nextCanvas || !scoreElement || !highScoreElement || !playPauseButton) {
    console.error("Initialization failed: Missing critical DOM elements.");
    alert("ゲームの初期化に失敗しました。ページを再読み込みしてください。");
} else {
    new Tetris(canvas, nextCanvas, scoreElement, highScoreElement, playPauseButton);
}