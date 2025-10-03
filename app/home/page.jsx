'use client'

import React from 'react'
import HomeLayout from '@/components/home/HomeLayout'
import HomeContent from '@/components/home/HomeContent'
import HomeAuth from '@/components/home/HomeAuth'

const HomePage = () => {
  return (
    <HomeAuth>
      <HomeLayout>
        <HomeContent />
      </HomeLayout>
    </HomeAuth>
  )
}

export default HomePage
