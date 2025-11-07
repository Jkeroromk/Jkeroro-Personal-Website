/**
 * Component Props Types
 * 组件 Props 类型定义
 */

import { Image, Track, Project, Comment } from './api'

// Music Player Types
export interface MusicPlayerProps {
  tracks?: Track[]
  autoPlay?: boolean
}

// Comment System Types
export interface CommentSystemProps {
  initialComments?: Comment[]
  maxDisplayed?: number
}

// Anniversary Counter Types
export interface AnniversaryCounterProps {
  anniversaryDate?: Date
  backgroundImages?: string[]
  imagePositions?: Record<string, { x: number; y: number }>
}

// Album Types
export interface AlbumProps {
  images?: Image[]
  autoPlay?: boolean
}

// Tabs (Projects Carousel) Types
export interface TabsProps {
  projects?: Project[]
  autoPlay?: boolean
}

// Viewer Stats Types
export interface ViewerStatsProps {
  viewCount?: number
  countries?: Array<{
    country: string
    count: number
    lastUpdated: string
    lastVisit: string
  }>
}

