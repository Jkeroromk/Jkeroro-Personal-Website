import { createClient } from '@supabase/supabase-js'

// ✅ Supabase Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ✅ Initialize Supabase Client (Client-side)
// 注意：这个客户端只能在客户端使用，用于认证和公共数据访问
let supabaseClient = null

if (typeof window !== 'undefined' && supabaseUrl && supabaseAnonKey) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Supabase client initialization failed:', error.message)
    }
  }
}

// ✅ Create Server-side Supabase Client
// 这个函数用于在服务器端 API 路由中使用
export const createServerClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables for server-side operations')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// ✅ Check Supabase Connection Status
export const checkSupabaseConnection = () => {
  const status = {
    client: !!supabaseClient,
    url: !!supabaseUrl,
    anonKey: !!supabaseAnonKey,
    serviceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase connection status:', status)
  }
  
  return status
}

// ✅ Export client-side Supabase client
export default supabaseClient

// ✅ Export Supabase utilities
export { supabaseClient as supabase }

