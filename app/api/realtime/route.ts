import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      }

      // 定期检查数据变化并推送
      const checkInterval = setInterval(async () => {
        try {
          // 检查图片数据
          const images = await prisma.image.findMany({
            orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
          })
          const imagesHash = JSON.stringify(images.map(img => ({ id: img.id, order: img.order })))
          if (imagesHash !== lastDataHash.images) {
            lastDataHash.images = imagesHash
            send('images', JSON.stringify(images))
          }

          // 检查音乐轨道数据
          const tracks = await prisma.track.findMany({
            orderBy: { order: 'asc' },
          })
          const tracksHash = JSON.stringify(tracks.map(track => ({ id: track.id, order: track.order })))
          if (tracksHash !== lastDataHash.tracks) {
            lastDataHash.tracks = tracksHash
            send('tracks', JSON.stringify(tracks))
          }

          // 检查项目数据
          const projects = await prisma.project.findMany({
            orderBy: { createdAt: 'desc' },
          })
          const projectsHash = JSON.stringify(projects.map(project => project.id))
          if (projectsHash !== lastDataHash.projects) {
            lastDataHash.projects = projectsHash
            send('projects', JSON.stringify(projects))
          }

          // 检查评论数据
          const comments = await prisma.comment.findMany({
            include: { reactions: true },
            orderBy: { createdAt: 'desc' },
          })
          const commentsHash = JSON.stringify(comments.map(comment => ({ id: comment.id, createdAt: comment.createdAt })))
          if (commentsHash !== lastDataHash.comments) {
            lastDataHash.comments = commentsHash
            send('comments', JSON.stringify(comments))
          }
        } catch (error) {
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

