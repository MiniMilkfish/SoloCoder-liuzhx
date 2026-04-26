import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setSelectedCell,
  setCellValue,
  toggleNote,
  clearCell,
  BoardState,
} from '@/features/sudoku/sudokuSlice'
import { pushAction } from '@/features/history/historySlice'
import { RootState } from '@/app/store'
import { cn } from '@/lib/utils'

interface SudokuBoardProps {
  board: BoardState
  disabled?: boolean
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({ board, disabled = false }) => {
  const dispatch = useDispatch()
  const { selectedCell, isNoteMode } = useSelector((state: RootState) => state.sudoku)
  const boardRef = useRef<HTMLDivElement>(null)

  const getRelatedCells = useCallback((row: number, col: number) => {
    const related: { row: number; col: number }[] = []
    const boxRow = Math.floor(row / 3) * 3
    const boxCol = Math.floor(col / 3) * 3

    for (let i = 0; i < 9; i++) {
      if (i !== col) related.push({ row, col: i })
      if (i !== row) related.push({ row: i, col })
    }

    for (let i = boxRow; i < boxRow + 3; i++) {
      for (let j = boxCol; j < boxCol + 3; j++) {
        if (i !== row || j !== col) {
          if (!related.some(r => r.row === i && r.col === j)) {
            related.push({ row: i, col: j })
          }
        }
      }
    }

    return related
  }, [])

  const isRelatedCell = useCallback((row: number, col: number) => {
    if (!selectedCell) return false
    const related = getRelatedCells(selectedCell.row, selectedCell.col)
    return related.some(r => r.row === row && r.col === col)
  }, [selectedCell, getRelatedCells])

  const isSameValue = useCallback((row: number, col: number) => {
    if (!selectedCell) return false
    const selectedValue = board[selectedCell.row][selectedCell.col].value
    const currentValue = board[row][col].value
    return selectedValue !== null && currentValue === selectedValue
  }, [selectedCell, board])

  const handleCellClick = useCallback((row: number, col: number) => {
    if (disabled) return
    dispatch(setSelectedCell({ row, col }))
  }, [dispatch, disabled])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled || !selectedCell) return

    const { row, col } = selectedCell
    const cell = board[row][col]

    if (e.key >= '1' && e.key <= '9') {
      const value = parseInt(e.key)
      
      if (isNoteMode) {
        const previousNotes = [...cell.notes]
        dispatch(toggleNote({ row, col, value }))
        dispatch(pushAction({
          row, col,
          type: 'toggleNote',
          value,
          previousValue: cell.value,
          previousNotes,
          timestamp: Date.now(),
        }))
      } else {
        const previousValue = cell.value
        dispatch(setCellValue({ row, col, value }))
        dispatch(pushAction({
          row, col,
          type: 'setValue',
          value,
          previousValue,
          previousNotes: [...cell.notes],
          timestamp: Date.now(),
        }))
      }
      e.preventDefault()
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      const previousValue = cell.value
      const previousNotes = [...cell.notes]
      dispatch(clearCell({ row, col }))
      dispatch(pushAction({
        row, col,
        type: 'clearCell',
        previousValue,
        previousNotes,
        timestamp: Date.now(),
      }))
      e.preventDefault()
    } else if (e.key === 'ArrowUp' && row > 0) {
      dispatch(setSelectedCell({ row: row - 1, col }))
      e.preventDefault()
    } else if (e.key === 'ArrowDown' && row < 8) {
      dispatch(setSelectedCell({ row: row + 1, col }))
      e.preventDefault()
    } else if (e.key === 'ArrowLeft' && col > 0) {
      dispatch(setSelectedCell({ row, col: col - 1 }))
      e.preventDefault()
    } else if (e.key === 'ArrowRight' && col < 8) {
      dispatch(setSelectedCell({ row, col: col + 1 }))
      e.preventDefault()
    }
  }, [selectedCell, board, isNoteMode, dispatch, disabled])

  useEffect(() => {
    if (selectedCell && boardRef.current) {
      boardRef.current.focus()
    }
  }, [selectedCell])

  const getCellClasses = (row: number, col: number) => {
    const cell = board[row][col]
    const isSelected = selectedCell?.row === row && selectedCell?.col === col
    const isRelated = isRelatedCell(row, col)
    const hasSameValue = isSameValue(row, col)

    let borderRight = 'border-r border-gray-300'
    let borderBottom = 'border-b border-gray-300'

    if ((col + 1) % 3 === 0 && col !== 8) {
      borderRight = 'border-r-2 border-r-gray-800'
    }
    if ((row + 1) % 3 === 0 && row !== 8) {
      borderBottom = 'border-b-2 border-b-gray-800'
    }

    return cn(
      'w-12 h-12 flex items-center justify-center cursor-pointer select-none transition-all duration-150 relative',
      'border-l border-t border-gray-300',
      borderRight,
      borderBottom,
      isSelected && 'bg-blue-200 ring-2 ring-blue-500',
      !isSelected && isRelated && 'bg-blue-50',
      !isSelected && hasSameValue && 'bg-yellow-100',
      cell.isHighlighted && 'bg-green-200 ring-2 ring-green-500',
      cell.isError && 'text-red-600',
      disabled && 'cursor-not-allowed opacity-70',
      'hover:bg-blue-50'
    )
  }

  const renderCell = (row: number, col: number) => {
    const cell = board[row][col]
    
    return (
      <div
        key={`${row}-${col}`}
        className={getCellClasses(row, col)}
        onClick={() => handleCellClick(row, col)}
      >
        {cell.value ? (
          <span
            className={cn(
              'text-2xl font-bold',
              cell.isOriginal ? 'text-gray-800' : 'text-blue-600',
              cell.isError && 'text-red-600'
            )}
          >
            {cell.value}
          </span>
        ) : cell.notes.length > 0 ? (
          <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <span
                key={num}
                className={cn(
                  'text-xs flex items-center justify-center',
                  cell.notes.includes(num) ? 'text-gray-600' : 'text-transparent'
                )}
              >
                {num}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <div
      ref={boardRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="outline-none"
    >
      <div className="inline-block border-2 border-gray-800 rounded-md overflow-hidden shadow-lg">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="flex">
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </div>
        ))}
      </div>
    </div>
  )
}
