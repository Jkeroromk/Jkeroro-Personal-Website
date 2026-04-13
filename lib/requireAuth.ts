import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/supabase'

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

  try {
    const supabase = createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return null // authenticated
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
