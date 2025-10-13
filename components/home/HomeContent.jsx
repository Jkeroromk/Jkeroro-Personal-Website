'use client'

import React from 'react'
import LinkforBio from "@/components/interactive/linkforbio"
import HomeSection from './HomeSection'

// 直接导入组件，减少加载时间
import Stack from "@/components/media/stack"
import MusicPlayer from "@/components/media/musicPlayer"
import Tabs from "@/components/media/tabs"
import PersonalStore from "@/components/interactive/personalStore"
import Album from "@/components/media/album"
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
      
      <HomeSection delay={0.4}>
        <Tabs />
      </HomeSection>
      
      <HomeSection delay={0.5}>
        <PersonalStore/>
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
