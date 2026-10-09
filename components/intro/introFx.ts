/**
 * introFx — 开场的 3D 层（星空 + 三条轨道环）
 *
 * 不用 Three.js：开场要在页面一打开就动起来，而 Three.js 本身要下载几百 KB。
 * 这里是手写的透视投影，画在两张 2D canvas 上：
 * - back：星空和轨道环的大部分，在头像后面
 * - front：轨道环转到头像前面、并且正好挡在头像圆盘上的那一段
 * 这样环看起来是真的绕着头像转。
 *
 * 每条环对应一项真实的加载内容（bgm / photo / muse）。
 * 没加载好时是一团散开的粒子，lock(key) 后聚拢成环并闪一下绿色。
 *
 * 性能：
 * - 粒子按透明度分到 10 个桶里，每个桶一次 path + 一次 fill，绘制调用只有二十几次
 * - canvas 分辨率最多 1.5 倍
 * - 连续一秒多掉帧会自动减半粒子
 */

export type RingKey = 'bgm' | 'photo' | 'muse'

export interface IntroFx {
  start(): void
  lock(key: RingKey, offset?: number): void
  warp(): void
  destroy(): void
}

interface RingDef { key: RingKey; r: number; tilt: number; roll: number; spin: number; n: number }
interface Pt { a: number; th: number; lx: number; ly: number; lz: number; lr: number; ph: number; delay: number; s: number }
interface Ring extends RingDef { pts: Pt[] }
interface Star { x: number; y: number; z: number; px: number | null; py: number | null; m: number; b: number; tw: number; ph: number }

const RINGS: RingDef[] = [
  { key: 'bgm',   r: 128, tilt: 1.22, roll:  0.62, spin:  0.55, n: 240 },
  { key: 'photo', r: 150, tilt: 1.28, roll: -0.62, spin: -0.42, n: 270 },
  { key: 'muse',  r: 172, tilt: 1.42, roll:  0.0,  spin:  0.32, n: 300 },
]
const F = 760          // 焦距
const D = 760          // 相机距离
const BASE_SIZE = 176  // 设计时头像窗口的直径，环的半径按它缩放
const LV = 10          // 透明度分桶数
const STAR_COUNT = 1100

const rnd = (a: number, b: number) => a + Math.random() * (b - a)
const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3)
const lvl = (a: number) => Math.max(0, Math.min(LV - 1, Math.round(a * (LV - 1))))

