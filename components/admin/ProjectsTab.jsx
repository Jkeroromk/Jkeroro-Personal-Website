'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Edit, Trash2, Settings, GripVertical } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ProjectsTab = ({ projects, onEdit, onDelete, onAddNew, onReorder }) => {
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [dragOverIndex, setDragOverIndex] = React.useState(null);
  const [localProjects, setLocalProjects] = React.useState(projects);

  // 当 projects prop 变化时更新本地状态
  React.useEffect(() => {
    setLocalProjects(projects);
  }, [projects]);

  // 拖拽处理函数
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    // 创建自定义拖拽图像
    const dragImage = document.createElement('div');
    dragImage.style.cssText = 'position: absolute; top: -9999px; opacity: 0.5; pointer-events: none;';
    dragImage.innerHTML = `<div style="width: 100px; height: 100px; background: rgba(0,0,0,0.8); border: 2px dashed #fff; border-radius: 8px;"></div>`;
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 50, 50);
    setTimeout(() => {
      if (document.body.contains(dragImage)) {
        document.body.removeChild(dragImage);
      }
    }, 0);
    
    setDraggedIndex(index);
    // 添加全局样式，使拖拽元素变半透明
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    // 设置拖拽悬停的索引（使用原始索引）
    if (index !== draggedIndex && draggedIndex !== null) {
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
    e.stopPropagation();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex !== dropIndex && dragIndex !== null && onReorder) {
      // 调用父组件的重新排序函数
      onReorder(dragIndex, dropIndex);
    }
    
    // 重置状态
    setDraggedIndex(null);
    setDragOverIndex(null);
    // 恢复本地状态到原始顺序（等待 API 更新）
    setLocalProjects(projects);
  };
  // 获取标签颜色的辅助函数（与其他组件保持一致）
  const getCategoryColor = (category) => {
    switch (category) {
      case 'personal':
        return 'bg-purple-700/30 border-purple-600 text-purple-800';
      case 'work':
        return 'bg-green-700/30 border-green-600 text-green-800';
      case 'school':
        return 'bg-blue-700/30 border-blue-600 text-blue-800';
      default:
        return 'bg-gray-700/30 border-gray-600 text-gray-800';
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-600">
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
        {/* 桌面端：网格布局 */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {localProjects.map((project, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const originalIndex = projects.findIndex(p => p.id === project.id);
              
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ 
                    opacity: isDragging ? 0.5 : 1, 
                    scale: isDragging ? 0.95 : 1,
                    zIndex: isDragging ? 50 : 1
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ 
                    duration: 0.2,
                    layout: { duration: 0.3 }
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                  className={`group bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl overflow-hidden border transition-all duration-200 hover:shadow-lg hover:shadow-gray-800/50 cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? 'border-blue-400 scale-105 shadow-xl shadow-blue-500/50 ring-2 ring-blue-400' 
                      : isDragOver
                        ? 'border-dashed border-yellow-400 bg-gray-750 scale-105 ring-2 ring-yellow-400/50' 
                        : 'border-gray-600 hover:border-gray-500'
                  }`}
                  style={{
                    cursor: isDragging ? 'grabbing' : 'grab',
                  }}
                >
                  {/* 拖拽手柄 */}
                  <div className={`absolute top-2 left-2 z-10 transition-opacity ${
                    isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <GripVertical className="w-5 h-5 text-white bg-black/70 rounded p-1 shadow-lg" />
                  </div>
                  
                  {/* 拖拽提示 */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center z-20 rounded-xl">
                      <div className="bg-black/80 text-white px-3 py-1 rounded text-xs font-semibold">
                        拖拽中...
                      </div>
                    </div>
                  )}
              {/* 图片容器 */}
              <div className="relative aspect-square bg-gray-600 overflow-hidden">
                {project.image && project.image.trim() !== '' ? (
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-contain transition-transform duration-300 group-hover:scale-105"
                    unoptimized={project.image.startsWith('/api/file/') || project.image.startsWith('https://')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
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
                  <span className={`inline-block text-xs px-2 py-0.5 border-l-2 font-light tracking-wide uppercase ${getCategoryColor(project.category)}`}>
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
              );
            })}
          </AnimatePresence>
        </div>

        {/* 移动端：列表布局 */}
        <div className="md:hidden space-y-3">
          <AnimatePresence mode="popLayout">
            {localProjects.map((project, index) => {
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const originalIndex = projects.findIndex(p => p.id === project.id);
              
              return (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: isDragging ? 0.5 : 1, 
                    y: 0,
                    scale: isDragging ? 0.95 : 1
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ 
                    duration: 0.2,
                    layout: { duration: 0.3 }
                  }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, originalIndex)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, originalIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, originalIndex)}
                  className={`rounded-lg p-3 transition-all duration-200 cursor-grab active:cursor-grabbing ${
                    isDragging
                      ? 'bg-gray-600 border-2 border-blue-400 shadow-lg' 
                      : isDragOver
                        ? 'bg-gray-600 border-2 border-dashed border-yellow-400' 
                        : 'bg-gray-700 hover:bg-gray-600 border-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      {/* 拖拽手柄 */}
                      <div className={`mr-2 transition-opacity flex-shrink-0 ${
                        isDragging ? 'opacity-100' : 'opacity-50'
                      }`}>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center mr-3 relative flex-shrink-0">
                    {project.image && project.image.trim() !== '' ? (
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        sizes="48px"
                        className="object-contain rounded-lg"
                        unoptimized={project.image.startsWith('/api/file/') || project.image.startsWith('https://')}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Settings className="w-5 h-5" />
                      </div>
                    )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-white truncate">{project.title}</h3>
                          <span className="text-xs text-gray-500 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                            #{index + 1}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 truncate">{project.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-1 py-0.5 rounded border ${getCategoryColor(project.category)}`}>
                            {project.category}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-700 px-1 py-0.5 rounded flex-shrink-0">
                            {project.link ? '有链接' : '无链接'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onEdit(project, 'project')}
                        className="hover:bg-gray-600 h-8 px-2"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(project.id, 'project')}
                        className="hover:bg-red-600 h-8 px-2"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default ProjectsTab
