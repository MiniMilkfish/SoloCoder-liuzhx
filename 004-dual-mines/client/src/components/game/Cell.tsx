import React from 'react';
import { cn, getNumberColor } from '@/lib/utils';
import { useLongPress } from '@/hooks/useLongPress';
import type { CellState } from '@/types';

interface CellProps {
  cell: CellState;
  row: number;
  col: number;
  isSelected: boolean;
  isCurrentPlayer: boolean;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
  onSelect: (row: number, col: number) => void;
  disabled?: boolean;
}

export const Cell: React.FC<CellProps> = ({
  cell,
  row,
  col,
  isSelected,
  isCurrentPlayer,
  onClick,
  onRightClick,
  onSelect,
  disabled = false,
}) => {
  const { handlers } = useLongPress({
    delay: 500,
    onLongPress: () => {
      if (!disabled && !cell.revealed) {
        onRightClick(row, col);
      }
    },
    onShortPress: () => {
      if (!disabled && !cell.flagged) {
        onClick(row, col);
      }
    },
  });

  const handleClick = () => {
    if (disabled) return;
    onSelect(row, col);
    if (!cell.flagged) {
      onClick(row, col);
    }
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || cell.revealed) return;
    onSelect(row, col);
    onRightClick(row, col);
  };

  const getCellContent = () => {
    if (cell.flagged) {
      return (
        <span className="text-red-500 dark:text-red-400 font-bold flex items-center justify-center">
          🚩
        </span>
      );
    }
    
    if (!cell.revealed) {
      return null;
    }
    
    if (cell.isMine) {
      return (
        <span className="flex items-center justify-center">
          💣
        </span>
      );
    }
    
    if (cell.adjacentMines > 0) {
      return (
        <span className={cn(
          'font-bold flex items-center justify-center',
          getNumberColor(cell.adjacentMines)
        )}>
          {cell.adjacentMines}
        </span>
      );
    }
    
    return null;
  };

  const cellClasses = cn(
    'w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 border flex items-center justify-center text-sm md:text-base transition-all select-none',
    !cell.revealed && !cell.flagged && [
      'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-pointer',
      'border-gray-300 dark:border-gray-600',
    ],
    cell.revealed && [
      'bg-gray-100 dark:bg-gray-800',
      cell.isMine && 'bg-red-200 dark:bg-red-900',
    ],
    isSelected && [
      'ring-2 ring-blue-500 dark:ring-blue-400',
      'ring-offset-1 dark:ring-offset-gray-900',
    ],
    !isCurrentPlayer && !disabled && [
      'opacity-70',
    ],
    disabled && [
      'cursor-not-allowed',
    ]
  );

  return (
    <button
      type="button"
      className={cellClasses}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      onMouseDown={handlers.onMouseDown}
      onMouseUp={handlers.onMouseUp}
      onMouseLeave={handlers.onMouseLeave}
      onTouchStart={handlers.onTouchStart}
      onTouchEnd={handlers.onTouchEnd}
      disabled={disabled}
      aria-label={`格子 (${row}, ${col})${cell.revealed ? cell.isMine ? ' 地雷' : ` 数字 ${cell.adjacentMines}` : cell.flagged ? ' 已标记' : ''}`}
    >
      {getCellContent()}
    </button>
  );
};
