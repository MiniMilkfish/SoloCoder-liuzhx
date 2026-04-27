import React, { useState, useEffect, useCallback } from 'react';
import { Moon, Sun, Copy, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Board } from '@/components/game/Board';
import { GameHeader } from '@/components/game/GameHeader';
import { GameControls } from '@/components/game/GameControls';
import { useTheme } from '@/hooks/useTheme';
import socketService from '@/services/socket';
import type { GameMode, GameRoom, Player, GameStatus, PlayerRole } from '@/types';
import { GAME_CONFIG } from '@/lib/utils';

interface GamePageProps {
  roomId: string;
  nickname: string;
  initialPlayer: Player;
  initialRoomState: GameRoom;
  onLeave: () => void;
}

interface GameResult {
  winner: string | null;
  winnerNickname: string | null;
  reason: string;
  show: boolean;
}

export const GamePage: React.FC<GamePageProps> = ({
  roomId,
  nickname,
  initialPlayer,
  initialRoomState,
  onLeave,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [player, setPlayer] = useState<Player>(initialPlayer);
  const [roomState, setRoomState] = useState<GameRoom>(initialRoomState);
  const [gameResult, setGameResult] = useState<GameResult>({ winner: null, winnerNickname: null, reason: '', show: false });
  const [notification, setNotification] = useState<string | null>(null);

  const mySocketId = socketService.getSocketId();
  const isCurrentPlayer = roomState.currentPlayerId === mySocketId;
  const isSpectator = player.role === 'spectator';
  const canChangeMode = roomState.status === 'waiting' && !isSpectator;
  const canStart = Object.values(roomState.players).every(p => p.isReady) && Object.keys(roomState.players).length >= 2;
  const hasResetVote = !!roomState.resetVote.initiatedBy;

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const copyRoomId = useCallback(() => {
    navigator.clipboard.writeText(roomId).then(() => {
      showNotification('房间号已复制到剪贴板');
    }).catch(() => {
      showNotification('复制失败，请手动复制');
    });
  }, [roomId, showNotification]);

  const handleModeChange = useCallback(async (newMode: GameMode) => {
    if (!canChangeMode) return;
    
    const response = await socketService.changeMode(roomId, newMode);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      showNotification(`已切换为${newMode === 'coop' ? '协作' : '对战'}模式`);
    } else {
      showNotification(response.error || '切换模式失败');
    }
  }, [roomId, canChangeMode, showNotification]);

  const handleReady = useCallback(async () => {
    if (isSpectator) return;
    
    const response = await socketService.playerReady(roomId);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      const myPlayer = response.roomState.players[mySocketId!];
      if (myPlayer) {
        setPlayer(myPlayer);
      }
    }
  }, [roomId, isSpectator, mySocketId]);

  const handlePlayAgain = useCallback(async () => {
    if (isSpectator) return;
    
    setGameResult(prev => ({ ...prev, show: false }));
    
    const response = await socketService.playerReady(roomId);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      const myPlayer = response.roomState.players[mySocketId!];
      if (myPlayer) {
        setPlayer(myPlayer);
      }
      
      const allReady = Object.values(response.roomState.players).every(p => p.isReady);
      const playerCount = Object.keys(response.roomState.players).length;
      
      if (allReady && playerCount >= 2) {
        showNotification('所有玩家已准备，开始新游戏...');
        const startResponse = await socketService.startGame(roomId);
        if (startResponse.success && startResponse.roomState) {
          setRoomState(startResponse.roomState);
          showNotification('游戏开始！');
        } else {
          showNotification(startResponse.error || '开始游戏失败');
        }
      } else {
        showNotification('已准备，等待对方准备...');
      }
    }
  }, [roomId, isSpectator, mySocketId, showNotification]);

  const handleStart = useCallback(async () => {
    if (isSpectator || !canStart) return;
    
    const response = await socketService.startGame(roomId);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      showNotification('游戏开始！');
    } else {
      showNotification(response.error || '开始游戏失败');
    }
  }, [roomId, isSpectator, canStart, showNotification]);

  const handleCellClick = useCallback(async (row: number, col: number) => {
    if (isSpectator || !isCurrentPlayer) return;
    
    const response = await socketService.clickCell(roomId, row, col);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      
      if (response.gameEnded) {
        setGameResult({
          winner: response.winner || null,
          winnerNickname: response.winnerNickname || null,
          reason: response.reason || '',
          show: true,
        });
      }
    }
  }, [roomId, isSpectator, isCurrentPlayer]);

  const handleCellRightClick = useCallback(async (row: number, col: number) => {
    if (isSpectator || !isCurrentPlayer) return;
    
    await socketService.flagCell(roomId, row, col);
  }, [roomId, isSpectator, isCurrentPlayer]);

  const handleInitResetVote = useCallback(async () => {
    if (isSpectator) return;
    
    const response = await socketService.initiateResetVote(roomId);
    if (response.success) {
      showNotification('已发起重置投票，等待对方同意');
    } else {
      showNotification(response.error || '发起投票失败');
    }
  }, [roomId, isSpectator, showNotification]);

  const handleVoteReset = useCallback(async (agree: boolean) => {
    if (isSpectator) return;
    
    const response = await socketService.voteReset(roomId, agree);
    if (response.success && response.roomState) {
      setRoomState(response.roomState);
      
      if (response.reset) {
        showNotification('重置投票通过，棋盘已重置');
        setGameResult({ winner: null, reason: '', show: false });
      } else {
        showNotification(`投票中... ${response.agreedCount}/${response.totalPlayers}`);
      }
    } else {
      showNotification(response.error || '投票失败');
    }
  }, [roomId, isSpectator, showNotification]);

  useEffect(() => {
    const socketId = socketService.getSocketId();
    if (!socketId) return;

    const cleanupHandlers: (() => void)[] = [];

    const unbindPlayerJoined = socketService.on('playerJoined', (data: { player: Player; roomState: GameRoom }) => {
      console.log('玩家加入:', data.player.nickname);
      setRoomState(data.roomState);
      showNotification(`玩家 ${data.player.nickname} 加入了房间`);
    });
    cleanupHandlers.push(unbindPlayerJoined);

    const unbindPlayerLeft = socketService.on('playerLeft', (data: { socketId: string; nickname: string; wasPlayer: boolean; roomState: GameRoom }) => {
      console.log('玩家离开:', data.nickname);
      setRoomState(data.roomState);
      showNotification(`玩家 ${data.nickname} 离开了房间`);
    });
    cleanupHandlers.push(unbindPlayerLeft);

    const unbindPlayerReadyUpdate = socketService.on('playerReadyUpdate', (data: { socketId: string; isReady: boolean; roomState: GameRoom }) => {
      console.log('玩家准备更新:', data.socketId, data.isReady);
      setRoomState(data.roomState);
      if (data.socketId === socketId) {
        const myPlayer = data.roomState.players[socketId];
        if (myPlayer) {
          setPlayer(myPlayer);
        }
      }
    });
    cleanupHandlers.push(unbindPlayerReadyUpdate);

    const unbindGameStarted = socketService.on('gameStarted', (data: { roomState: GameRoom }) => {
      console.log('游戏开始');
      setRoomState(data.roomState);
      showNotification('游戏开始！');
    });
    cleanupHandlers.push(unbindGameStarted);

    const unbindTimeUpdated = socketService.on('timeUpdated', (data: { timeRemaining: number; currentPlayerId: string }) => {
      setRoomState(prev => ({
        ...prev,
        timeRemaining: data.timeRemaining,
        currentPlayerId: data.currentPlayerId,
      }));
    });
    cleanupHandlers.push(unbindTimeUpdated);

    const unbindCellRevealed = socketService.on('cellRevealed', (data: { revealed: unknown[]; nextPlayerId: string; roomState: GameRoom }) => {
      console.log('格子揭开:', data.revealed);
      setRoomState(data.roomState);
    });
    cleanupHandlers.push(unbindCellRevealed);

    const unbindCellFlagged = socketService.on('cellFlagged', (data: { row: number; col: number; flagged: boolean; roomState: GameRoom }) => {
      console.log('格子标记:', data.row, data.col, data.flagged);
      setRoomState(data.roomState);
    });
    cleanupHandlers.push(unbindCellFlagged);

    const unbindGameEnded = socketService.on('gameEnded', (data: { winner: string; winnerNickname?: string; reason: string; roomState: GameRoom }) => {
      console.log('游戏结束:', data.winner, data.winnerNickname, data.reason);
      setRoomState(data.roomState);
      setGameResult({
        winner: data.winner,
        winnerNickname: data.winnerNickname || null,
        reason: data.reason,
        show: true,
      });
    });
    cleanupHandlers.push(unbindGameEnded);

    const unbindModeChanged = socketService.on('modeChanged', (data: { newMode: GameMode; roomState: GameRoom }) => {
      console.log('模式改变:', data.newMode);
      setRoomState(data.roomState);
    });
    cleanupHandlers.push(unbindModeChanged);

    const unbindResetVoteInitiated = socketService.on('resetVoteInitiated', (data: { initiatedBy: string; roomState: GameRoom }) => {
      console.log('重置投票发起:', data.initiatedBy);
      setRoomState(data.roomState);
      if (data.initiatedBy !== socketId) {
        showNotification('对方发起了重置投票');
      }
    });
    cleanupHandlers.push(unbindResetVoteInitiated);

    const unbindResetVoteUpdated = socketService.on('resetVoteUpdated', (data: { agreedCount: number; totalPlayers: number; roomState: GameRoom }) => {
      console.log('重置投票更新:', data.agreedCount, data.totalPlayers);
      setRoomState(data.roomState);
    });
    cleanupHandlers.push(unbindResetVoteUpdated);

    const unbindGameReset = socketService.on('gameReset', (data: { reason: string; roomState: GameRoom }) => {
      console.log('游戏重置:', data.reason);
      setRoomState(data.roomState);
      setGameResult({ winner: null, reason: '', show: false });
      showNotification('游戏已重置');
    });
    cleanupHandlers.push(unbindGameReset);

    const unbindPlayerReconnected = socketService.on('playerReconnected', (data: { oldSocketId: string; newSocketId: string; player: Player; roomState: GameRoom }) => {
      console.log('玩家重连:', data.oldSocketId, '->', data.newSocketId);
      setRoomState(data.roomState);
    });
    cleanupHandlers.push(unbindPlayerReconnected);

    return () => {
      cleanupHandlers.forEach(cleanup => cleanup());
    };
  }, [showNotification]);

  const getWinnerNickname = () => {
    if (gameResult.winnerNickname) {
      return gameResult.winnerNickname;
    }
    if (!gameResult.winner) return null;
    const winner = roomState.players[gameResult.winner];
    return winner?.nickname || '未知玩家';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onLeave}
              aria-label="离开房间"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">双人扫雷</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1 bg-secondary rounded-lg">
              <span className="text-sm text-muted-foreground">房间号:</span>
              <span className="font-mono font-medium">{roomId}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyRoomId}
                aria-label="复制房间号"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label="切换主题"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardContent className="pt-6">
              <GameHeader
                mode={roomState.mode}
                status={roomState.status}
                timeRemaining={roomState.timeRemaining}
                timeLimit={roomState.timeLimit}
                currentPlayerId={roomState.currentPlayerId}
                players={Object.values(roomState.players)}
                spectators={Object.values(roomState.spectators)}
                mySocketId={mySocketId || null}
                onModeChange={handleModeChange}
                canChangeMode={canChangeMode}
              />
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Card>
              <CardContent className="p-4">
                <Board
                  board={roomState.board}
                  isCurrentPlayer={isCurrentPlayer && !isSpectator}
                  currentPlayerId={roomState.currentPlayerId}
                  mySocketId={mySocketId || null}
                  onCellClick={handleCellClick}
                  onCellRightClick={handleCellRightClick}
                  disabled={roomState.status !== 'playing' || isSpectator}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="pt-6">
              <GameControls
                status={roomState.status}
                role={player.role}
                isReady={player.isReady}
                hasResetVote={hasResetVote}
                onReady={handleReady}
                onStart={handleStart}
                onInitResetVote={handleInitResetVote}
                onVoteReset={handleVoteReset}
                onPlayAgain={handlePlayAgain}
                canStart={canStart}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  <span>地雷数量: </span>
                  <span className="font-bold">{roomState.mineCount}</span>
                </div>
                <div>
                  <span>棋盘大小: </span>
                  <span className="font-bold">{roomState.rows} × {roomState.cols}</span>
                </div>
                <div>
                  <span>每步限时: </span>
                  <span className="font-bold">{roomState.timeLimit}秒</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {notification && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
            {notification}
          </div>
        </div>
      )}

      <Dialog open={gameResult.show} onOpenChange={(open) => setGameResult(prev => ({ ...prev, show: open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">
              {isSpectator ? (
                <span className="text-primary">🎮 游戏结束</span>
              ) : gameResult.winner === mySocketId ? (
                <span className="text-green-500">🎉 你赢了！</span>
              ) : gameResult.winner ? (
                <span className="text-red-500">💥 你输了</span>
              ) : (
                <span>游戏结束</span>
              )}
            </DialogTitle>
            <DialogDescription className="text-center">
              {gameResult.winner && (
                <p className="text-lg">
                  获胜者: <span className="font-bold">{getWinnerNickname()}</span>
                </p>
              )}
              <p className="text-muted-foreground">{gameResult.reason}</p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-center">
            {roomState.status === 'ended' && !isSpectator && (
              <Button onClick={handlePlayAgain}>
                再来一局
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
