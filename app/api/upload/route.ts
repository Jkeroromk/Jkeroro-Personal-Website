import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { requireAuth } from '@/lib/requireAuth'
import { uploadToSupabase, generateFileName, UploadBucket } from '@/lib/upload-to-supabase'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File too large. Maximum size is 10MB.' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: JPG, PNG, WEBP, MP3, WAV, OGG' }, { status: 400 })
    }

    const bucket: UploadBucket = file.type.startsWith('image/') ? 'images' : 'audio'
    const fileName = generateFileName(file.name)
    const buffer = Buffer.from(await file.arrayBuffer())

    try {
      const { publicUrl } = await uploadToSupabase(buffer, fileName, file.type, bucket)
      return NextResponse.json({ success: true, fileName, filePath: publicUrl, isSupabase: true })
    } catch (supabaseError) {
      console.error('Supabase Storage upload failed:', supabaseError)

      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          success: false,
          error: 'File upload failed. Please try again later.',
          details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error',
        }, { status: 500 })
      }

      // 开发环境本地回退
      const uploadsDir = join(process.cwd(), 'public', 'uploads')
      if (!existsSync(uploadsDir)) await mkdir(uploadsDir, { recursive: true })
      const localPath = join(uploadsDir, fileName)
      await writeFile(localPath, buffer)
      return NextResponse.json({ success: true, fileName, filePath: `/uploads/${fileName}`, isSupabase: false })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