export function createIntroFx(back: HTMLCanvasElement, front: HTMLCanvasElement, win: HTMLElement): IntroFx {
  const bc = back.getContext('2d')!
  const fc = front.getContext('2d')!
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let rings: Ring[] = []
  let stars: Star[] = []
  let lockAt: Partial<Record<RingKey, number>> = {}
  let flashAt: Partial<Record<RingKey, number>> = {}
  let warpAt: number | null = null
  let w = 0, h = 0, dpr = 1
  const ptr = { x: 0, y: 0 }
  const sway = { x: 0, y: 0 }
  let t0 = performance.now()
  let running = false
  let raf = 0
  let rect: { cx: number; cy: number; wd: number } | null = null
  let frameNo = 0, lastT = 0, slowFrames = 0, lite = false
  let stopTimer: ReturnType<typeof setTimeout> | null = null

  const mk = () => Array.from({ length: LV }, () => [] as number[])
  const buckets = { b: mk(), f: mk() }
  const green = { b: [] as number[], f: [] as number[] }
  const streaks = mk()

  function reset() {
    lockAt = {}; flashAt = {}; warpAt = null
    rings = RINGS.map(R => ({
      ...R,
      pts: Array.from({ length: R.n }, (_, i) => ({
        a: (i / R.n) * Math.PI * 2 + rnd(-0.02, 0.02),
        th: rnd(-3, 3),                                       // 环的厚度
        lx: rnd(-1, 1), ly: rnd(-1, 1), lz: rnd(-1, 1),       // 散开时的位置
        lr: rnd(220, 520), ph: rnd(0, 6.28),
        delay: rnd(0, 420),
        s: rnd(0.6, 1.4),
      })),
    }))
    // 大部分是细碎的小星点，约 5% 是会闪烁的大亮星
    stars = Array.from({ length: STAR_COUNT }, () => {
      const big = Math.random() < 0.05
      return {
        x: rnd(-1600, 1600), y: rnd(-1000, 1000), z: rnd(60, 2200), px: null, py: null,
        m: big ? rnd(1.8, 2.6) : rnd(0.6, 1.2), b: big ? 1.6 : rnd(0.6, 1), tw: rnd(1.5, 4), ph: rnd(0, 6.28),
      }
    })
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    w = window.innerWidth; h = window.innerHeight
    for (const c of [back, front]) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr) }
    bc.setTransform(dpr, 0, 0, dpr, 0, 0)
    fc.setTransform(dpr, 0, 0, dpr, 0, 0)
    rect = null
  }

  function measure() {
    const r = win.getBoundingClientRect()
    rect = { cx: r.left + r.width / 2, cy: r.top + r.height / 2, wd: r.width || BASE_SIZE }
  }

  function push(list: number[], x: number, y: number, sz: number) { list.push(x - sz / 2, y - sz / 2, sz) }

  function flushRects(ctx: CanvasRenderingContext2D, list: number[], style: string) {
    if (!list.length) return
    ctx.fillStyle = style
    ctx.beginPath()
    for (let i = 0; i < list.length; i += 3) ctx.rect(list[i], list[i + 1], list[i + 2], list[i + 2])
    ctx.fill()
    list.length = 0
  }

  function frame(now: number) {
    if (!running) return
    raf = requestAnimationFrame(frame)
    if (!rect || frameNo++ % 30 === 0) measure()
    const dt = lastT ? Math.min(0.05, (now - lastT) / 1000) : 1 / 60
    // 弱设备：连续一秒多掉帧，粒子减半
    if (!lite && lastT && now - lastT > 26 && ++slowFrames > 40) {
      lite = true
      rings.forEach(R => { R.pts = R.pts.filter((_, i) => i % 2 === 0) })
      stars = stars.filter((_, i) => i % 2 === 0)
    }
    lastT = now

    const t = (now - t0) / 1000
    const { cx, cy } = rect!
    const k = rect!.wd / BASE_SIZE
    const winR = rect!.wd / 2 - 10
    const warp = warpAt == null ? 0 : ease((now - warpAt) / 1100)

    sway.x += (ptr.y * 0.28 - sway.x) * 0.05
    sway.y += (ptr.x * 0.45 - sway.y) * 0.05
    const cX = Math.cos(sway.x), sX = Math.sin(sway.x), cY = Math.cos(sway.y), sY = Math.sin(sway.y)

    bc.clearRect(0, 0, w, h)
    fc.clearRect(0, 0, w, h)

    // ---- 星空：缓慢朝你飘来，穿越时拉成光线
    const speed = reduce ? 0 : 30 + warp * 4200
    const streaking = warp > 0.05
    for (const st of stars) {
      st.z -= speed * dt
      if (st.z < 20) { st.z = 2200; st.x = rnd(-1600, 1600); st.y = rnd(-1000, 1000); st.px = null }
      const sc = F / st.z
      const x = cx + (st.x - sway.y * 300) * sc
      const y = cy + (st.y + sway.x * 300) * sc
      const twinkle = reduce ? 1 : 0.7 + 0.3 * Math.sin(t * st.tw + st.ph)
      const a = Math.min(1, Math.min(1, (2200 - st.z) / 900) * 0.68 * st.b * twinkle)
      if (streaking && st.px != null && st.py != null) streaks[lvl(a)].push(st.px, st.py, x, y)
      else if (x > -4 && x < w + 4 && y > -4 && y < h + 4) push(buckets.b[lvl(a)], x, y, Math.max(0.6, sc * 1.1 * st.m))
      st.px = x; st.py = y
    }

    // ---- 轨道环
    const W = 1 + warp * 7
    for (const R of rings) {
      const L = lockAt[R.key]
      const spin = reduce ? 0 : t * R.spin
      const fa = flashAt[R.key]
      const flash = fa != null && now >= fa ? Math.max(0, 1 - (now - fa) / 900) : 0
      const ct = Math.cos(R.tilt), stl = Math.sin(R.tilt), cr = Math.cos(R.roll), sr = Math.sin(R.roll)
      let head: { a: number; sx: number; sy: number; sc: number; ctx: CanvasRenderingContext2D } | null = null

      for (const p of R.pts) {
        const e = L == null ? 0 : ease((now - L - p.delay) / 900)
        // 环上的目标位置：先绕 X 轴倾斜，再在屏幕上绕 Z 轴转一个角度
        const a = p.a + spin, rr = (R.r + p.th) * k, ca = Math.cos(a), sa = Math.sin(a)
        const px0 = ca * rr, py0 = sa * rr * ct, tz = sa * rr * stl
        const tx = px0 * cr - py0 * sr, ty = px0 * sr + py0 * cr
        // 散开时：一团缓慢旋转的粒子云
        const lt = t * 0.12 + p.ph, cl = Math.cos(lt), sl = Math.sin(lt)
        const lx = (p.lx * cl + p.lz * sl) * p.lr * k
        const lz = (-p.lx * sl + p.lz * cl) * p.lr * k
        const ly = p.ly * p.lr * 0.55 * k + Math.sin(t + p.ph) * 6
        const x = (lx + (tx - lx) * e) * W
        const y = (ly + (ty - ly) * e) * W
        const z = (lz + (tz - lz) * e) * W - warp * 600
        // 鼠标视差
        const y1 = y * cX - z * sX, z1 = y * sX + z * cX
        const x2 = x * cY + z1 * sY, z2 = -x * sY + z1 * cY
        const zz = z2 + D
        if (zz < 30) continue
        const sc = F / zz
        const sx = cx + x2 * sc, sy = cy + y1 * sc
        if (sx < -6 || sx > w + 6 || sy < -6 || sy > h + 6) continue
        const alpha = (L == null ? 0.22 : 0.22 + 0.6 * e) * Math.min(1, sc * 1.1) * (1 - warp * 0.6)
        const size = (L == null ? 1.1 : 1.1 + 0.5 * e) * p.s * sc
        // 比头像更近、并且落在头像圆盘上，才画到前面那张 canvas
        const side = z2 < 0 && (sx - cx) ** 2 + (sy - cy) ** 2 < winR * winR ? 'f' : 'b'
        if (flash > 0 && e > 0.5) push(green[side], sx, sy, size)
        else push(buckets[side][lvl(alpha)], sx, sy, size)
        if (e > 0.98 && (!head || p.a > head.a)) head = { a: p.a, sx, sy, sc, ctx: side === 'f' ? fc : bc }
      }

      if (flash > 0) {
        const g = `rgba(159,216,164,${Math.min(1, 0.5 + flash * 0.5)})`
        flushRects(bc, green.b, g)
        flushRects(fc, green.f, g)
      }
      // 每条环上跑着的一颗亮点
      if (head && L != null && warp < 0.3) {
        const r = 9 * head.sc
        const g = head.ctx.createRadialGradient(head.sx, head.sy, 0, head.sx, head.sy, r)
        g.addColorStop(0, 'rgba(255,255,255,.95)')
        g.addColorStop(1, 'rgba(255,255,255,0)')
        head.ctx.fillStyle = g
        head.ctx.beginPath()
        head.ctx.arc(head.sx, head.sy, r, 0, Math.PI * 2)
        head.ctx.fill()
      }
    }

    for (let i = 0; i < LV; i++) {
      const style = `rgba(255,255,255,${(i / (LV - 1)).toFixed(2)})`
      flushRects(bc, buckets.b[i], style)
      flushRects(fc, buckets.f[i], style)
      const sl = streaks[i]
      if (sl.length) {
        bc.strokeStyle = style
        bc.lineWidth = 1.3
        bc.beginPath()
        for (let j = 0; j < sl.length; j += 4) { bc.moveTo(sl[j], sl[j + 1]); bc.lineTo(sl[j + 2], sl[j + 3]) }
        bc.stroke()
        sl.length = 0
      }
    }
  }

  const onPointer = (e: PointerEvent) => {
    ptr.x = (e.clientX / window.innerWidth) * 2 - 1
    ptr.y = (e.clientY / window.innerHeight) * 2 - 1
  }
  window.addEventListener('resize', resize)
  window.addEventListener('pointermove', onPointer, { passive: true })
  resize()
  reset()

  return {
    start() {
      reset()
      rect = null; lastT = 0; slowFrames = 0; lite = false
      t0 = performance.now()
      if (!running) { running = true; raf = requestAnimationFrame(frame) }
    },
    lock(key, offset = 0) {
      if (lockAt[key] != null) return
      lockAt[key] = performance.now() + offset
      flashAt[key] = lockAt[key]! + 500
    },
    warp() {
      warpAt = performance.now()
      stopTimer = setTimeout(() => { running = false }, 1400)
    },
    destroy() {
      running = false
      cancelAnimationFrame(raf)
      if (stopTimer) clearTimeout(stopTimer)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onPointer)
    },
  }
}
