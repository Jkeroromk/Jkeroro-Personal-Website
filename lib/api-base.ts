/**
 * API Base URL Configuration
 * 统一 API 基础 URL 配置
 * 
 * Priority:
 * 1. Use NEXT_PUBLIC_API_URL if set (for production with CDN)
 * 2. Fallback to relative path (same domain)
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL && process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, '')
    : ''

/**
 * Get full API URL
 * @param path - API path (e.g., '/api/comments')
 * @returns Full API URL
 */
export function getApiUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  
  // If API_BASE is set, use it; otherwise use relative path
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath
}

