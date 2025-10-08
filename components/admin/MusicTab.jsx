'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, Music, Plus, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const MusicTab = ({ tracks, onEdit, onDelete, onAdd, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [dragOverIndex, setDragOverIndex] = React.useState(null);

  // 移除动态鼠标跟踪，避免掉帧

  // 计算总文件大小（估算）
  const getFileSizeEstimate = (src) => {
    // 简单的文件大小估算，实际大小可能不同
    const fileName = src.split('/').pop() || '';
    
    // 检查常见的音乐文件大小模式
    if (fileName.includes('Everybody')) return '4.9MB';
    if (fileName.includes('Leessang')) return '5.4MB';
    if (fileName.includes('ReawakeR')) return '4.5MB';
    if (fileName.includes('SPECIALZ')) return '1.9MB';
    if (fileName.includes('Work')) return '4.8MB';
    if (fileName.includes('2hollis')) return '3.2MB';
    if (fileName.includes('ICEDMANE')) return '4.1MB';
    if (fileName.includes('Instruments_of_Retribution')) return '5.8MB';
    
    // 根据文件扩展名估算
    if (fileName.endsWith('.mp3')) {
      // MP3 文件通常 3-6MB
      return '~4MB';
    } else if (fileName.endsWith('.wav')) {
      // WAV 文件通常更大
      return '~8MB';
    } else if (fileName.endsWith('.flac')) {
      // FLAC 文件通常 5-10MB
      return '~6MB';
    }
    
    return '~3MB'; // 默认估算
  };

  const totalSizeEstimate = tracks.reduce((total, track) => {
    const size = getFileSizeEstimate(track.src);
    // 移除 ~ 符号和 MB 后缀，然后转换为数字
    const sizeNum = parseFloat(size.replace(/[~MB]/g, ''));
    return total + sizeNum;
  }, 0);

  // 拖拽处理函数
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
    // 移除拖拽虚影
    e.dataTransfer.setDragImage(new Image(), 0, 0);
    
    setDraggedIndex(index);
  };

  const handleDragEnd = (e) => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    // 设置拖拽悬停的索引
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = (e) => {
    // 只有当鼠标真正离开元素时才清除拖拽悬停状态
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex !== dropIndex && onReorder) {
      onReorder(dragIndex, dropIndex);
    }
    setDragOverIndex(null);
  };

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Music className="w-5 h-5 mr-2" />
            Music Tracks ({tracks.length})
          </div>
          <div className="flex items-center gap-2">
            {tracks.length > 0 && (
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                ~{totalSizeEstimate.toFixed(1)}MB total
              </span>
            )}
            {tracks.length === 0 && (
              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                Empty Library
              </span>
            )}
            <Button
              size="sm"
              onClick={onAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Track
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 性能警告 */}
        {tracks.length > 8 && (
          <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-yellow-300">
                <span className="font-medium">Performance Warning:</span> You have {tracks.length} tracks (~{totalSizeEstimate.toFixed(1)}MB). 
                Consider keeping under 8 tracks for optimal loading speed.
              </p>
            </div>
          </div>
        )}

        {tracks.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg className="w-12 h-12 mx-auto text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Music Tracks</h3>
            <p className="text-sm text-gray-400 mb-4">
              Start building your music library by uploading your first track!
            </p>
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 max-w-md mx-auto">
              <p className="text-xs text-gray-300 mb-2">Supported formats:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">MP3</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">WAV</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">OGG</span>
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">M4A</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {(tracks || []).map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                className={`rounded-lg p-3 sm:p-4 flex items-center justify-between transition-colors duration-150 cursor-move group ${
                  draggedIndex === index 
                    ? 'bg-gray-600 border-2 border-gray-400' 
                    : dragOverIndex === index 
                      ? 'bg-gray-600 border-2 border-dashed border-gray-400' 
                      : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="flex items-center flex-1 min-w-0">
                  <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center mr-3 relative flex-shrink-0">
                    <Music className="w-5 h-5 text-gray-400" />
                    <GripVertical className="absolute -left-6 w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white truncate">{track.title}</h3>
                      <span className="text-xs text-gray-500 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 truncate">{track.subtitle}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-600 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                        {getFileSizeEstimate(track.src)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(track, 'track')}
                    className="hover:bg-gray-600 h-8 px-2 sm:px-3"
                  >
                    <Edit className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                    <span className="hidden sm:inline">Edit</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(track.id, 'track')}
                    className="hover:bg-red-600 h-8 px-2 sm:px-3"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default MusicTab
