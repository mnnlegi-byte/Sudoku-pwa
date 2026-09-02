// ===================== Константы =====================

const DIFFICULTIES = {
  EASY:    { key: 'EASY',    label: 'Лёгкий',  clues: 46 },
  MEDIUM:  { key: 'MEDIUM',  label: 'Средний', clues: 36 },
  HARD:    { key: 'HARD',    label: 'Сложный', clues: 30 },
  EXPERT:  { key: 'EXPERT',  label: 'Эксперт', clues: 24 },
};

const SAVE_KEY = 'sudoku_save_v1';

// ===================== Генератор судоку =====================

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function isValid(grid, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (grid[row][i] === num) return false;
    if (grid[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3, bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (grid[r][c] === num) return false;
    }
  }
  return true;
}

function fillGrid(grid) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (grid[r][c] === 0) {
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
        for (const num of nums) {
          if (isValid(grid, r, c, num)) {
            grid[r][c] = num;
            if (fillGrid(grid)) return true;
            grid[r][c] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(grid, limit) {
  let count = 0;
  function solve() {
    if (count >= limit) return;
    let row = -1, col = -1;
    outer:
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) { row = r; col = c; break outer; }
      }
    }
    if (row === -1) { count++; return; }
    for (let num = 1; num <= 9; num++) {
      if (count >= limit) return;
      if (isValid(grid, row, col, num)) {
        grid[row][col] = num;
        solve();
        grid[row][col] = 0;
      }
    }
  }
  solve();
  return count;
}

function removeCells(grid, count) {
  let removed = 0, attempts = 0;
  const maxAttempts = count * 15;
  const positions = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) positions.push([r, c]);
  shuffle(positions);
  let idx = 0;
  while (removed < count && attempts < maxAttempts && idx < positions.length) {
    const [r, c] = positions[idx]; idx++; attempts++;
    if (grid[r][c] === 0) continue;
    const backup = grid[r][c];
    grid[r][c] = 0;
    const copy = grid.map(row => row.slice());
    if (countSolutions(copy, 2) === 1) {
      removed++;
    } else {
      grid[r][c] = backup;
    }
  }
}

function generateBoard(diffKey) {
  const diff = DIFFICULTIES[diffKey];
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  fillGrid(grid);
  const solution = grid.map(row => row.slice());
  const puzzle = grid.map(row => row.slice());
  removeCells(puzzle, 81 - diff.clues);
  const fixed = puzzle.map(row => row.map(v => v !== 0));
  return { solution, puzzle, fixed };
}

function findConflicts(grid) {
  const conflicts = Array.from({ length: 9 }, () => Array(9).fill(false));
  for (let r = 0; r < 9; r++) {
    const seen = {};
    for (let c = 0; c < 9; c++) {
      const v = grid[r][c];
      if (v !== 0) (seen[v] = seen[v] || []).push(c);
    }
    for (const v in seen) if (seen[v].length > 1) for (const c of seen[v]) conflicts[r][c] = true;
  }
  for (let c = 0; c < 9; c++) {
    const seen = {};
    for (let r = 0; r < 9; r++) {
      const v = grid[r][c];
      if (v !== 0) (seen[v] = seen[v] || []).push(r);
    }
    for (const v in seen) if (seen[v].length > 1) for (const r of seen[v]) conflicts[r][c] = true;
  }
  for (let br = 0; br < 3; br++) {
    for (let bc = 0; bc < 3; bc++) {
      const seen = {};
      for (let r = br * 3; r < br * 3 + 3; r++) {
        for (let c = bc * 3; c < bc * 3 + 3; c++) {
          const v = grid[r][c];
          if (v !== 0) (seen[v] = seen[v] || []).push([r, c]);
        }
      }
      for (const v in seen) if (seen[v].length > 1) for (const [r, c] of seen[v]) conflicts[r][c] = true;
    }
  }
  return conflicts;
}

function isBoardComplete(grid) {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (grid[r][c] === 0) return false;
  return true;
}
function isBoardCorrect(grid, solution) {
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) if (grid[r][c] !== solution[r][c]) return false;
  return true;
}

// ===================== Утилиты сериализации =====================

