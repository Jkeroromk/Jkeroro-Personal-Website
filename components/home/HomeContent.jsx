'use client'

import React from 'react'
import LinkforBio from "@/components/linkforbio"
import Tabs from "@/components/tabs"
import Stack from "@/components/stack"
import MusicPlayer from "@/components/musicPlayer"
import Footer from "@/components/footer"
import Album from "@/components/album"
import PersonalStore from "@/components/personalStore"
import HomeSection from './HomeSection'

const HomeContent = () => {
  return (
    <>
      <HomeSection delay={0.4}>
        <LinkforBio/>
      </HomeSection>
      
      <HomeSection delay={0.5}>
        <Stack/>
      </HomeSection>
      
      <HomeSection delay={0.6}>
        <MusicPlayer />
      </HomeSection>
      
      <HomeSection delay={0.7}>
        <Tabs />
      </HomeSection>
      
      <HomeSection delay={0.8}>
        <PersonalStore/>
      </HomeSection>
      
      <HomeSection delay={0.9}>
        <Album />
      </HomeSection>
      
      <HomeSection delay={1.0}>
        <Footer />
      </HomeSection>
    </>
  )
}

export default HomeContent
