/**
 * /api/chat 限流
 * - 每个 IP：每分钟、每天各有上限
 * - 全站：每天总上限（预算保险丝，防止被刷爆账单）
 * 记录存在数据库 chat_usage 表（只存 IP 的哈希）；数据库不可用时退回到内存计数（单实例内有效）。
 * 上限都可以用环境变量调整。
 */
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'

const num = (v: string | undefined, d: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? n : d
}

export const LIMITS = {
  perMinute: num(process.env.CHAT_LIMIT_PER_MINUTE, 6),
  perDay: num(process.env.CHAT_LIMIT_PER_DAY, 40),
  globalPerDay: num(process.env.CHAT_LIMIT_GLOBAL_PER_DAY, 400),
}

const MINUTE = 60_000
const DAY = 86_400_000

export type LimitResult =
  | { ok: true }
  | { ok: false; reason: 'minute' | 'day' | 'global'; retryAfter: number }

export function getClientIp(headers: Headers): string {
  // Vercel 会把真实客户端 IP 放在 x-forwarded-for 第一个（并覆盖客户端自己传的值）
  const xff = headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return headers.get('x-real-ip') || 'unknown'
}

function hashIp(ip: string) {
  const salt = process.env.RATE_LIMIT_SALT || 'jkeroro-muse'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32)
}

/* ---------- 内存兜底（数据库出错时用） ---------- */
const memory = new Map<string, number[]>()
const memoryGlobal: number[] = []

function memoryCheck(ipHash: string, now: number): LimitResult {
  const hits = (memory.get(ipHash) ?? []).filter((t) => now - t < DAY)
  while (memoryGlobal.length && now - memoryGlobal[0] > DAY) memoryGlobal.shift()

  if (memoryGlobal.length >= LIMITS.globalPerDay) return { ok: false, reason: 'global', retryAfter: 3600 }
  if (hits.length >= LIMITS.perDay) return { ok: false, reason: 'day', retryAfter: 3600 }
  if (hits.filter((t) => now - t < MINUTE).length >= LIMITS.perMinute) {
    return { ok: false, reason: 'minute', retryAfter: 60 }
  }

  hits.push(now)
  memory.set(ipHash, hits)
  memoryGlobal.push(now)
  if (memory.size > 5000) memory.clear()
  return { ok: true }
}

/** 检查并记录一次请求；超限时返回原因 */
export async function checkChatLimit(ip: string): Promise<LimitResult> {
  const ipHash = hashIp(ip)
  const now = Date.now()

  try {
    const [minute, day, global] = await Promise.all([
      prisma.chatUsage.count({ where: { ipHash, createdAt: { gte: new Date(now - MINUTE) } } }),
      prisma.chatUsage.count({ where: { ipHash, createdAt: { gte: new Date(now - DAY) } } }),
      prisma.chatUsage.count({ where: { createdAt: { gte: new Date(now - DAY) } } }),
    ])

    if (global >= LIMITS.globalPerDay) return { ok: false, reason: 'global', retryAfter: 3600 }
    if (day >= LIMITS.perDay) return { ok: false, reason: 'day', retryAfter: 3600 }
    if (minute >= LIMITS.perMinute) return { ok: false, reason: 'minute', retryAfter: 60 }

    await prisma.chatUsage.create({ data: { ipHash } })

    // 偶尔清理两天前的记录
    if (Math.random() < 0.02) {
      prisma.chatUsage
        .deleteMany({ where: { createdAt: { lt: new Date(now - 2 * DAY) } } })
        .catch(() => {})
    }
    return { ok: true }
  } catch (error) {
    console.error('chat rate limit: database unavailable, using in-memory fallback', error)
    return memoryCheck(ipHash, now)
  }
}
