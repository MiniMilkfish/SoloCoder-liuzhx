import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setNoteMode,
  setCellValueWithHistory,
  toggleNoteWithHistory,
  clearCellWithHistory,
  undo,
  redo,
  Difficulty,
  setDifficulty,
  Hint,
} from '@/features/sudoku/sudokuSlice'
import { RootState } from '@/app/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Pencil, Eraser, RotateCcw, RotateCw, Lightbulb, Trash2 } from 'lucide-react'

interface SudokuControlsProps {
  onNewGame: (difficulty: Difficulty) => void
  onHint: () => void
  onReset: () => void
  hint: Hint | null
}

export const SudokuControls: React.FC<SudokuControlsProps> = ({
  onNewGame,
  onHint,
  onReset,
  hint,
}) => {
  const dispatch = useDispatch()
  const { isNoteMode, selectedCell, difficulty, undoStack, redoStack } = useSelector(
    (state: RootState) => state.sudoku
  )
  const board = useSelector((state: RootState) => state.sudoku.board)

  const getNumberCount = (num: number): number => {
    let count = 0
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c].value === num) {
          count++
        }
      }
    }
    return count
  }

  const isNumberComplete = (num: number): boolean => {
    return getNumberCount(num) >= 9
  }

  const handleNumberClick = (num: number) => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    const cell = board[row][col]

    if (cell.isOriginal) return

    if (isNoteMode) {
      dispatch(toggleNoteWithHistory({ row, col, value: num }))
    } else {
      dispatch(setCellValueWithHistory({ row, col, value: num }))
    }
  }

  const handleEraserClick = () => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    dispatch(clearCellWithHistory({ row, col }))
  }

  const handleUndo = () => {
    dispatch(undo())
  }

  const handleRedo = () => {
    dispatch(redo())
  }

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: '简单', value: 'easy' },
    { label: '中等', value: 'medium' },
    { label: '困难', value: 'hard' },
    { label: '专家', value: 'expert' },
  ]

  const canUndo = undoStack.length > 0
  const canRedo = redoStack.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {difficulties.map((d) => (
          <Button
            key={d.value}
            variant={difficulty === d.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => onNewGame(d.value)}
          >
            {d.label}
          </Button>
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          variant={isNoteMode ? 'default' : 'outline'}
          size="icon"
          onClick={() => dispatch(setNoteMode(!isNoteMode))}
          title="笔记模式"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleEraserClick}
          disabled={!selectedCell}
          title="清除"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleUndo}
          disabled={!canUndo}
          title="撤销"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleRedo}
          disabled={!canRedo}
          title="重做"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          title="重置"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
          const isComplete = isNumberComplete(num)
          const count = getNumberCount(num)
          return (
            <Button
              key={num}
              variant="outline"
              className={cn(
                'h-10 text-lg font-bold relative',
                isComplete && 'opacity-50 bg-gray-100 text-gray-400',
              )}
              onClick={() => handleNumberClick(num)}
              disabled={!selectedCell || isComplete}
              title={isComplete ? `数字 ${num} 已全部填完（共9个）` : `数字 ${num} 已填 ${count}/9 个`}
            >
              {num}
              {!isComplete && count > 0 && (
                <span className="absolute bottom-0.5 right-1 text-xs text-gray-400">
                  {count}/9
                </span>
              )}
              {isComplete && (
                <span className="absolute bottom-0.5 right-1 text-xs text-green-500">
                  ✓
                </span>
              )}
            </Button>
          )
        })}
        <Button
          variant="outline"
          className="h-10 text-lg font-bold"
          onClick={handleEraserClick}
          disabled={!selectedCell}
        >
          ✕
        </Button>
      </div>

      <Button
        variant="secondary"
        onClick={onHint}
        className="w-full"
      >
        <Lightbulb className="h-4 w-4 mr-2" />
        下一步提示
      </Button>

      {hint && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <h4 className="font-semibold text-yellow-800 mb-1">
            {hint.technique}
          </h4>
          <p className="text-sm text-yellow-700 whitespace-pre-line">{hint.reason}</p>
          <p className="text-sm text-yellow-600 mt-1">
            位置: 第{hint.row + 1}行 第{hint.col + 1}列
            → 填入 {hint.value}
          </p>
        </div>
      )}
    </div>
  )
}
