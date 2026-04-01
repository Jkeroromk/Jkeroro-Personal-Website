/**
 * 实时数据客户端 - 使用 Supabase Realtime WebSocket
 * 监听数据库表变更事件，变更时重新拉取对应 API 数据推送给订阅者
 */

import { createClient, RealtimeChannel } from '@supabase/supabase-js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void

type SubscribeType = 'images' | 'tracks' | 'projects' | 'comments' | 'view_count'

interface TableConfig {
  /** 触发刷新的 PostgreSQL 表名（可多个，如 comments + comment_reactions 都触发评论刷新） */
  dbTables: string[]
  /** 变更后重新拉取数据的 API 路径 */
  api: string
}

const TABLE_CONFIGS: Record<SubscribeType, TableConfig> = {
  comments: {
    dbTables: ['comments', 'comment_reactions'],
    api: '/api/comments',
  },
  images: {
    dbTables: ['images'],
    api: '/api/media/images',
  },
  tracks: {
    dbTables: ['tracks'],
    api: '/api/media/tracks',
  },
  projects: {
    dbTables: ['projects'],
    api: '/api/media/projects',
  },
  view_count: {
    dbTables: ['view_count'],
    api: '/api/stats/view',
  },
}

class RealtimeClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private supabase: ReturnType<typeof createClient> | null = null
  private listeners: Map<SubscribeType, Set<EventCallback>> = new Map()
  private channels: Map<string, RealtimeChannel> = new Map()

  constructor() {
    if (typeof window === 'undefined') return

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (url && key) {
      this.supabase = createClient(url, key, {
        realtime: { params: { eventsPerSecond: 10 } },
      })
    }
  }

  /**
   * 订阅特定类型的数据更新
   */
  subscribe(type: SubscribeType, callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)

    // 确保该类型的 Realtime channel 已建立
    this.ensureChannels(type)

    return () => this.unsubscribe(type, callback)
  }

  /**
   * 为指定订阅类型建立 Supabase Realtime channel（如已建立则跳过）
   */
  private ensureChannels(type: SubscribeType) {
    if (!this.supabase) return

    const config = TABLE_CONFIGS[type]

    for (const tableName of config.dbTables) {
      const channelKey = `${type}:${tableName}`
      if (this.channels.has(channelKey)) continue

      const channel = this.supabase
        .channel(`realtime-${channelKey}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: tableName },
          () => {
            // 数据库发生变更时，重新拉取对应 API 数据并推送给订阅者
            this.refetchAndEmit(type)
          }
        )
        .subscribe()

      this.channels.set(channelKey, channel)
    }
  }

  /**
   * 拉取 API 数据并推送给该类型的所有订阅者
   */
  private async refetchAndEmit(type: SubscribeType) {
    const config = TABLE_CONFIGS[type]

    try {
      const res = await fetch(config.api)
      if (!res.ok) return

      const data = await res.json()
      this.emit(type, data)
    } catch {
      // 静默处理网络错误
    }
  }

  /**
   * 推送数据给订阅者
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private emit(type: SubscribeType, data: any) {
    const callbacks = this.listeners.get(type)
    callbacks?.forEach((cb) => {
      try {
        cb(data)
      } catch {
        // 静默处理回调错误
      }
    })
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: SubscribeType, callback: EventCallback) {
    const callbacks = this.listeners.get(type)
    if (!callbacks) return

    callbacks.delete(callback)

    // 如果该类型已无订阅者，清理 channel
    if (callbacks.size === 0) {
      this.listeners.delete(type)
      const config = TABLE_CONFIGS[type]

      for (const tableName of config.dbTables) {
        const channelKey = `${type}:${tableName}`
        const channel = this.channels.get(channelKey)
        if (channel && this.supabase) {
          this.supabase.removeChannel(channel)
          this.channels.delete(channelKey)
        }
      }
    }
  }

  /**
   * 断开所有 channel（兼容旧接口）
   */
  disconnect() {
    if (this.supabase) {
      this.channels.forEach((channel) => this.supabase!.removeChannel(channel))
      this.channels.clear()
    }
    this.listeners.clear()
  }

  /** 兼容旧接口 */
  connect() {}

  isConnected(): boolean {
    return this.supabase !== null
  }
}

// 单例
let instance: RealtimeClient | null = null

export function getRealtimeClient(): RealtimeClient {
  if (typeof window === 'undefined') {
    throw new Error('RealtimeClient 只能在客户端使用')
  }

  if (!instance) {
    instance = new RealtimeClient()
  }

  return instance
}

export default getRealtimeClient
