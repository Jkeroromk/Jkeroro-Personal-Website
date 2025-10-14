'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Edit, Trash2, MessageSquare, ThumbsUp, Flame, Heart, Laugh, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { getAllComments, deleteComment, updateComment } from '../../firebase'

const CommentsTab = () => {
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingComment, setEditingComment] = useState(null)
  const [editText, setEditText] = useState('')
  const { toast } = useToast()

  // 获取所有评论
  const fetchComments = async () => {
    try {
      setLoading(true)
      const allComments = await getAllComments()
      setComments(allComments)
    } catch (error) {
      console.error('Error fetching comments:', error)
      toast({
        title: "错误",
        description: "获取评论失败: " + error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [])

  // 删除评论
  const handleDeleteComment = async (commentId) => {
    if (!confirm('确定要删除这条评论吗？')) return
    
    try {
      await deleteComment(commentId)
      setComments(comments.filter(c => c.id !== commentId))
      toast({
        title: "成功",
        description: "评论已删除",
      })
    } catch (error) {
      console.error('Error deleting comment:', error)
      toast({
        title: "错误",
        description: "删除评论失败: " + error.message,
        variant: "destructive",
      })
    }
  }

  // 开始编辑评论
  const handleStartEdit = (comment) => {
    setEditingComment(comment.id)
    setEditText(comment.text)
  }

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      toast({
        title: "错误",
        description: "评论内容不能为空",
        variant: "destructive",
      })
      return
    }

    try {
      await updateComment(editingComment, editText.trim())
      setComments(comments.map(c => 
        c.id === editingComment ? { ...c, text: editText.trim() } : c
      ))
      setEditingComment(null)
      setEditText('')
      toast({
        title: "成功",
        description: "评论已更新",
      })
    } catch (error) {
      console.error('Error updating comment:', error)
      toast({
        title: "错误",
        description: "更新评论失败: " + error.message,
        variant: "destructive",
      })
    }
  }

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingComment(null)
    setEditText('')
  }

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return '未知时间'
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 获取反应总数
  const getTotalReactions = (comment) => {
    const reactions = ['likes', 'fires', 'hearts', 'laughs', 'wows']
    return reactions.reduce((total, reaction) => {
      const count = comment[reaction]
      return total + (typeof count === 'object' ? 0 : (count || 0))
    }, 0)
  }

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-600">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
            <span className="ml-3 text-white">加载评论中...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-gray-800 border-gray-600">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            评论管理 ({comments.length})
          </CardTitle>
          <Button
            onClick={fetchComments}
            className="bg-white text-black hover:bg-gray-200"
          >
            刷新
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400">暂无评论</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 hover:bg-gray-700/70 transition-all duration-200"
              >
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="bg-gray-800 text-white border-gray-600 focus:border-gray-500"
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        保存
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                        size="sm"
                      >
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <p className="text-white text-sm leading-relaxed flex-1 mr-4">
                        {comment.text}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          onClick={() => handleStartEdit(comment)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white hover:bg-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-red-400 hover:bg-gray-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-gray-400 text-xs">
                          {formatTime(comment.timestamp)}
                        </span>
                        
                        {getTotalReactions(comment) > 0 && (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              <ThumbsUp className="w-3 h-3 mr-1" />
                              {comment.likes || 0}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              <Flame className="w-3 h-3 mr-1" />
                              {comment.fires || 0}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              <Heart className="w-3 h-3 mr-1" />
                              {comment.hearts || 0}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              <Laugh className="w-3 h-3 mr-1" />
                              {comment.laughs || 0}
                            </Badge>
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              <Eye className="w-3 h-3 mr-1" />
                              {comment.wows || 0}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <Badge variant="outline" className="border-gray-500 text-gray-400">
                        ID: {comment.id.slice(-8)}
                      </Badge>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default CommentsTab
