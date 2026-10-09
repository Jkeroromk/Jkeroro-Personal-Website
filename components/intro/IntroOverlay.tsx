'use client'

/**
 * IntroOverlay — 开场遮罩（替代原来的 / → /loading → /home 三次跳转）
 *
 * 首页直接渲染在 / 上，这个遮罩盖在最上面：
 * - 首次访问（本次会话）：等三项真实加载（音乐 / 图片 / Muse），最少 1.4 秒、最多 4 秒，
 *   然后出现「音乐开关 + 进入」。点进入时（用户手势）通知音乐播放器开始播放。
 * - 同一会话里刷新或回来：不拦人，环快速聚拢、Muse 挥手，约 1.5 秒后自动进门；点任意处可跳过。
 * - 语言：默认跟随浏览器首选语言（中文显示中文，其余英文）；手动切换后记住。
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import DataManager from '@/lib/data-manager'
import {
  AUDIO_PERMISSION_KEY,
  INTRO_SEEN_KEY,
  LANG_KEY,
  emitIntroEnter,
  readStorage,
  setIntroPhase,
  writeStorage,
} from '@/lib/intro-signal'
import { createIntroFx, type IntroFx, type RingKey } from './introFx'
import s from './IntroOverlay.module.css'

const AVATAR = {
  poster: '/jkeroro-avatar/avatar-poster.webp',
  idle: '/jkeroro-avatar/avatar-idle.mp4',
  celebrating: '/jkeroro-avatar/avatar-celebrating.mp4',
}
// 首页首屏会用到的图片，图片那条环等它们解码完
const HOME_IMAGES = ['/pfp.webp', '/me.webp', '/header.webp']

const MIN_SHOW = 1400   // 最少显示时间，免得一闪而过
const MAX_WAIT = 4000   // 最多拦这么久，没加载完的进门后继续
const QUICK_MS = 1500   // 同一会话再次进入的开场长度
const EXIT_MS = 1250    // 门帘拉开 + 穿越的时长
const C = 2 * Math.PI * 48

type Lang = 'zh' | 'en'
type Mode = 'full' | 'quick'
type Done = Record<RingKey, boolean>
const STAGES: RingKey[] = ['bgm', 'photo', 'muse']

const T = {
  zh: {
    tag: '欢迎来到我的小窝', back: '欢迎回来', skip: '点任意处跳过',
    stages: { bgm: ['音乐', '调好第一首歌'], photo: ['图片', '挂上照片'], muse: ['Muse', '叫醒我的 Muse'] },
    soundLabel: 'BGM', on: '音乐 开', off: '音乐 关', door: '进入小窝',
    keys: 'Enter 进入 · M 开关音乐',
    slowHint: '音乐还在路上，进来后会自己接上',
    lang: 'EN', langLabel: 'Switch to English',
  },
  en: {
    tag: 'Welcome to my Cozy Place', back: 'Welcome back', skip: 'tap anywhere to skip',
    stages: { bgm: ['bgm', 'tuning the first track'], photo: ['photos', 'hanging the pictures'], muse: ['muse', 'waking up my Muse'] },
    soundLabel: 'BGM', on: 'Music on', off: 'Music off', door: 'Come in',
    keys: 'Enter to come in · M toggles music',
    slowHint: 'Music is still on its way. It will start once it arrives.',
    lang: '中', langLabel: '切换到中文',
  },
} as const

function detectLang(): Lang {
  const saved = readStorage('local', LANG_KEY)
  if (saved === 'zh' || saved === 'en') return saved
  const prefs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en']
  return /^zh\b/i.test(prefs[0]) ? 'zh' : 'en'
}

function withTimeout(p: Promise<unknown>, ms: number) {
  return Promise.race([p.catch(() => {}), new Promise(r => setTimeout(r, ms))])
}

/** 音乐：拿到第一首歌并加载它的元数据 */
async function loadFirstTrack() {
  const dm = DataManager.getInstance()
  let src = dm.getTracks()?.[0]?.src
  if (!src) {
    const res = await fetch('/api/media/tracks')
    if (res.ok) {
      const tracks = await res.json()
      if (Array.isArray(tracks) && tracks.length) {
        dm.saveTracks(tracks)
        src = tracks[0]?.src
      }
    }
  }
  if (!src) return
  await new Promise<void>(resolve => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.addEventListener('loadedmetadata', () => resolve(), { once: true })
    audio.addEventListener('error', () => resolve(), { once: true })
    audio.src = src!
  })
}

