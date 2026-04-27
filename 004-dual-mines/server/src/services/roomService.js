import { v4 as uuidv4 } from 'uuid';
import { GAME_CONFIG } from '../types/index.js';
import { 
  generateMines, 
  encryptMines, 
  createBoard, 
  calculateAdjacentMines,
  revealCell,
  toggleFlag,
  checkWin,
  getPublicBoard 
} from './minesService.js';
import { getOrCreateUser, updateUserWins } from './database.js';

const rooms = new Map();

export function createRoom(mode) {
  const roomId = uuidv4();
  const mines = generateMines(GAME_CONFIG.ROWS, GAME_CONFIG.COLS, GAME_CONFIG.MINE_COUNT);
  const encryptedMines = encryptMines(mines);
  const board = calculateAdjacentMines(
    createBoard(GAME_CONFIG.ROWS, GAME_CONFIG.COLS),
    mines
  );
  
  const room = {
    id: roomId,
    mode,
    status: 'waiting',
    players: {},
    spectators: {},
    currentPlayerId: null,
    timeLimit: GAME_CONFIG.TIME_LIMIT,
    timeRemaining: GAME_CONFIG.TIME_LIMIT,
    board,
    encryptedMines,
    mineCount: GAME_CONFIG.MINE_COUNT,
    rows: GAME_CONFIG.ROWS,
    cols: GAME_CONFIG.COLS,
    resetVote: {
      initiatedBy: null,
      agreed: [],
    },
    timer: null,
  };
  
  rooms.set(roomId, room);
  return room;
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function getPublicRoomState(room) {
  return {
    id: room.id,
    mode: room.mode,
    status: room.status,
    players: Object.values(room.players),
    spectators: Object.values(room.spectators),
    currentPlayerId: room.currentPlayerId,
    timeLimit: room.timeLimit,
    timeRemaining: room.timeRemaining,
    board: getPublicBoard(room.board),
    mineCount: room.mineCount,
    rows: room.rows,
    cols: room.cols,
    resetVote: room.resetVote,
  };
}

export function joinRoom(roomId, socketId, nickname, role = 'player') {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  const user = getOrCreateUser(nickname);
  
  if (role === 'player') {
    if (Object.keys(room.players).length >= 2) {
      if (Object.keys(room.spectators).length >= GAME_CONFIG.MAX_SPECTATORS) {
        return { success: false, error: '房间已满' };
      }
      role = 'spectator';
    }
  }
  
  const player = {
    id: socketId,
    nickname: user.nickname,
    role,
    wins: user.wins,
    isReady: false,
  };
  
  if (role === 'player') {
    room.players[socketId] = player;
  } else {
    room.spectators[socketId] = player;
  }
  
  const playerCount = Object.keys(room.players).length;
  const spectatorsCount = Object.keys(room.spectators).length;
  
  console.log(`玩家 ${nickname} 加入房间 ${roomId}，角色: ${role}`);
  console.log(`当前玩家数: ${playerCount}, 观众数: ${spectatorsCount}`);
  
  return { 
    success: true, 
    player, 
    role,
    playerCount,
    spectatorsCount
  };
}

export function leaveRoom(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return;
  
  const wasPlayer = room.players[socketId];
  const wasSpectator = room.spectators[socketId];
  
  if (room.players[socketId]) {
    delete room.players[socketId];
  }
  if (room.spectators[socketId]) {
    delete room.spectators[socketId];
  }
  
  if (Object.keys(room.players).length === 0 && Object.keys(room.spectators).length === 0) {
    if (room.timer) {
      clearInterval(room.timer);
    }
    rooms.delete(roomId);
    console.log(`房间 ${roomId} 已被删除，因为没有玩家`);
  } else if (wasPlayer) {
    if (room.status === 'playing') {
      room.status = 'ended';
      if (room.timer) {
        clearInterval(room.timer);
        room.timer = null;
      }
      console.log(`房间 ${roomId} 游戏结束，因为玩家离开`);
    }
  }
}

export function startGame(roomId) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  const playerIds = Object.keys(room.players);
  if (playerIds.length < 2) {
    return { success: false, error: '需要2名玩家才能开始' };
  }
  
  const allReady = Object.values(room.players).every(p => p.isReady);
  if (!allReady) {
    return { success: false, error: '所有玩家需要准备好' };
  }
  
  room.status = 'playing';
  room.currentPlayerId = playerIds[0];
  room.timeRemaining = room.timeLimit;
  
  const mines = generateMines(room.rows, room.cols, room.mineCount);
  room.encryptedMines = encryptMines(mines);
  room.board = calculateAdjacentMines(
    createBoard(room.rows, room.cols),
    mines
  );
  room.resetVote = { initiatedBy: null, agreed: [] };
  
  if (room.timer) {
    clearInterval(room.timer);
  }
  room.timer = setInterval(() => {
    if (room.status !== 'playing') {
      clearInterval(room.timer);
      room.timer = null;
      return;
    }
    
    room.timeRemaining--;
    if (room.timeRemaining <= 0) {
      room.status = 'ended';
      clearInterval(room.timer);
      room.timer = null;
    }
  }, 1000);
  
  console.log(`房间 ${roomId} 游戏开始，模式: ${room.mode}`);
  
  return { success: true };
}

export function playerReady(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (room.players[socketId]) {
    room.players[socketId].isReady = true;
  }
  
  return { success: true };
}

