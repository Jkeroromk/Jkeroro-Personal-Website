'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const skills = ['React', 'Next.js', 'TypeScript', 'Node.js', 'Python', '日料']

const timeline = [
  { year: '2024', role: 'Frontend Engineer', place: 'Open Source & Personal Projects' },
  { year: '2023', role: 'Sushi Chef', place: 'Japanese Omakase Restaurant' },
  { year: '2022', role: 'Full Stack Developer', place: 'Freelance' },
]

const About = () => {
  const shouldReduceMotion = useReducedMotion()

  return (
    <div className="flex flex-col items-center mt-16 px-4 w-full max-w-2xl mx-auto">
      <h1 className="text-white font-extrabold text-2xl">About Me</h1>

      <div className="flex flex-col md:flex-row gap-8 mt-8 w-full items-start">
        {/* Photo placeholder */}
        <div className="flex-shrink-0 flex justify-center w-full md:w-auto">
          <div className="w-40 h-52 bg-neutral-800 rounded-2xl border border-white/10 flex items-center justify-center text-neutral-500 text-sm font-medium select-none">
            放照片
          </div>
        </div>

        {/* Bio */}
        <div className="flex flex-col gap-4 flex-1">
          <p className="text-white/90 text-sm leading-relaxed">
            Hi, I&apos;m <span className="font-bold text-white">Jason</span> — a frontend engineer
            who also happens to be a trained sushi chef. I build cozy, thoughtful web experiences
            by day and craft omakase by night.
          </p>
          <p className="text-white/60 text-sm leading-relaxed">
            The duality keeps me grounded: coding taught me systems thinking; the kitchen taught me
            precision and calm under pressure. Both demand the same obsessive attention to detail.
          </p>

          {/* Skill tags */}
          <div className="flex flex-wrap gap-2 mt-1">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-white/10 text-white text-xs font-semibold rounded-full border border-white/10 hover:bg-white/20 transition-colors duration-200 cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="mt-10 w-full">
        <h2 className="text-white font-bold text-base mb-5">Experience</h2>
        <div className="flex flex-col gap-5 pl-1 border-l border-white/10">
          {timeline.map((item, i) => (
            <motion.div
              key={item.year + item.role}
              className="flex items-start gap-4 relative pl-5"
              initial={shouldReduceMotion ? false : { opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-40px 0px' }}
              transition={{ duration: 0.35, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="absolute left-[-5px] top-1.5 w-2 h-2 rounded-full bg-white/30" />
              <span className="text-white/40 text-xs font-mono w-10 shrink-0 mt-0.5">{item.year}</span>
              <div className="flex flex-col">
                <span className="text-white font-semibold text-sm">{item.role}</span>
                <span className="text-white/50 text-xs mt-0.5">{item.place}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default About
