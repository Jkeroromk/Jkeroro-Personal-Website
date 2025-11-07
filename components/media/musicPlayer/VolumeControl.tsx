/**
 * VolumeControl Component
 * 音量控制组件
 */

import { Volume2, VolumeX, Minus, Plus, Repeat, Shuffle } from 'lucide-react'

interface VolumeControlProps {
  volume: number
  isMuted: boolean
  isLooping: boolean
  isShuffled: boolean
  onVolumeChange: (delta: number) => void
  onToggleMute: () => void
  onToggleLoop: () => void
  onToggleShuffle: () => void
}

export default function VolumeControl({
  volume,
  isMuted,
  isLooping,
  isShuffled,
  onVolumeChange,
  onToggleMute,
  onToggleLoop,
  onToggleShuffle,
}: VolumeControlProps) {
  return (
    <div className="items-center justify-center gap-5 mt-5 flex" style={{ height: '40px' }}>
      <div
        className="relative"
        title={isShuffled ? 'Disable Shuffle' : 'Enable Shuffle'}
      >
        <Shuffle
          className={`cursor-pointer text-xl transition duration-300 ${
            isShuffled
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-white hover:text-gray-300'
          }`}
          onPointerDown={onToggleShuffle}
        />
      </div>
      <div
        className="cursor-pointer text-white text-xl hover:scale-[1.5] transition duration-300"
        onPointerDown={() => onVolumeChange(-10)}
        title="Decrease Volume"
      >
        <Minus />
      </div>
      <div
        className="flex flex-col items-center cursor-pointer"
        onPointerDown={onToggleMute}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX className="text-white text-xl" />
        ) : (
          <Volume2 className="text-white text-xl" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-white font-bold">
          {isMuted ? '0' : volume > 100 ? `${volume}%` : volume}
        </span>
        <div
          className="cursor-pointer text-white text-xl hover:scale-[1.5] transition duration-300"
          onPointerDown={() => onVolumeChange(10)}
          title="Increase Volume"
        >
          <Plus />
        </div>
      </div>
      <div
        className="relative"
        title={isLooping ? 'Disable Loop' : 'Enable Loop'}
      >
        <Repeat
          className="cursor-pointer text-white text-xl hover:text-gray-300"
          onPointerDown={onToggleLoop}
        />
        {isLooping && (
          <span className="absolute -top-1 -right-1 text-xs font-bold text-white-400 transition-all duration-300">
            1
          </span>
        )}
      </div>
    </div>
  )
}

