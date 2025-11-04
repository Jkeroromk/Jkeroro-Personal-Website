import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const adminStatus = await prisma.adminStatus.findUnique({
      where: { id: 'admin' },
    })

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
    return NextResponse.json(
      { error: 'Internal server error' },
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

