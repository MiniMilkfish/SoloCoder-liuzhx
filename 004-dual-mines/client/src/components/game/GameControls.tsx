import React from 'react';
import { RefreshCw, RotateCcw, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { GameStatus, PlayerRole } from '@/types';

interface GameControlsProps {
  status: GameStatus;
  role: PlayerRole;
  isReady: boolean;
  hasResetVote: boolean;
  onReady: () => void;
  onStart: () => void;
  onInitResetVote: () => void;
  onVoteReset: (agree: boolean) => void;
  onPlayAgain?: () => void;
  canStart: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  status,
  role,
  isReady,
  hasResetVote,
  onReady,
  onStart,
  onInitResetVote,
  onVoteReset,
  onPlayAgain,
  canStart,
}) => {
  if (role === 'spectator') {
    return (
      <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
        <Flag className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">你正在以观众身份观看</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      {status === 'waiting' && (
        <>
          <Button
            onClick={onReady}
            variant={isReady ? 'secondary' : 'default'}
          >
            {isReady ? '取消准备' : '准备开始'}
          </Button>
          <Button
            onClick={onStart}
            disabled={!canStart}
          >
            开始游戏
          </Button>
        </>
      )}

      {status === 'playing' && (
        <>
          {!hasResetVote ? (
            <Button
              onClick={onInitResetVote}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              发起重置投票
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={() => onVoteReset(true)}
                variant="default"
              >
                同意重置
              </Button>
              <Button
                onClick={() => onVoteReset(false)}
                variant="destructive"
              >
                拒绝
              </Button>
            </div>
          )}
        </>
      )}

      {status === 'ended' && (
        <Button
          onClick={onPlayAgain || onReady}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          再来一局
        </Button>
      )}
    </div>
  );
};
