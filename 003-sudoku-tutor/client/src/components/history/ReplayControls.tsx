import React, { useEffect, useRef, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import {
  stopReplay,
  setReplayStep,
} from '@/features/history/historySlice'
import { RootState } from '@/app/store'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  X,
} from 'lucide-react'

export const ReplayControls: React.FC = () => {
  const dispatch = useDispatch()
  const { currentReplay } = useSelector((state: RootState) => state.history)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [speed, setSpeed] = React.useState(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const handleStepChange = useCallback((step: number) => {
    if (!currentReplay) return
    const maxStep = currentReplay.game.actions.length
    const clampedStep = Math.max(0, Math.min(step, maxStep))
    dispatch(setReplayStep(clampedStep))
  }, [currentReplay, dispatch])

  useEffect(() => {
    if (!isPlaying || !currentReplay) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    const interval = 1000 / speed
    intervalRef.current = setInterval(() => {
      const { currentStep, game } = currentReplay
      if (currentStep >= game.actions.length) {
        setIsPlaying(false)
      } else {
        dispatch(setReplayStep(currentStep + 1))
      }
    }, interval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isPlaying, speed, currentReplay, dispatch])

  useEffect(() => {
    if (!currentReplay) {
      setIsPlaying(false)
    }
  }, [currentReplay])

  if (!currentReplay) return null

  const { game, currentStep } = currentReplay
  const totalSteps = game.actions.length
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0

  return (
    <div className="bg-gray-800 text-white rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">回放模式</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch(stopReplay())}
          className="text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-400">
          <span>进度: {currentStep} / {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={totalSteps}
          value={currentStep}
          onChange={(e) => handleStepChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStepChange(0)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="回到开始"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStepChange(currentStep - 1)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            disabled={currentStep === 0}
            title="上一步"
          >
            <StepBack className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStepChange(currentStep + 1)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            disabled={currentStep >= totalSteps}
            title="下一步"
          >
            <StepForward className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleStepChange(totalSteps)}
            className="text-gray-300 hover:text-white hover:bg-gray-700"
            title="跳到最后"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">速度:</span>
          {[0.5, 1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-2 py-1 text-xs rounded ${
                speed === s
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
