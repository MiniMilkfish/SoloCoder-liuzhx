import { useCallback, useEffect } from 'react';
import type { CellState } from '@/types';

export interface UseGameKeyboardOptions {
  board: CellState[][];
  selectedCell: { row: number; col: number } | null;
  onCellClick: (row: number, col: number) => void;
  onCellFlag: (row: number, col: number) => void;
  onSelectCell: (row: number, col: number) => void;
  enabled?: boolean;
}

export function useGameKeyboard({
  board,
  selectedCell,
  onCellClick,
  onCellFlag,
  onSelectCell,
  enabled = true,
}: UseGameKeyboardOptions) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;
    
    const rows = board.length;
    const cols = board[0]?.length || 0;
    
    let currentRow = selectedCell?.row ?? 0;
    let currentCol = selectedCell?.col ?? 0;
    
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        currentRow = Math.max(0, currentRow - 1);
        onSelectCell(currentRow, currentCol);
        break;
        
      case 'ArrowDown':
        e.preventDefault();
        currentRow = Math.min(rows - 1, currentRow + 1);
        onSelectCell(currentRow, currentCol);
        break;
        
      case 'ArrowLeft':
        e.preventDefault();
        currentCol = Math.max(0, currentCol - 1);
        onSelectCell(currentRow, currentCol);
        break;
        
      case 'ArrowRight':
        e.preventDefault();
        currentCol = Math.min(cols - 1, currentCol + 1);
        onSelectCell(currentRow, currentCol);
        break;
        
      case ' ':
        e.preventDefault();
        if (selectedCell) {
          onCellClick(selectedCell.row, selectedCell.col);
        }
        break;
        
      case 'f':
      case 'F':
        e.preventDefault();
        if (selectedCell) {
          onCellFlag(selectedCell.row, selectedCell.col);
        }
        break;
    }
  }, [board, selectedCell, onCellClick, onCellFlag, onSelectCell, enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
