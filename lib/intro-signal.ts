/**
 * Intro signal — 开场遮罩和首页之间的小通信层
 *
 * 首页和开场遮罩渲染在同一个页面里（遮罩盖在上面）。
 * 首页里有些东西要等开场走到某一步再动：
 * - 背景视频很大，等关键资源加载完（ready）再开始下载，免得抢带宽
 * - 音乐播放器要在用户点「进入」的那一下开始播放（浏览器要求用户手势）
 *
 * phase:  loading → ready → done
 * enter 事件的 music:
 *   true    — 用户选了开着音乐进来，立刻播放（或者等音乐加载好再播）
 *   false   — 安静进来
 *   'armed' — 同一会话再次进入，上次开着音乐：先试着自动播放，浏览器拦了就等用户点页面任意处再放
 */

export type IntroPhase = 'loading' | 'ready' | 'done'
export type IntroMusic = boolean | 'armed'

const PHASE_EVENT = 'jk:intro-phase'
const ENTER_EVENT = 'jk:intro-enter'

export const AUDIO_PERMISSION_KEY = 'audioPermission' // 沿用旧 key，老访客的选择不丢
export const INTRO_SEEN_KEY = 'jk:intro-seen'
export const LANG_KEY = 'jk:lang'

declare global {
  interface Window {
    __jkIntroPhase?: IntroPhase
    __jkIntroMusic?: IntroMusic
  }
}

export function getIntroPhase(): IntroPhase {
  if (typeof window === 'undefined') return 'loading'
  return window.__jkIntroPhase ?? 'loading'
}

export function setIntroPhase(phase: IntroPhase) {
  if (typeof window === 'undefined') return
  window.__jkIntroPhase = phase
  window.dispatchEvent(new CustomEvent(PHASE_EVENT, { detail: phase }))
}

/** 订阅阶段变化；已经到达的阶段会立刻回调一次 */
export function onIntroPhase(cb: (phase: IntroPhase) => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => cb((e as CustomEvent<IntroPhase>).detail)
  window.addEventListener(PHASE_EVENT, handler)
  cb(getIntroPhase())
  return () => window.removeEventListener(PHASE_EVENT, handler)
}

/** 必须在点击处理函数里同步调用，监听方才能在同一个用户手势里 play() */
export function emitIntroEnter(music: IntroMusic) {
  if (typeof window === 'undefined') return
  window.__jkIntroMusic = music
  window.dispatchEvent(new CustomEvent(ENTER_EVENT, { detail: music }))
  setIntroPhase('done')
}

/** 订阅「进入」。只在进入那一刻回调（不补发），免得组件重新挂载时又放一次音乐 */
export function onIntroEnter(cb: (music: IntroMusic) => void) {
  if (typeof window === 'undefined') return () => {}
  const handler = (e: Event) => cb((e as CustomEvent<IntroMusic>).detail)
  window.addEventListener(ENTER_EVENT, handler)
  return () => window.removeEventListener(ENTER_EVENT, handler)
}

export function readStorage(store: 'local' | 'session', key: string): string | null {
  try {
    return (store === 'local' ? window.localStorage : window.sessionStorage).getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(store: 'local' | 'session', key: string, value: string) {
  try {
    ;(store === 'local' ? window.localStorage : window.sessionStorage).setItem(key, value)
  } catch {
    // 隐私模式等情况下存储不可用，忽略
  }
}
