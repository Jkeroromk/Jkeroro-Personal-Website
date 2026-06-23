import { NextRequest, NextResponse } from 'next/server'

// LRCLIB - 免费开源歌词 API，无需 key
// https://lrclib.net/docs

const LRC_HEADERS = { 'Lrclib-Client': 'Jkeroro-Personal-Website (https://github.com/Jkeroromk)' }
const CACHE = { next: { revalidate: 3600 } } as const

interface LrcResult {
  syncedLyrics?: string
  plainLyrics?: string
  duration?: number
}

// 去掉标题里的版本备注（Live/Remix/feat. 等），提高 LRCLIB 命中率
function normalizeTitle(title: string): string {
  return title
    .replace(/[（(][^）)]*[）)]/g, '') // 去掉括号备注，如 (Live)、（伴奏）
    .replace(/[\[【][^\]】]*[\]】]/g, '') // 去掉方括号备注
    .replace(/\b(feat\.?|ft\.?)\s+.+$/i, '') // 去掉 feat./ft. 之后的内容
    .replace(/\s{2,}/g, ' ')
    .trim()
}

async function fetchJson<T>(url: URL): Promise<T | null> {
  return fetch(url.toString(), { headers: LRC_HEADERS, ...CACHE })
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
}

// 在候选结果中选出时长最接近的一个（避免选到 Live/Remix 等不同版本导致歌词错位）
function pickBest(candidates: LrcResult[], duration: number | null, key: 'syncedLyrics' | 'plainLyrics'): LrcResult | undefined {
  const matches = candidates.filter(c => c?.[key])
  if (matches.length === 0) return undefined
  if (!duration) return matches[0]

  let best = matches[0]
  let bestDiff = Math.abs((best.duration ?? duration) - duration)
  for (const m of matches.slice(1)) {
    const diff = Math.abs((m.duration ?? duration) - duration)
    if (diff < bestDiff) {
      best = m
      bestDiff = diff
    }
  }
  return best
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''
  const durationParam = parseFloat(searchParams.get('duration') || '')
  const duration = Number.isFinite(durationParam) && durationParam > 0 ? durationParam : null

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const normalizedTitle = normalizeTitle(title)
    const titleVariants = normalizedTitle && normalizedTitle !== title
      ? [title, normalizedTitle]
      : [title]

    const exactRequests: Promise<LrcResult | null>[] = []
    const searchRequests: Promise<LrcResult[] | null>[] = []
    for (const t of titleVariants) {
      const exactUrl = new URL('https://lrclib.net/api/get')
      exactUrl.searchParams.set('track_name', t)
      if (artist) exactUrl.searchParams.set('artist_name', artist)
      if (duration) exactUrl.searchParams.set('duration', String(Math.round(duration)))
      exactRequests.push(fetchJson<LrcResult>(exactUrl))

      const searchUrl = new URL('https://lrclib.net/api/search')
      searchUrl.searchParams.set('q', `${artist} ${t}`.trim())
      searchRequests.push(fetchJson<LrcResult[]>(searchUrl))
    }

    const [exactResults, searchResultsList] = await Promise.all([
      Promise.all(exactRequests),
      Promise.all(searchRequests),
    ])

    const candidates: LrcResult[] = []
    for (const exactData of exactResults) {
      if (exactData) candidates.push(exactData)
    }
    for (const searchResults of searchResultsList) {
      if (Array.isArray(searchResults)) candidates.push(...searchResults)
    }

    const synced = pickBest(candidates, duration, 'syncedLyrics')
    if (synced) return NextResponse.json({ syncedLyrics: synced.syncedLyrics })

    const plain = pickBest(candidates, duration, 'plainLyrics')
    if (plain) return NextResponse.json({ plainLyrics: plain.plainLyrics })

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Lyrics fetch error:', error)
    return NextResponse.json({ error: '获取歌词失败' }, { status: 500 })
  }
}
