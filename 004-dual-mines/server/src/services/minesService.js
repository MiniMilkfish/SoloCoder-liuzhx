import CryptoJS from 'crypto-js';
import { GAME_CONFIG } from '../types/index.js';

const SECRET_KEY = process.env.MINE_SECRET_KEY || 'dual-mines-secret-key-2024';

export function generateMines(rows, cols, mineCount) {
  const mines = new Set();
  while (mines.size < mineCount) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    mines.add(`${row},${col}`);
  }
  
  const mineArray = Array.from(mines).map(m => {
    const [r, c] = m.split(',').map(Number);
    return { row: r, col: c };
  });
  
  return mineArray;
}

export function encryptMines(mines) {
  const data = JSON.stringify(mines);
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
}

export function decryptMines(encryptedMines) {
  const bytes = CryptoJS.AES.decrypt(encryptedMines, SECRET_KEY);
  const data = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(data);
}

export function createBoard(rows, cols) {
  const board = [];
  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        revealed: false,
        flagged: false,
        isMine: false,
        adjacentMines: 0,
      });
    }
    board.push(row);
  }
  return board;
}

export function calculateAdjacentMines(board, mines) {
  const mineSet = new Set(mines.map(m => `${m.row},${m.col}`));
  
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      if (mineSet.has(`${r},${c}`)) {
        board[r][c].isMine = true;
      } else {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
              if (mineSet.has(`${nr},${nc}`)) count++;
            }
          }
        }
        board[r][c].adjacentMines = count;
      }
    }
  }
  return board;
}

export function revealCell(board, row, col) {
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
    return { success: false, revealed: [] };
  }
  
  const cell = board[row][col];
  if (cell.revealed || cell.flagged) {
    return { success: false, revealed: [] };
  }
  
  const revealed = [];
  const reveal = (r, c) => {
    if (r < 0 || r >= board.length || c < 0 || c >= board[0].length) return;
    const cell = board[r][c];
    if (cell.revealed || cell.flagged) return;
    
    cell.revealed = true;
    revealed.push({ row: r, col: c, ...cell });
    
    if (cell.isMine) return;
    if (cell.adjacentMines > 0) return;
    
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        reveal(r + dr, c + dc);
      }
    }
  };
  
  reveal(row, col);
  
  return { success: true, revealed };
}

export function toggleFlag(board, row, col) {
  if (row < 0 || row >= board.length || col < 0 || col >= board[0].length) {
    return { success: false };
  }
  
  const cell = board[row][col];
  if (cell.revealed) {
    return { success: false };
  }
  
  cell.flagged = !cell.flagged;
  return { success: true, flagged: cell.flagged };
}

export function checkWin(board) {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (!cell.isMine && !cell.revealed) {
        return false;
      }
    }
  }
  return true;
}

export function getPublicBoard(board) {
  return board.map(row => 
    row.map(cell => ({
      revealed: cell.revealed,
      flagged: cell.flagged,
      isMine: cell.revealed ? cell.isMine : false,
      adjacentMines: cell.revealed ? cell.adjacentMines : 0,
    }))
  );
}
