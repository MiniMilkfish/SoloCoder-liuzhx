import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import sudokuReducer from '@/features/sudoku/sudokuSlice'
import historyReducer from '@/features/history/historySlice'

export const store = configureStore({
  reducer: {
    sudoku: sudokuReducer,
    history: historyReducer,
  },
})

setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
