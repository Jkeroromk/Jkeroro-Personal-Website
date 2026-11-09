/**
 * 读取 iCloud 共享相簿（需要在 iPhone 上给相簿打开「公共网站」）。
 *
 * 用的是 icloud.com 网页版共享相簿自己调用的接口，Apple 没有公开文档，
 * 很多电子相框项目都靠它。万一 Apple 改了，同步会报错停下，已经同步到网站的照片不受影响。
 *
 * 流程：
 * 1. 链接 https://www.icloud.com/sharedalbum/#B0xxxx 里 # 后面是 token
 * 2. POST {base}/webstream → 相簿名 + 每张照片的 guid、各个尺寸（derivatives）
 *    第一次请求的服务器不对时，返回里会带 X-Apple-MMe-Host，换到那台服务器再请求一次
 * 3. POST {base}/webasseturls → 每个尺寸的临时下载地址（几个小时后失效，所以要下载下来存到 Supabase）
 */

const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
// 选这个尺寸以内最大的一档，首页和纪念日轮播都够用，文件也不会太大
const TARGET_SIDE = 2048

export interface AlbumPhoto {
  guid: string
  checksum: string
  width: number
  height: number
  caption: string
  takenAt: string | null
}

export interface AlbumInfo {
  name: string
  photos: AlbumPhoto[]
  host: string
}

/** 从分享链接里取出 token；不是合法链接返回 null */
export function parseShareToken(input: string): string | null {
  const s = (input || '').trim()
  const fromHash = s.includes('#') ? s.split('#').pop()! : s
  const token = fromHash.split(/[?&;/]/)[0]
  return /^[A-Za-z0-9]{10,}$/.test(token) ? token : null
}

function base62(str: string) {
  let n = 0
  for (const c of str) n = n * 62 + BASE62.indexOf(c)
  return n
}

/** token 里编码了它所在的服务器分区，算错也没关系，服务器会告诉我们正确的那台 */
function guessHost(token: string) {
  const partition = token[0] === 'A' ? base62(token[1]) : base62(token.slice(1, 3))
  return `p${String(partition).padStart(2, '0')}-sharedstreams.icloud.com`
}

async function post<T>(host: string, token: string, path: string, body: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`https://${host}/${token}/sharedstreams/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  })
  const text = await res.text()
  let data: T
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`iCloud 返回了无法解析的内容 (${res.status})`)
  }
  return { status: res.status, data }
}

interface RawDerivative { checksum: string; fileSize: string; width: string; height: string }
interface RawPhoto {
  photoGuid: string
  mediaAssetType?: string
  caption?: string
  dateCreated?: string
  derivatives: Record<string, RawDerivative>
}
interface RawStream {
  streamName?: string
  photos?: RawPhoto[]
  'X-Apple-MMe-Host'?: string
}

function pickDerivative(photo: RawPhoto) {
  const list = Object.entries(photo.derivatives || {})
    .filter(([key]) => key !== 'PosterFrame')
    .map(([, d]) => ({ ...d, w: Number(d.width) || 0, h: Number(d.height) || 0 }))
    .filter((d) => d.checksum && d.w > 0 && d.h > 0)
  if (!list.length) return null
  const fits = list.filter((d) => Math.max(d.w, d.h) <= TARGET_SIDE)
  if (fits.length) return fits.reduce((a, b) => (Math.max(b.w, b.h) > Math.max(a.w, a.h) ? b : a))
  return list.reduce((a, b) => (Math.max(b.w, b.h) < Math.max(a.w, a.h) ? b : a))
}

/** 读相簿内容（只要照片，跳过视频） */
export async function fetchAlbum(token: string): Promise<AlbumInfo> {
  let host = guessHost(token)
  let { status, data } = await post<RawStream>(host, token, 'webstream', { streamCtag: null })

  const redirect = data['X-Apple-MMe-Host']
  if (redirect) {
    host = redirect
    ;({ status, data } = await post<RawStream>(host, token, 'webstream', { streamCtag: null }))
  }

  if (status === 404) throw new Error('找不到这个相簿：检查链接，或者确认相簿的「公共网站」开着')
  if (status >= 400 || !Array.isArray(data.photos)) {
    throw new Error(`读取相簿失败 (${status})，可能是「公共网站」没打开`)
  }

  const photos: AlbumPhoto[] = []
  for (const p of data.photos) {
    if (p.mediaAssetType === 'video') continue
    const d = pickDerivative(p)
    if (!d) continue
    photos.push({
      guid: p.photoGuid,
      checksum: d.checksum,
      width: d.w,
      height: d.h,
      caption: (p.caption || '').trim(),
      takenAt: p.dateCreated || null,
    })
  }
  return { name: data.streamName || 'iCloud Album', photos, host }
}

/** 拿一批照片的临时下载地址，返回 checksum → url */
export async function fetchAssetUrls(host: string, token: string, guids: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (let i = 0; i < guids.length; i += 25) {
    const { status, data } = await post<{ items?: Record<string, { url_location: string; url_path: string }> }>(
      host, token, 'webasseturls', { photoGuids: guids.slice(i, i + 25) }
    )
    if (status >= 400 || !data.items) throw new Error(`拿不到照片下载地址 (${status})`)
    for (const [checksum, item] of Object.entries(data.items)) {
      out[checksum] = `https://${item.url_location}${item.url_path}`
    }
  }
  return out
}
