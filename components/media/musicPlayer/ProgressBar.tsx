/**
 * ProgressBar Component
 * 播放进度条组件
 */

interface ProgressBarProps {
  currentTime: number
  duration: number
  onSeek: (time: number) => void
  formatTime: (seconds: number) => string
}

export default function ProgressBar({
  currentTime,
  duration,
  onSeek,
  formatTime,
}: ProgressBarProps) {
  return (
    <div className="w-full flex flex-col items-center mb-2 mt-2" style={{ height: '40px' }}>
      <input
        type="range"
        min="0"
        max={duration || 0}
        value={currentTime || 0}
        onChange={(e) => onSeek(parseFloat(e.target.value))}
        aria-label="音乐播放进度条"
        className="w-full mb-2 h-2"
        style={{
          appearance: 'none',
          background: `linear-gradient(to right, #4a4a4a ${
            duration ? (currentTime / duration) * 100 : 0
          }%, #e0e0e0 0%)`,
          height: '8px',
          borderRadius: '5px',
        }}
      />
      <div className="flex justify-between w-full text-sm text-white">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}

