import { NextRequest, NextResponse } from 'next/server'

const FETCH_TIMEOUT_MS = 5000
const CACHE = { next: { revalidate: 86400 } } as const
// 网易云/QQ 音乐被风控或限流时照样返回 HTTP 200（错误码在 body 里），
// 不能进 Next 数据缓存，否则一次失败会被缓存 24 小时
const NO_CACHE = { cache: 'no-store' } as const

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

interface NeteaseSong {
  name?: string
  ar?: { name?: string }[]
  al?: { picUrl?: string }
}

interface QQTrack {
  name?: string
  singer?: { name?: string }[]
  album?: { mid?: string }
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
  if (!rt || !t) return false
  if (rt.includes(t) || t.includes(rt)) return true

  // 子串没对上时，按字符重叠率兜底：容错简繁体等个别字符差异
  // （例如数据库存的是繁体"客客氣氣"，平台索引的是简体"客客气气"）
  // 阈值定得高，避免把完全不同的曲目误判成匹配
  const [shorter, longer] = rt.length <= t.length ? [rt, t] : [t, rt]
  if (shorter.length < 4) return false
  let matched = 0
  for (const ch of shorter) {
    if (longer.includes(ch)) matched++
  }
  return matched / shorter.length >= 0.8
}

// 候选结果打分，用于挑最佳：曲名完全一致 > 包含，歌手完全一致 > 包含
function scoreMatch(resultTitle: string, resultArtist: string, title: string, artist: string): number {
  const rt = normalize(resultTitle)
  const ra = normalize(resultArtist)
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

// iTunes 默认给 100x100，换成更高清的尺寸
function upscaleItunes(url: string, size = 500): string {
  return url.replace(/\d+x\d+bb\.(jpg|png)$/, `${size}x${size}bb.$1`)
}

// country 为 iTunes 商店区域：美区收录欧美歌最全；国区接口搜不到东西，华语歌要走台区
async function searchItunes(title: string, artist: string, country: string): Promise<string | null> {
  try {
    const url = new URL('https://itunes.apple.com/search')
    url.searchParams.set('term', `${artist} ${title}`.trim())
    url.searchParams.set('entity', 'song')
    url.searchParams.set('limit', '10')
    url.searchParams.set('country', country)

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

    const score = (r: ItunesResult) => scoreMatch(r.trackName || '', r.artistName || '', title, artist)
    const best = candidates.reduce((prev, cur) => (score(cur) >= score(prev) ? cur : prev))
    return upscaleItunes(best.artworkUrl100!)
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

    const score = (t: DeezerTrack) => scoreMatch(t.title || '', t.artist?.name || '', title, artist)
    const best = candidates.reduce((prev, cur) => (score(cur) >= score(prev) ? cur : prev))
    return best.album?.cover_xl || best.album?.cover_big || null
  } catch {
    return null
  }
}

// 网易云音乐：华语曲库覆盖最全，歌手名多为"中文 英文"（如"鹤 The Crane"），
// 能对上数据库里的中文歌手名（iTunes 上同一歌手只有英文名 "The Crane"）
async function searchNetease(title: string, artist: string): Promise<string | null> {
  try {
    const url = new URL('https://music.163.com/api/cloudsearch/pc')
    url.searchParams.set('s', `${artist} ${title}`.trim())
    url.searchParams.set('type', '1') // 1 = 单曲
    url.searchParams.set('limit', '10')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Referer: 'https://music.163.com/', 'User-Agent': 'Mozilla/5.0' },
      ...NO_CACHE,
    })
    if (!res.ok) return null

    const data = await res.json()
    const songs: NeteaseSong[] = Array.isArray(data?.result?.songs) ? data.result.songs : []
    const withArt = songs.filter(s => s.al?.picUrl)
    if (!withArt.length) return null

    const candidates = withArt.filter(
      s =>
        titleMatches(s.name || '', title) &&
        (!artist || (s.ar || []).some(a => artistMatches(a.name || '', artist)))
    )
    if (!candidates.length) return null

    const score = (s: NeteaseSong) =>
      scoreMatch(s.name || '', (s.ar || []).map(a => a.name || '').join(''), title, artist)
    const best = candidates.reduce((prev, cur) => (score(cur) >= score(prev) ? cur : prev))
    // 接口给的是 http 原图，换成 https，并让图床缩放到 500x500
    return `${best.al!.picUrl!.replace(/^http:/, 'https:')}?param=500y500`
  } catch {
    return null
  }
}

// QQ 音乐兜底。旧接口 c.y.qq.com/soso/fcgi-bin/client_search_cp 已下线（一律返回 500），
// 改用网页版在用的 musicu.fcg；它有频率限制，被限时返回 req.code 2001、结果为空
async function searchQQMusic(title: string, artist: string): Promise<string | null> {
  try {
    const res = await fetch('https://u.y.qq.com/cgi-bin/musicu.fcg', {
      method: 'POST',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: {
        Referer: 'https://y.qq.com/',
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comm: { ct: 19, cv: 1859, uin: '0' },
        req: {
          module: 'music.search.SearchCgiService',
          method: 'DoSearchForQQMusicDesktop',
          param: { query: `${artist} ${title}`.trim(), search_type: 0, page_num: 1, num_per_page: 10, grp: 1 },
        },
      }),
      ...NO_CACHE,
    })
    if (!res.ok) return null

    const data = await res.json()
    const list = data?.req?.data?.body?.song?.list
    const tracks: QQTrack[] = Array.isArray(list) ? list : []
    const withArt = tracks.filter(t => t.album?.mid)
    if (!withArt.length) return null

    const candidates = withArt.filter(
      t =>
        titleMatches(t.name || '', title) &&
        (!artist || (t.singer || []).some(s => artistMatches(s.name || '', artist)))
    )
    if (!candidates.length) return null

    const score = (t: QQTrack) =>
      scoreMatch(t.name || '', (t.singer || []).map(s => s.name || '').join(''), title, artist)
    const best = candidates.reduce((prev, cur) => (score(cur) >= score(prev) ? cur : prev))
    return `https://y.gtimg.cn/music/photo_new/T002R500x500M000${best.album!.mid}.jpg`
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
    // 官方接口优先：iTunes 美区 → iTunes 台区 → Deezer；
    // 再用华语曲库兜底：网易云 → QQ 音乐（非官方接口，可能被风控，所以放最后）
    const artwork =
      (await searchItunes(title, artist, 'US')) ??
      (await searchItunes(title, artist, 'TW')) ??
      (await searchDeezer(title, artist)) ??
      (await searchNetease(title, artist)) ??
      (await searchQQMusic(title, artist))
    if (artwork) return NextResponse.json({ artwork })

    return NextResponse.json({ found: false })
  } catch (error) {
    console.error('Cover art fetch error:', error)
    return NextResponse.json({ error: '获取封面失败' }, { status: 500 })
  }
}
