import React from 'react';
import { Clock, Users, Crown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GameMode, GameStatus, Player } from '@/types';

interface GameHeaderProps {
  mode: GameMode;
  status: GameStatus;
  timeRemaining: number;
  timeLimit: number;
  currentPlayerId: string | null;
  players: Player[];
  spectators: Player[];
  mySocketId: string | null;
  onModeChange?: (mode: GameMode) => void;
  canChangeMode?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  mode,
  status,
  timeRemaining,
  timeLimit,
  currentPlayerId,
  players,
  spectators,
  mySocketId,
  onModeChange,
  canChangeMode = false,
}) => {
  const isTimeLow = timeRemaining <= 10;
  const isTimeCritical = timeRemaining <= 5;

  const getPlayerStatus = (player: Player) => {
    const isCurrentPlayer = currentPlayerId === player.id;
    const isMe = player.id === mySocketId;
    
    return (
      <div
        key={player.id}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg border',
          isCurrentPlayer && 'bg-primary/10 border-primary',
          isMe && !isCurrentPlayer && 'bg-secondary border-secondary',
          !isMe && !isCurrentPlayer && 'bg-card border-border',
          player.isReady && 'ring-2 ring-green-500'
        )}
      >
        {isCurrentPlayer && (
          <Crown className="w-4 h-4 text-yellow-500" />
        )}
        <span className="font-medium truncate max-w-24">
          {player.nickname}
          {isMe && ' (你)'}
        </span>
        <span className="text-xs text-muted-foreground">
          {player.wins}胜
        </span>
        {player.isReady && (
          <span className="text-xs text-green-500 font-medium">已准备</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => onModeChange?.('coop')}
              disabled={!canChangeMode}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                mode === 'coop'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent',
                !canChangeMode && 'opacity-50 cursor-not-allowed'
              )}
            >
              协作模式
            </button>
            <button
              onClick={() => onModeChange?.('battle')}
              disabled={!canChangeMode}
              className={cn(
                'px-4 py-2 rounded-lg font-medium transition-all',
                mode === 'battle'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent',
                !canChangeMode && 'opacity-50 cursor-not-allowed'
              )}
            >
              对战模式
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className={cn(
            'w-5 h-5',
            isTimeCritical && 'text-red-500 animate-pulse',
            isTimeLow && !isTimeCritical && 'text-yellow-500',
            !isTimeLow && 'text-muted-foreground',
          )} />
          <span className={cn(
            'text-2xl font-mono font-bold',
            isTimeCritical && 'text-red-500 animate-pulse',
            isTimeLow && !isTimeCritical && 'text-yellow-500',
          )}>
            {timeRemaining}
          </span>
          <span className="text-sm text-muted-foreground">秒</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">玩家 ({players.length}/2):</span>
          <div className="flex gap-2 flex-wrap">
            {players.length > 0 ? (
              players.map(getPlayerStatus)
            ) : (
              <span className="text-sm text-muted-foreground">等待玩家加入...</span>
            )}
          </div>
        </div>

        {spectators.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <X className="w-4 h-4 text-muted-foreground rotate-45" />
            <span className="text-sm font-medium">观众 ({spectators.length}/5):</span>
            <div className="flex gap-2 flex-wrap">
              {spectators.map(spec => (
                <span
                  key={spec.id}
                  className="text-sm text-muted-foreground px-2 py-1 bg-secondary rounded"
                >
                  {spec.nickname}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">状态:</span>
        <span className={cn(
          'font-medium',
          status === 'waiting' && 'text-yellow-500',
          status === 'playing' && 'text-green-500',
          status === 'ended' && 'text-red-500',
        )}>
          {status === 'waiting' && '等待开始'}
          {status === 'playing' && '游戏中'}
          {status === 'ended' && '游戏结束'}
        </span>
      </div>
    </div>
  );
};
