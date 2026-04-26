import { Router } from 'express'
import sudokuService from '../services/sudokuService.js'

const router = Router()

router.get('/generate/:difficulty?', (req, res) => {
  try {
    const { difficulty = 'medium' } = req.params

    if (!['easy', 'medium', 'hard', 'expert'].includes(difficulty)) {
      return res.status(400).json({
        error: '无效的难度级别',
        validLevels: ['easy', 'medium', 'hard', 'expert'],
      })
    }

    const result = sudokuService.generateSudoku(difficulty)

    res.json({
      success: true,
      data: {
        puzzle: result.puzzle,
        solution: result.solution,
        difficulty: result.difficulty,
        clueCount: result.clueCount,
      },
      meta: {
        generationTimeMs: result.elapsed,
      },
    })
  } catch (error) {
    console.error('生成数独失败:', error)
    res.status(500).json({
      success: false,
      error: '生成数独失败',
      message: error.message,
    })
  }
})

router.post('/solve', (req, res) => {
  try {
    const { board } = req.body

    if (!board || !Array.isArray(board) || board.length !== 9) {
      return res.status(400).json({
        error: '无效的棋盘数据，请提供 9×9 的二维数组',
      })
    }

    for (let i = 0; i < 9; i++) {
      if (!Array.isArray(board[i]) || board[i].length !== 9) {
        return res.status(400).json({
          error: `第 ${i + 1} 行数据格式错误`,
        })
      }
      for (let j = 0; j < 9; j++) {
        const val = board[i][j]
        if (val !== 0 && (val < 1 || val > 9 || !Number.isInteger(val))) {
          return res.status(400).json({
            error: `位置 (${i + 1}, ${j + 1}) 的值无效：必须是 0-9 之间的整数`,
          })
        }
      }
    }

    const validation = sudokuService.validateBoard(board)
    if (!validation.isValid) {
      return res.status(400).json({
        error: '输入的数独棋盘包含矛盾',
        details: validation.errors,
      })
    }

    const startTime = Date.now()
    const { solution, elapsed } = sudokuService.solveSudoku(board)

    if (!solution) {
      return res.status(404).json({
        success: false,
        error: '该数独无解',
      })
    }

    res.json({
      success: true,
      data: {
        solution,
        isComplete: true,
      },
      meta: {
        solveTimeMs: elapsed,
      },
    })
  } catch (error) {
    console.error('求解数独失败:', error)
    res.status(500).json({
      success: false,
      error: '求解数独失败',
      message: error.message,
    })
  }
})

router.post('/hint', (req, res) => {
  try {
    const { board, solution } = req.body

    if (!board || !Array.isArray(board) || board.length !== 9) {
      return res.status(400).json({
        error: '无效的棋盘数据，请提供 9×9 的二维数组',
      })
    }

    if (!solution || !Array.isArray(solution) || solution.length !== 9) {
      return res.status(400).json({
        error: '请提供正确的解决方案',
      })
    }

    const hint = sudokuService.getNextHint(board, solution)

    if (!hint) {
      return res.json({
        success: true,
        data: null,
        message: '棋盘已完成或没有可用的提示',
      })
    }

    res.json({
      success: true,
      data: {
        row: hint.row,
        col: hint.col,
        value: hint.value,
        technique: hint.technique,
        reason: hint.reason,
      },
    })
  } catch (error) {
    console.error('获取提示失败:', error)
    res.status(500).json({
      success: false,
      error: '获取提示失败',
      message: error.message,
    })
  }
})

router.post('/validate', (req, res) => {
  try {
    const { board } = req.body

    if (!board || !Array.isArray(board) || board.length !== 9) {
      return res.status(400).json({
        error: '无效的棋盘数据',
      })
    }

    const result = sudokuService.validateBoard(board)

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    console.error('验证数独失败:', error)
    res.status(500).json({
      success: false,
      error: '验证数独失败',
      message: error.message,
    })
  }
})

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'sudoku-api',
    timestamp: new Date().toISOString(),
  })
})

export default router
