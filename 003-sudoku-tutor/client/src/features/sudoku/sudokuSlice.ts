import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type CellValue = number | null
export type Notes = number[]
export type CellState = {
  value: CellValue
  notes: Notes
  isOriginal: boolean
  isError: boolean
  isHighlighted: boolean
}

export type BoardState = CellState[][]

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert'

export type Hint = {
  row: number
  col: number
  value: number
  reason: string
  technique: string
}

export type HistoryAction = {
  row: number
  col: number
  type: 'setValue' | 'toggleNote' | 'clearCell'
  value?: number
  previousValue: number | null
  previousNotes: number[]
  nextValue: number | null
  nextNotes: number[]
  timestamp: number
}

export interface SudokuState {
  board: BoardState
  solution: number[][]
  selectedCell: { row: number; col: number } | null
  isNoteMode: boolean
  difficulty: Difficulty
  isComplete: boolean
  startTime: number | null
  elapsedTime: number
  currentHint: Hint | null
  undoStack: HistoryAction[]
  redoStack: HistoryAction[]
}

const createEmptyCell = (): CellState => ({
  value: null,
  notes: [],
  isOriginal: false,
  isError: false,
  isHighlighted: false,
})

const createEmptyBoard = (): BoardState => {
  return Array(9).fill(null).map(() => 
    Array(9).fill(null).map(() => createEmptyCell())
  )
}

const initialState: SudokuState = {
  board: createEmptyBoard(),
  solution: [],
  selectedCell: null,
  isNoteMode: false,
  difficulty: 'easy',
  isComplete: false,
  startTime: null,
  elapsedTime: 0,
  currentHint: null,
  undoStack: [],
  redoStack: [],
}

const cloneCell = (cell: CellState): CellState => ({
  value: cell.value,
  notes: [...cell.notes],
  isOriginal: cell.isOriginal,
  isError: cell.isError,
  isHighlighted: cell.isHighlighted,
})

