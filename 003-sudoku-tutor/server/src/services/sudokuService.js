class SudokuService {
  constructor() {
    this.DIFFICULTY_SETTINGS = {
      easy: { minClues: 45, maxClues: 50, maxSolvingSteps: 2 },
      medium: { minClues: 32, maxClues: 40, maxSolvingSteps: 4 },
      hard: { minClues: 25, maxClues: 31, maxSolvingSteps: 6 },
      expert: { minClues: 17, maxClues: 24, maxSolvingSteps: 8 },
    }

    this.TECHNIQUES = {
      NAKED_SINGLE: '唯一候选数法',
      HIDDEN_SINGLE: '隐藏唯一数法',
      NAKED_PAIR: '裸对法',
      NAKED_TRIPLE: '裸三法',
      NAKED_QUAD: '裸四法',
      HIDDEN_PAIR: '隐藏对法',
      HIDDEN_TRIPLE: '隐藏三法',
      POINTING_PAIR: '指向对法',
      BOX_LINE_REDUCTION: '宫行排除法',
      X_WING: 'X-Wing',
      SWORDFISH: '剑鱼',
      XY_WING: 'XY-Wing',
      GUESSING: '试数法',
    }
  }

  isValid(board, row, col, num) {
    for (let x = 0; x < 9; x++) {
      if (board[row][x] === num) return false
      if (board[x][col] === num) return false
    }

    const startRow = row - (row % 3)
    const startCol = col - (col % 3)

    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (board[startRow + i][startCol + j] === num) return false
      }
    }

    return true
  }

  getCandidates(board, row, col) {
    if (board[row][col] !== 0) return []

    const candidates = []
    for (let num = 1; num <= 9; num++) {
      if (this.isValid(board, row, col, num)) {
        candidates.push(num)
      }
    }
    return candidates
  }

  getAllCandidates(board) {
    const candidates = []
    for (let r = 0; r < 9; r++) {
      const rowCandidates = []
      for (let c = 0; c < 9; c++) {
        rowCandidates.push(this.getCandidates(board, r, c))
      }
      candidates.push(rowCandidates)
    }
    return candidates
  }

  solveSudoku(board) {
    const startTime = Date.now()
    const solution = this._solveBacktrack(board)
    const elapsed = Date.now() - startTime
    return { solution, elapsed }
  }

  _solveBacktrack(board) {
    const copy = board.map(row => [...row])
    return this._backtrack(copy) ? copy : null
  }

  _backtrack(board) {
    const empty = this._findEmptyMRV(board)
    if (!empty) return true

    const [row, col] = empty
    const candidates = this.getCandidates(board, row, col)

    for (const num of candidates) {
      board[row][col] = num
      if (this._backtrack(board)) return true
      board[row][col] = 0
    }

    return false
  }

  _findEmptyMRV(board) {
    let minCandidates = 10
    let bestCell = null

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const candidates = this.getCandidates(board, r, c)
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length
            bestCell = [r, c]
            if (minCandidates === 1) return bestCell
          }
        }
      }
    }

    return bestCell
  }

  countSolutions(board, limit = 2) {
    const copy = board.map(row => [...row])
    let count = 0

    const backtrack = () => {
      if (count >= limit) return

      const empty = this._findEmptyMRV(copy)
      if (!empty) {
        count++
        return
      }

      const [row, col] = empty
      const candidates = this.getCandidates(copy, row, col)

      for (const num of candidates) {
        copy[row][col] = num
        backtrack()
        if (count >= limit) return
        copy[row][col] = 0
      }
    }

    backtrack()
    return count
  }

  generateSudoku(difficulty = 'medium') {
    const settings = this.DIFFICULTY_SETTINGS[difficulty]
    const startTime = Date.now()

    const solution = this._generateFullBoard()
    const puzzle = solution.map(row => [...row])

    const positions = []
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        positions.push({ row: r, col: c })
      }
    }

    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[positions[i], positions[j]] = [positions[j], positions[i]]
    }

    let removed = 0
    const targetRemove = 81 - settings.minClues

    for (const pos of positions) {
      if (removed >= targetRemove) break

      const saved = puzzle[pos.row][pos.col]
      puzzle[pos.row][pos.col] = 0

      const testBoard = puzzle.map(row => [...row])
      const solutions = this.countSolutions(testBoard, 2)

      if (solutions !== 1) {
        puzzle[pos.row][pos.col] = saved
      } else {
        removed++
      }
    }

    const clueCount = puzzle.flat().filter(n => n !== 0).length

    const elapsed = Date.now() - startTime
    return {
      puzzle,
      solution,
      difficulty,
      clueCount,
      elapsed,
    }
  }

  _generateFullBoard() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0))
    this._fillBoard(board)
    return board
  }

  _fillBoard(board) {
    const empty = this._findEmptyMRV(board)
    if (!empty) return true

    const [row, col] = empty
    const candidates = this.getCandidates(board, row, col)

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[candidates[i], candidates[j]] = [candidates[j], candidates[i]]
    }

    for (const num of candidates) {
      board[row][col] = num
      if (this._fillBoard(board)) return true
      board[row][col] = 0
    }

    return false
  }

  getNextHint(board, solution) {
    const candidates = this.getAllCandidates(board)

    const nakedSingle = this._findNakedSingle(board, candidates)
    if (nakedSingle) {
      return {
        row: nakedSingle.row,
        col: nakedSingle.col,
        value: nakedSingle.value,
        technique: this.TECHNIQUES.NAKED_SINGLE,
        reason: `第${nakedSingle.row + 1}行、第${nakedSingle.col + 1}列这个格子中，通过分析行、列和3×3宫格中已有的数字，发现只有 ${nakedSingle.value} 这一个数字可以填入。这是最简单的解题技巧。`,
      }
    }

    const hiddenSingle = this._findHiddenSingle(board, candidates)
    if (hiddenSingle) {
      const { row, col, value, reason } = hiddenSingle
      return {
        row,
        col,
        value,
        technique: this.TECHNIQUES.HIDDEN_SINGLE,
        reason,
      }
    }

    const advancedHint = this._findAdvancedEliminationHint(board, candidates, solution)
    if (advancedHint) {
      return advancedHint
    }

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && candidates[r][c].length > 0) {
          return {
            row: r,
            col: c,
            value: solution[r][c],
            technique: '基础排除法',
            reason: `第${r + 1}行、第${c + 1}列这个格子目前有 ${candidates[r][c].length} 个候选数：${candidates[r][c].join('、')}。通过进一步分析所在行、列和宫格中的数字，可以逐步排除不可能的候选数。建议先尝试使用笔记功能标记所有候选数。`,
          }
        }
      }
    }

    return null
  }

  _findAdvancedEliminationHint(board, candidates, solution) {
    for (let num = 1; num <= 9; num++) {
      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const startRow = boxRow * 3
          const startCol = boxCol * 3

          const positions = []
          for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
              if (board[r][c] === 0 && candidates[r][c].includes(num)) {
                positions.push({ row: r, col: c })
              }
            }
          }

          if (positions.length >= 2 && positions.length <= 3) {
            const sameRow = positions.every(p => p.row === positions[0].row)
            const sameCol = positions.every(p => p.col === positions[0].col)

            if (sameRow) {
              const targetRow = positions[0].row
              let canEliminate = false
              for (let c = 0; c < 9; c++) {
                if (board[targetRow][c] === 0 && candidates[targetRow][c].includes(num)) {
                  const inBox = c >= startCol && c < startCol + 3
                  if (!inBox) {
                    canEliminate = true
                    break
                  }
                }
              }

              if (canEliminate) {
                const fillableCell = positions.find(p => solution[p.row][p.col] === num)
                if (fillableCell && candidates[fillableCell.row][fillableCell.col].includes(num)) {
                  const otherCandidates = candidates[fillableCell.row][fillableCell.col].filter(n => n !== num)
                  return {
                    row: fillableCell.row,
                    col: fillableCell.col,
                    value: num,
                    technique: this.TECHNIQUES.POINTING_PAIR,
                    reason: `观察第${boxRow * 3 + 1}-${boxRow * 3 + 3}行、第${boxCol * 3 + 1}-${boxCol * 3 + 3}列的3×3宫格：数字 ${num} 的候选位置都在第${targetRow + 1}行。这意味着 ${num} 必然在这一行的这个宫格中，因此可以排除这一行其他宫格中的 ${num}。排除后，第${fillableCell.row + 1}行、第${fillableCell.col + 1}列只剩下 ${num} 这一个选择${otherCandidates.length > 0 ? '（已排除候选数：' + otherCandidates.join('、') + '）' : ''}。`,
                  }
                }
              }
            }

            if (sameCol) {
              const targetCol = positions[0].col
              let canEliminate = false
              for (let r = 0; r < 9; r++) {
                if (board[r][targetCol] === 0 && candidates[r][targetCol].includes(num)) {
                  const inBox = r >= startRow && r < startRow + 3
                  if (!inBox) {
                    canEliminate = true
                    break
                  }
                }
              }

              if (canEliminate) {
                const fillableCell = positions.find(p => solution[p.row][p.col] === num)
                if (fillableCell && candidates[fillableCell.row][fillableCell.col].includes(num)) {
                  const otherCandidates = candidates[fillableCell.row][fillableCell.col].filter(n => n !== num)
                  return {
                    row: fillableCell.row,
                    col: fillableCell.col,
                    value: num,
                    technique: this.TECHNIQUES.POINTING_PAIR,
                    reason: `观察第${boxRow * 3 + 1}-${boxRow * 3 + 3}行、第${boxCol * 3 + 1}-${boxCol * 3 + 3}列的3×3宫格：数字 ${num} 的候选位置都在第${targetCol + 1}列。这意味着 ${num} 必然在这一列的这个宫格中，因此可以排除这一列其他宫格中的 ${num}。排除后，第${fillableCell.row + 1}行、第${fillableCell.col + 1}列只剩下 ${num} 这一个选择${otherCandidates.length > 0 ? '（已排除候选数：' + otherCandidates.join('、') + '）' : ''}。`,
                  }
                }
              }
            }
          }
        }
      }
    }

    for (let num = 1; num <= 9; num++) {
      for (let r = 0; r < 9; r++) {
        const positions = []
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0 && candidates[r][c].includes(num)) {
            positions.push(c)
          }
        }

        if (positions.length >= 2 && positions.length <= 3) {
          const boxCol = Math.floor(positions[0] / 3)
          const allInSameBox = positions.every(c => Math.floor(c / 3) === boxCol)

          if (allInSameBox) {
            const boxRow = Math.floor(r / 3)
            const startRow = boxRow * 3
            const startCol = boxCol * 3

            let canEliminate = false
            for (let i = startRow; i < startRow + 3; i++) {
              if (i !== r) {
                for (let j = startCol; j < startCol + 3; j++) {
                  if (board[i][j] === 0 && candidates[i][j].includes(num)) {
                    canEliminate = true
                    break
                  }
                }
                if (canEliminate) break
              }
            }

            if (canEliminate) {
              for (const col of positions) {
                if (solution[r][col] === num && candidates[r][col].includes(num)) {
                  const otherCandidates = candidates[r][col].filter(n => n !== num)
                  return {
                    row: r,
                    col: col,
                    value: num,
                    technique: this.TECHNIQUES.BOX_LINE_REDUCTION,
                    reason: `观察第${r + 1}行：数字 ${num} 的候选位置都在第${boxCol * 3 + 1}-${boxCol * 3 + 3}列的宫格中。这意味着 ${num} 必然在这个宫格的这一行中，因此可以排除这个宫格中其他行的 ${num}。排除后，第${r + 1}行、第${col + 1}列只剩下 ${num} 这一个选择${otherCandidates.length > 0 ? '（已排除候选数：' + otherCandidates.join('、') + '）' : ''}。`,
                  }
                }
              }
            }
          }
        }
      }

      for (let c = 0; c < 9; c++) {
        const positions = []
        for (let r = 0; r < 9; r++) {
          if (board[r][c] === 0 && candidates[r][c].includes(num)) {
            positions.push(r)
          }
        }

        if (positions.length >= 2 && positions.length <= 3) {
          const boxRow = Math.floor(positions[0] / 3)
          const allInSameBox = positions.every(r => Math.floor(r / 3) === boxRow)

          if (allInSameBox) {
            const boxCol = Math.floor(c / 3)
            const startRow = boxRow * 3
            const startCol = boxCol * 3

            let canEliminate = false
            for (let i = startRow; i < startRow + 3; i++) {
              for (let j = startCol; j < startCol + 3; j++) {
                if (j !== c && board[i][j] === 0 && candidates[i][j].includes(num)) {
                  canEliminate = true
                  break
                }
              }
              if (canEliminate) break
            }

            if (canEliminate) {
              for (const row of positions) {
                if (solution[row][c] === num && candidates[row][c].includes(num)) {
                  const otherCandidates = candidates[row][c].filter(n => n !== num)
                  return {
                    row: row,
                    col: c,
                    value: num,
                    technique: this.TECHNIQUES.BOX_LINE_REDUCTION,
                    reason: `观察第${c + 1}列：数字 ${num} 的候选位置都在第${boxRow * 3 + 1}-${boxRow * 3 + 3}行的宫格中。这意味着 ${num} 必然在这个宫格的这一列中，因此可以排除这个宫格中其他列的 ${num}。排除后，第${row + 1}行、第${c + 1}列只剩下 ${num} 这一个选择${otherCandidates.length > 0 ? '（已排除候选数：' + otherCandidates.join('、') + '）' : ''}。`,
                  }
                }
              }
            }
          }
        }
      }
    }

    return null
  }

  _findNakedSingle(board, candidates) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && candidates[r][c].length === 1) {
          return {
            row: r,
            col: c,
            value: candidates[r][c][0],
          }
        }
      }
    }
    return null
  }

  _findHiddenSingle(board, candidates) {
    for (let num = 1; num <= 9; num++) {
      for (let r = 0; r < 9; r++) {
        const positions = []
        for (let c = 0; c < 9; c++) {
          if (board[r][c] === 0 && candidates[r][c].includes(num)) {
            positions.push(c)
          }
        }
        if (positions.length === 1) {
          return {
            row: r,
            col: positions[0],
            value: num,
            reason: `观察第${r + 1}行，数字 ${num} 只能出现在第${positions[0] + 1}列这个位置（其他位置要么已填数，要么不能填 ${num}）。虽然这个格子可能有多个候选数，但数字 ${num} 是这一行中唯一能填入这个位置的数字。`,
          }
        }
      }

      for (let c = 0; c < 9; c++) {
        const positions = []
        for (let r = 0; r < 9; r++) {
          if (board[r][c] === 0 && candidates[r][c].includes(num)) {
            positions.push(r)
          }
        }
        if (positions.length === 1) {
          return {
            row: positions[0],
            col: c,
            value: num,
            reason: `观察第${c + 1}列，数字 ${num} 只能出现在第${positions[0] + 1}行这个位置（其他位置要么已填数，要么不能填 ${num}）。虽然这个格子可能有多个候选数，但数字 ${num} 是这一列中唯一能填入这个位置的数字。`,
          }
        }
      }

      for (let boxRow = 0; boxRow < 3; boxRow++) {
        for (let boxCol = 0; boxCol < 3; boxCol++) {
          const positions = []
          const startRow = boxRow * 3
          const startCol = boxCol * 3

          for (let r = startRow; r < startRow + 3; r++) {
            for (let c = startCol; c < startCol + 3; c++) {
              if (board[r][c] === 0 && candidates[r][c].includes(num)) {
                positions.push({ row: r, col: c })
              }
            }
          }

          if (positions.length === 1) {
            return {
              row: positions[0].row,
              col: positions[0].col,
              value: num,
              reason: `观察第${boxRow * 3 + 1}-${boxRow * 3 + 3}行、第${boxCol * 3 + 1}-${boxCol * 3 + 3}列的3×3宫格，数字 ${num} 只能出现在第${positions[0].row + 1}行、第${positions[0].col + 1}列这个位置。虽然这个格子可能有多个候选数，但数字 ${num} 是这个宫格中唯一能填入这个位置的数字。`,
            }
          }
        }
      }
    }

    return null
  }

  validateBoard(board) {
    const errors = []

    for (let r = 0; r < 9; r++) {
      const seen = new Set()
      for (let c = 0; c < 9; c++) {
        const val = board[r][c]
        if (val !== 0 && val !== null) {
          if (seen.has(val)) {
            errors.push({ row: r, col: c, type: 'duplicate_in_row' })
          }
          seen.add(val)
        }
      }
    }

    for (let c = 0; c < 9; c++) {
      const seen = new Set()
      for (let r = 0; r < 9; r++) {
        const val = board[r][c]
        if (val !== 0 && val !== null) {
          if (seen.has(val)) {
            errors.push({ row: r, col: c, type: 'duplicate_in_col' })
          }
          seen.add(val)
        }
      }
    }

    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set()
        const startRow = boxRow * 3
        const startCol = boxCol * 3

        for (let r = startRow; r < startRow + 3; r++) {
          for (let c = startCol; c < startCol + 3; c++) {
            const val = board[r][c]
            if (val !== 0 && val !== null) {
              if (seen.has(val)) {
                errors.push({ row: r, col: c, type: 'duplicate_in_box' })
              }
              seen.add(val)
            }
          }
        }
      }
    }

    const emptyCount = board.flat().filter(v => v === 0 || v === null).length
    const isComplete = emptyCount === 0 && errors.length === 0

    return {
      isValid: errors.length === 0,
      errors,
      isComplete,
      emptyCount,
    }
  }
}

export default new SudokuService()