function gridToStr(grid) { return grid.flat().join(''); }
function strToGrid(str) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(0));
  for (let i = 0; i < 81; i++) grid[Math.floor(i / 9)][i % 9] = Number(str[i]);
  return grid;
}
function boolGridToStr(grid) { return grid.flat().map(b => b ? '1' : '0').join(''); }
function strToBoolGrid(str) {
  const grid = Array.from({ length: 9 }, () => Array(9).fill(false));
  for (let i = 0; i < 81; i++) grid[Math.floor(i / 9)][i % 9] = str[i] === '1';
  return grid;
}

// ===================== Хранилище прогресса =====================

function saveGame(g) {
  const data = {
    difficulty: g.difficulty,
    solution: gridToStr(g.board.solution),
    fixed: boolGridToStr(g.board.fixed),
    userGrid: gridToStr(g.userGrid),
    pencilMarks: g.pencilMarks.map(row => row.map(s => Array.from(s).join(''))),
    mistakes: g.mistakes,
    seconds: g.seconds,
    replayIndex: g.replayIndex,
  };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch (e) {}
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return {
      difficulty: data.difficulty,
      solution: strToGrid(data.solution),
      fixed: strToBoolGrid(data.fixed),
      userGrid: strToGrid(data.userGrid),
      pencilMarks: data.pencilMarks
        ? data.pencilMarks.map(row => row.map(s => new Set(Array.from(s).map(Number))))
        : Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())),
      mistakes: data.mistakes || 0,
      seconds: data.seconds || 0,
      replayIndex: (data.replayIndex === undefined) ? null : data.replayIndex,
    };
  } catch (e) { return null; }
}

function hasSavedGame() { return localStorage.getItem(SAVE_KEY) !== null; }
function clearSave() { localStorage.removeItem(SAVE_KEY); }

// ===================== Хранилище статистики =====================

function statsKey(diff) { return `sudoku_stats_${diff}`; }

function getRecords(diff) {
  const raw = localStorage.getItem(statsKey(diff));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch (e) { return []; }
}
function saveRecords(diff, records) {
  try { localStorage.setItem(statsKey(diff), JSON.stringify(records)); } catch (e) {}
}
function addRecord(diff, puzzle, solution, timeSeconds, dateMillis) {
  const records = getRecords(diff);
  records.push({ puzzle, solution, timeSeconds, dateMillis });
  saveRecords(diff, records);
  return records.length - 1;
}
function updateRecord(diff, index, timeSeconds, dateMillis) {
  const records = getRecords(diff);
  if (index >= 0 && index < records.length) {
    records[index] = { ...records[index], timeSeconds, dateMillis };
    saveRecords(diff, records);
  }
}

// ===================== Форматирование =====================

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
function formatDate(millis) {
  const d = new Date(millis);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

// ===================== Навигация экранов =====================

function showScreen(name) {
  document.getElementById('difficultyScreen').classList.toggle('hidden', name !== 'difficulty');
  document.getElementById('statsScreen').classList.toggle('hidden', name !== 'stats');
  document.getElementById('gameScreen').classList.toggle('hidden', name !== 'game');
}

// ===================== Экран выбора сложности =====================

function renderDifficultyScreen() {
  const hasSave = hasSavedGame();
  const el = document.getElementById('difficultyScreen');
  let html = `<div class="center-col">
    <h1>Судоку</h1>`;
  if (hasSave) {
    html += `<button class="btn btn-continue" id="btnContinue">Продолжить игру</button>`;
  }
  html += `<p class="hint">Выберите сложность</p>`;
  for (const key in DIFFICULTIES) {
    const d = DIFFICULTIES[key];
    html += `<div class="diff-row">
      <button class="btn btn-diff" data-diff="${key}">${d.label}</button>
      <button class="btn-stats" data-stats="${key}">📊</button>
    </div>`;
  }
  html += `</div>`;
  el.innerHTML = html;
}

// ===================== Экран статистики =====================

function renderStatsScreen(diff) {
  const records = getRecords(diff);
  const el = document.getElementById('statsScreen');
  let html = `<div class="top-bar">
    <button class="btn-link" id="btnStatsBack">← Назад</button>
    <h2>Статистика: ${DIFFICULTIES[diff].label}</h2>
  </div>`;
  if (records.length === 0) {
    html += `<div class="empty-hint">Пока нет завершённых игр на этом уровне</div>`;
  } else {
    html += `<div class="stats-list">`;
    records.forEach((rec, i) => {
      html += `<div class="stats-card">
        <div class="stats-info">
          <div class="stats-num">#${i + 1}</div>
          <div>Время: ${formatTime(rec.timeSeconds)}</div>
          <div class="stats-date">${formatDate(rec.dateMillis)}</div>
        </div>
        <button class="btn" data-replay="${i}" data-replay-diff="${diff}">Заново</button>
      </div>`;
    });
    html += `</div>`;
  }
  el.innerHTML = html;
}

function showStats(diff) {
  renderStatsScreen(diff);
  showScreen('stats');
}

// ===================== Игровой экран =====================

let game = null;

function stopTimer() {
  if (game && game.timerId) { clearInterval(game.timerId); game.timerId = null; }
}

function startTimer() {
  stopTimer();
  game.timerId = setInterval(() => {
    if (!game || game.won || game.mistakes >= 3) { stopTimer(); return; }
    game.seconds++;
    if (game.seconds % 5 === 0) saveGame(game);
    renderGame();
  }, 1000);
}

function loadingHtml() {
  return `<div class="loading"><div class="spinner"></div></div>`;
}

function initGameFromBoard(diff, board, opts = {}) {
  game = {
    difficulty: diff,
    board: board,
    userGrid: opts.userGrid || board.puzzle.map(row => row.slice()),
    pencilMarks: opts.pencilMarks || Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set())),
    selectedRow: -1,
    selectedCol: -1,
    armedNumber: null,
    inputMode: 'cell',
    pencilMode: false,
    mistakes: opts.mistakes || 0,
    seconds: opts.seconds || 0,
    won: false,
    replayIndex: (opts.replayIndex === undefined) ? null : opts.replayIndex,
    timerId: null,
  };
  showScreen('game');
  renderGame();
  startTimer();
  saveGame(game);
}

