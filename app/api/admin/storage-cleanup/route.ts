import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/requireAuth'
import { findOrphanFiles, removeOrphanFiles, StorageRef } from '@/lib/storage-cleanup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 列出 Storage 里没有任何记录在用的文件（只看，不删）
export async function GET(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const files = await findOrphanFiles()
    return NextResponse.json({ files })
  } catch (error) {
    console.error('Find orphan files error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '读取 Storage 失败' },
      { status: 500 }
    )
  }
}

// 删除选中的文件；服务端会再确认一遍没有记录在用
export async function POST(request: NextRequest) {
  const authError = await requireAuth(request)
  if (authError) return authError
  try {
    const body = await request.json().catch(() => ({}))
    const files: StorageRef[] = Array.isArray(body?.files) ? body.files.slice(0, 1000) : []
    if (files.length === 0) {
      return NextResponse.json({ error: '没有选择文件' }, { status: 400 })
    }
    const removed = await removeOrphanFiles(files)
    return NextResponse.json({ removed })
  } catch (error) {
    console.error('Remove orphan files error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '删除失败' },
      { status: 500 }
    )
  }
}
