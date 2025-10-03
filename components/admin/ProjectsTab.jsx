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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg overflow-hidden"
            >
              <img 
                src={project.image} 
                alt={project.title}
                className="w-full h-32 object-cover"
              />
              <div className="p-4">
                <h3 className="font-semibold text-white">{project.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{project.description}</p>
                <span className="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded">
                  {project.category}
                </span>
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(project, 'project')}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(project.id, 'project')}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectsTab
