/**
 * 实时数据客户端 - 使用 Server-Sent Events (SSE)
 * 所有数据都通过 SSE 轮询数据库获取更新
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventCallback = (data: any) => void

class RealtimeClient {
  private eventSource: EventSource | null = null
  private listeners: Map<string, Set<EventCallback>> = new Map()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 3000

  constructor() {
    if (typeof window === 'undefined') {
      return
    }
  }

  /**
   * 连接到 SSE 服务器
   */
  connect() {
    if (typeof window === 'undefined' || this.eventSource) {
      return
    }

    try {
      this.eventSource = new EventSource('/api/realtime')

      this.eventSource.onopen = () => {
        this.reconnectAttempts = 0
      }

      this.eventSource.onmessage = (event) => {
        // 通用消息处理（如果没有特定事件类型）
        try {
          const data = JSON.parse(event.data)
          if (data.type) {
            this.handleMessage({ type: data.type, data: data.data || data })
          }
        } catch {
          // 静默处理解析错误
        }
      }

      this.eventSource.onerror = () => {
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          this.reconnect()
        }
      }

      // 监听特定事件类型
      this.eventSource.addEventListener('images', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage({ type: 'images', data })
        } catch {
          // 静默处理解析错误
        }
      })

      this.eventSource.addEventListener('tracks', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage({ type: 'tracks', data })
        } catch {
          // 静默处理解析错误
        }
      })

      this.eventSource.addEventListener('projects', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage({ type: 'projects', data })
        } catch {
          // 静默处理解析错误
        }
      })

      this.eventSource.addEventListener('comments', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage({ type: 'comments', data })
        } catch {
          // 静默处理解析错误
        }
      })

      this.eventSource.addEventListener('view_count', (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage({ type: 'view_count', data })
        } catch {
          // 静默处理解析错误
        }
      })
    } catch {
      // 静默处理连接错误
    }
  }

  /**
   * 处理收到的消息
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(message: { type: string; data?: any }) {
    const callbacks = this.listeners.get(message.type)
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(message.data)
        } catch {
          // 静默处理回调错误
        }
      })
    }
  }

  /**
   * 订阅特定类型的数据更新
   */
  subscribe(type: 'images' | 'tracks' | 'projects' | 'comments' | 'view_count', callback: EventCallback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }
    this.listeners.get(type)!.add(callback)

    // 所有类型都使用 SSE
    if (!this.eventSource) {
      this.connect()
    }

    // 返回取消订阅的函数
    return () => {
      this.unsubscribe(type, callback)
    }
  }

  /**
   * 取消订阅
   */
  unsubscribe(type: string, callback: EventCallback) {
    const callbacks = this.listeners.get(type)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.listeners.delete(type)
      }
    }
  }

  /**
   * 重新连接
   */
  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      return
    }

    this.disconnect()
    this.reconnectAttempts++

    setTimeout(() => {
      this.connect()
    }, this.reconnectDelay)
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }

  /**
   * 检查连接状态
   */
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN
  }
}

// 单例模式
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

