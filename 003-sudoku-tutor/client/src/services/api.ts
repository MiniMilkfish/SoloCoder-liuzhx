import { Difficulty, Hint } from '@/features/sudoku/sudokuSlice'

const API_BASE = '/api'

export interface GenerateGameResponse {
  success: boolean
  data: {
    puzzle: number[][]
    solution: number[][]
    difficulty: string
    clueCount: number
  }
  meta: {
    generationTimeMs: number
  }
}

export interface SolveResponse {
  success: boolean
  data: {
    solution: number[][]
    isComplete: boolean
  }
  meta: {
    solveTimeMs: number
  }
}

export interface HintResponse {
  success: boolean
  data: {
    row: number
    col: number
    value: number
    technique: string
    reason: string
  } | null
  message?: string
}

export interface ValidateResponse {
  success: boolean
  data: {
    isValid: boolean
    errors: Array<{ row: number; col: number; type: string }>
    isComplete: boolean
    emptyCount: number
  }
}

class SudokuApi {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.message || `API 请求失败: ${response.status}`)
    }

    return response.json()
  }

  async generateGame(difficulty: Difficulty = 'medium'): Promise<GenerateGameResponse> {
    return this.request<GenerateGameResponse>(`/sudoku/generate/${difficulty}`)
  }

  async solve(board: number[][]): Promise<SolveResponse> {
    return this.request<SolveResponse>('/sudoku/solve', {
      method: 'POST',
      body: JSON.stringify({ board }),
    })
  }

  async getHint(board: number[][], solution: number[][]): Promise<HintResponse> {
    return this.request<HintResponse>('/sudoku/hint', {
      method: 'POST',
      body: JSON.stringify({ board, solution }),
    })
  }

  async validate(board: number[][]): Promise<ValidateResponse> {
    return this.request<ValidateResponse>('/sudoku/validate', {
      method: 'POST',
      body: JSON.stringify({ board }),
    })
  }

  async health(): Promise<{ status: string; service: string; timestamp: string }> {
    return this.request('/sudoku/health')
  }
}

export const sudokuApi = new SudokuApi()
