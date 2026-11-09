'use client'

import { getAuthHeaders } from '@/lib/auth-client'
import { compressImage } from '@/lib/compress-image'

export interface UploadedImage {
  src: string
  width: number
  height: number
  name: string
}

/** 压缩 + 上传一张图到 Supabase Storage（走 /api/upload），返回公开地址和真实宽高 */
export async function uploadImage(file: File): Promise<UploadedImage> {
  const { file: compressed, width, height } = await compressImage(file)

  const formData = new FormData()
  formData.append('file', compressed)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: await getAuthHeaders(),
    body: formData,
  })

  let result: { success?: boolean; filePath?: string; error?: string } = {}
  try {
    result = await res.json()
  } catch {
    // Vercel 在请求体过大时直接回 413 的 HTML，不是 JSON
  }
  if (!res.ok || !result.success || !result.filePath) {
    throw new Error(result.error || (res.status === 413 ? '图片太大了' : `上传失败 (${res.status})`))
  }
  return { src: result.filePath, width, height, name: file.name }
}

/** 并发上传一批图（默认同时 3 张），每张完成/失败都回调一次，不会因为一张失败中断其他的 */
export async function uploadImages(
  files: File[],
  onProgress: (index: number, state: { status: 'uploading' | 'done' | 'error'; result?: UploadedImage; error?: string }) => void,
  concurrency = 3
): Promise<(UploadedImage | null)[]> {
  const results: (UploadedImage | null)[] = new Array(files.length).fill(null)
  let next = 0
  const worker = async () => {
    while (next < files.length) {
      const i = next++
      onProgress(i, { status: 'uploading' })
      try {
        results[i] = await uploadImage(files[i])
        onProgress(i, { status: 'done', result: results[i]! })
      } catch (err) {
        onProgress(i, { status: 'error', error: err instanceof Error ? err.message : String(err) })
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker))
  return results
}

/** 从拖拽 / 粘贴 / 文件选择里挑出图片文件 */
export function pickImageFiles(list: FileList | File[] | null | undefined): File[] {
  return Array.from(list || []).filter(
    (f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)
  )
}
