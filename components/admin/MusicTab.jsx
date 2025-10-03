'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Music } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const MusicTab = ({ tracks, onEdit, onDelete }) => {
  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Music className="w-5 h-5 mr-2" />
          Music Tracks ({tracks.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tracks.map((track) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-white">{track.title}</h3>
                <p className="text-sm text-gray-400">{track.subtitle}</p>
                <p className="text-xs text-gray-500">{track.src}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onEdit(track, 'track')}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(track.id, 'track')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export default MusicTab
