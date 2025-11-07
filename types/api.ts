/**
 * API Response Types
 * API 响应类型定义
 */

// Base API Response
export interface ApiResponse<T> {
  data: T
  message?: string
  error?: string
}

// Media Types
export interface Image {
  id: string
  src: string
  alt: string
  width: number
  height: number
  order: number
  priority: boolean
  imageOffsetX: number
  imageOffsetY: number
  createdAt: string
  updatedAt: string
}

export interface Track {
  id: string
  title: string
  subtitle: string
  src: string
  order: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  title: string
  description: string
  image: string | null
  link: string | null
  category: string
  cropX: number | null
  cropY: number | null
  cropSize: number | null
  imageOffsetX: number | null
  imageOffsetY: number | null
  scale: number | null
  order: number
  createdAt: string
  updatedAt: string
}

// Comment Types
export interface Comment {
  id: string
  text: string
  likes: number
  fires: number
  hearts: number
  laughs: number
  wows: number
  createdAt: string
  updatedAt: string
}

export interface CommentReaction {
  id: string
  commentId: string
  userId: string
  type: 'like' | 'fire' | 'heart' | 'laugh' | 'wow'
  createdAt: string
}

// Stats Types
export interface ViewCount {
  id: string
  count: number
  lastUpdated: string
}

export interface CountryVisit {
  id: string
  country: string
  count: number
  lastUpdated: string
  lastVisit: string
}

// Anniversary Types
export interface AnniversarySettings {
  id: string
  backgroundImage: string | null
  backgroundImages: string[]
  imagePositions: Record<string, { x: number; y: number }>
  imageOffsetX: number
  imageOffsetY: number
  createdAt: string
  updatedAt: string
}

// API Error Response
export interface ApiErrorResponse {
  message: string
  error?: string
  details?: unknown
  status?: number
}

