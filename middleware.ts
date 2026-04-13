import { NextRequest, NextResponse } from 'next/server'

// IP-based rate limiter running on Edge (more persistent than serverless)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

// Per-route rate limit rules
// { limit: max requests, windowMs: time window in ms }
const RATE_LIMITS: Array<{
  pattern: RegExp
  methods?: string[]
  limit: number
  windowMs: number
}> = [
  // AI/external API — most expensive, tightest limit
  { pattern: /^\/api\/ai$/,             limit: 5,  windowMs: 60_000 },
  { pattern: /^\/api\/chat/,  methods: ['POST'],   limit: 10, windowMs: 60_000 },

  // Lyrics proxy — prevents hammering LRCLIB
  { pattern: /^\/api\/lyrics\/search/,  limit: 30, windowMs: 60_000 },

  // Public write endpoints — spam prevention
  { pattern: /^\/api\/guestbook/,       methods: ['POST'], limit: 3, windowMs: 300_000 },
  { pattern: /^\/api\/comments/,        methods: ['POST'], limit: 5, windowMs: 60_000  },
  { pattern: /^\/api\/comments\/.*\/reactions/, methods: ['POST'], limit: 10, windowMs: 60_000 },

  // File uploads — prevent storage abuse
  { pattern: /^\/api\/upload/,          methods: ['POST'], limit: 5, windowMs: 60_000 },
  { pattern: /^\/api\/music\/upload-audio/, methods: ['POST'], limit: 3, windowMs: 60_000 },

  // Stats — prevent fake inflation
  { pattern: /^\/api\/stats/,           methods: ['POST'], limit: 20, windowMs: 60_000 },

  // Auth — brute force protection
  { pattern: /^\/api\/auth\/login/,     methods: ['POST'], limit: 5, windowMs: 300_000 },
]

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method
  const ip = getClientIp(request)

  for (const rule of RATE_LIMITS) {
    if (!rule.pattern.test(pathname)) continue
    if (rule.methods && !rule.methods.includes(method)) continue

    const key = `${pathname}:${ip}`
    if (!checkRateLimit(key, rule.limit, rule.windowMs)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil(rule.windowMs / 1000)) },
        }
      )
    }
    break
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}
