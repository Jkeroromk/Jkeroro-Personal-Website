import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Validates the Bearer token in the Authorization header.
 * Returns null if authenticated, or a 401 NextResponse if not.
 *
 * Usage in API route:
 *   const authError = await requireAuth(request)
 *   if (authError) return authError
 */
export async function requireAuth(request: NextRequest): Promise<NextResponse | null> {
  const authHeader = request.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // service role key 优先，没有则降级用 anon key（验证 token 身份两者都可以）
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return null // authenticated
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
