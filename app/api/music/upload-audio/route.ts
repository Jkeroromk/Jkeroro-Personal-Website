import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { uploadToSupabase, generateFileName } from '@/lib/upload-to-supabase'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string | null)?.trim() || 'Unknown'
    const artist = (formData.get('artist') as string | null)?.trim() || 'Unknown'

    if (!file) {
      return NextResponse.json({ error: '请选择音频文件' }, { status: 400 })
    }

    const contentType = file.type || 'audio/mpeg'
    const fileName = generateFileName(file.name, title)
    const buffer = Buffer.from(await file.arrayBuffer())

    const { publicUrl } = await uploadToSupabase(buffer, fileName, contentType, 'audio')

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
