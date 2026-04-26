import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type HistoryAction = {
  row: number
  col: number
  type: 'setValue' | 'toggleNote' | 'clearCell'
  value?: number
  previousValue: number | null
  previousNotes: number[]
  timestamp: number
}

export type GameRecord = {
  id: string
  difficulty: string
  startTime: number
  endTime: number
  duration: number
  board: number[][]
  solution: number[][]
  actions: HistoryAction[]
  isComplete: boolean
}

export interface HistoryState {
  currentActions: HistoryAction[]
  redoStack: HistoryAction[]
  savedGames: GameRecord[]
  currentReplay: {
    game: GameRecord
    currentStep: number
  } | null
}

const initialState: HistoryState = {
  currentActions: [],
  redoStack: [],
  savedGames: [],
  currentReplay: null,
}

const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    pushAction: (state, action: PayloadAction<HistoryAction>) => {
      state.currentActions.push(action.payload)
      state.redoStack = []
    },
    undo: (state) => {
      if (state.currentActions.length === 0) return
      
      const lastAction = state.currentActions.pop()!
      state.redoStack.push(lastAction)
    },
    redo: (state) => {
      if (state.redoStack.length === 0) return
      
      const action = state.redoStack.pop()!
      state.currentActions.push(action)
    },
    resetCurrentActions: (state) => {
      state.currentActions = []
      state.redoStack = []
    },
    saveGame: (state, action: PayloadAction<GameRecord>) => {
      state.savedGames.unshift(action.payload)
      if (state.savedGames.length > 20) {
        state.savedGames = state.savedGames.slice(0, 20)
      }
    },
    deleteGame: (state, action: PayloadAction<string>) => {
      state.savedGames = state.savedGames.filter(g => g.id !== action.payload)
    },
    startReplay: (state, action: PayloadAction<GameRecord>) => {
      state.currentReplay = {
        game: action.payload,
        currentStep: 0,
      }
    },
    stopReplay: (state) => {
      state.currentReplay = null
    },
    setReplayStep: (state, action: PayloadAction<number>) => {
      if (state.currentReplay) {
        state.currentReplay.currentStep = action.payload
      }
    },
  },
})

export const {
  pushAction,
  undo,
  redo,
  resetCurrentActions,
  saveGame,
  deleteGame,
  startReplay,
  stopReplay,
  setReplayStep,
} = historySlice.actions

export default historySlice.reducer
