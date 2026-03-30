import { NextRequest, NextResponse } from 'next/server'

// LRCLIB - 免费开源歌词 API，无需 key
// https://lrclib.net/docs

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    // 先尝试精确匹配
    const exactUrl = new URL('https://lrclib.net/api/get')
    exactUrl.searchParams.set('track_name', title)
    if (artist) exactUrl.searchParams.set('artist_name', artist)

    const exactRes = await fetch(exactUrl.toString(), {
      headers: { 'Lrclib-Client': 'Jkeroro-Personal-Website (https://github.com/Jkeroromk)' },
      next: { revalidate: 3600 },
    })

    if (exactRes.ok) {
      const data = await exactRes.json()
      if (data.syncedLyrics) {
        return NextResponse.json({ syncedLyrics: data.syncedLyrics, source: 'exact' })
      }
      if (data.plainLyrics) {
        return NextResponse.json({ plainLyrics: data.plainLyrics, source: 'exact' })
      }
    }

    // 精确匹配没有结果，尝试搜索
    const searchUrl = new URL('https://lrclib.net/api/search')
    searchUrl.searchParams.set('q', `${artist} ${title}`.trim())

    const searchRes = await fetch(searchUrl.toString(), {
      headers: { 'Lrclib-Client': 'Jkeroro-Personal-Website (https://github.com/Jkeroromk)' },
      next: { revalidate: 3600 },
    })

    if (searchRes.ok) {
      const results = await searchRes.json()
      if (Array.isArray(results) && results.length > 0) {
        // 优先找有 syncedLyrics 的结果
        const synced = results.find((r) => r.syncedLyrics)
        if (synced) {
          return NextResponse.json({ syncedLyrics: synced.syncedLyrics, source: 'search' })
        }
        const plain = results.find((r) => r.plainLyrics)
        if (plain) {
          return NextResponse.json({ plainLyrics: plain.plainLyrics, source: 'search' })
        }
      }
    }

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Lyrics fetch error:', error)
    return NextResponse.json({ error: '获取歌词失败' }, { status: 500 })
  }
}
