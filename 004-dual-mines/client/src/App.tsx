import React, { useState, useEffect } from 'react';
import { LobbyPage } from '@/pages/LobbyPage';
import { GamePage } from '@/pages/GamePage';
import socketService from '@/services/socket';
import type { GameRoom, Player } from '@/types';

interface SavedSession {
  roomId: string;
  nickname: string;
  player: Player;
  oldSocketId: string;
}

function App() {
  const [currentPage, setCurrentPage] = useState<'lobby' | 'game'>('lobby');
  const [gameState, setGameState] = useState<{
    roomId: string;
    nickname: string;
    player: Player;
    roomState: GameRoom;
  } | null>(null);

  useEffect(() => {
    const savedSession = localStorage.getItem('minesweeper_session');
    if (savedSession) {
      try {
        const session: SavedSession = JSON.parse(savedSession);
        if (session.roomId && session.nickname && session.oldSocketId) {
          attemptReconnect(session);
        }
      } catch (e) {
        console.error('Failed to parse saved session:', e);
        localStorage.removeItem('minesweeper_session');
      }
    }
  }, []);

  const attemptReconnect = async (session: SavedSession) => {
    try {
      await socketService.connect();
      
      const response = await socketService.reconnect(
        session.oldSocketId,
        session.roomId,
        session.nickname
      );

      if (response.success && response.player && response.roomState) {
        setGameState({
          roomId: session.roomId,
          nickname: session.nickname,
          player: response.player,
          roomState: response.roomState,
        });
        setCurrentPage('game');
        
        const newSocketId = socketService.getSocketId();
        if (newSocketId) {
          localStorage.setItem('minesweeper_session', JSON.stringify({
            roomId: session.roomId,
            nickname: session.nickname,
            player: response.player,
            oldSocketId: newSocketId,
          }));
        }
      } else {
        localStorage.removeItem('minesweeper_session');
      }
    } catch (e) {
      console.error('Reconnection failed:', e);
      localStorage.removeItem('minesweeper_session');
    }
  };

  const handleJoinRoom = (roomId: string, nickname: string, player: Player, roomState: GameRoom) => {
    setGameState({ roomId, nickname, player, roomState });
    setCurrentPage('game');
    
    const socketId = socketService.getSocketId();
    if (socketId) {
      localStorage.setItem('minesweeper_session', JSON.stringify({
        roomId,
        nickname,
        player,
        oldSocketId: socketId,
      }));
    }
  };

  const handleLeaveRoom = () => {
    localStorage.removeItem('minesweeper_session');
    setGameState(null);
    setCurrentPage('lobby');
  };

  return (
    <div className="min-h-screen bg-background">
      {currentPage === 'lobby' && (
        <LobbyPage onJoinRoom={handleJoinRoom} />
      )}
      {currentPage === 'game' && gameState && (
        <GamePage
          roomId={gameState.roomId}
          nickname={gameState.nickname}
          initialPlayer={gameState.player}
          initialRoomState={gameState.roomState}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
