// SSE 流式进度：边处理边推送进度到客户端
// youtubei.js (Innertube) 提取 URL → 流式下载 → 上传到 Supabase Storage

import { NextRequest, NextResponse } from 'next/server'
import { Innertube } from 'youtubei.js'

export const maxDuration = 60

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([^&]+)/,
    /youtu\.be\/([^?&]+)/,
    /embed\/([^?&]+)/,
    /shorts\/([^?&]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function parseVideoTitle(videoTitle: string, channelName: string) {
  const clean = (s: string) =>
    s.replace(/\s*[\(\[][^\)\]]*[\)\]]/g, '')
      .replace(/\s*(feat\.|ft\.|with\s+)\s*.*/i, '')
      .trim()
  const dashMatch = videoTitle.match(/^(.+?)\s*[-–—]\s*(.+)$/)
  if (dashMatch) return { title: clean(dashMatch[2]), artist: clean(dashMatch[1]) }
  return { title: clean(videoTitle), artist: channelName }
}

export async function POST(request: NextRequest) {
  let videoId: string | null = null
  try {
    const body = await request.json()
    videoId = body.url ? extractVideoId(body.url) : null
  } catch {
    return NextResponse.json({ error: '请求格式错误' }, { status: 400 })
  }

  if (!videoId) {
    return NextResponse.json({ error: '请输入有效的 YouTube 链接' }, { status: 400 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {}
      }

      try {
        // 1. 获取视频信息（用 ANDROID 客户端获取不加密的直链）
        send({ progress: 3, message: '获取视频信息...' })
        const yt = await Innertube.create({ retrieve_player: false })
        const info = await yt.getBasicInfo(videoId!, { client: 'ANDROID' })

        const videoTitle = info.basic_info.title ?? ''
        const channelName = info.basic_info.author ?? ''
        const { title, artist } = parseVideoTitle(videoTitle, channelName)

        // 2. 选择最佳音频格式
        send({ progress: 8, message: '解析音频地址...' })
        const formats = info.streaming_data?.adaptive_formats ?? []
        const audioFormats = formats
          .filter((f) => f.has_audio && !f.has_video)
          .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0))

        const format = audioFormats[0]
        if (!format?.url) throw new Error('未获取到音频地址')

        const mimeType = format.mime_type ?? 'audio/webm'
        const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
        const contentType = mimeType.split(';')[0]

        // 3. 下载音频
        send({ progress: 12, message: '开始下载...' })
        const audioRes = await fetch(format.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36',
            'Referer': 'https://www.youtube.com/',
          },
        })
        if (!audioRes.ok) throw new Error(`音频下载失败 (${audioRes.status})`)

        const contentLength = parseInt(audioRes.headers.get('content-length') || '0')
        const chunks: Uint8Array[] = []
        let downloaded = 0
        const reader = audioRes.body!.getReader()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          chunks.push(value)
          downloaded += value.length
          const pct = contentLength > 0
            ? Math.round(12 + (downloaded / contentLength) * 68)
            : Math.min(12 + Math.floor(downloaded / 80000), 79)
          send({
            progress: pct,
            downloaded,
            total: contentLength || 0,
            message: contentLength > 0
              ? `下载中 ${(downloaded / 1048576).toFixed(1)} / ${(contentLength / 1048576).toFixed(1)} MB`
              : `下载中 ${(downloaded / 1048576).toFixed(1)} MB...`,
          })
        }

        // 4. 上传到 Supabase Storage
        send({ progress: 82, message: '上传音频...' })
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)
        const fileName = `${Date.now()}-${safeTitle}.${ext}`

        const totalLen = chunks.reduce((s, c) => s + c.length, 0)
        const bodyArr = new Uint8Array(totalLen)
        let off = 0
        for (const c of chunks) { bodyArr.set(c, off); off += c.length }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        const uploadRes = await fetch(
          `${supabaseUrl}/storage/v1/object/audio/${fileName}`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${serviceRoleKey}`,
              'Content-Type': contentType,
            },
            body: bodyArr,
          }
        )

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({})) as { message?: string }
          throw new Error(`上传失败: ${err.message || uploadRes.status}`)
        }

        const publicUrl = `${supabaseUrl}/storage/v1/object/public/audio/${fileName}`
        send({ stage: 'done', progress: 100, publicUrl, title, artist, message: '导入完成！' })

      } catch (error) {
        send({ stage: 'error', error: error instanceof Error ? error.message : '导入失败' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  })
}
