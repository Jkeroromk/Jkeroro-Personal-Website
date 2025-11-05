import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 添加连接超时保护
    const adminStatus = await Promise.race([
      prisma.adminStatus.findUnique({
        where: { id: 'admin' },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.adminStatus.findUnique>>

    if (!adminStatus) {
      return NextResponse.json({
        lastActive: null,
        isOnline: false,
      })
    }

    const now = Date.now()
    const lastActive = new Date(adminStatus.lastActive).getTime()
    const isOnline = now - lastActive < 5 * 60 * 1000 // 5 分钟内

    return NextResponse.json({
      lastActive: adminStatus.lastActive.toISOString(),
      isOnline,
    })
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回默认值
      return NextResponse.json({
        lastActive: null,
        isOnline: false,
      })
    }
    
    // 只在非连接错误或生产环境记录错误
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Get admin status error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Admin status error details:', {
        message: errorMessage,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    // 添加连接超时保护
    const adminStatus = await Promise.race([
      prisma.adminStatus.upsert({
        where: { id: 'admin' },
        update: { lastActive: new Date() },
        create: { id: 'admin', lastActive: new Date() },
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )
    ]) as Awaited<ReturnType<typeof prisma.adminStatus.upsert>>

    return NextResponse.json({
      lastActive: adminStatus.lastActive.toISOString(),
    })
  } catch (error) {
    // 在开发环境中，如果是数据库连接错误，静默处理
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError'))
    
    if (process.env.NODE_ENV === 'development' && isConnectionError) {
      // 开发环境返回成功但跳过更新
      return NextResponse.json({
        lastActive: new Date().toISOString(),
      })
    }
    
    // 只在非连接错误或生产环境记录错误
    if (!isConnectionError || process.env.NODE_ENV === 'production') {
      console.error('Update admin status error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Update admin status error details:', {
        message: errorMessage,
        timestamp: new Date().toISOString(),
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined,
      },
      { status: 500 }
    )
  }
}

