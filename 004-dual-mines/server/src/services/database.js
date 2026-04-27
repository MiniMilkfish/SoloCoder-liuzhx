import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/minesweeper.db');

let db;

export function initDatabase() {
  db = new Database(dbPath);
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nickname TEXT UNIQUE NOT NULL,
      wins INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE INDEX IF NOT EXISTS idx_nickname ON users(nickname);
  `);
  
  console.log('Database initialized at:', dbPath);
  return db;
}

export function getOrCreateUser(nickname) {
  const existingUser = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
  
  if (existingUser) {
    return {
      id: existingUser.id,
      nickname: existingUser.nickname,
      wins: existingUser.wins,
    };
  }
  
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO users (id, nickname, wins, created_at, updated_at)
    VALUES (?, ?, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `).run(id, nickname);
  
  return {
    id,
    nickname,
    wins: 0,
  };
}

export function updateUserWins(nickname, wins) {
  db.prepare(`
    UPDATE users 
    SET wins = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE nickname = ?
  `).run(wins, nickname);
}

export function getUserByNickname(nickname) {
  const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
  if (!user) return null;
  return {
    id: user.id,
    nickname: user.nickname,
    wins: user.wins,
  };
}

export { db };
