/**
 * NAS 自动换图：家里的 NAS 每天把照片推送到网站（只有 NAS 往外连，NAS 不用暴露到公网）。
 * NAS 那边的程序在仓库的 nas-sync/ 文件夹里。
 *
 * 鉴权：请求头 Authorization: Bearer <NAS_SYNC_TOKEN>，token 存在 Vercel 环境变量里，
 * 和后台登录是两套，NAS 只能调 /api/nas/* 这几个接口。
 *
 * 文件名用照片内容的 hash（nas/<hash>.webp），同一张照片重复推送不会多存一份，
 * NAS 那边的记录丢了也不会产生重复。换下来不再用的图由每周的存储清理回收。
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { uploadToSupabase } from '@/lib/upload-to-supabase'

export function requireNasToken(request: NextRequest): NextResponse | null {
  const expected = process.env.NAS_SYNC_TOKEN
  if (!expected || expected.length < 32) {
    return NextResponse.json({ error: 'NAS_SYNC_TOKEN is not configured' }, { status: 503 })
  }
  const header = request.headers.get('authorization') || ''
  const given = header.startsWith('Bearer ') ? header.slice(7) : ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

const MAX_BYTES = 4 * 1024 * 1024
const TYPES: Record<string, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg' }

export const isNasUrl = (url: string) => /\/storage\/v1\/object\/public\/images\/nas\//.test(url)

/** 读 NAS 推上来的照片（multipart 里的 file + hash），存到 images 桶的 nas/ 下，返回公开地址 */
export async function storeNasPhoto(form: FormData): Promise<{ url: string; width: number; height: number }> {
  const file = form.get('file')
  const hash = String(form.get('hash') || '')
  const width = Number(form.get('width'))
  const height = Number(form.get('height'))
  if (!(file instanceof File)) throw new NasError('file is required')
  if (!/^[a-f0-9]{16,64}$/.test(hash)) throw new NasError('invalid hash')
  if (!(width > 0 && height > 0)) throw new NasError('invalid width/height')
  const ext = TYPES[file.type]
  if (!ext) throw new NasError('only image/webp or image/jpeg')
  if (file.size > MAX_BYTES) throw new NasError('file too large (max 4MB)')

  const buffer = Buffer.from(await file.arrayBuffer())
  const { publicUrl } = await uploadToSupabase(buffer, `nas/${hash}.${ext}`, file.type, 'images', { upsert: true })
  return { url: publicUrl, width: Math.round(width), height: Math.round(height) }
}

export class NasError extends Error {}

export function nasErrorResponse(err: unknown) {
  if (err instanceof NasError) return NextResponse.json({ error: err.message }, { status: 400 })
  console.error('[nas]', err)
  return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal error' }, { status: 500 })
}
