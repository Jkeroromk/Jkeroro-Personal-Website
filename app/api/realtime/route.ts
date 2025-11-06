import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getDbErrorInfo, withTimeout } from '@/lib/db-error-handler'

// Server-Sent Events 端点，用于实时推送数据更新
export async function GET(request: NextRequest) {
  // 创建 SSE 流
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()
      
      // 发送 SSE 消息的辅助函数
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`))
      }

      // 发送连接确认
      send('connected', JSON.stringify({ message: 'SSE connection established' }))

      // 存储上次的数据哈希，用于检测变化
      const lastDataHash = {
        images: '',
        tracks: '',
        projects: '',
        comments: '',
        view_count: '',
      }

      // 定期检查数据变化并推送
      const checkInterval = setInterval(async () => {
        try {
          // 并行执行所有查询，每个查询都有超时保护（5秒超时，因为这是定期轮询）
          const [images, tracks, projects, comments, viewCount] = await Promise.allSettled([
            withTimeout(
              prisma.image.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
              }),
              5000
            ),
            withTimeout(
              prisma.track.findMany({
                orderBy: { order: 'asc' },
              }),
              5000
            ),
            withTimeout(
              prisma.project.findMany({
                orderBy: { createdAt: 'desc' },
              }),
              5000
            ),
            withTimeout(
              prisma.comment.findMany({
                include: { reactions: true },
                orderBy: { createdAt: 'desc' },
              }),
              5000
            ),
            withTimeout(
              prisma.viewCount.upsert({
                where: { id: 'main' },
                update: {},
                create: { id: 'main', count: 0 },
              }),
              5000
            ),
          ])

          // 处理图片数据
          if (images.status === 'fulfilled') {
            const imagesHash = JSON.stringify(images.value.map(img => ({ id: img.id, order: img.order })))
          if (imagesHash !== lastDataHash.images) {
            lastDataHash.images = imagesHash
              send('images', JSON.stringify(images.value))
            }
          }

          // 处理音乐轨道数据
          if (tracks.status === 'fulfilled') {
            const tracksHash = JSON.stringify(tracks.value.map(track => ({ id: track.id, order: track.order })))
          if (tracksHash !== lastDataHash.tracks) {
            lastDataHash.tracks = tracksHash
              send('tracks', JSON.stringify(tracks.value))
            }
          }

          // 处理项目数据
          if (projects.status === 'fulfilled') {
            const projectsHash = JSON.stringify(projects.value.map(project => ({ id: project.id, createdAt: project.createdAt })))
          if (projectsHash !== lastDataHash.projects) {
            lastDataHash.projects = projectsHash
              send('projects', JSON.stringify(projects.value))
            }
          }

          // 处理评论数据
          if (comments.status === 'fulfilled') {
            const commentsHash = JSON.stringify(comments.value.map(comment => ({ id: comment.id, createdAt: comment.createdAt })))
          if (commentsHash !== lastDataHash.comments) {
            lastDataHash.comments = commentsHash
              send('comments', JSON.stringify(comments.value))
            }
          }

          // 处理 viewer count 数据
          if (viewCount.status === 'fulfilled') {
            const viewCountHash = JSON.stringify(viewCount.value ? { count: viewCount.value.count, lastUpdated: viewCount.value.lastUpdated } : null)
            if (viewCountHash !== lastDataHash.view_count) {
              lastDataHash.view_count = viewCountHash
              send('view_count', JSON.stringify(viewCount.value || { count: 0, lastUpdated: null }))
            }
          }

          // 检查是否有任何查询失败（静默记录，不中断连接）
          const failures = [images, tracks, projects, comments, viewCount].filter(r => r.status === 'rejected')
          if (failures.length > 0) {
            failures.forEach(failure => {
              if (failure.status === 'rejected') {
                const errorInfo = getDbErrorInfo(failure.reason)
                if (errorInfo.shouldReturnEmpty) {
                  // 静默处理连接错误，不发送错误消息
                  console.error('Database connection/timeout error (SSE):', errorInfo.errorMessage)
                } else {
                  // 其他错误才记录
                  console.error('SSE query error:', failure.reason)
                }
              }
            })
          }
        } catch (error) {
          const errorInfo = getDbErrorInfo(error)
          
          if (errorInfo.shouldReturnEmpty) {
            // 连接错误或超时时静默处理，不发送错误消息（避免客户端频繁重连）
            console.error('Database connection/timeout error (SSE):', errorInfo.errorMessage)
            // 不发送错误事件，保持连接，等待数据库恢复
            return
          }
          
          // 其他错误才记录并发送错误消息
            console.error('SSE error:', error)
          send('error', JSON.stringify({ message: 'Failed to fetch data' }))
        }
      }, 3000) // 每 3 秒检查一次（只在数据变化时推送）

      // 监听连接关闭
      request.signal.addEventListener('abort', () => {
        clearInterval(checkInterval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // 禁用 Nginx 缓冲
    },
  })
}