function startNewGame(diff) {
  showScreen('game');
  document.getElementById('gameScreen').innerHTML = loadingHtml();
  setTimeout(() => {
    const board = generateBoard(diff);
    initGameFromBoard(diff, board, { mistakes: 0, seconds: 0, replayIndex: null });
  }, 30);
}

function onContinueGame() {
  const saved = loadGame();
  if (!saved) return;
  const puzzle = Array.from({ length: 9 }, (_, r) =>
    Array.from({ length: 9 }, (_, c) => saved.fixed[r][c] ? saved.solution[r][c] : 0)
  );
  const board = { solution: saved.solution, puzzle, fixed: saved.fixed };
  initGameFromBoard(saved.difficulty, board, {
    mistakes: saved.mistakes,
    seconds: saved.seconds,
    replayIndex: saved.replayIndex,
    userGrid: saved.userGrid,
    pencilMarks: saved.pencilMarks,
  });
}

function startReplay(diff, index) {
  showScreen('game');
  document.getElementById('gameScreen').innerHTML = loadingHtml();
  setTimeout(() => {
    const records = getRecords(diff);
    const rec = records[index];
    if (!rec) { startNewGame(diff); return; }
    const solution = strToGrid(rec.solution);
    const puzzle = strToGrid(rec.puzzle);
    const fixed = puzzle.map(row => row.map(v => v !== 0));
    initGameFromBoard(diff, { solution, puzzle, fixed }, { mistakes: 0, seconds: 0, replayIndex: index });
  }, 30);
}

function exitToMenu() {
  stopTimer();
  game = null;
  renderDifficultyScreen();
  showScreen('difficulty');
}

function onWin() {
  game.won = true;
  stopTimer();
  clearSave();
  const now = Date.now();
  if (game.replayIndex != null) {
    updateRecord(game.difficulty, game.replayIndex, game.seconds, now);
  } else {
    const idx = addRecord(game.difficulty, gridToStr(game.board.puzzle), gridToStr(game.board.solution), game.seconds, now);
    game.replayIndex = idx;
  }
}

function placeValue(r, c, num) {
  if (game.won || game.mistakes >= 3) return;
  game.userGrid[r][c] = num;
  if (game.pencilMarks[r][c].size > 0) game.pencilMarks[r][c] = new Set();
  if (num !== game.board.solution[r][c]) game.mistakes++;

  if (isBoardComplete(game.userGrid) && isBoardCorrect(game.userGrid, game.board.solution)) {
    onWin();
  }

  if (!game.won) {
    if (game.mistakes >= 3) {
      stopTimer();
      clearSave();
    } else {
      saveGame(game);
    }
  }
  renderGame();
}

function togglePencilMark(r, c, num) {
  if (game.won || game.mistakes >= 3) return;
  if (game.userGrid[r][c] !== 0) return;
  const set = game.pencilMarks[r][c];
  if (set.has(num)) set.delete(num); else set.add(num);
  saveGame(game);
  renderGame();
}

