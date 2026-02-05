// Game Logic
class MinesweeperGame {
  constructor() {
    this.board = [];
    this.gameState = 'playing';
    this.startTime = null;
    this.timer = null;
    this.currentTime = 0;
    this.settings = {
      easy: { rows: 9, cols: 9, mines: 10 },
      medium: { rows: 16, cols: 16, mines: 40 },
      hard: { rows: 16, cols: 30, mines: 99 }
    };
    this.currentDifficulty = 'easy';
    this.minesLeft = 10;
    this.firstClick = true;
    this.initGame();
    this.loadHighScores();
  }

  initGame() {
    const config = this.settings[this.currentDifficulty];
    this.board = Array(config.rows).fill().map(() =>
      Array(config.cols).fill().map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0
      }))
    );
    this.gameState = 'playing';
    this.minesLeft = config.mines;
    this.currentTime = 0;
    this.firstClick = true;
    this.updateDisplay();
    this.renderBoard();
  }

  placeMines(excludeRow, excludeCol) {
    const config = this.settings[this.currentDifficulty];
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const row = Math.floor(Math.random() * config.rows);
      const col = Math.floor(Math.random() * config.cols);
      if (!this.board[row][col].isMine && !(row === excludeRow && col === excludeCol)) {
        this.board[row][col].isMine = true;
        minesPlaced++;
      }
    }
    this.calculateNeighborMines();
  }

  calculateNeighborMines() {
    const config = this.settings[this.currentDifficulty];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (!this.board[row][col].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const newRow = row + i;
              const newCol = col + j;
              if (newRow >= 0 && newRow < config.rows &&
                newCol >= 0 && newCol < config.cols &&
                this.board[newRow][newCol].isMine) {
                count++;
              }
            }
          }
          this.board[row][col].neighborMines = count;
        }
      }
    }
  }

  revealCell(row, col) {
    if (this.gameState !== 'playing' ||
      this.board[row][col].isRevealed ||
      this.board[row][col].isFlagged) {
      return;
    }

    if (this.firstClick) {
      this.placeMines(row, col);
      this.firstClick = false;
      this.startTimer();
    }

    this.board[row][col].isRevealed = true;

    if (this.board[row][col].isMine) {
      this.gameState = 'lost';
      this.revealAllMines();
      this.stopTimer();
      this.showGameOver(false);
    } else if (this.board[row][col].neighborMines === 0) {
      this.revealNeighbors(row, col);
    }

    this.checkWin();
    this.renderBoard();
  }

  revealNeighbors(row, col) {
    const config = this.settings[this.currentDifficulty];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (newRow >= 0 && newRow < config.rows &&
          newCol >= 0 && newCol < config.cols &&
          !this.board[newRow][newCol].isRevealed &&
          !this.board[newRow][newCol].isFlagged) {
          this.revealCell(newRow, newCol);
        }
      }
    }
  }

  toggleFlag(row, col) {
    if (this.gameState !== 'playing' || this.board[row][col].isRevealed) {
      return;
    }
    this.board[row][col].isFlagged = !this.board[row][col].isFlagged;
    this.minesLeft += this.board[row][col].isFlagged ? -1 : 1;
    this.updateDisplay();
    this.renderBoard();
  }

  revealAllMines() {
    const config = this.settings[this.currentDifficulty];
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (this.board[row][col].isMine) {
          this.board[row][col].isRevealed = true;
        }
      }
    }
  }

  checkWin() {
    const config = this.settings[this.currentDifficulty];
    let revealedCount = 0;
    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        if (this.board[row][col].isRevealed && !this.board[row][col].isMine) {
          revealedCount++;
        }
      }
    }
    if (revealedCount === config.rows * config.cols - config.mines) {
      this.gameState = 'won';
      this.stopTimer();
      this.showGameOver(true);
    }
  }

  startTimer() {
    this.startTime = Date.now();
    this.timer = setInterval(() => {
      this.currentTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.updateDisplay();
    }, 1000);
  }

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  updateDisplay() {
    document.getElementById('mineCount').textContent = this.minesLeft;
    document.getElementById('timer').textContent = String(this.currentTime).padStart(3, '0');
    const statusElement = document.getElementById('gameStatus');
    switch (this.gameState) {
      case 'playing':
        statusElement.textContent = 'プレイ中';
        statusElement.className = 'text-lg font-medium text-blue-600';
        break;
      case 'won':
        statusElement.textContent = '勝利！';
        statusElement.className = 'text-lg font-medium text-green-600';
        break;
      case 'lost':
        statusElement.textContent = '敗北！';
        statusElement.className = 'text-lg font-medium text-red-600';
        break;
    }
  }

  renderBoard() {
    const config = this.settings[this.currentDifficulty];
    const boardElement = document.getElementById('gameBoard');
    boardElement.innerHTML = '';
    const cellSize = Math.min(30, Math.floor(600 / Math.max(config.rows, config.cols)));
    boardElement.style.width = `${config.cols * cellSize}px`;
    boardElement.style.height = `${config.rows * cellSize}px`;
    boardElement.style.display = 'grid';
    boardElement.style.gridTemplateColumns = `repeat(${config.cols}, ${cellSize}px)`;
    boardElement.style.gridTemplateRows = `repeat(${config.rows}, ${cellSize}px)`;

    for (let row = 0; row < config.rows; row++) {
      for (let col = 0; col < config.cols; col++) {
        const cell = document.createElement('div');
        cell.className = 'border border-gray-400 flex items-center justify-center text-sm font-bold cursor-pointer select-none';
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        const cellData = this.board[row][col];

        if (cellData.isFlagged) {
          cell.className += ' bg-yellow-200';
          cell.innerHTML = '<i class="ri-flag-fill text-red-500"></i>';
        } else if (cellData.isRevealed) {
          if (cellData.isMine) {
            cell.className += ' bg-red-500';
            cell.innerHTML = '<i class="ri-bomb-line text-white"></i>';
          } else {
            cell.className += ' bg-gray-100';
            if (cellData.neighborMines > 0) {
              cell.textContent = cellData.neighborMines;
              const colors = ['', 'text-blue-600', 'text-green-600', 'text-red-600', 'text-purple-600', 'text-yellow-600', 'text-pink-600', 'text-black', 'text-gray-600'];
              cell.className += ` ${colors[cellData.neighborMines]}`;
            }
          }
        } else {
          cell.className += ' bg-gray-300 hover:bg-gray-200';
        }

        cell.addEventListener('click', () => this.revealCell(row, col));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          this.toggleFlag(row, col);
        });

        boardElement.appendChild(cell);
      }
    }
  }

  showGameOver(won) {
    const modal = document.getElementById('gameOverModal');
    const modalIcon = document.getElementById('modalIcon');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');
    const modalTime = document.getElementById('modalTime');

    if (won) {
      modalIcon.className = 'w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-green-100';
      modalIcon.innerHTML = '<i class="ri-trophy-line text-4xl text-green-600"></i>';
      modalTitle.textContent = 'おめでとうございます！';
      modalMessage.textContent = '勝利です！';
    } else {
      modalIcon.className = 'w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100';
      modalIcon.innerHTML = '<i class="ri-bomb-line text-4xl text-red-600"></i>';
      modalTitle.textContent = 'ゲームオーバー！';
      modalMessage.textContent = '敗北です！';
    }

    modalTime.textContent = `時間: ${this.currentTime}秒`;
    modal.classList.remove('hidden');
  }

  changeDifficulty(difficulty) {
    this.currentDifficulty = difficulty;
    this.stopTimer();
    this.initGame();
  }

  loadHighScores() {
    // Load high scores logic
  }
}

