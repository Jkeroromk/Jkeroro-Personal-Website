/**
 * TrackInfo Component
 * 曲目信息显示组件
 */

import { Track } from '@/types/api'

interface TrackInfoProps {
  track: Track | null
}

export default function TrackInfo({ track }: TrackInfoProps) {
  return (
    <>
      <h2
        className="mb-2 text-xl font-bold truncate w-full text-center"
        style={{ height: '28px' }}
      >
        {track?.title || 'No Track'}
      </h2>
      {track?.subtitle && (
        <p
          className="text-sm text-gray-300 mb-5 truncate w-full text-center"
          style={{ height: '20px' }}
        >
          {track.subtitle}
        </p>
      )}
    </>
  )
}

