import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { createServerClient } from '@/supabase'

/**
 * 音频已经由浏览器直接传到 Storage（见 lib/upload-direct.ts），这里只负责建歌曲记录。
 * 请求体：{ path, title, artist }，path 是 /api/upload/sign 返回的文件路径
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const body = await request.json().catch(() => ({}))
    const path = typeof body?.path === 'string' ? body.path : ''
    const title = (typeof body?.title === 'string' ? body.title.trim() : '') || 'Unknown'
    const artist = (typeof body?.artist === 'string' ? body.artist.trim() : '') || 'Unknown'

    // 只接受 /api/upload/sign 生成的那种文件名，且必须真的已经传上去了
    if (!/^[\w.-]+$/.test(path) || path.startsWith('.')) {
      return NextResponse.json({ error: '文件路径无效' }, { status: 400 })
    }
    const supabase = createServerClient()
    const { data: found, error: listError } = await supabase.storage
      .from('audio')
      .list('', { search: path, limit: 10 })
    if (listError) throw new Error(listError.message)
    if (!found?.some((f) => f.name === path)) {
      return NextResponse.json({ error: '没找到上传的文件，请重新上传' }, { status: 400 })
    }

    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(path)

    const { prisma } = await import('@/lib/prisma')
    const maxOrder = await prisma.track.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
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
    console.error('Upload audio error:', error)
    return NextResponse.json({ error: '保存歌曲失败，请重试' }, { status: 500 })
  }
}
