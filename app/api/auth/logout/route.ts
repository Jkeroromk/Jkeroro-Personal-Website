import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/supabase'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // 获取当前用户
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabase.auth.getUser(token)
      
      // 如果是管理员，更新最后活动时间
      if (user?.email === 'zzou2000@gmail.com') {
        const { prisma } = await import('@/lib/prisma')
        await prisma.adminStatus.upsert({
          where: { id: 'admin' },
          update: { lastActive: new Date() },
          create: { id: 'admin', lastActive: new Date() },
        })
      }
    }

    // 登出（清除会话）
    // 注意：Supabase 的 signOut 需要在客户端调用
    // 这里我们只更新状态，实际的登出由客户端处理
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