// Initialize game
let game;

// Event Handlers
document.addEventListener('DOMContentLoaded', function () {
  game = new MinesweeperGame();

  const difficultySelect = document.getElementById('difficulty');
  const restartBtn = document.getElementById('restartBtn');
  const saveScoreBtn = document.getElementById('saveScore');
  const closeModalBtn = document.getElementById('closeModal');
  const clearScoresBtn = document.getElementById('clearScores');
  const playerNameInput = document.getElementById('playerName');

  difficultySelect.addEventListener('change', function () {
    game.changeDifficulty(this.value);
  });

  restartBtn.addEventListener('click', function () {
    game.stopTimer();
    game.initGame();
  });

  if (saveScoreBtn) {
    saveScoreBtn.addEventListener('click', function () {
      game.saveHighScore();
    });
  }

  closeModalBtn.addEventListener('click', function () {
    document.getElementById('gameOverModal').classList.add('hidden');
  });

  if (clearScoresBtn) {
    clearScoresBtn.addEventListener('click', function () {
      game.clearHighScores();
    });
  }

  if (playerNameInput) {
    playerNameInput.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') {
        game.saveHighScore();
      }
    });
  }

  document.getElementById('gameOverModal').addEventListener('click', function (e) {
    if (e.target === this) {
      this.classList.add('hidden');
    }
  });
});
