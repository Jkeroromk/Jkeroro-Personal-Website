'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Github, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import projects from '@/lib/projects'

const ProjectCard = ({ project }) => {
  return (
    <motion.div
      whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(0,0,0,0.6)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
    >
      {/* 预览图 */}
      <div className="relative w-full h-40 bg-white/5 overflow-hidden">
        {project.image ? (
          <Image
            src={project.image}
            alt={project.name}
            fill
            className="object-cover opacity-80 transition-opacity duration-300 hover:opacity-100"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-white/20 text-4xl font-bold">{project.name[0]}</span>
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <h3 className="text-white font-bold text-lg leading-tight">{project.name}</h3>
        <p className="text-white/60 text-sm leading-relaxed flex-1">{project.description}</p>

        {/* 技术标签 */}
        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 border border-white/10"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 链接 */}
        <div className="flex items-center gap-3 pt-1">
          <a
            href={project.github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors duration-200"
          >
            <Github size={15} />
            <span>GitHub</span>
          </a>
          {project.demo && (
            <a
              href={project.demo}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors duration-200"
            >
              <ExternalLink size={15} />
              <span>Demo</span>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const Projects = () => {
  return (
    <div className="flex flex-col items-center mt-16 px-4">
      <h1 className="text-white font-extrabold text-2xl">Projects</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8 w-full max-w-2xl">
        {projects.map((project) => (
          <ProjectCard key={project.name} project={project} />
        ))}
      </div>
    </div>
  )
}

export default Projects
