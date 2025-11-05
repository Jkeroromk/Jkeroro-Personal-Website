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
    console.error('Get admin status error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    // 详细错误日志
    console.error('Admin status error details:', {
      message: errorMessage,
      stack: errorStack,
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
    const adminStatus = await prisma.adminStatus.upsert({
      where: { id: 'admin' },
      update: { lastActive: new Date() },
      create: { id: 'admin', lastActive: new Date() },
    })

    return NextResponse.json({
      lastActive: adminStatus.lastActive.toISOString(),
    })
  } catch (error) {
    console.error('Update admin status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

