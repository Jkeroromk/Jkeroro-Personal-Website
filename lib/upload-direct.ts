'use client'

import { getAuthHeaders } from '@/lib/auth-client'
import type { UploadBucket } from '@/lib/upload-to-supabase'

export interface DirectUploadResult {
  bucket: UploadBucket
  path: string
  publicUrl: string
}

interface Options {
  bucket: UploadBucket
  /** 用来生成文件名（例如歌名），不传就用原文件名 */
  label?: string
  /** 0–1 */
  onProgress?: (ratio: number) => void
}

// 有些浏览器认不出 .flac / .m4a 的类型（file.type 是空的），按扩展名补上
const AUDIO_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  webm: 'audio/webm',
}

function guessType(file: File, bucket: UploadBucket): string {
  if (file.type) return file.type
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (bucket === 'audio') return AUDIO_TYPES[ext] || 'audio/mpeg'
  return 'application/octet-stream'
}

/**
 * 浏览器直接把文件传到 Supabase Storage，不经过 Vercel 函数（函数请求体上限 4.5 MB）。
 * 1. 向 /api/upload/sign 要一个只能传这个文件的签名地址（需要登录）
 * 2. 把文件 PUT 到这个地址，用 XHR 拿上传进度
 */
export async function uploadDirect(file: File, { bucket, label, onProgress }: Options): Promise<DirectUploadResult> {
  const contentType = guessType(file, bucket)

  const signRes = await fetch('/api/upload/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
    body: JSON.stringify({ bucket, fileName: file.name, contentType, size: file.size, label }),
  })
  const sign = await signRes.json().catch(() => ({}))
  if (!signRes.ok || !sign.signedUrl) {
    throw new Error(sign.error || (signRes.status === 401 ? '登录已过期，请重新登录' : `上传失败 (${signRes.status})`))
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', sign.signedUrl)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.setRequestHeader('x-upsert', 'false')
    xhr.setRequestHeader('cache-control', 'max-age=31536000')
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve()
      let msg = `上传到 Storage 失败 (${xhr.status})`
      try {
        const err = JSON.parse(xhr.responseText)
        if (err?.message || err?.error) msg = `上传到 Storage 失败：${err.message || err.error}`
      } catch {
        /* 不是 JSON */
      }
      reject(new Error(msg))
    }
    xhr.onerror = () => reject(new Error('网络错误，上传中断'))
    xhr.send(file)
  })

  onProgress?.(1)
  return { bucket: sign.bucket, path: sign.path, publicUrl: sign.publicUrl }
}
