import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../../data');
const dbPath = path.join(dataDir, 'minesweeper.json');

let db = {
  users: []
};

export function initDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (fs.existsSync(dbPath)) {
    try {
      const data = fs.readFileSync(dbPath, 'utf-8');
      db = JSON.parse(data);
      console.log('Database loaded from:', dbPath);
      console.log(`现有用户数: ${db.users.length}`);
    } catch (error) {
      console.error('Failed to load database:', error);
      db = { users: [] };
    }
  } else {
    db = { users: [] };
    saveDatabase();
    console.log('New database created at:', dbPath);
  }
  
  return db;
}

function saveDatabase() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
  } catch (error) {
    console.error('Failed to save database:', error);
  }
}

function getCurrentTime() {
  return new Date().toISOString();
}

export function getOrCreateUser(nickname) {
  const existingUser = db.users.find(u => u.nickname === nickname);
  
  if (existingUser) {
    console.log(`找到现有用户: ${nickname}, 胜场数: ${existingUser.wins}`);
    return {
      id: existingUser.id,
      nickname: existingUser.nickname,
      wins: existingUser.wins,
    };
  }
  
  const id = uuidv4();
  const newUser = {
    id,
    nickname,
    wins: 0,
    created_at: getCurrentTime(),
    updated_at: getCurrentTime(),
  };
  
  db.users.push(newUser);
  saveDatabase();
  
  console.log(`创建新用户: ${nickname}, ID: ${id}`);
  
  return {
    id,
    nickname,
    wins: 0,
  };
}

export function updateUserWins(nickname, wins) {
  const userIndex = db.users.findIndex(u => u.nickname === nickname);
  
  if (userIndex !== -1) {
    db.users[userIndex].wins = wins;
    db.users[userIndex].updated_at = getCurrentTime();
    saveDatabase();
    console.log(`更新用户 ${nickname} 胜场数为: ${wins}`);
  }
}

export function getUserByNickname(nickname) {
  const user = db.users.find(u => u.nickname === nickname);
  if (!user) return null;
  return {
    id: user.id,
    nickname: user.nickname,
    wins: user.wins,
  };
}

export { db };