function handlePlacement(r, c, num) {
  if (game.pencilMode) togglePencilMark(r, c, num); else placeValue(r, c, num);
}

function handleCellClick(r, c) {
  if (game.board.fixed[r][c] || game.won || game.mistakes >= 3) return;
  game.selectedRow = r; game.selectedCol = c;
  if (game.inputMode === 'number' && game.armedNumber != null) {
    handlePlacement(r, c, game.armedNumber);
  } else {
    renderGame();
  }
}

function handleNumberClick(num) {
  if (game.won || game.mistakes >= 3) return;
  if (game.inputMode === 'cell') {
    if (game.selectedRow >= 0 && game.selectedCol >= 0) {
      handlePlacement(game.selectedRow, game.selectedCol, num);
    }
  } else {
    game.armedNumber = (game.armedNumber === num) ? null : num;
    renderGame();
  }
}

function handleErase() {
  if (game.selectedRow >= 0 && game.selectedCol >= 0) {
    game.userGrid[game.selectedRow][game.selectedCol] = 0;
    game.pencilMarks[game.selectedRow][game.selectedCol] = new Set();
    saveGame(game);
    renderGame();
  }
}

function toggleInputMode() {
  game.inputMode = game.inputMode === 'cell' ? 'number' : 'cell';
  game.armedNumber = null;
  renderGame();
}

function winDialogHtml() {
  return `<div class="dialog-overlay">
    <div class="dialog">
      <h3>Поздравляем! 🎉</h3>
      <p>Судоку решена за ${formatTime(game.seconds)}, ошибок: ${game.mistakes}.</p>
      <div class="dialog-actions">
        <button class="btn" id="btnWinNewGame">Новая игра</button>
        <button class="btn btn-outline" id="btnWinChangeDiff">Сменить сложность</button>
      </div>
    </div>
  </div>`;
}
function loseDialogHtml() {
  return `<div class="dialog-overlay">
    <div class="dialog">
      <h3>Игра окончена</h3>
      <p>Слишком много ошибок (3). Попробуйте ещё раз.</p>
      <div class="dialog-actions">
        <button class="btn" id="btnLoseRetry">Начать заново</button>
        <button class="btn btn-outline" id="btnLoseChangeDiff">Сменить сложность</button>
      </div>
    </div>
  </div>`;
}

