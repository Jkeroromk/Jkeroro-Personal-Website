/**
 * PlayerControls Component
 * 播放控制按钮组件
 */

import { Play, Pause, SkipBack, SkipForward } from 'lucide-react'

interface PlayerControlsProps {
  isPlaying: boolean
  onPlayPause: () => void
  onSkipBack: () => void
  onSkipForward: () => void
}

export default function PlayerControls({
  isPlaying,
  onPlayPause,
  onSkipBack,
  onSkipForward,
}: PlayerControlsProps) {
  return (
    <div className="flex justify-between w-full mb-5" style={{ height: '40px' }}>
      <SkipBack
        onClick={onSkipBack}
        className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
      />
      <div
        onClick={onPlayPause}
        className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
      >
        {isPlaying ? <Pause /> : <Play />}
      </div>
      <SkipForward
        onClick={onSkipForward}
        className="cursor-pointer text-white text-2xl hover:scale-[1.5] transition duration-300"
      />
    </div>
  )
}