export function clickCell(roomId, socketId, row, col) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未开始' };
  }
  
  if (room.mode === 'coop' || room.mode === 'battle') {
    if (room.currentPlayerId !== socketId) {
      return { success: false, error: '不是你的回合' };
    }
  }
  
  const result = revealCell(room.board, row, col);
  if (!result.success) {
    return { success: false, error: '无法点击该格子' };
  }
  
  const hitMine = result.revealed.some(c => c.isMine);
  
  if (hitMine) {
    room.status = 'ended';
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    
    const playerIds = Object.keys(room.players);
    const winnerIndex = playerIds.indexOf(socketId) === 0 ? 1 : 0;
    const winnerId = playerIds[winnerIndex];
    
    if (room.players[winnerId]) {
      room.players[winnerId].wins++;
      updateUserWins(room.players[winnerId].nickname, room.players[winnerId].wins);
    }
    
    return {
      success: true,
      revealed: result.revealed,
      gameEnded: true,
      winner: winnerId,
      reason: '踩到地雷',
    };
  }
  
  if (checkWin(room.board)) {
    room.status = 'ended';
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    
    if (room.players[socketId]) {
      room.players[socketId].wins++;
      updateUserWins(room.players[socketId].nickname, room.players[socketId].wins);
    }
    
    return {
      success: true,
      revealed: result.revealed,
      gameEnded: true,
      winner: socketId,
      reason: '安全完成所有格子',
    };
  }
  
  room.timeRemaining = room.timeLimit;
  
  if (room.mode === 'coop' || room.mode === 'battle') {
    const playerIds = Object.keys(room.players);
    const currentIndex = playerIds.indexOf(socketId);
    const nextIndex = (currentIndex + 1) % playerIds.length;
    room.currentPlayerId = playerIds[nextIndex];
  }
  
  return {
    success: true,
    revealed: result.revealed,
    gameEnded: false,
    nextPlayerId: room.currentPlayerId,
  };
}

export function flagCell(roomId, socketId, row, col) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未开始' };
  }
  
  const result = toggleFlag(room.board, row, col);
  return {
    ...result,
    row,
    col,
  };
}

export function changeMode(roomId, newMode) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (room.status === 'playing') {
    return { success: false, error: '游戏进行中无法切换模式' };
  }
  
  room.mode = newMode;
  console.log(`房间 ${roomId} 模式切换为: ${newMode}`);
  return { success: true };
}

export function initiateResetVote(roomId, socketId) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (room.status !== 'playing') {
    return { success: false, error: '游戏未开始' };
  }
  
  if (room.resetVote.initiatedBy) {
    return { success: false, error: '重置投票已在进行中' };
  }
  
  room.resetVote = {
    initiatedBy: socketId,
    agreed: [socketId],
  };
  
  console.log(`玩家 ${socketId} 发起房间 ${roomId} 的重置投票`);
  
  return { success: true };
}

export function voteReset(roomId, socketId, agree) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  if (!room.resetVote.initiatedBy) {
    return { success: false, error: '没有进行中的重置投票' };
  }
  
  if (agree && !room.resetVote.agreed.includes(socketId)) {
    room.resetVote.agreed.push(socketId);
  }
  
  const playerIds = Object.keys(room.players);
  const allAgreed = playerIds.every(id => room.resetVote.agreed.includes(id));
  
  if (allAgreed) {
    for (let r = 0; r < room.board.length; r++) {
      for (let c = 0; c < room.board[0].length; c++) {
        room.board[r][c].revealed = false;
        room.board[r][c].flagged = false;
      }
    }
    
    room.status = 'waiting';
    room.timeRemaining = room.timeLimit;
    room.resetVote = { initiatedBy: null, agreed: [] };
    
    if (room.timer) {
      clearInterval(room.timer);
      room.timer = null;
    }
    
    console.log(`房间 ${roomId} 重置投票通过，棋盘已重置`);
    
    return { 
      success: true, 
      reset: true,
      reason: '重置投票通过'
    };
  }
  
  return { 
    success: true, 
    reset: false,
    agreedCount: room.resetVote.agreed.length,
    totalPlayers: playerIds.length
  };
}

export function handleTimeout(roomId) {
  const room = rooms.get(roomId);
  if (!room) return null;
  
  if (room.status !== 'playing') return null;
  
  const playerIds = Object.keys(room.players);
  const winnerIndex = playerIds.indexOf(room.currentPlayerId) === 0 ? 1 : 0;
  const winnerId = playerIds[winnerIndex];
  
  if (room.players[winnerId]) {
    room.players[winnerId].wins++;
    updateUserWins(room.players[winnerId].nickname, room.players[winnerId].wins);
  }
  
  room.status = 'ended';
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  
  console.log(`房间 ${roomId} 超时，玩家 ${room.currentPlayerId} 输了`);
  
  return {
    winner: winnerId,
    loser: room.currentPlayerId,
    reason: '超时',
  };
}

export function reconnectUser(socketId, oldSocketId, roomId) {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: '房间不存在' };
  
  let player = room.players[oldSocketId];
  let isPlayer = true;
  
  if (!player) {
    player = room.spectators[oldSocketId];
    isPlayer = false;
  }
  
  if (!player) {
    return { success: false, error: '用户不在该房间' };
  }
  
  player.id = socketId;
  
  if (isPlayer) {
    delete room.players[oldSocketId];
    room.players[socketId] = player;
    
    if (room.currentPlayerId === oldSocketId) {
      room.currentPlayerId = socketId;
    }
  } else {
    delete room.spectators[oldSocketId];
    room.spectators[socketId] = player;
  }
  
  console.log(`用户重连: ${oldSocketId} -> ${socketId}`);
  
  return {
    success: true,
    player,
    isPlayer,
    roomState: getPublicRoomState(room),
  };
}

export { rooms };