function renderGame() {
  if (!game) return;
  const b = game.board;
  const conflicts = findConflicts(game.userGrid);

  let gridHtml = `<div class="sudoku-grid">`;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const isFixed = b.fixed[r][c];
      const value = game.userGrid[r][c];
      const marks = game.pencilMarks[r][c];
      const isSelected = r === game.selectedRow && c === game.selectedCol;
      const isHighlighted = !isSelected && (
        r === game.selectedRow || c === game.selectedCol ||
        (Math.floor(r / 3) === Math.floor(game.selectedRow / 3) && Math.floor(c / 3) === Math.floor(game.selectedCol / 3))
      );
      const hasConflict = conflicts[r][c];
      const sameValue = game.selectedRow >= 0 && game.selectedCol >= 0 &&
        game.userGrid[game.selectedRow][game.selectedCol] !== 0 &&
        value === game.userGrid[game.selectedRow][game.selectedCol];

      const classes = ['cell'];
      if (c % 3 === 0) classes.push('block-left');
      if (r % 3 === 0) classes.push('block-top');
      if (c === 8) classes.push('block-right');
      if (r === 8) classes.push('block-bottom');
      if (isSelected) classes.push('selected');
      else if (hasConflict) classes.push('conflict');
      else if (sameValue) classes.push('same-value');
      else if (isHighlighted) classes.push('highlighted');

      let inner = '';
      if (value !== 0) {
        const textClass = hasConflict ? 'val conflict-text' : (isFixed ? 'val fixed-text' : 'val user-text');
        inner = `<span class="${textClass}">${value}</span>`;
      } else if (marks.size > 0) {
        inner = `<div class="marks">`;
        for (let n = 1; n <= 9; n++) inner += `<span class="mark">${marks.has(n) ? n : ''}</span>`;
        inner += `</div>`;
      }
      gridHtml += `<div class="${classes.join(' ')}" data-cell="${r},${c}">${inner}</div>`;
    }
  }
  gridHtml += `</div>`;

  const modeLabel = game.inputMode === 'cell' ? 'Клетка → цифра' : 'Цифра → клетка';
  const numberPadHtml = `
    <div class="controls-row">
      <button class="btn-toggle" id="btnToggleMode">${modeLabel}</button>
      <button class="btn-toggle ${game.pencilMode ? 'active' : ''}" id="btnTogglePencil">✏️ Карандаш${game.pencilMode ? ' ВКЛ' : ''}</button>
    </div>
    <div class="numpad">
      ${[1,2,3,4,5,6,7,8,9].map(n =>
        `<button class="numbtn ${game.inputMode === 'number' && game.armedNumber === n ? 'armed' : ''}" data-num="${n}">${n}</button>`
      ).join('')}
      <button class="numbtn erase" id="btnErase">⌫</button>
    </div>
  `;

  let hintText;
  if (game.pencilMode && game.inputMode === 'number') hintText = 'Карандаш: выберите цифру, затем клетки для пометки';
  else if (game.pencilMode) hintText = 'Карандаш: выберите клетку, затем цифру для пометки';
  else if (game.inputMode === 'number') hintText = 'Выберите цифру, затем клетку, чтобы поставить её';
  else hintText = 'Выберите клетку, затем цифру, чтобы поставить её';

  const html = `
    <div class="top-bar">
      <button class="btn-link" id="btnBackTop">← ${DIFFICULTIES[game.difficulty].label}</button>
      <div class="timer">${formatTime(game.seconds)}</div>
      <div class="mistakes">Ошибки: ${game.mistakes}/3</div>
    </div>
    <div class="grid-wrap">${gridHtml}</div>
    ${numberPadHtml}
    <div class="hint-text">${hintText}</div>
    <div class="newgame-row"><button class="btn btn-outline" id="btnNewGame">Новая игра</button></div>
    <button class="fab" id="btnHomeFab">🏠</button>
    ${game.won ? winDialogHtml() : ''}
    ${(game.mistakes >= 3 && !game.won) ? loseDialogHtml() : ''}
  `;
  document.getElementById('gameScreen').innerHTML = html;
}

// ===================== Делегирование событий =====================

document.addEventListener('click', (e) => {
  // Экран сложности
  if (e.target.closest('#btnContinue')) { onContinueGame(); return; }
  const diffBtn = e.target.closest('[data-diff]');
  if (diffBtn) { startNewGame(diffBtn.dataset.diff); return; }
  const statsBtn = e.target.closest('[data-stats]');
  if (statsBtn) { showStats(statsBtn.dataset.stats); return; }

  // Экран статистики
  if (e.target.closest('#btnStatsBack')) { renderDifficultyScreen(); showScreen('difficulty'); return; }
  const replayBtn = e.target.closest('[data-replay]');
  if (replayBtn) {
    startReplay(replayBtn.dataset.replayDiff, Number(replayBtn.dataset.replay));
    return;
  }

  // Экран игры
  if (!game) return;
  const cellEl = e.target.closest('[data-cell]');
  if (cellEl) {
    const [r, c] = cellEl.dataset.cell.split(',').map(Number);
    handleCellClick(r, c);
    return;
  }
  const numEl = e.target.closest('[data-num]');
  if (numEl) { handleNumberClick(Number(numEl.dataset.num)); return; }
  if (e.target.closest('#btnErase')) { handleErase(); return; }
  if (e.target.closest('#btnToggleMode')) { toggleInputMode(); return; }
  if (e.target.closest('#btnTogglePencil')) { game.pencilMode = !game.pencilMode; renderGame(); return; }
  if (e.target.closest('#btnNewGame')) { startNewGame(game.difficulty); return; }
  if (e.target.closest('#btnBackTop')) { exitToMenu(); return; }
  if (e.target.closest('#btnHomeFab')) { exitToMenu(); return; }
  if (e.target.closest('#btnWinNewGame')) { startNewGame(game.difficulty); return; }
  if (e.target.closest('#btnWinChangeDiff')) { exitToMenu(); return; }
  if (e.target.closest('#btnLoseRetry')) { startNewGame(game.difficulty); return; }
  if (e.target.closest('#btnLoseChangeDiff')) { exitToMenu(); return; }
});

// ===================== Инициализация =====================

function init() {
  renderDifficultyScreen();
  showScreen('difficulty');
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

document.addEventListener('DOMContentLoaded', init);
