import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { GameRecord, deleteGame, startReplay } from '@/features/history/historySlice'
import { RootState } from '@/app/store'
import { Button } from '@/components/ui/button'
import { Play, Trash2 } from 'lucide-react'

interface HistoryListProps {
  onSelectGame: (game: GameRecord) => void
}

const formatDuration = (ms: number) => {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const difficultyLabels: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
  expert: '专家',
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelectGame }) => {
  const dispatch = useDispatch()
  const { savedGames } = useSelector((state: RootState) => state.history)

  if (savedGames.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>暂无历史记录</p>
        <p className="text-sm mt-1">完成游戏后会自动保存记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {savedGames.map((game) => (
        <div
          key={game.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded ${
                  game.isComplete
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {difficultyLabels[game.difficulty] || game.difficulty}
              </span>
              <span className="text-sm text-gray-600">
                {formatDate(game.startTime)}
              </span>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              用时: {formatDuration(game.duration)}
              {game.isComplete ? ' (已完成)' : ' (未完成)'}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              操作数: {game.actions.length} 步
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                dispatch(startReplay(game))
                onSelectGame(game)
              }}
              title="回放"
            >
              <Play className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dispatch(deleteGame(game.id))}
              title="删除"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
