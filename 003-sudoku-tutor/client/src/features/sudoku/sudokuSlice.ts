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
}

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
    },
    setSelectedCell: (state, action: PayloadAction<{ row: number; col: number } | null>) => {
      state.selectedCell = action.payload
    },
    setCellValue: (state, action: PayloadAction<{ row: number; col: number; value: number }>) => {
      const { row, col, value } = action.payload
      const cell = state.board[row][col]
      
      if (cell.isOriginal) return
      
      cell.value = value
      cell.notes = []
      cell.isError = value !== state.solution[row][col]
      cell.isHighlighted = false
      
      const isComplete = state.board.every((row, i) =>
        row.every((cell, j) => cell.value === state.solution[i][j])
      )
      
      if (isComplete) {
        state.isComplete = true
        state.elapsedTime = Date.now() - (state.startTime || Date.now())
      }
    },
    toggleNote: (state, action: PayloadAction<{ row: number; col: number; value: number }>) => {
      const { row, col, value } = action.payload
      const cell = state.board[row][col]
      
      if (cell.isOriginal || cell.value !== null) return
      
      const noteIndex = cell.notes.indexOf(value)
      if (noteIndex === -1) {
        cell.notes = [...cell.notes, value].sort((a, b) => a - b)
      } else {
        cell.notes = cell.notes.filter(n => n !== value)
      }
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
    clearCell: (state, action: PayloadAction<{ row: number; col: number }>) => {
      const { row, col } = action.payload
      const cell = state.board[row][col]
      
      if (cell.isOriginal) return
      
      cell.value = null
      cell.notes = []
      cell.isError = false
      cell.isHighlighted = false
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
    },
  },
})

export const {
  setBoard,
  setSelectedCell,
  setCellValue,
  toggleNote,
  setNoteMode,
  setDifficulty,
  setCurrentHint,
  clearCell,
  resetGame,
} = sudokuSlice.actions

export default sudokuSlice.reducer
