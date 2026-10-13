import { NextRequest, NextResponse } from 'next/server'
import { verifyCron, recordRun } from '@/lib/cron'
import { findOrphanFiles, removeOrphanFiles } from '@/lib/storage-cleanup'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// 存储定时清理（vercel.json 里每周一跑一次）
// 和后台「清理文件」用同一套判断：两个桶里没有任何记录在用的文件。
// 自动删除更保守：只删闲置超过 7 天的，每次最多 200 个；删除前会再检查一遍有没有被用上。
const AUTO_MIN_AGE_MS = 7 * 24 * 60 * 60 * 1000
const MAX_FILES_PER_RUN = 200

export async function GET(request: NextRequest) {
  const authError = verifyCron(request)
  if (authError) return authError

  try {
    const now = Date.now()
    const candidates = (await findOrphanFiles())
      .filter((f) => {
        const created = f.createdAt ? Date.parse(f.createdAt) : NaN
        return Number.isFinite(created) && now - created >= AUTO_MIN_AGE_MS
      })
      .slice(0, MAX_FILES_PER_RUN)

    const removed = candidates.length
      ? await removeOrphanFiles(candidates.map(({ bucket, path }) => ({ bucket, path })))
      : []
    const removedKeys = new Set(removed.map((r) => `${r.bucket}/${r.path}`))
    const bytes = candidates
      .filter((f) => removedKeys.has(`${f.bucket}/${f.path}`))
      .reduce((sum, f) => sum + (f.size || 0), 0)

    const result = {
      removed: removed.length,
      bytes,
      files: removed.map((r) => `${r.bucket}/${r.path}`).slice(0, 50),
    }
    await recordRun('storage-cleanup', true, result)
    return NextResponse.json(result)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Cron storage cleanup error:', error)
    await recordRun('storage-cleanup', false, { error: message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
