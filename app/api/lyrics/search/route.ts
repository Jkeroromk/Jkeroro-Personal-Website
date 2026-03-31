import { NextRequest, NextResponse } from 'next/server'

// LRCLIB - 免费开源歌词 API，无需 key
// https://lrclib.net/docs

const LRC_HEADERS = { 'Lrclib-Client': 'Jkeroro-Personal-Website (https://github.com/Jkeroromk)' }
const CACHE = { next: { revalidate: 3600 } } as const

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    const exactUrl = new URL('https://lrclib.net/api/get')
    exactUrl.searchParams.set('track_name', title)
    if (artist) exactUrl.searchParams.set('artist_name', artist)

    const searchUrl = new URL('https://lrclib.net/api/search')
    searchUrl.searchParams.set('q', `${artist} ${title}`.trim())

    // 并行请求，不再串行等待
    const [exactData, searchResults] = await Promise.all([
      fetch(exactUrl.toString(), { headers: LRC_HEADERS, ...CACHE })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(searchUrl.toString(), { headers: LRC_HEADERS, ...CACHE })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ])

    // 优先级：精确syncedLyrics > 搜索syncedLyrics > 精确plainLyrics > 搜索plainLyrics
    if (exactData?.syncedLyrics)
      return NextResponse.json({ syncedLyrics: exactData.syncedLyrics })

    const syncedMatch = Array.isArray(searchResults) && searchResults.find(r => r.syncedLyrics)
    if (syncedMatch)
      return NextResponse.json({ syncedLyrics: syncedMatch.syncedLyrics })

    if (exactData?.plainLyrics)
      return NextResponse.json({ plainLyrics: exactData.plainLyrics })

    const plainMatch = Array.isArray(searchResults) && searchResults.find(r => r.plainLyrics)
    if (plainMatch)
      return NextResponse.json({ plainLyrics: plainMatch.plainLyrics })

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Lyrics fetch error:', error)
    return NextResponse.json({ error: '获取歌词失败' }, { status: 500 })
  }
}
