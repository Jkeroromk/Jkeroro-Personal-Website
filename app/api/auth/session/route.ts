import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
    // 从请求头获取 token
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ user: null })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ user: null })
  }
}

