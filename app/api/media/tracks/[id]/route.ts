import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/requireAuth'
import { removeUnusedFiles } from '@/lib/storage-cleanup'

// 更新音乐轨道
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  const { id } = await params
  try {
    const body = await request.json()
    const { title, subtitle, src, cover, order, lyricsOffset } = body

    const before = await prisma.track.findUnique({
      where: { id },
      select: { src: true, cover: true },
    })

    const track = await prisma.track.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(subtitle && { subtitle }),
        ...(src && { src }),
        ...(cover !== undefined && { cover: cover || null }),
        ...(order !== undefined && { order }),
        ...(lyricsOffset !== undefined && { lyricsOffset }),
      },
    })

    // 换了音频或封面：旧文件没别处在用就从 Storage 删掉
    const replaced = [
      before?.src !== track.src ? before?.src : null,
      before?.cover !== track.cover ? before?.cover : null,
    ]
    await removeUnusedFiles(replaced)

    return NextResponse.json(track)
  } catch (error) {
    console.error('Update track error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 详细错误日志
    console.error('Update track error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isPrismaError: errorMessage.includes('Prisma') || errorMessage.includes('Query Engine'),
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// 删除音乐轨道
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const { id } = await params
    
    // 添加连接超时保护
    const deleted = await Promise.race([
      prisma.track.delete({
        where: { id },
        select: { src: true, cover: true },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ])

    // 记录删掉后，把音频和封面从 Storage 里删掉（别的记录还在用的会保留）
    const removedFiles = await removeUnusedFiles([deleted.src, deleted.cover])

    return NextResponse.json({ success: true, removedFiles: removedFiles.length })
  } catch (error) {
    console.error('Delete track error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 详细错误日志
    console.error('Delete track error details:', {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isPrismaError: errorMessage.includes('Prisma') || errorMessage.includes('Query Engine'),
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

