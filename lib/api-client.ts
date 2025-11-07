/**
 * Unified API Client
 * 统一 API 调用封装
 * 
 * Provides:
 * - Consistent error handling
 * - Loading states
 * - Empty state handling
 * - Type safety
 */

import { getApiUrl } from './api-base'

export interface ApiError {
  message: string
  status?: number
  details?: unknown
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
  loading: boolean
}

/**
 * Make API request with error handling
 */
export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: ApiError | null }> {
  try {
    const url = getApiUrl(path)
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      let errorDetails: unknown = null

      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        errorDetails = errorData.details || errorData
      } catch {
        // If response is not JSON, try text
        try {
          const errorText = await response.text()
          if (errorText) errorMessage = errorText
        } catch {
          // Ignore parsing errors
        }
      }

      return {
        data: null,
        error: {
          message: errorMessage,
          status: response.status,
          details: errorDetails,
        },
      }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error,
      },
    }
  }
}

/**
 * Fetch array data from API
 * Ensures response is always an array
 */
export async function fetchArray<T>(
  path: string,
  options?: RequestInit
): Promise<{ data: T[]; error: ApiError | null }> {
  const result = await apiRequest<T[] | T>(path, options)

  if (result.error) {
    return { data: [], error: result.error }
  }

  if (result.data === null) {
    return { data: [], error: null }
  }

  // Ensure data is an array
  const dataArray = Array.isArray(result.data) ? result.data : [result.data]
  return { data: dataArray, error: null }
}

/**
 * Fetch object data from API
 * Returns null if data is not an object
 */
export async function fetchObject<T extends object>(
  path: string,
  options?: RequestInit
): Promise<{ data: T | null; error: ApiError | null }> {
  const result = await apiRequest<T>(path, options)

  if (result.error || result.data === null) {
    return { data: null, error: result.error }
  }

  // Ensure data is an object
  if (typeof result.data === 'object' && !Array.isArray(result.data)) {
    return { data: result.data as T, error: null }
  }

  return {
    data: null,
    error: {
      message: 'Response is not an object',
    },
  }
}

