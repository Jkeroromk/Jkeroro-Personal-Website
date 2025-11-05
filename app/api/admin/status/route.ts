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
    // 检查是否是数据库连接错误
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError') ||
       error.message.includes('P1001') ||
       error.message.includes('query timeout'))
    
    // 如果是连接错误，返回默认值（不阻塞用户）
    if (isConnectionError) {
      console.error('Database connection error (get admin status):', error instanceof Error ? error.message : error)
      return NextResponse.json({
        lastActive: null,
        isOnline: false,
      })
    }
    
    // 其他错误才返回 500
    console.error('Get admin status error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Admin status error details:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
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
    // 检查是否是数据库连接错误
    const isConnectionError = error instanceof Error && 
      (error.message.includes("Can't reach database server") || 
       error.message.includes('PrismaClientInitializationError') ||
       error.message.includes('P1001') ||
       error.message.includes('query timeout'))
    
    // 如果是连接错误，返回成功但跳过更新（不阻塞用户）
    if (isConnectionError) {
      console.error('Database connection error (update admin status):', error instanceof Error ? error.message : error)
      return NextResponse.json({
        lastActive: new Date().toISOString(),
      })
    }
    
    // 其他错误才返回 500
    console.error('Update admin status error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Update admin status error details:', {
      message: errorMessage,
      timestamp: new Date().toISOString(),
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
    })
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