const sudokuSlice = createSlice({
  name: 'sudoku',
  initialState,
  reducers: {
    setBoard: (state, action: PayloadAction<{ board: number[][]; solution: number[][] }>) => {
      const { board, solution } = action.payload
      state.board = board.map((row, rowIndex) =>
        row.map((value, colIndex) => ({
          value: value || null,
          notes: [],
          isOriginal: value !== 0,
          isError: false,
          isHighlighted: false,
        }))
      )
      state.solution = solution
      state.isComplete = false
      state.startTime = Date.now()
      state.elapsedTime = 0
      state.currentHint = null
      state.undoStack = []
      state.redoStack = []
    },

    setSelectedCell: (state, action: PayloadAction<{ row: number; col: number } | null>) => {
      state.selectedCell = action.payload
    },

    setCellValueWithHistory: (
      state,
      action: PayloadAction<{ row: number; col: number; value: number }>
    ) => {
      const { row, col, value } = action.payload
      const cell = state.board[row][col]

      if (cell.isOriginal) return

      const previousValue = cell.value
      const previousNotes = [...cell.notes]

      cell.value = value
      cell.notes = []
      cell.isError = value !== state.solution[row][col]
      cell.isHighlighted = false

      if (previousValue !== value) {
        const historyAction: HistoryAction = {
          row,
          col,
          type: 'setValue',
          value,
          previousValue,
          previousNotes,
          nextValue: value,
          nextNotes: [],
          timestamp: Date.now(),
        }
        state.undoStack.push(historyAction)
        state.redoStack = []
      }

      const isComplete = state.board.every((row, i) =>
        row.every((cell, j) => cell.value === state.solution[i][j])
      )

      if (isComplete) {
        state.isComplete = true
        state.elapsedTime = Date.now() - (state.startTime || Date.now())
      }
    },

    toggleNoteWithHistory: (
      state,
      action: PayloadAction<{ row: number; col: number; value: number }>
    ) => {
      const { row, col, value } = action.payload
      const cell = state.board[row][col]

      if (cell.isOriginal || cell.value !== null) return

      const previousValue = cell.value
      const previousNotes = [...cell.notes]

      const noteIndex = cell.notes.indexOf(value)
      if (noteIndex === -1) {
        cell.notes = [...cell.notes, value].sort((a, b) => a - b)
      } else {
        cell.notes = cell.notes.filter(n => n !== value)
      }

      const historyAction: HistoryAction = {
        row,
        col,
        type: 'toggleNote',
        value,
        previousValue,
        previousNotes,
        nextValue: cell.value,
        nextNotes: [...cell.notes],
        timestamp: Date.now(),
      }
      state.undoStack.push(historyAction)
      state.redoStack = []
    },

    clearCellWithHistory: (
      state,
      action: PayloadAction<{ row: number; col: number }>
    ) => {
      const { row, col } = action.payload
      const cell = state.board[row][col]

      if (cell.isOriginal) return
      if (cell.value === null && cell.notes.length === 0) return

      const previousValue = cell.value
      const previousNotes = [...cell.notes]

      cell.value = null
      cell.notes = []
      cell.isError = false
      cell.isHighlighted = false

      const historyAction: HistoryAction = {
        row,
        col,
        type: 'clearCell',
        previousValue,
        previousNotes,
        nextValue: null,
        nextNotes: [],
        timestamp: Date.now(),
      }
      state.undoStack.push(historyAction)
      state.redoStack = []
    },

    undo: (state) => {
      if (state.undoStack.length === 0) return

      const lastAction = state.undoStack.pop()!
      const cell = state.board[lastAction.row][lastAction.col]

      state.redoStack.push({
        ...lastAction,
        previousValue: lastAction.previousValue,
        previousNotes: lastAction.previousNotes,
        nextValue: cell.value,
        nextNotes: [...cell.notes],
      })

      cell.value = lastAction.previousValue
      cell.notes = [...lastAction.previousNotes]
      cell.isError = cell.value !== null && cell.value !== state.solution[lastAction.row][lastAction.col]
      cell.isHighlighted = false

      state.isComplete = state.board.every((row, i) =>
        row.every((cell, j) => cell.value === state.solution[i][j])
      )
    },

    redo: (state) => {
      if (state.redoStack.length === 0) return

      const action = state.redoStack.pop()!
      const cell = state.board[action.row][action.col]

      state.undoStack.push({
        ...action,
        previousValue: cell.value,
        previousNotes: [...cell.notes],
        nextValue: action.nextValue,
        nextNotes: [...action.nextNotes],
      })

      cell.value = action.nextValue
      cell.notes = [...action.nextNotes]
      cell.isError = cell.value !== null && cell.value !== state.solution[action.row][action.col]
      cell.isHighlighted = false

      state.isComplete = state.board.every((row, i) =>
        row.every((cell, j) => cell.value === state.solution[i][j])
      )
    },

    setNoteMode: (state, action: PayloadAction<boolean>) => {
      state.isNoteMode = action.payload
    },

    setDifficulty: (state, action: PayloadAction<Difficulty>) => {
      state.difficulty = action.payload
    },

    setCurrentHint: (state, action: PayloadAction<Hint | null>) => {
      state.currentHint = action.payload
      if (action.payload) {
        const { row, col } = action.payload
        state.board = state.board.map((r, ri) =>
          r.map((cell, ci) => ({
            ...cell,
            isHighlighted: ri === row && ci === col,
          }))
        )
      }
    },

    resetGame: (state) => {
      state.board = state.board.map(row =>
        row.map(cell => ({
          ...cell,
          value: cell.isOriginal ? cell.value : null,
          notes: [],
          isError: false,
          isHighlighted: false,
        }))
      )
      state.isComplete = false
      state.startTime = Date.now()
      state.elapsedTime = 0
      state.currentHint = null
      state.undoStack = []
      state.redoStack = []
    },
  },
})

export const {
  setBoard,
  setSelectedCell,
  setCellValueWithHistory,
  toggleNoteWithHistory,
  clearCellWithHistory,
  undo,
  redo,
  setNoteMode,
  setDifficulty,
  setCurrentHint,
  resetGame,
} = sudokuSlice.actions

export default sudokuSlice.reducer
