import { NextResponse } from 'next/server'

// 检查 Supabase 配置状态（服务器端）
export async function GET() {
  try {
    const status = {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      databaseUrl: !!process.env.DATABASE_URL,
    }

    return NextResponse.json(status)
  } catch (error) {
    console.error('Error checking Supabase status:', error)
    return NextResponse.json(
      { error: 'Failed to check Supabase status' },
      { status: 500 }
    )
  }
}

