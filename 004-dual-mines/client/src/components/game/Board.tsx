import React, { useCallback, useState } from 'react';
import { Cell } from './Cell';
import { useGameKeyboard } from '@/hooks/useGameKeyboard';
import type { CellState } from '@/types';

interface BoardProps {
  board: CellState[][];
  isCurrentPlayer: boolean;
  currentPlayerId: string | null;
  mySocketId: string | null;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  disabled?: boolean;
}

export const Board: React.FC<BoardProps> = ({
  board,
  isCurrentPlayer,
  currentPlayerId,
  mySocketId,
  onCellClick,
  onCellRightClick,
  disabled = false,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleClick = useCallback((row: number, col: number) => {
    if (disabled) return;
    if (!isCurrentPlayer) return;
    onCellClick(row, col);
  }, [disabled, isCurrentPlayer, onCellClick]);

  const handleRightClick = useCallback((row: number, col: number) => {
    if (disabled) return;
    if (!isCurrentPlayer) return;
    onCellRightClick(row, col);
  }, [disabled, isCurrentPlayer, onCellRightClick]);

  useGameKeyboard({
    board,
    selectedCell,
    onCellClick: handleClick,
    onCellFlag: handleRightClick,
    onSelectCell: setSelectedCell,
    enabled: !disabled && isCurrentPlayer,
  });

  if (!board || board.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">棋盘加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="flex">
          {row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              row={rowIndex}
              col={colIndex}
              isSelected={selectedCell?.row === rowIndex && selectedCell?.col === colIndex}
              isCurrentPlayer={isCurrentPlayer}
              onClick={handleClick}
              onRightClick={handleRightClick}
              onSelect={setSelectedCell}
              disabled={disabled || !isCurrentPlayer}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
