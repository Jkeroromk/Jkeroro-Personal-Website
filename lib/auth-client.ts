import { supabase } from '@/supabase'

/**
 * Returns Authorization header with the current Supabase access token.
 * Used by admin hooks to authenticate API requests.
 *
 * Usage:
 *   const authHeaders = await getAuthHeaders()
 *   fetch(url, { headers: { 'Content-Type': 'application/json', ...authHeaders } })
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    if (!supabase) return {}
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return {}
    return { Authorization: `Bearer ${session.access_token}` }
  } catch {
    return {}
  }
}
