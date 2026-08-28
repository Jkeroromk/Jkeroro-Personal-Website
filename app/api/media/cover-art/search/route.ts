import { NextRequest, NextResponse } from 'next/server'

// iTunes Search API — 免费，无需 key，按歌名 + 歌手匹配专辑封面
// https://performance-partners.apple.com/search-api
const FETCH_TIMEOUT_MS = 5000
const CACHE = { next: { revalidate: 86400 } } as const // 封面基本不变，缓存一天

interface ItunesResult {
  artworkUrl100?: string
}

// iTunes 默认给 100x100 缩略图，换成更高清的尺寸
function upscaleArtwork(url: string, size = 600): string {
  return url.replace(/\d+x\d+bb\.(jpg|png)$/, `${size}x${size}bb.$1`)
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', `${artist} ${title}`.trim())
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '5')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      ...CACHE,
    })
    if (!res.ok) return NextResponse.json({ found: false })

    const data = await res.json()
    const results: ItunesResult[] = Array.isArray(data?.results) ? data.results : []
    const match = results.find(r => r.artworkUrl100)

    if (!match?.artworkUrl100) return NextResponse.json({ found: false })

    return NextResponse.json({ artwork: upscaleArtwork(match.artworkUrl100) })
  } catch (error) {
    console.error('Cover art fetch error:', error)
    return NextResponse.json({ error: '获取封面失败' }, { status: 500 })
  }
}
