import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { createServerClient } from '@/supabase'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // 检查文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Allowed: JPG, PNG, WEBP, MP3, WAV, OGG' 
      }, { status: 400 })
    }

    // 优先使用 Supabase Storage
    try {
      // 检查环境变量
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set')
      }
      
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL environment variable is not set')
      }
      
      const supabase = createServerClient()
      
      // 生成唯一文件名
      const timestamp = Date.now()
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}-${cleanFileName}`
      
      // 确定存储桶（根据文件类型）
      const bucket = file.type.startsWith('image/') ? 'images' : 'audio'
      
      // 将文件转换为 ArrayBuffer
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      
      // 检查存储桶是否存在
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      if (bucketsError) {
        console.error('Failed to list buckets:', bucketsError)
        throw new Error(`Failed to access Supabase Storage: ${bucketsError.message}`)
      }
      
      const bucketExists = buckets?.some(b => b.name === bucket)
      if (!bucketExists) {
        const errorMsg = `Storage bucket "${bucket}" does not exist. Please create it in Supabase Dashboard (Storage > New bucket).`
        console.error(errorMsg)
        throw new Error(errorMsg)
      }
      
      // 上传到 Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          upsert: false, // 不覆盖已存在的文件
        })
      
      if (uploadError) {
        console.error('Supabase upload error details:', {
          message: uploadError.message,
          name: uploadError.name,
        })
        
        // 提供更友好的错误信息
        let errorMessage = uploadError.message
        if (uploadError.message.includes('new row violates row-level security')) {
          errorMessage = `Storage bucket "${bucket}" has RLS enabled. Please disable RLS or add a policy to allow uploads.`
        } else if (uploadError.message.includes('JWT')) {
          errorMessage = 'Authentication failed. Please check SUPABASE_SERVICE_ROLE_KEY.'
        } else if (uploadError.message.includes('permission') || uploadError.message.includes('denied')) {
          errorMessage = `Permission denied. Please check bucket "${bucket}" permissions in Supabase Dashboard.`
        }
        
        throw new Error(errorMessage)
      }
      
      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)
      
      return NextResponse.json({ 
        success: true, 
        fileName: fileName,
        filePath: urlData.publicUrl,
        isSupabase: true,
        message: 'File uploaded to Supabase Storage successfully'
      })
      
    } catch (supabaseError) {
      console.error('Supabase Storage upload failed:', supabaseError)
      
      // 如果 Supabase 上传失败，回退到本地存储
      const isProduction = process.env.NODE_ENV === 'production'
      
      if (isProduction) {
        // 生产环境不允许本地存储，返回错误
        return NextResponse.json({ 
          success: false, 
          error: 'File upload failed. Please try again later.',
          details: supabaseError instanceof Error ? supabaseError.message : 'Unknown error'
        }, { status: 500 })
      }
      
      // 开发环境：回退到本地存储
      try {
        const uploadsDir = join(process.cwd(), 'public', 'uploads')
        
        // 确保 uploads 目录存在
        if (!existsSync(uploadsDir)) {
          await mkdir(uploadsDir, { recursive: true })
        }
        
        // 生成唯一文件名
        const timestamp = Date.now()
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${cleanFileName}`
        const filePath = join(uploadsDir, fileName)
        
        // 保存文件
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
        
        return NextResponse.json({ 
          success: true, 
          fileName: fileName,
          filePath: `/uploads/${fileName}`,
          isSupabase: false,
          message: 'File saved locally (development mode)'
        })
      } catch (localError) {
        console.error('Local file save failed:', localError)
        return NextResponse.json({ 
          success: false, 
          error: 'Failed to save file locally',
          details: localError instanceof Error ? localError.message : 'Unknown error'
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
