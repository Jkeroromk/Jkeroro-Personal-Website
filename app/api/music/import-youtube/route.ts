import { NextRequest, NextResponse } from 'next/server'
import ytDlp from 'yt-dlp-exec'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/supabase'

export const maxDuration = 300

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
  try {
    const { url } = await request.json()
    const videoId = url ? extractVideoId(url) : null
    if (!videoId) {
      return NextResponse.json({ error: '请输入有效的 YouTube 链接' }, { status: 400 })
    }

    // Use clean URL to avoid playlist params
    const cleanUrl = `https://www.youtube.com/watch?v=${videoId}`

    // 1. Get metadata via YouTube oEmbed
    const oembedRes = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`
    )
    if (!oembedRes.ok) {
      return NextResponse.json({ error: '无法获取视频信息，请检查链接是否有效' }, { status: 400 })
    }
    const oembed = await oembedRes.json()
    const { title, artist } = parseVideoTitle(oembed.title, oembed.author_name)

    // 2. Use yt-dlp to get the best audio stream URL (no ffmpeg needed, no temp file)
    const info = await ytDlp(cleanUrl, {
      dumpSingleJson: true,
      format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio',
      noPlaylist: true,
      noCheckCertificate: true,
    }) as any

    const audioUrl: string = info.url
    const ext: string = info.ext || 'm4a'

    if (!audioUrl) {
      return NextResponse.json({ error: '未获取到音频地址' }, { status: 500 })
    }

    // 3. Download audio (strip Set-Cookie to prevent __cf_bm browser warnings)
    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': info.http_headers?.['User-Agent'] || 'Mozilla/5.0',
        'Referer': 'https://www.youtube.com/',
      },
      signal: AbortSignal.timeout(240000),
    })
    if (!audioRes.ok) {
      return NextResponse.json({ error: `音频下载失败 (${audioRes.status})` }, { status: 500 })
    }
    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

    // 4. Upload to Supabase
    const supabase = createServerClient()
    const fileName = `${Date.now()}-${title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`
    const contentType = ext === 'm4a' ? 'audio/mp4' : 'audio/webm'

    const { error: uploadError } = await supabase.storage
      .from('audio')
      .upload(fileName, audioBuffer, { contentType, upsert: false })

    if (uploadError) {
      return NextResponse.json({ error: `上传失败: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(fileName)

    // 5. Create track record
    const maxOrder = await prisma.track.findFirst({ orderBy: { order: 'desc' }, select: { order: true } })
    const track = await prisma.track.create({
      data: {
        title,
        subtitle: artist,
        src: urlData.publicUrl,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error('YouTube import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败，请重试' },
      { status: 500 }
    )
  }
}
