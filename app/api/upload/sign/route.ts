import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { createServerClient } from '@/supabase'
import { generateFileName, UploadBucket } from '@/lib/upload-to-supabase'

/**
 * 发一个 Supabase Storage 的签名上传地址，浏览器拿到后直接把文件传到 Storage。
 *
 * 文件不经过这里：Vercel 函数的请求体上限是 4.5 MB，大一点的音频走函数会直接 413。
 * 这里只收文件名、类型和大小（几百字节），检查完发地址。地址只能上传这一个文件路径，2 小时内有效。
 */

const LIMITS: Record<UploadBucket, { maxBytes: number; types: RegExp }> = {
  audio: { maxBytes: 50 * 1024 * 1024, types: /^audio\// },
  images: { maxBytes: 20 * 1024 * 1024, types: /^image\// },
}

export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const body = await request.json().catch(() => ({}))
    const bucket = body?.bucket as UploadBucket
    const name = typeof body?.fileName === 'string' ? body.fileName : ''
    const contentType = typeof body?.contentType === 'string' ? body.contentType : ''
    const size = Number(body?.size)
    const label = typeof body?.label === 'string' ? body.label : undefined

    const limit = LIMITS[bucket]
    if (!limit) return NextResponse.json({ error: '不支持的存储桶' }, { status: 400 })
    if (!name) return NextResponse.json({ error: '缺少文件名' }, { status: 400 })
    if (!limit.types.test(contentType)) {
      return NextResponse.json({ error: bucket === 'audio' ? '请选择音频文件' : '请选择图片文件' }, { status: 400 })
    }
    if (!Number.isFinite(size) || size <= 0) {
      return NextResponse.json({ error: '文件是空的' }, { status: 400 })
    }
    if (size > limit.maxBytes) {
      return NextResponse.json(
        { error: `文件太大了，最大 ${Math.round(limit.maxBytes / 1048576)} MB` },
        { status: 400 }
      )
    }

    const path = generateFileName(name, label)
    const supabase = createServerClient()
    const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) {
      console.error('Create signed upload URL failed:', error)
      return NextResponse.json({ error: '无法创建上传地址，请重试' }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
    return NextResponse.json({
      bucket,
      path: data.path,
      signedUrl: data.signedUrl,
      publicUrl: urlData.publicUrl,
    })
  } catch (error) {
    console.error('Sign upload error:', error)
    return NextResponse.json({ error: '无法创建上传地址，请重试' }, { status: 500 })
  }
}
