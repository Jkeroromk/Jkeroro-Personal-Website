import { NextRequest, NextResponse } from 'next/server'

const FETCH_TIMEOUT_MS = 5000
const CACHE = { next: { revalidate: 86400 } } as const

interface ItunesResult {
  trackName?: string
  artistName?: string
  artworkUrl100?: string
}

interface DeezerTrack {
  title?: string
  artist?: { name?: string }
  album?: { cover_xl?: string; cover_big?: string }
}

interface QQTrack {
  songname?: string
  singer?: { name?: string }[]
  albummid?: string
}

// 去除标点/空格后小写，用于模糊匹配（兼容中文 Unicode）
function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

// 判断歌手名是否在结果里有任意匹配（防止用错误歌手的封面）
function artistMatches(resultArtist: string, queryArtist: string): boolean {
  const ra = normalize(resultArtist)
  const a = normalize(queryArtist)
  return !!(ra && a && (ra.includes(a) || a.includes(ra)))
}

// 判断曲名是否匹配（防止歌手对了但曲目不对，选到同一歌手其他专辑的封面）
function titleMatches(resultTitle: string, queryTitle: string): boolean {
  const rt = normalize(resultTitle)
  const t = normalize(queryTitle)
  return !!(rt && t && (rt.includes(t) || t.includes(rt)))
}

// iTunes 默认给 100x100，换成更高清的尺寸
function upscaleItunes(url: string, size = 500): string {
  return url.replace(/\d+x\d+bb\.(jpg|png)$/, `${size}x${size}bb.$1`)
}

function scoreItunes(r: ItunesResult, title: string, artist: string): number {
  const rt = normalize(r.trackName || '')
  const ra = normalize(r.artistName || '')
  const t = normalize(title)
  const a = normalize(artist)
  let s = 0
  if (t && rt) {
    if (rt === t) s += 10
    else if (rt.includes(t) || t.includes(rt)) s += 5
  }
  if (a && ra) {
    if (ra === a) s += 6
    else if (ra.includes(a) || a.includes(ra)) s += 3
  }
  return s
}

function scoreDeezer(t: DeezerTrack, title: string, artist: string): number {
  const rt = normalize(t.title || '')
  const ra = normalize(t.artist?.name || '')
  const ti = normalize(title)
  const ar = normalize(artist)
  let s = 0
  if (ti && rt) {
    if (rt === ti) s += 10
    else if (rt.includes(ti) || ti.includes(rt)) s += 5
  }
  if (ar && ra) {
    if (ra === ar) s += 6
    else if (ra.includes(ar) || ar.includes(ra)) s += 3
  }
  return s
}

async function searchItunes(title: string, artist: string): Promise<string | null> {
  try {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', `${artist} ${title}`.trim())
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '10')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), ...CACHE })
    if (!res.ok) return null

    const data = await res.json()
    const results: ItunesResult[] = Array.isArray(data?.results) ? data.results : []
    const withArt = results.filter(r => r.artworkUrl100)
    if (!withArt.length) return null

    // 曲名和歌手（有给的话）都必须匹配，否则宁可空白也不返回错误封面
    const candidates = withArt.filter(
      r => titleMatches(r.trackName || '', title) && (!artist || artistMatches(r.artistName || '', artist))
    )
    if (!candidates.length) return null

    const best = candidates.reduce((prev, cur) =>
      scoreItunes(cur, title, artist) >= scoreItunes(prev, title, artist) ? cur : prev
    )
    return upscaleItunes(best.artworkUrl100!)
  } catch {
    return null
  }
}

function scoreQQ(t: QQTrack, title: string, artist: string): number {
  const rt = normalize(t.songname || '')
  const ra = normalize((t.singer || []).map(s => s.name || '').join(''))
  const ti = normalize(title)
  const ar = normalize(artist)
  let s = 0
  if (ti && rt) {
    if (rt === ti) s += 10
    else if (rt.includes(ti) || ti.includes(rt)) s += 5
  }
  if (ar && ra) {
    if (ra === ar) s += 6
    else if (ra.includes(ar) || ar.includes(ra)) s += 3
  }
  return s
}

// 中文曲库兜底（iTunes/Deezer 对国内歌曲覆盖差），走 QQ 音乐搜索
async function searchQQMusic(title: string, artist: string): Promise<string | null> {
  try {
    const url = new URL('https://c.y.qq.com/soso/fcgi-bin/client_search_cp')
    url.searchParams.set('w', `${artist} ${title}`.trim())
    url.searchParams.set('p', '1')
    url.searchParams.set('n', '10')
    url.searchParams.set('format', 'json')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Referer: 'https://y.qq.com/', 'User-Agent': 'Mozilla/5.0' },
      ...CACHE,
    })
    if (!res.ok) return null

    const data = await res.json()
    const tracks: QQTrack[] = Array.isArray(data?.data?.song?.list) ? data.data.song.list : []
    const withArt = tracks.filter(t => t.albummid)
    if (!withArt.length) return null

    const candidates = withArt.filter(
      t =>
        titleMatches(t.songname || '', title) &&
        (!artist || (t.singer || []).some(s => artistMatches(s.name || '', artist)))
    )
    if (!candidates.length) return null

    const best = candidates.reduce((prev, cur) =>
      scoreQQ(cur, title, artist) >= scoreQQ(prev, title, artist) ? cur : prev
    )
    return `https://y.gtimg.cn/music/photo_new/T002R500x500M000${best.albummid}.jpg`
  } catch {
    return null
  }
}

async function searchDeezer(title: string, artist: string): Promise<string | null> {
  try {
    // Deezer 支持字段限定搜索，命中率更高
    const q = artist ? `artist:"${artist}" track:"${title}"` : `track:"${title}"`
    const url = new URL('https://api.deezer.com/search')
    url.searchParams.set('q', q)
    url.searchParams.set('limit', '10')

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), ...CACHE })
    if (!res.ok) return null

    const data = await res.json()
    const tracks: DeezerTrack[] = Array.isArray(data?.data) ? data.data : []
    const withArt = tracks.filter(t => t.album?.cover_xl || t.album?.cover_big)
    if (!withArt.length) return null

    const candidates = withArt.filter(
      t => titleMatches(t.title || '', title) && (!artist || artistMatches(t.artist?.name || '', artist))
    )
    if (!candidates.length) return null

    const best = candidates.reduce((prev, cur) =>
      scoreDeezer(cur, title, artist) >= scoreDeezer(prev, title, artist) ? cur : prev
    )
    return best.album?.cover_xl || best.album?.cover_big || null
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || ''
  const artist = searchParams.get('artist') || ''

  if (!title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }

  try {
    // iTunes 优先，失败后 fallback 到 Deezer，再 fallback 到 QQ 音乐（覆盖中文曲库）
    const artwork =
      (await searchItunes(title, artist)) ??
      (await searchDeezer(title, artist)) ??
      (await searchQQMusic(title, artist))
    if (artwork) return NextResponse.json({ artwork })

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Cover art fetch error:', error)
    return NextResponse.json({ error: '获取封面失败' }, { status: 500 })
  }
}
