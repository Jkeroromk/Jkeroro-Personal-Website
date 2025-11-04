import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient()
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    // 更新管理员最后活动时间（如果是管理员）
    if (data.user?.email === 'zzou2000@gmail.com') {
      const { prisma } = await import('@/lib/prisma')
      await prisma.adminStatus.upsert({
        where: { id: 'admin' },
        update: { lastActive: new Date() },
        create: { id: 'admin', lastActive: new Date() },
      })
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      session: data.session,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

