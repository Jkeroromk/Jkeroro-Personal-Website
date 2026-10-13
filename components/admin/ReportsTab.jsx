'use client'

/**
 * ReportsTab — 后台月报
 * 上面是本月至今（打开页面时实时算），下面是每月 1 号定时任务存下来的历史月报，最后是最近的定时任务记录。
 */

import React, { useEffect, useState } from 'react'
import { RefreshCw, Eye, MessageSquare, ShieldAlert, Bot, HardDrive, Globe2, CheckCircle2, XCircle } from 'lucide-react'
import { getAuthHeaders } from '@/lib/auth-client'

const formatBytes = (bytes) => {
  if (!bytes) return '0 MB'
  const mb = bytes / (1024 * 1024)
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

const monthLabel = (key) => {
  const [y, m] = key.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
}

const JOB_LABELS = { 'storage-cleanup': 'Storage cleanup', 'monthly-report': 'Monthly report' }

const Stat = ({ icon: Icon, label, value, hint }) => (
  <div className="rounded-xl border border-white/5 bg-zinc-950/60 p-3">
    <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </div>
    <div className="text-xl font-semibold text-white mt-1 tabular-nums">{value}</div>
    {hint && <div className="text-[11px] text-zinc-500 mt-0.5">{hint}</div>}
  </div>
)

const ReportCard = ({ report, highlight }) => (
  <section className={`rounded-2xl border p-4 space-y-4 ${highlight ? 'border-indigo-500/30 bg-indigo-500/[0.04]' : 'border-white/10 bg-zinc-900'}`}>
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-sm font-semibold text-white">
        {highlight ? `This month so far · ${monthLabel(report.month)}` : monthLabel(report.month)}
      </h3>
      <span className="text-[11px] text-zinc-500">
        {highlight ? 'Updated just now' : `Generated ${new Date(report.generatedAt).toLocaleDateString()}`}
      </span>
    </div>

    {report.baseline && (
      <p className="text-xs text-amber-300/90">
        No earlier snapshot to compare with, so visits show all-time totals. Monthly visit counts start from the next report.
      </p>
    )}

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      <Stat
        icon={Eye}
        label="Visits"
        value={report.views == null ? '—' : report.views.toLocaleString()}
        hint={`${report.totals.views.toLocaleString()} all-time`}
      />
      <Stat
        icon={MessageSquare}
        label="New comments"
        value={report.comments.new}
        hint={report.comments.hiddenByFilter ? `${report.comments.hiddenByFilter} hidden by the auto-filter` : 'None hidden'}
      />
      <Stat icon={Bot} label="Muse chat messages" value={report.chatMessages} />
      <Stat
        icon={HardDrive}
        label="Storage cleaned"
        value={`${report.storageCleanup.removed} files`}
        hint={`${formatBytes(report.storageCleanup.bytes)} · ${report.storageCleanup.runs} run${report.storageCleanup.runs !== 1 ? 's' : ''}${report.storageCleanup.failedRuns ? ` · ${report.storageCleanup.failedRuns} failed` : ''}`}
      />
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 min-w-0">
        <p className="flex items-center gap-1.5 text-[11px] text-zinc-500 mb-2">
          <Globe2 className="w-3.5 h-3.5" />
          {report.baseline ? 'Top countries (all-time)' : 'Top countries'}
        </p>
        {report.topCountries.length === 0 ? (
          <p className="text-xs text-zinc-600">No visits recorded.</p>
        ) : (
          <ul className="space-y-1">
            {report.topCountries.map((c) => (
              <li key={c.country} className="flex justify-between text-sm">
                <span className="text-zinc-300">{c.country}</span>
                <span className="text-zinc-500 tabular-nums">{c.visits.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {report.newCountries.length > 0 && (
        <div className="sm:w-48">
          <p className="text-[11px] text-zinc-500 mb-2">New countries</p>
          <p className="text-sm text-zinc-300">{report.newCountries.join(', ')}</p>
        </div>
      )}
    </div>
  </section>
)

export default function ReportsTab() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/admin/reports', { headers: authHeaders, cache: 'no-store' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`)
      setData(json)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-500 rounded-full animate-spin" />
          <span className="text-sm">Loading reports...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02] gap-3">
        <p className="text-sm text-white">Couldn’t load reports</p>
        <p className="text-xs text-zinc-500">{error}</p>
        <button onClick={load} className="px-3 py-1.5 rounded-lg border border-white/10 text-zinc-300 hover:text-white text-sm">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Monthly Report</h2>
          <p className="text-xs text-zinc-500 mt-0.5">A report is saved automatically on the 1st of every month.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <ReportCard report={data.current} highlight />

      {data.reports.length === 0 ? (
        <p className="text-xs text-zinc-500">No saved reports yet. The first one is created on the 1st of next month.</p>
      ) : (
        data.reports.map((r) => <ReportCard key={r.month} report={r} />)
      )}

      <section className="rounded-2xl border border-white/10 bg-zinc-900 p-4">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-white mb-3">
          <ShieldAlert className="w-4 h-4 text-zinc-400" />
          Recent automated jobs
        </h3>
        {data.runs.length === 0 ? (
          <p className="text-xs text-zinc-500">No jobs have run yet. Storage cleanup runs every Monday; the report runs on the 1st.</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {data.runs.map((run, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-zinc-300">
                  {run.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                  {JOB_LABELS[run.job] || run.job}
                  {run.job === 'storage-cleanup' && run.ok && (
                    <span className="text-xs text-zinc-500">
                      {run.result?.removed ?? 0} files · {formatBytes(run.result?.bytes)}
                    </span>
                  )}
                  {!run.ok && run.result?.error && <span className="text-xs text-red-400 truncate max-w-[240px]">{run.result.error}</span>}
                </span>
                <span className="text-xs text-zinc-500 whitespace-nowrap">{new Date(run.ranAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
