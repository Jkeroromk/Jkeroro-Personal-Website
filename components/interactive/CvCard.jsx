'use client'

// Tech Stack 上面的 CV 入口
import LinkCard from './LinkCard'

const CV_URL = 'https://3d-portfolio-jade-xi.vercel.app/'

export default function CvCard() {
  return <LinkCard title="Personal CV" sub="Resume · Job only" href={CV_URL} className="mt-12" />
}