/** 图片：首屏图片解码完 + 字体就绪 */
function loadImages() {
  const imgs = HOME_IMAGES.map(src => {
    const img = new Image()
    img.src = src
    return img.decode().catch(() => {})
  })
  return Promise.all([...imgs, document.fonts?.ready ?? Promise.resolve()])
}

export default function IntroOverlay() {
  const [mounted, setMounted] = useState(false)
  const [mode, setMode] = useState<Mode>('full')
  const [lang, setLang] = useState<Lang>('en')
  const [done, setDone] = useState<Done>({ bgm: false, photo: false, muse: false })
  const [ready, setReady] = useState(false)
  const [soundOn, setSoundOn] = useState(true)
  const [celebrating, setCelebrating] = useState(false)
  const [parting, setParting] = useState(false)
  const [gone, setGone] = useState(false)

  const rootRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLCanvasElement>(null)
  const frontRef = useRef<HTMLCanvasElement>(null)
  const winRef = useRef<HTMLDivElement>(null)
  const idleRef = useRef<HTMLVideoElement>(null)
  const celebRef = useRef<HTMLVideoElement>(null)
  const doorRef = useRef<HTMLButtonElement>(null)
  const fxRef = useRef<IntroFx | null>(null)
  const enteredRef = useRef(false)
  const readyRef = useRef(false)
  const doneRef = useRef<Done>({ bgm: false, photo: false, muse: false })

  const t = T[lang]

  // ---------- 挂载：判断模式、语言、上次的音乐选择，锁住页面滚动 ----------
  useEffect(() => {
    setMounted(true)
    setLang(detectLang())
    setSoundOn(readStorage('local', AUDIO_PERMISSION_KEY) !== 'declined')
    setMode(readStorage('session', INTRO_SEEN_KEY) ? 'quick' : 'full')
    setIntroPhase('loading')
  }, [])

  // 遮罩在的时候锁住页面滚动，首页也不能被 Tab 到；遮罩走了就恢复
  useEffect(() => {
    if (gone) return
    const html = document.documentElement
    const prevOverflow = html.style.overflow
    html.style.overflow = 'hidden'
    const home = document.getElementById('jk-home')
    home?.setAttribute('inert', '')
    return () => {
      html.style.overflow = prevOverflow
      home?.removeAttribute('inert')
    }
  }, [gone])

  // ---------- 3D 层 ----------
  useEffect(() => {
    if (!mounted || !backRef.current || !frontRef.current || !winRef.current) return
    const fx = createIntroFx(backRef.current, frontRef.current, winRef.current)
    fxRef.current = fx
    fx.start()
    return () => { fx.destroy(); fxRef.current = null }
  }, [mounted])

  const playCelebrate = useCallback(() => {
    const v = celebRef.current
    if (!v) return
    v.currentTime = 0
    setCelebrating(true)
    v.play().catch(() => setCelebrating(false))
  }, [])

  const becomeReady = useCallback(() => {
    if (readyRef.current) return
    readyRef.current = true
    setReady(true)
    setIntroPhase('ready')
    playCelebrate()
  }, [playCelebrate])

  // ---------- 首次访问：真实加载 ----------
  useEffect(() => {
    if (!mounted || mode !== 'full') return
    let cancelled = false
    const start = performance.now()
    const timers: ReturnType<typeof setTimeout>[] = []

    const tryReady = () => {
      if (cancelled || readyRef.current) return
      if (!STAGES.every(k => doneRef.current[k])) return
      const wait = MIN_SHOW - (performance.now() - start)
      if (wait > 0) timers.push(setTimeout(becomeReady, wait))
      else becomeReady()
    }
    const mark = (k: RingKey) => {
      if (cancelled || doneRef.current[k]) return
      doneRef.current = { ...doneRef.current, [k]: true }
      setDone(doneRef.current)
      fxRef.current?.lock(k)
      tryReady()
    }

    withTimeout(loadFirstTrack(), 8000).then(() => mark('bgm'))
    withTimeout(loadImages(), 6000).then(() => mark('photo'))

    // Muse：待机视频能播了就算好
    const idle = idleRef.current
    const museReady = new Promise<void>(resolve => {
      if (!idle || idle.readyState >= 3) return resolve()
      idle.addEventListener('canplay', () => resolve(), { once: true })
      idle.addEventListener('error', () => resolve(), { once: true })
    })
    withTimeout(museReady, 5000).then(() => mark('muse'))

    // 不管加载到哪，最多拦 MAX_WAIT
    timers.push(setTimeout(becomeReady, MAX_WAIT))

    return () => { cancelled = true; timers.forEach(clearTimeout) }
  }, [mounted, mode, becomeReady])

  // 准备好后把焦点放到「进入」上，键盘直接回车
  useEffect(() => {
    if (ready && mode === 'full') doorRef.current?.focus({ preventScroll: true })
  }, [ready, mode])

  // ---------- 进门 ----------
  const leave = useCallback(() => {
    setParting(true)
    fxRef.current?.warp()
    setTimeout(() => setGone(true), EXIT_MS)
  }, [])

  /** 首次访问点「进入」——一定是在点击/按键处理函数里同步调用 */
  const enter = useCallback((withMusic: boolean) => {
    if (!readyRef.current || enteredRef.current) return
    enteredRef.current = true
    writeStorage('local', AUDIO_PERMISSION_KEY, withMusic ? 'allowed' : 'declined')
    writeStorage('session', INTRO_SEEN_KEY, '1')
    emitIntroEnter(withMusic)
    leave()
  }, [leave])

  /** 同一会话再次进入。fromGesture：用户点了/按了键，可以直接放音乐 */
  const quickEnter = useCallback((fromGesture: boolean) => {
    if (enteredRef.current) return
    enteredRef.current = true
    const allowed = readStorage('local', AUDIO_PERMISSION_KEY) === 'allowed'
    emitIntroEnter(allowed ? (fromGesture ? true : 'armed') : false)
    leave()
  }, [leave])

  // ---------- 同一会话再次进入：快速版开场 ----------
  useEffect(() => {
    if (!mounted || mode !== 'quick') return
    const all = { bgm: true, photo: true, muse: true }
    doneRef.current = all
    setDone(all)
    readyRef.current = true
    setReady(true)
    setIntroPhase('ready')
    // 等 3D 层建好再让环一条接一条聚拢
    const raf = requestAnimationFrame(() => {
      fxRef.current?.lock('bgm', -350)
      fxRef.current?.lock('photo', -120)
      fxRef.current?.lock('muse', 80)
    })
    playCelebrate()
    const timer = setTimeout(() => quickEnter(false), QUICK_MS)
    return () => { cancelAnimationFrame(raf); clearTimeout(timer) }
  }, [mounted, mode, playCelebrate, quickEnter])

  // ---------- 键盘 ----------
  useEffect(() => {
    if (!mounted || gone) return
    const onKey = (e: KeyboardEvent) => {
      if (enteredRef.current) return
      if (mode === 'quick') { quickEnter(true); return }
      if (!readyRef.current) return
      if (e.key === 'Enter' && document.activeElement?.id !== 'jk-intro-sound') {
        e.preventDefault()
        enter(soundOn)
      } else if (e.key === 'm' || e.key === 'M') {
        setSoundOn(v => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [mounted, gone, mode, soundOn, enter, quickEnter])

  const toggleLang = () => {
    const next: Lang = lang === 'zh' ? 'en' : 'zh'
    setLang(next)
    writeStorage('local', LANG_KEY, next)
  }

  if (gone) return null

  const progress = mode === 'quick'
    ? 1
    : (() => {
        const n = STAGES.filter(k => done[k]).length
        return ready && n < 3 ? Math.max(n / 3, 0.92) : n / 3
      })()

  let hint = ''
  let keysHint = false
  if (mode === 'quick') hint = t.skip
  else if (ready && !done.bgm) hint = t.slowHint
  else if (ready) { hint = t.keys; keysHint = true }

  const rootClass = [
    s.root,
    mounted && s.mounted,
    mode === 'quick' && s.quick,
    parting && s.parting,
  ].filter(Boolean).join(' ')

  return (
    <div
      ref={rootRef}
      className={rootClass}
      role="dialog"
      aria-modal="true"
      aria-label="Jkeroro"
      lang={lang === 'zh' ? 'zh-CN' : 'en'}
      onPointerDown={() => { if (mode === 'quick') quickEnter(true) }}
    >
      <div className={`${s.curtain} ${s.curtainL}`} />
      <div className={`${s.curtain} ${s.curtainR}`} />
      <canvas ref={backRef} className={s.fx} aria-hidden="true" />

      <div className={s.content}>
        <button type="button" className={`${s.lang} ${s.late}`} onClick={toggleLang} aria-label={t.langLabel}>
          {t.lang}
        </button>

        <div ref={winRef} className={s.window} aria-hidden="true">
          <svg viewBox="0 0 100 100">
            <circle className={s.track} cx="50" cy="50" r="48" />
            <circle
              className={s.arc}
              cx="50" cy="50" r="48"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
            />
          </svg>
          <div className={s.glass} style={{ backgroundImage: `url(${AVATAR.poster})` }}>
            <video
              ref={idleRef}
              className={celebrating ? undefined : s.on}
              src={AVATAR.idle}
              poster={AVATAR.poster}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
            <video
              ref={celebRef}
              className={celebrating ? s.on : undefined}
              src={AVATAR.celebrating}
              muted
              playsInline
              preload="auto"
              onEnded={() => setCelebrating(false)}
            />
          </div>
        </div>

        <div className={s.mark}>
          <h1>Jkeroro</h1>
          <p className={s.late}>{mounted ? (mode === 'quick' ? t.back : t.tag) : ''}</p>
        </div>

        <div className={`${s.log} ${s.late}`} aria-live="polite">
          {mounted && STAGES.map(k => {
            const [key, text] = t.stages[k]
            return (
              <div key={k} className={`${s.row} ${done[k] ? s.done : ''}`}>
                <span className={s.rowKey}>{key}</span>
                <span className={s.rowText}>{text}</span>
                <span className={`${s.rowVal} ${done[k] ? '' : s.spin}`}>{done[k] ? 'ok' : ''}</span>
              </div>
            )
          })}
        </div>

        <div className={`${s.doors} ${ready && mode === 'full' ? s.show : ''}`}>
          <div className={s.dock}>
            <button
              id="jk-intro-sound"
              type="button"
              className={s.sound}
              aria-pressed={soundOn}
              aria-label={soundOn ? t.on : t.off}
              onClick={() => setSoundOn(v => !v)}
              tabIndex={ready ? 0 : -1}
            >
              <span className={s.vinyl} aria-hidden="true">
                <svg viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="17" fill="#111" stroke="#3a3a3a" />
                  <circle cx="18" cy="18" r="13" fill="none" stroke="#222" />
                  <circle cx="18" cy="18" r="10" fill="none" stroke="#262626" />
                  <path d="M8 12 A12 12 0 0 1 14 7" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="5.5" fill="#f4f4f2" />
                  <circle cx="18" cy="18" r="1.3" fill="#111" />
                </svg>
                <i className={s.slash} />
              </span>
              <span className={s.soundTxt}>
                <small>{t.soundLabel}</small>
                <span>{soundOn ? t.on : t.off}</span>
              </span>
              <span className={s.eq} aria-hidden="true"><i /><i /><i /></span>
            </button>
            <button
              ref={doorRef}
              type="button"
              className={s.door}
              onClick={() => enter(soundOn)}
              tabIndex={ready ? 0 : -1}
            >
              <span>{t.door}</span>
              <kbd>↵</kbd>
              <span className={s.arrow} aria-hidden="true">→</span>
            </button>
          </div>
        </div>

        <div className={`${s.hint} ${s.late} ${keysHint ? s.keysHint : ''}`}>{mounted ? hint : ''}</div>
      </div>

      <canvas ref={frontRef} className={s.fx} aria-hidden="true" />
    </div>
  )
}
