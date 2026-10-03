'use client'

/**
 * JkeroroAvatar — 会动的头像（来自 Muse App 导出的个性化形象）
 *
 * 状态：
 * - idle:        待机（默认循环）
 * - working:     思考 / 处理中（戴耳机敲键盘）
 * - making:      生成 / 输出中
 * - celebrating: 庆祝（打招呼、高光时刻）
 *
 * 只播放当前状态的视频，其余暂停，避免 4 路视频同时解码。
 * 视频文件放在 public/jkeroro-avatar/。
 */

import { useEffect, useRef } from 'react'

export type JkeroroAvatarState = 'idle' | 'working' | 'making' | 'celebrating'

const VIDEO_SRC: Record<JkeroroAvatarState, string> = {
  idle: '/jkeroro-avatar/avatar-idle.mp4',
  working: '/jkeroro-avatar/avatar-working.mp4',
  making: '/jkeroro-avatar/avatar-making.mp4',
  celebrating: '/jkeroro-avatar/avatar-celebrating.mp4',
}

// 各状态构图不同（idle 半身、making/celebrating 全身），调整取景让脸尽量居中
const OBJECT_POSITION: Record<JkeroroAvatarState, string> = {
  idle: '50% 18%',
  working: '42% 22%',
  making: '50% 17%',
  celebrating: '50% 13%',
}

const ZOOM: Record<JkeroroAvatarState, number> = {
  idle: 1.6,
  working: 1.35,
  making: 1.9,
  celebrating: 1.7,
}

export const AVATAR_POSTER = '/jkeroro-avatar/avatar-poster.webp'

const ALL_STATES: JkeroroAvatarState[] = ['idle', 'working', 'making', 'celebrating']

interface JkeroroAvatarProps {
  /** 当前状态，切换时自动交叉淡入淡出 */
  state?: JkeroroAvatarState
  /** 直径 px */
  size?: number
  /** 只加载这些状态（导航栏小按钮只需要 idle） */
  states?: JkeroroAvatarState[]
  className?: string
}

export default function JkeroroAvatar({
  state = 'idle',
  size = 160,
  states = ALL_STATES,
  className = '',
}: JkeroroAvatarProps) {
  const refs = useRef<Partial<Record<JkeroroAvatarState, HTMLVideoElement | null>>>({})
  const active: JkeroroAvatarState = states.includes(state) ? state : states[0]
  // 用字符串做依赖，避免父组件每次渲染传入新数组导致视频被反复重置
  const statesKey = states.join(',')

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    for (const s of statesKey.split(',') as JkeroroAvatarState[]) {
      const el = refs.current[s]
      if (!el) continue
      if (s === active && !reduceMotion) {
        try {
          el.currentTime = 0
          const p = el.play()
          if (p) p.catch(() => {})
        } catch {
          /* 自动播放被拦截时保持静默 */
        }
      } else {
        el.pause()
      }
    }
  }, [active, statesKey])

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        background: '#f4f4f2',
        flexShrink: 0,
      }}
      role="img"
      aria-label={`Muse avatar — ${active}`}
    >
      {states.map((s) => (
        <video
          key={s}
          ref={(el) => {
            refs.current[s] = el
          }}
          src={VIDEO_SRC[s]}
          poster={s === 'idle' ? AVATAR_POSTER : undefined}
          muted
          loop
          playsInline
          preload={s === active || s === 'idle' ? 'auto' : 'metadata'}
          disablePictureInPicture
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: OBJECT_POSITION[s],
            transform: `scale(${ZOOM[s]})`,
            transformOrigin: OBJECT_POSITION[s],
            opacity: s === active ? 1 : 0,
            transition: 'opacity 0.45s ease',
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  )
}
