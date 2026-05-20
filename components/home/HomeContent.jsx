'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import LinkforBio from "@/components/interactive/linkforbio"
import HomeSection from './HomeSection'

// 首屏组件直接导入
import Stack from "@/components/media/stack"
import MusicPlayer from "@/components/media/musicPlayer"

// 折叠下方组件延迟加载，减少首屏 JS 体积
const Tabs = dynamic(() => import("@/components/media/tabs"), { ssr: false })
const GuestbookWall = dynamic(() => import("@/components/interactive/GuestbookWall"), { ssr: false })
const PersonalStore = dynamic(() => import("@/components/interactive/personalStore"), { ssr: false })
const Album = dynamic(() => import("@/components/media/album"), { ssr: false })
const AnniversaryCounter = dynamic(() => import("@/components/interactive/AnniversaryCounter"), { ssr: false })
import Footer from "@/components/layout/footer"


const HomeContent = () => {
  return (
    <>
      <HomeSection delay={0.1}>
        <LinkforBio/>
      </HomeSection>
      
      <HomeSection delay={0.2}>
        <Stack/>
      </HomeSection>
      
      <HomeSection delay={0.3}>
        <MusicPlayer />
      </HomeSection>

      <HomeSection delay={0.35}>
        <GuestbookWall />
      </HomeSection>

      <HomeSection delay={0.4}>
        <Tabs />
      </HomeSection>
      
      <HomeSection delay={0.5}>
        <PersonalStore/>
      </HomeSection>
      
      <HomeSection delay={0.55}>
        <AnniversaryCounter />
      </HomeSection>
      
      <HomeSection delay={0.6}>
        <Album />
      </HomeSection>

      <HomeSection delay={0.7}>
        <Footer />
      </HomeSection>
    </>
  )
}

export default HomeContent
