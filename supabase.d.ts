import type { SupabaseClient } from '@supabase/supabase-js'

declare const supabaseClient: SupabaseClient | null

export { supabaseClient as supabase }
export default supabaseClient
export declare function createServerClient(): SupabaseClient
export declare function checkSupabaseConnection(): {
  client: boolean
  url: boolean
  anonKey: boolean
  serviceRoleKey: boolean
}
