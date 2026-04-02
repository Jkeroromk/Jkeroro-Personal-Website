import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null)?.trim() || 'Unknown'
    const artist = (formData.get('artist') as string | null)?.trim() || 'Unknown'

    if (!file) {
      return NextResponse.json({ error: '请选择音频文件' }, { status: 400 })
    }

    const contentType = file.type || 'audio/mpeg'
    const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3'
    const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)
    const fileName = `${Date.now()}-${safeTitle}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const bodyArr = new Uint8Array(arrayBuffer)

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
      return NextResponse.json({ error: `上传失败: ${err.message || uploadRes.status}` }, { status: 500 })
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/audio/${fileName}`

    // 保存到数据库
    const { prisma } = await import('@/lib/prisma')
    const maxOrder = await prisma.track.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    })
    const track = await prisma.track.create({
      data: {
        title,
        subtitle: artist,
        src: publicUrl,
        order: (maxOrder?.order ?? -1) + 1,
      },
    })

    return NextResponse.json(track)
  } catch (error) {
    console.error('Upload audio error:', error)
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 })
  }
}
