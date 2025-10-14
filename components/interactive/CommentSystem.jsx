'use client'

import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { MessageSquare } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import ClientTimeDisplay from '../layout/ClientTimeDisplay'
import { database, ref, onValue, addComment, addCommentReaction } from '../../firebase'
import { Smile, X } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

const CommentSystem = () => {
  const [comment, setComment] = useState("")
  const [comments, setComments] = useState([])
  const [commentsError, setCommentsError] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [commentError, setCommentError] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMoreComments, setHasMoreComments] = useState(true)
  const [showReactions, setShowReactions] = useState({}) // 控制每个评论的表情显示
  const [userReactions, setUserReactions] = useState({}) // 跟踪用户对每个评论的反应 (支持多个反应)
  const { toast } = useToast()

  // Generate user ID (client-side only)
  const generateUserId = () => {
    if (typeof window === 'undefined') return null; // Server-side safety
    
    let savedUserId = localStorage.getItem('userId');
    if (!savedUserId) {
      // Generate a unique user ID based on browser fingerprint (mobile-friendly)
      const fingerprint = navigator.userAgent + 
                         navigator.language + 
                         (screen?.width || window.innerWidth) + 
                         (screen?.height || window.innerHeight) + 
                         new Date().getTimezoneOffset() +
                         (navigator.platform || 'unknown');
      
      try {
        savedUserId = 'user_' + btoa(fingerprint).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      } catch (error) {
        // Fallback for browsers that don't support btoa
        savedUserId = 'user_' + fingerprint.replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
      }
      localStorage.setItem('userId', savedUserId);
    }
    return savedUserId;
  };

  // Initialize user ID (client-side only)
  const [userId, setUserId] = useState(null);

  // Initialize user ID and load reactions on client-side mount
  useEffect(() => {
    // Initialize user ID
    const newUserId = generateUserId();
    setUserId(newUserId);

    // Load user reactions
    const savedReactions = localStorage.getItem('userReactions');
    if (savedReactions) {
      try {
        setUserReactions(JSON.parse(savedReactions));
      } catch (error) {
        // Silently handle parsing errors
      }
    }
  }, []);

  // Save user reactions to localStorage whenever it changes (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userReactions', JSON.stringify(userReactions));
    }
  }, [userReactions]);

  // Fetch comments
  useEffect(() => {
    const commentsRef = ref(database, "comments");
    const unsubscribe = onValue(
      commentsRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const sortedComments = Object.entries(data)
            .map(([id, comment]) => ({ ...comment, id }))
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5);
          setComments(sortedComments);
          setCommentsError(null);
        } else {
          setComments([]);
          setCommentsError(null);
        }
      },
      (error) => {
        console.error("Error fetching comments:", error.code, error.message);
        setCommentsError(error.code === "PERMISSION_DENIED" ? "Permission denied" : "Error loading comments");
      }
    );

    return () => unsubscribe();
  }, []);

  // Handle comment reaction (like/fire/heart/laugh/wow)
  const handleCommentReaction = async (commentId, reactionType) => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not initialized",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCommentReaction(commentId, reactionType, userId);
      
      // Update local user reactions state (support multiple reactions per comment)
      setUserReactions(prev => {
        const currentReactions = prev[commentId] || [];
        
        if (Array.isArray(currentReactions)) {
          // Check if user already reacted with this type
          if (currentReactions.includes(reactionType)) {
            // Remove the reaction
            const newReactions = currentReactions.filter(r => r !== reactionType);
            return {
              ...prev,
              [commentId]: newReactions.length > 0 ? newReactions : undefined
            };
          } else {
            // Add the reaction
            return {
              ...prev,
              [commentId]: [...currentReactions, reactionType]
            };
          }
        } else {
          // Handle legacy single reaction format
          if (currentReactions === reactionType) {
            // Remove the reaction
            const newReactions = { ...prev };
            delete newReactions[commentId];
            return newReactions;
          } else {
            // Convert to array format and add new reaction
            return {
              ...prev,
              [commentId]: [currentReactions, reactionType]
            };
          }
        }
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
  };

  // 获取有数量的表情反应
  const getReactionsWithCount = (comment) => {
    const reactions = [
      { type: 'likes', emoji: '👍', color: 'hover:text-blue-400' },
      { type: 'fires', emoji: '🔥', color: 'hover:text-orange-400' },
      { type: 'hearts', emoji: '❤️', color: 'hover:text-red-400' },
      { type: 'laughs', emoji: '😂', color: 'hover:text-yellow-400' },
      { type: 'wows', emoji: '😮', color: 'hover:text-purple-400' }
    ];

    return reactions.filter(reaction => {
      const rawCount = comment[reaction.type];
      // Handle Firebase object format - extract the actual number
      const count = typeof rawCount === 'object' ? (rawCount[reaction.type] || 0) : rawCount;
      
      // Check if user reacted with this type (support both array and single reaction formats)
      const userReactionsForComment = userReactions[comment.id];
      const userReacted = Array.isArray(userReactionsForComment) 
        ? userReactionsForComment.includes(reaction.type)
        : userReactionsForComment === reaction.type;
      
      // Show reaction if it has count OR if user just reacted to it
      return (count || 0) > 0 || userReacted;
    });
  };

  // 获取总表情数量
  const getTotalReactionCount = (comment) => {
    const reactions = ['likes', 'fires', 'hearts', 'laughs', 'wows'];
    return reactions.reduce((total, reaction) => {
      const rawCount = comment[reaction];
      // Handle Firebase object format - extract the actual number
      const count = typeof rawCount === 'object' ? (rawCount[reaction] || 0) : rawCount;
      return total + (count || 0);
    }, 0);
  };

  // 切换表情显示
  const toggleReactions = (commentId) => {
    setShowReactions(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Load more comments
  const loadMoreComments = async () => {
    if (loadingMore || !hasMoreComments) return;
    
    setLoadingMore(true);
    try {
      // For now, we'll just simulate loading more comments
      // In a real implementation, you'd fetch more comments from Firebase
      setTimeout(() => {
        setLoadingMore(false);
        setHasMoreComments(false); // No more comments for demo
      }, 1000);
    } catch (error) {
      setLoadingMore(false);
    }
  };

  // Comment submission
  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      setCommentError(true);
      return;
    }
    try {
      await addComment(comment);
      setComment("");
      setCommentError(false);
      setDialogOpen(false);
      toast({
        title: "Comment Submitted",
        description: "Your comment has been posted successfully!",
        action: <ToastAction altText="Close">Close</ToastAction>,
      });
    } catch (err) {
      console.error("Error adding comment:", err);
      toast({
        title: "Error",
        description: "Failed to submit comment: " + err.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" className="text-white hover:text-black">
          <MessageSquare /> Comment
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-2xl scale-[0.85] sm:scale-[1.0]">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl font-bold text-white">
            Most Recent Comments
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300 text-sm leading-relaxed">
            View and submit comments. Your feedback helps improve the experience.
          </AlertDialogDescription>
          {commentsError ? (
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">
                {commentsError}
              </p>
            </div>
          ) : (
            <div 
              className="max-h-60 overflow-y-auto modern-scrollbar mb-4 space-y-3"
              onScroll={(e) => {
                const { scrollTop, scrollHeight, clientHeight } = e.target;
                if (scrollHeight - scrollTop === clientHeight && hasMoreComments && !loadingMore) {
                  loadMoreComments();
                }
              }}
            >
              {comments.length > 0 ? (
                comments.map((c, index) => (
                  <div key={index} className="group relative">
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-300/50 rounded-lg p-3 hover:bg-white/95 transition-all duration-200">
                      <p className="text-black text-sm leading-relaxed font-semibold">{c.text}</p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-gray-600 text-xs">
                          <ClientTimeDisplay timestamp={c.timestamp} fallback="Just now" />
                        </p>
                        
                        {/* 表情反应区域 */}
                        <div className="flex items-center gap-2">
                          {/* 如果有表情反应，显示有数量的表情 */}
                          {getReactionsWithCount(c).length > 0 && (
                            <div className="flex items-center gap-1">
                              {getReactionsWithCount(c).map((reaction) => {
                                // Check if user reacted with this type (support both array and single reaction formats)
                                const userReactionsForComment = userReactions[c.id];
                                const isUserReacted = Array.isArray(userReactionsForComment) 
                                  ? userReactionsForComment.includes(reaction.type)
                                  : userReactionsForComment === reaction.type;
                                
                                const rawCount = c[reaction.type] || 0;
                                // Handle Firebase object format - extract the actual number
                                const count = typeof rawCount === 'object' ? (rawCount[reaction.type] || 0) : rawCount;
                                const displayCount = isUserReacted && count === 0 ? 1 : count;
                                
                                return (
                                  <button
                                    key={reaction.type}
                                    onClick={() => handleCommentReaction(c.id, reaction.type)}
                                    className={`flex items-center gap-1 ${isUserReacted ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-400'} ${reaction.color} transition-colors text-xs px-3 py-2 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 touch-manipulation`}
                                    title={reaction.type}
                                  >
                                    <span>{reaction.emoji}</span>
                                    <span className="text-black font-bold">{displayCount}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                          
                          {/* 表情开关按钮 - 始终显示 */}
                          <button
                            onClick={() => toggleReactions(c.id)}
                            className="text-gray-400 hover:text-yellow-400 active:text-yellow-400 transition-colors text-sm px-3 py-2 rounded-full hover:bg-gray-700/50 active:bg-gray-700/70 border-2 border-gray-500/70 hover:border-yellow-400/70 active:border-yellow-400/70 touch-manipulation"
                            title={showReactions[c.id] ? "Close Reactions" : "Add Reaction"}
                          >
                            {showReactions[c.id] ? <X size={18} /> : <Smile size={18} />}
                          </button>
                          
                          {/* 表情选择器 */}
                          {showReactions[c.id] && (
                            <div className="flex items-center gap-1 bg-gray-800/80 backdrop-blur-sm border border-gray-600/50 rounded-full px-2 py-1 touch-manipulation">
                              <button
                                onClick={() => {
                                  handleCommentReaction(c.id, 'likes');
                                  setShowReactions(prev => ({ ...prev, [c.id]: false }));
                                }}
                                className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('likes') : userReactions[c.id] === 'likes') ? 'text-blue-400 bg-blue-400/20' : 'text-gray-400 hover:text-blue-400 active:text-blue-400'} transition-all duration-200 text-lg px-2 py-1 hover:scale-150 active:scale-125 touch-manipulation`}
                                title="点赞"
                              >
                                👍
                              </button>
                              <button
                                onClick={() => {
                                  handleCommentReaction(c.id, 'fires');
                                  setShowReactions(prev => ({ ...prev, [c.id]: false }));
                                }}
                                className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('fires') : userReactions[c.id] === 'fires') ? 'text-orange-400 bg-orange-400/20' : 'text-gray-400 hover:text-orange-400 active:text-orange-400'} transition-all duration-200 text-lg px-2 py-1 hover:scale-150 active:scale-125 touch-manipulation`}
                                title="Fire"
                              >
                                🔥
                              </button>
                              <button
                                onClick={() => {
                                  handleCommentReaction(c.id, 'hearts');
                                  setShowReactions(prev => ({ ...prev, [c.id]: false }));
                                }}
                                className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('hearts') : userReactions[c.id] === 'hearts') ? 'text-red-400 bg-red-400/20' : 'text-gray-400 hover:text-red-400 active:text-red-400'} transition-all duration-200 text-lg px-2 py-1 hover:scale-150 active:scale-125 touch-manipulation`}
                                title="爱心"
                              >
                                ❤️
                              </button>
                              <button
                                onClick={() => {
                                  handleCommentReaction(c.id, 'laughs');
                                  setShowReactions(prev => ({ ...prev, [c.id]: false }));
                                }}
                                className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('laughs') : userReactions[c.id] === 'laughs') ? 'text-yellow-400 bg-yellow-400/20' : 'text-gray-400 hover:text-yellow-400 active:text-yellow-400'} transition-all duration-200 text-lg px-2 py-1 hover:scale-150 active:scale-125 touch-manipulation`}
                                title="大笑"
                              >
                                😂
                              </button>
                              <button
                                onClick={() => {
                                  handleCommentReaction(c.id, 'wows');
                                  setShowReactions(prev => ({ ...prev, [c.id]: false }));
                                }}
                                className={`${(Array.isArray(userReactions[c.id]) ? userReactions[c.id].includes('wows') : userReactions[c.id] === 'wows') ? 'text-purple-400 bg-purple-400/20' : 'text-gray-400 hover:text-purple-400 active:text-purple-400'} transition-all duration-200 text-lg px-2 py-1 hover:scale-150 active:scale-125 touch-manipulation`}
                                title="惊讶"
                              >
                                😮
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <div className="w-12 h-12 mx-auto mb-3 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-400 text-sm">No comments yet.</p>
                </div>
              )}
              
              {/* Load more indicator */}
              {loadingMore && (
                <div className="text-center py-4">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-800/50 rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                  </div>
                  <p className="text-gray-400 text-xs">Loading more comments...</p>
                </div>
              )}
              
              {!hasMoreComments && comments.length > 0 && (
                <div className="text-center py-2">
                  <p className="text-gray-500 text-xs">No more comments</p>
                </div>
              )}
            </div>
          )}
        </AlertDialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center sm:justify-start">
            <h1 className="text-lg font-semibold text-white">
              I want to hear from you
            </h1>
          </div>
          <div className="relative">
            <textarea
              className={`w-full p-3 bg-white/90 text-black border ${
                commentError ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition-all duration-200 resize-none placeholder-gray-500`}
              placeholder="Type your comment..."
              rows={4}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setCommentError(false);
              }}
            />
          </div>
          {commentError && (
            <div className="bg-red-100/90 backdrop-blur-sm border border-red-300/50 rounded-lg p-2">
              <p className="text-red-600 text-sm">
                Comment cannot be empty!
              </p>
            </div>
          )}
        </div>
        
        <AlertDialogFooter className="flex gap-3 pt-4">
          <AlertDialogCancel className="bg-red-500/90 backdrop-blur-sm text-white hover:bg-red-600/90 hover:text-white border-red-400/50 transition-all duration-200">
            Cancel
          </AlertDialogCancel>
          <Button 
            className="bg-blue-600/90 backdrop-blur-sm text-white hover:bg-blue-700/90 transition-all duration-200" 
            onClick={handleCommentSubmit}
          >
            Submit
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default CommentSystem
