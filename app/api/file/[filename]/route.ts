import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    // 在生产环境中，文件存储在 /tmp/uploads 目录
    const isProduction = process.env.NODE_ENV === 'production'
    const uploadsDir = isProduction 
      ? join(tmpdir(), 'uploads')
      : join(process.cwd(), 'public', 'uploads')
    
    const filePath = join(uploadsDir, filename)
    
    try {
      // 读取文件
      const fileBuffer = await readFile(filePath)
      
      // 根据文件扩展名确定MIME类型
      const getMimeType = (filename: string) => {
        const ext = filename.toLowerCase().split('.').pop()
        switch (ext) {
          case 'jpg':
          case 'jpeg':
            return 'image/jpeg'
          case 'png':
            return 'image/png'
          case 'webp':
            return 'image/webp'
          case 'gif':
            return 'image/gif'
          case 'mp3':
            return 'audio/mpeg'
          case 'wav':
            return 'audio/wav'
          case 'ogg':
            return 'audio/ogg'
          default:
            return 'application/octet-stream'
        }
      }
      
      const mimeType = getMimeType(filename)
      
      // 返回文件内容
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': mimeType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': fileBuffer.length.toString(),
        },
      })
      
    } catch (fileError) {
      console.error('File not found:', filePath, fileError)
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
    
  } catch (error) {
    console.error('File API error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
