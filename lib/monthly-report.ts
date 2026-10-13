/**
 * 月报：每月 1 号的定时任务把上个月的数据算好存进 monthly_reports，后台 Monthly Report 页面显示。
 *
 * 访问量和各国访问量在数据库里只有累计值，所以每份月报都存一份当时的累计快照（totals），
 * 当月增量 = 这次快照 - 上一份月报的快照。第一份月报没有上一份可比，只记录基准（baseline）。
 * 留言、AI 聊天、存储清理这些有时间戳，直接按月份范围统计。
 */

import { prisma } from '@/lib/prisma'

export interface Totals {
  views: number
  countries: Record<string, number>
  comments: number
}

export interface ReportData {
  month: string // 'YYYY-MM'
  generatedAt: string
  partial: boolean // true = 本月至今（还没结束）
  baseline: boolean // true = 没有上一份快照，访问量增量算不出来
  totals: Totals
  views: number | null
  topCountries: { country: string; visits: number }[]
  newCountries: string[]
  comments: { new: number; hiddenByFilter: number }
  chatMessages: number
  storageCleanup: { runs: number; removed: number; bytes: number; failedRuns: number }
}

/** 'YYYY-MM' 对应的 UTC 月份起止 */
export function monthRange(month: string): { start: Date; end: Date } {
  const [y, m] = month.split('-').map(Number)
  return { start: new Date(Date.UTC(y, m - 1, 1)), end: new Date(Date.UTC(y, m, 1)) }
}

export function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

export function previousMonthKey(date: Date): string {
  return monthKey(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)))
}

async function currentTotals(): Promise<Totals> {
  const [view, countries, comments] = await Promise.all([
    prisma.viewCount.findUnique({ where: { id: 'main' } }),
    prisma.countryVisit.findMany({ select: { country: true, count: true } }),
    prisma.comment.count(),
  ])
  return {
    views: view?.count ?? 0,
    countries: Object.fromEntries(countries.map((c) => [c.country, c.count])),
    comments,
  }
}

/** 找 month 之前最近的一份月报快照 */
async function previousSnapshot(month: string): Promise<Totals | null> {
  const prev = await prisma.monthlyReport.findFirst({
    where: { month: { lt: month } },
    orderBy: { month: 'desc' },
  })
  const data = prev?.data as unknown as ReportData | undefined
  return data?.totals ?? null
}

export async function buildReport(month: string, partial: boolean): Promise<ReportData> {
  const { start, end } = monthRange(month)
  const range = { gte: start, lt: end }

  const [totals, prev, newComments, hiddenComments, chatMessages, cleanupRuns] = await Promise.all([
    currentTotals(),
    previousSnapshot(month),
    prisma.comment.count({ where: { createdAt: range } }),
    prisma.comment.count({ where: { createdAt: range, hidden: true } }),
    prisma.chatMessage.count({ where: { createdAt: range, role: 'user' } }),
    prisma.cronRun.findMany({ where: { job: 'storage-cleanup', ranAt: range } }),
  ])

  // 各国访问：有上一份快照就算当月增量，没有就用累计值
  const countryVisits = Object.entries(totals.countries)
    .map(([country, count]) => ({ country, visits: prev ? count - (prev.countries[country] ?? 0) : count }))
    .filter((c) => c.visits > 0)
    .sort((a, b) => b.visits - a.visits)

  const storageCleanup = cleanupRuns.reduce(
    (acc, run) => {
      const r = (run.result ?? {}) as { removed?: number; bytes?: number }
      acc.runs += 1
      if (!run.ok) acc.failedRuns += 1
      acc.removed += Number(r.removed) || 0
      acc.bytes += Number(r.bytes) || 0
      return acc
    },
    { runs: 0, removed: 0, bytes: 0, failedRuns: 0 }
  )

  return {
    month,
    generatedAt: new Date().toISOString(),
    partial,
    baseline: !prev,
    totals,
    views: prev ? Math.max(0, totals.views - prev.views) : null,
    topCountries: countryVisits.slice(0, 5),
    newCountries: prev ? Object.keys(totals.countries).filter((c) => !(c in prev.countries)) : [],
    comments: { new: newComments, hiddenByFilter: hiddenComments },
    chatMessages,
    storageCleanup,
  }
}

/** 定时任务用：生成并保存某个月的月报（同一个月重复跑会覆盖） */
export async function saveReport(month: string): Promise<ReportData> {
  const data = await buildReport(month, false)
  await prisma.monthlyReport.upsert({
    where: { month },
    create: { month, data: JSON.parse(JSON.stringify(data)) },
    update: { data: JSON.parse(JSON.stringify(data)) },
  })
  return data
}
