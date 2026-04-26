import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setNoteMode,
  setCellValue,
  clearCell,
  Difficulty,
  setDifficulty,
  Hint,
} from '@/features/sudoku/sudokuSlice'
import { pushAction } from '@/features/history/historySlice'
import { RootState } from '@/app/store'
import { Button } from '@/components/ui/button'
import { Pencil, Eraser, RotateCcw, RotateCw, Lightbulb, Trash2 } from 'lucide-react'

interface SudokuControlsProps {
  onNewGame: (difficulty: Difficulty) => void
  onHint: () => void
  onUndo: () => void
  onRedo: () => void
  onReset: () => void
  hint: Hint | null
  canUndo: boolean
  canRedo: boolean
}

export const SudokuControls: React.FC<SudokuControlsProps> = ({
  onNewGame,
  onHint,
  onUndo,
  onRedo,
  onReset,
  hint,
  canUndo,
  canRedo,
}) => {
  const dispatch = useDispatch()
  const { isNoteMode, selectedCell, difficulty } = useSelector(
    (state: RootState) => state.sudoku
  )
  const board = useSelector((state: RootState) => state.sudoku.board)

  const handleNumberClick = (num: number) => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    const cell = board[row][col]

    if (cell.isOriginal) return

    if (isNoteMode) {
      const previousNotes = [...cell.notes]
      const hasNote = cell.notes.includes(num)
      
      if (hasNote) {
        dispatch({
          type: 'sudoku/toggleNote',
          payload: { row, col, value: num },
        })
      } else {
        dispatch({
          type: 'sudoku/toggleNote',
          payload: { row, col, value: num },
        })
      }
      
      dispatch(pushAction({
        row, col,
        type: 'toggleNote',
        value: num,
        previousValue: cell.value,
        previousNotes,
        timestamp: Date.now(),
      }))
    } else {
      const previousValue = cell.value
      dispatch(setCellValue({ row, col, value: num }))
      dispatch(pushAction({
        row, col,
        type: 'setValue',
        value: num,
        previousValue,
        previousNotes: [...cell.notes],
        timestamp: Date.now(),
      }))
    }
  }

  const handleEraserClick = () => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    const cell = board[row][col]

    if (cell.isOriginal) return

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
  }

  const difficulties: { label: string; value: Difficulty }[] = [
    { label: '简单', value: 'easy' },
    { label: '中等', value: 'medium' },
    { label: '困难', value: 'hard' },
    { label: '专家', value: 'expert' },
  ]

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
          onClick={onUndo}
          disabled={!canUndo}
          title="撤销"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={onRedo}
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
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <Button
            key={num}
            variant="outline"
            className="h-10 text-lg font-bold"
            onClick={() => handleNumberClick(num)}
            disabled={!selectedCell}
          >
            {num}
          </Button>
        ))}
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
          <p className="text-sm text-yellow-700">{hint.reason}</p>
          <p className="text-sm text-yellow-600 mt-1">
            位置: 第{hint.row + 1}行 第{hint.col + 1}列
            → 填入 {hint.value}
          </p>
        </div>
      )}
    </div>
  )
}
