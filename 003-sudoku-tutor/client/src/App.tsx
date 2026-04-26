import { useEffect, useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  setBoard,
  Difficulty,
  setCurrentHint,
  resetGame,
  BoardState,
  GameRecord,
  setDifficulty,
} from './features/sudoku/sudokuSlice'
import {
  saveGame,
} from './features/history/historySlice'
import { RootState } from './app/store'
import { SudokuBoard } from './components/sudoku/SudokuBoard'
import { SudokuControls } from './components/sudoku/SudokuControls'
import { HistoryList } from './components/history/HistoryList'
import { ReplayControls } from './components/history/ReplayControls'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { sudokuApi } from './services/api'

const generateSampleBoard = (): { board: number[][]; solution: number[][] } => {
  const solution = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9],
  ]

  const board = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9],
  ]

  return { board, solution }
}

const buildReplayBoard = (game: GameRecord, step: number): BoardState => {
  const board: BoardState = game.board.map((row, rowIndex) =>
    row.map((value, colIndex) => ({
      value: value || null,
      notes: [],
      isOriginal: value !== 0,
      isError: false,
      isHighlighted: false,
    }))
  )

  for (let i = 0; i < step && i < game.actions.length; i++) {
    const action = game.actions[i]
    const cell = board[action.row][action.col]

    if (cell.isOriginal) continue

    if (action.type === 'setValue' && action.value !== undefined) {
      cell.value = action.value
      cell.notes = []
      cell.isError = action.value !== game.solution[action.row][action.col]
    } else if (action.type === 'toggleNote' && action.value !== undefined) {
      if (cell.value === null) {
        const noteIndex = cell.notes.indexOf(action.value)
        if (noteIndex === -1) {
          cell.notes = [...cell.notes, action.value].sort((a, b) => a - b)
        } else {
          cell.notes = cell.notes.filter(n => n !== action.value)
        }
      }
    } else if (action.type === 'clearCell') {
      cell.value = null
      cell.notes = []
      cell.isError = false
    }
  }

  return board
}

function App() {
  const dispatch = useDispatch()
  const { board, isComplete, currentHint, difficulty, solution, undoStack } = useSelector(
    (state: RootState) => state.sudoku
  )
  const { currentReplay } = useSelector(
    (state: RootState) => state.history
  )
  const [elapsedTime, setElapsedTime] = useState(0)
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleNewGame = useCallback(async (newDifficulty: Difficulty) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await sudokuApi.generateGame(newDifficulty)

      if (response.success) {
        dispatch(
          setBoard({
            board: response.data.puzzle,
            solution: response.data.solution,
          })
        )
        dispatch(setDifficulty(newDifficulty))
        setElapsedTime(0)
        setIsTimerRunning(true)
      }
    } catch (err) {
      console.error('生成游戏失败:', err)
      const fallback = generateSampleBoard()
      dispatch(setBoard(fallback))
      dispatch(setDifficulty(newDifficulty))
      setElapsedTime(0)
      setIsTimerRunning(true)
      setError(err instanceof Error ? err.message : '使用本地数独数据')
    } finally {
      setIsLoading(false)
    }
  }, [dispatch])

  const handleHint = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const numericBoard = board.map((row) =>
        row.map((cell) => cell.value || 0)
      )

      const response = await sudokuApi.getHint(numericBoard, solution)

      if (response.success && response.data) {
        dispatch(
          setCurrentHint({
            row: response.data.row,
            col: response.data.col,
            value: response.data.value,
            technique: response.data.technique,
            reason: response.data.reason,
          })
        )
      } else {
        setCurrentHint(null)
        setError(response.message || '没有可用提示')
      }
    } catch (err) {
      console.error('获取提示失败:', err)
      setError(err instanceof Error ? err.message : '获取提示失败')
    } finally {
      setIsLoading(false)
    }
  }, [dispatch, board, solution])

  const handleReset = useCallback(() => {
    dispatch(resetGame())
    setElapsedTime(0)
    setIsTimerRunning(true)
  }, [dispatch])

  const handleSelectGame = useCallback((game: GameRecord) => {
    setIsTimerRunning(false)
  }, [])

  useEffect(() => {
    handleNewGame('easy')
  }, [])

  useEffect(() => {
    if (!isTimerRunning) return

    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isTimerRunning])

  useEffect(() => {
    if (isComplete && isTimerRunning) {
      setIsTimerRunning(false)

      const originalBoard = solution.map((row, r) =>
        row.map((_, c) => (board[r][c].isOriginal ? board[r][c].value || 0 : 0))
      )

      dispatch(
        saveGame({
          id: Date.now().toString(),
          difficulty,
          startTime: Date.now() - elapsedTime * 1000,
          endTime: Date.now(),
          duration: elapsedTime * 1000,
          board: originalBoard,
          solution,
          actions: undoStack,
          isComplete: true,
        })
      )
    }
  }, [isComplete, isTimerRunning, elapsedTime, undoStack, difficulty, dispatch, solution, board])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const displayBoard = currentReplay
    ? buildReplayBoard(currentReplay.game, currentReplay.currentStep)
    : board

  const difficultyLabels: Record<Difficulty, string> = {
    easy: '简单',
    medium: '中等',
    hard: '困难',
    expert: '专家',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">数独导师</h1>
          <p className="text-gray-600">不仅能解数独，更能教你解数独</p>
        </header>

        {isLoading && (
          <div className="text-center mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600">
            加载中...
          </div>
        )}

        {error && (
          <div className="text-center mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
            {error}
          </div>
        )}

        {isComplete && (
          <div className="text-center mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <h2 className="text-2xl font-bold text-green-700">🎉 恭喜完成！</h2>
            <p className="text-green-600 mt-1">
              难度: {difficultyLabels[difficulty]} | 用时: {formatTime(elapsedTime)}
            </p>
          </div>
        )}

        <Tabs defaultValue="play" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="play">游戏</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>

          <TabsContent value="play" className="mt-6">
            <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">难度</div>
                    <div className="font-semibold text-gray-700">
                      {difficultyLabels[difficulty]}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">用时</div>
                    <div className="font-mono font-semibold text-gray-700 text-lg">
                      {currentReplay
                        ? formatTime(Math.floor(currentReplay.game.duration / 1000))
                        : formatTime(elapsedTime)}
                    </div>
                  </div>
                </div>

                <SudokuBoard board={displayBoard} disabled={!!currentReplay} />

                {currentReplay && (
                  <div className="mt-4 w-full max-w-md">
                    <ReplayControls />
                  </div>
                )}
              </div>

              <div className="w-full max-w-sm">
                {!currentReplay && (
                  <SudokuControls
                    onNewGame={handleNewGame}
                    onHint={handleHint}
                    onReset={handleReset}
                    hint={currentHint}
                  />
                )}

                {!currentReplay && (
                  <div className="mt-6 p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="font-semibold text-gray-700 mb-2">操作说明</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 点击格子选中，直接输入数字</li>
                      <li>• 按方向键移动选中格</li>
                      <li>• 开启笔记模式可标记候选数</li>
                      <li>• 点击"下一步提示"学习解题思路</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">历史记录</h2>
                <HistoryList onSelectGame={handleSelectGame} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default App
