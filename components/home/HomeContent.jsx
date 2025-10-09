'use client'

import React, { Suspense, lazy } from 'react'
import LinkforBio from "@/components/interactive/linkforbio"
import HomeSection from './HomeSection'

// 动态导入非关键组件
const Stack = lazy(() => import("@/components/media/stack"))
const MusicPlayer = lazy(() => import("@/components/media/musicPlayer"))
const Tabs = lazy(() => import("@/components/media/tabs"))
const PersonalStore = lazy(() => import("@/components/interactive/personalStore"))
const Album = lazy(() => import("@/components/media/album"))
const Footer = lazy(() => import("@/components/layout/footer"))

// 加载占位符组件
const LoadingPlaceholder = ({ delay }) => (
  <div 
    className="w-full h-32 bg-gray-800/50 rounded-lg animate-pulse"
    style={{ animationDelay: `${delay}s` }}
  />
)

const HomeContent = () => {
  return (
    <>
      <HomeSection delay={0.4}>
        <LinkforBio/>
      </HomeSection>
      
      <HomeSection delay={0.5}>
        <Suspense fallback={<LoadingPlaceholder delay={0.5} />}>
          <Stack/>
        </Suspense>
      </HomeSection>
      
      <HomeSection delay={0.6}>
        <Suspense fallback={<LoadingPlaceholder delay={0.6} />}>
          <MusicPlayer />
        </Suspense>
      </HomeSection>
      
      <HomeSection delay={0.7}>
        <Suspense fallback={<LoadingPlaceholder delay={0.7} />}>
          <Tabs />
        </Suspense>
      </HomeSection>
      
      <HomeSection delay={0.8}>
        <Suspense fallback={<LoadingPlaceholder delay={0.8} />}>
          <PersonalStore/>
        </Suspense>
      </HomeSection>
      
      <HomeSection delay={0.9}>
        <Suspense fallback={<LoadingPlaceholder delay={0.9} />}>
          <Album />
        </Suspense>
      </HomeSection>
      
      <HomeSection delay={1.0}>
        <Suspense fallback={<LoadingPlaceholder delay={1.0} />}>
          <Footer />
        </Suspense>
      </HomeSection>
    </>
  )
}

export default HomeContent
