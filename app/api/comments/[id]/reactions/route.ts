import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 添加或移除评论反应
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { type, userId } = await request.json()

    if (!type || !userId) {
      return NextResponse.json(
        { error: 'Reaction type and userId are required' },
        { status: 400 }
      )
    }

    // 支持单数和复数形式（数据库字段是复数形式）
    const typeMapping: Record<string, string> = {
      'like': 'likes',
      'likes': 'likes',
      'fire': 'fires',
      'fires': 'fires',
      'heart': 'hearts',
      'hearts': 'hearts',
      'laugh': 'laughs',
      'laughs': 'laughs',
      'wow': 'wows',
      'wows': 'wows',
    }
    
    const normalizedType = typeMapping[type]
    if (!normalizedType) {
      return NextResponse.json(
        { error: 'Invalid reaction type' },
        { status: 400 }
      )
    }
    
    // 使用规范化后的类型（数据库字段格式）
    const dbType = normalizedType

    // 首先检查评论是否存在
    const comment = await prisma.comment.findUnique({
      where: { id },
    })

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found' },
        { status: 404 }
      )
    }

    // 检查是否已存在反应
    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_type: {
          commentId: id,
          userId,
          type: dbType,
        },
      },
    })

    if (existingReaction) {
      // 移除反应
      await prisma.commentReaction.delete({
        where: {
          commentId_userId_type: {
            commentId: id,
            userId,
            type,
          },
        },
      })

      // 减少计数（确保不会小于0）
      const reactionCounts: Record<string, number> = {
        likes: comment.likes,
        fires: comment.fires,
        hearts: comment.hearts,
        laughs: comment.laughs,
        wows: comment.wows,
      }
      const currentCount = reactionCounts[dbType] || 0
      const newCount = Math.max(0, currentCount - 1)
      await prisma.comment.update({
        where: { id },
        data: {
          [dbType]: newCount,
        },
      })

      return NextResponse.json({ action: 'removed' })
    } else {
      // 添加反应
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId,
          type: dbType,
        },
      })

      // 增加计数
      await prisma.comment.update({
        where: { id },
        data: {
          [dbType]: { increment: 1 },
        },
      })

      return NextResponse.json({ action: 'added' })
    }
  } catch (error) {
    console.error('Toggle reaction error:', error)
    
    // 提供更详细的错误信息
    let errorMessage = 'Internal server error'
    let statusCode = 500
    
    if (error instanceof Error) {
      // Prisma 错误处理
      if (error.message.includes('Record to update not found')) {
        errorMessage = 'Comment not found'
        statusCode = 404
      } else if (error.message.includes('Unique constraint')) {
        errorMessage = 'Reaction already exists'
        statusCode = 409
      } else if (error.message.includes('Foreign key constraint')) {
        errorMessage = 'Invalid comment ID'
        statusCode = 400
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    )
  }
}

