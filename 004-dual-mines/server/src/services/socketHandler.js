import { 
  createRoom, 
  getRoom, 
  joinRoom, 
  leaveRoom, 
  startGame, 
  playerReady,
  clickCell, 
  flagCell, 
  changeMode,
  initiateResetVote,
  voteReset,
  handleTimeout,
  getPublicRoomState,
  reconnectUser,
  rooms 
} from './roomService.js';

const userSocketMap = new Map();

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('新连接:', socket.id);
    
    socket.on('disconnect', () => {
      console.log('断开连接:', socket.id);
      
      for (const [roomId, room] of rooms.entries()) {
        if (room.players[socket.id] || room.spectators[socket.id]) {
          const wasPlayer = !!room.players[socket.id];
          const playerNickname = room.players[socket.id]?.nickname || room.spectators[socket.id]?.nickname;
          
          leaveRoom(roomId, socket.id);
          
          const roomState = getPublicRoomState(room);
          io.to(roomId).emit('playerLeft', {
            socketId: socket.id,
            nickname: playerNickname,
            wasPlayer,
            roomState,
          });
          
          console.log(`玩家 ${playerNickname} (${socket.id}) 离开房间 ${roomId}`);
        }
      }
    });
    
    socket.on('createRoom', ({ nickname, mode }, callback) => {
      try {
        const room = createRoom(mode);
        console.log(`玩家 ${nickname} 创建房间 ${room.id}，模式: ${mode}`);
        
        socket.join(room.id);
        
        const joinResult = joinRoom(room.id, socket.id, nickname, 'player');
        if (!joinResult.success) {
          callback({ success: false, error: joinResult.error });
          return;
        }
        
        userSocketMap.set(nickname, {
          socketId: socket.id,
          roomId: room.id,
          role: 'player',
        });
        
        const roomState = getPublicRoomState(room);
        callback({ 
          success: true, 
          roomId: room.id, 
          roomState,
          player: joinResult.player,
        });
        
        console.log(`玩家 ${nickname} 已加入房间 ${room.id} 作为玩家`);
      } catch (error) {
        console.error('创建房间错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('joinRoom', ({ nickname, roomId, role = 'player' }, callback) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          callback({ success: false, error: '房间不存在' });
          return;
        }
        
        socket.join(roomId);
        
        const joinResult = joinRoom(roomId, socket.id, nickname, role);
        if (!joinResult.success) {
          callback({ success: false, error: joinResult.error });
          return;
        }
        
        userSocketMap.set(nickname, {
          socketId: socket.id,
          roomId: roomId,
          role: joinResult.role,
        });
        
        const roomState = getPublicRoomState(room);
        
        socket.to(roomId).emit('playerJoined', {
          player: joinResult.player,
          roomState,
        });
        
        const playerCount = Object.keys(room.players).length;
        const spectatorsCount = Object.keys(room.spectators).length;
        
        callback({ 
          success: true, 
          roomState,
          player: joinResult.player,
          actualRole: joinResult.role,
          playerCount,
          spectatorsCount,
        });
        
        console.log(`玩家 ${nickname} 加入房间 ${roomId}，角色: ${joinResult.role}`);
        console.log(`房间 ${roomId} - 玩家数: ${playerCount}, 观众数: ${spectatorsCount}`);
      } catch (error) {
        console.error('加入房间错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('playerReady', ({ roomId }, callback) => {
      try {
        const result = playerReady(roomId, socket.id);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        io.to(roomId).emit('playerReadyUpdate', {
          socketId: socket.id,
          isReady: true,
          roomState,
        });
        
        callback({ success: true, roomState });
        
        console.log(`玩家 ${socket.id} 在房间 ${roomId} 准备就绪`);
      } catch (error) {
        console.error('准备错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('startGame', ({ roomId }, callback) => {
      try {
        const result = startGame(roomId);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        io.to(roomId).emit('gameStarted', {
          roomState,
        });
        
        callback({ success: true, roomState });
        
        console.log(`房间 ${roomId} 游戏开始`);
      } catch (error) {
        console.error('开始游戏错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('clickCell', ({ roomId, row, col }, callback) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          callback({ success: false, error: '房间不存在' });
          return;
        }
        
        const player = room.players[socket.id] || room.spectators[socket.id];
        const playerNickname = player?.nickname || '未知玩家';
        
        console.log(`玩家 ${playerNickname} (${socket.id}) 在房间 ${roomId} 点击格子 (${row}, ${col})`);
        console.log(`当前回合玩家: ${room.currentPlayerId}, 点击玩家: ${socket.id}`);
        
        if (room.players[socket.id]) {
          console.log(`玩家角色: 玩家`);
        } else if (room.spectators[socket.id]) {
          console.log(`玩家角色: 观众`);
        } else {
          console.log(`玩家角色: 未找到`);
        }
        
        const result = clickCell(roomId, socket.id, row, col);
        console.log(`点击结果:`, result);
        
        if (!result.success) {
          console.error(`点击失败:`, result.error);
          callback({ success: false, error: result.error });
          return;
        }
        
        const roomState = getPublicRoomState(room);
        
        if (result.gameEnded) {
          io.to(roomId).emit('gameEnded', {
            winner: result.winner,
            winnerNickname: result.winnerNickname,
            reason: result.reason,
            roomState,
          });
          
          console.log(`房间 ${roomId} 游戏结束 - 获胜者: ${result.winnerNickname}, 原因: ${result.reason}`);
        } else {
          io.to(roomId).emit('cellRevealed', {
            revealed: result.revealed,
            nextPlayerId: result.nextPlayerId,
            roomState,
          });
          
          console.log(`房间 ${roomId} 格子 (${row}, ${col}) 已揭开，下一个玩家: ${result.nextPlayerId}`);
        }
        
        callback({ success: true, ...result, roomState });
      } catch (error) {
        console.error('点击格子错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('flagCell', ({ roomId, row, col }, callback) => {
      try {
        const result = flagCell(roomId, socket.id, row, col);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        io.to(roomId).emit('cellFlagged', {
          row,
          col,
          flagged: result.flagged,
          roomState,
        });
        
        callback({ success: true, ...result, roomState });
        
        console.log(`玩家 ${socket.id} 在房间 ${roomId} 标记格子 (${row}, ${col})，状态: ${result.flagged}`);
      } catch (error) {
        console.error('标记格子错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('changeMode', ({ roomId, newMode }, callback) => {
      try {
        const result = changeMode(roomId, newMode);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        io.to(roomId).emit('modeChanged', {
          newMode,
          roomState,
        });
        
        callback({ success: true, roomState });
        
        console.log(`房间 ${roomId} 模式切换为: ${newMode}`);
      } catch (error) {
        console.error('切换模式错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('initiateResetVote', ({ roomId }, callback) => {
      try {
        const result = initiateResetVote(roomId, socket.id);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        io.to(roomId).emit('resetVoteInitiated', {
          initiatedBy: socket.id,
          roomState,
        });
        
        callback({ success: true, roomState });
        
        console.log(`玩家 ${socket.id} 在房间 ${roomId} 发起重置投票`);
      } catch (error) {
        console.error('发起重置投票错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('voteReset', ({ roomId, agree }, callback) => {
      try {
        const result = voteReset(roomId, socket.id, agree);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        const room = getRoom(roomId);
        const roomState = getPublicRoomState(room);
        
        if (result.reset) {
          io.to(roomId).emit('gameReset', {
            reason: result.reason,
            roomState,
          });
          
          console.log(`房间 ${roomId} 重置投票通过，游戏已重置`);
        } else {
          io.to(roomId).emit('resetVoteUpdated', {
            agreedCount: result.agreedCount,
            totalPlayers: result.totalPlayers,
            roomState,
          });
          
          console.log(`房间 ${roomId} 重置投票 - 同意: ${result.agreedCount}/${result.totalPlayers}`);
        }
        
        callback({ success: true, ...result, roomState });
      } catch (error) {
        console.error('投票错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('reconnect', ({ oldSocketId, roomId, nickname }, callback) => {
      try {
        const result = reconnectUser(socket.id, oldSocketId, roomId);
        if (!result.success) {
          callback({ success: false, error: result.error });
          return;
        }
        
        socket.join(roomId);
        
        userSocketMap.set(nickname, {
          socketId: socket.id,
          roomId: roomId,
          role: result.isPlayer ? 'player' : 'spectator',
        });
        
        socket.to(roomId).emit('playerReconnected', {
          oldSocketId,
          newSocketId: socket.id,
          player: result.player,
          roomState: result.roomState,
        });
        
        callback({ 
          success: true, 
          player: result.player,
          roomState: result.roomState,
          isPlayer: result.isPlayer,
        });
        
        console.log(`玩家 ${nickname} 重连成功: ${oldSocketId} -> ${socket.id}`);
      } catch (error) {
        console.error('重连错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('getRoomState', ({ roomId }, callback) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          callback({ success: false, error: '房间不存在' });
          return;
        }
        
        const roomState = getPublicRoomState(room);
        callback({ success: true, roomState });
      } catch (error) {
        console.error('获取房间状态错误:', error);
        callback({ success: false, error: error.message });
      }
    });
    
    socket.on('sendChat', ({ roomId, message }, callback) => {
      try {
        const room = getRoom(roomId);
        if (!room) {
          callback({ success: false, error: '房间不存在' });
          return;
        }
        
        const player = room.players[socket.id] || room.spectators[socket.id];
        if (!player) {
          callback({ success: false, error: '你不在这个房间' });
          return;
        }
        
        io.to(roomId).emit('chatMessage', {
          sender: player.nickname,
          message,
          timestamp: Date.now(),
        });
        
        callback({ success: true });
      } catch (error) {
        console.error('发送消息错误:', error);
        callback({ success: false, error: error.message });
      }
    });
  });
  
  setInterval(() => {
    for (const [roomId, room] of rooms.entries()) {
      if (room.status === 'playing' && room.timeRemaining <= 0) {
        const result = handleTimeout(roomId);
        if (result) {
          const roomState = getPublicRoomState(room);
          io.to(roomId).emit('gameEnded', {
            winner: result.winner,
            winnerNickname: result.winnerNickname,
            loser: result.loser,
            reason: result.reason,
            roomState,
          });
          
          console.log(`房间 ${roomId} 超时结束 - 获胜者: ${result.winnerNickname}, 失败者: ${result.loser}`);
        }
      }
    }
  }, 1000);
}
