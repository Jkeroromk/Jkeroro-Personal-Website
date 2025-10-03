'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ProjectsTab = ({ projects, onEdit, onDelete, onAddNew }) => {
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Projects ({projects.length})
          </CardTitle>
          <Button
            onClick={() => onAddNew('project')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add Project
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="group bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/50"
            >
              {/* 图片容器 */}
              <div className="relative aspect-square bg-gray-700 overflow-hidden">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                {/* 悬停时的操作按钮 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(project, 'project')}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(project.id, 'project')}
                    className="bg-red-600/80 hover:bg-red-700/80 text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* 信息区域 */}
              <div className="p-4">
                <h3 className="font-semibold text-white text-sm mb-1 truncate" title={project.title}>
                  {project.title}
                </h3>
                <p className="text-xs text-gray-400 mb-2 line-clamp-2" title={project.description}>
                  {project.description}
                </p>
                <div className="mb-3">
                  <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded">
                    {project.category}
                  </span>
                </div>
                {project.link && (
                  <a 
                    href={project.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 truncate block"
                    title={project.link}
                  >
                    🔗 View Project
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectsTab
