import React from 'react'

const Background = () => {
  return (
    <div className='fixed inset-0 z-[-99] overflow-hidden'>
    <video 
    src="/background.mp4"
    autoPlay
    loop
    muted
    playsInline
    className='object-cover w-full h-full'
    />
    </div>
  )
}

export default Background