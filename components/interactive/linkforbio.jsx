"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef
import { useAuth } from "../../auth";
import { database, ref, set, onValue, incrementViewCount, trackVisitorLocation, addComment, addCommentReaction } from "../../firebase";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Eye, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import ClientTimeDisplay from "../layout/ClientTimeDisplay";
// 使用更精确的导入来减少包大小
import { FaTiktok } from "react-icons/fa6";
import { FaInstagram, FaYoutube, FaTwitch, FaSpotify, FaSoundcloud } from "react-icons/fa";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import WorldMapDialog from "@/components/effects/worldMap";
import dynamic from "next/dynamic";

const Car = dynamic(() => import("../media/car"), { ssr: false, loading: () => <p>Loading...</p> });

export default function LinkforBio() {
  const { user, isAdmin, isOnline, lastActivity, loading, loginWithEmail, logout } = useAuth();
  const [viewerCount, setViewerCount] = useState(0);
  const [viewerError, setViewerError] = useState(null);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [commentError, setCommentError] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const { toast } = useToast();
  const debounceTimeoutRef = useRef(null); // Added to manage debounce timeout

  // 移除隐藏键登录功能，现在使用专门的登录按钮

  // Admin activity tracking
  useEffect(() => {
    if (!isAdmin || !user) return;

    const adminStatusRef = ref(database, "adminStatus/lastActive");

    const debounce = (func, delay) => {
      return (...args) => {
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
          if (user) func(...args); // Only call if user is still logged in
        }, delay);
      };
    };

    const updateActivityInDB = () => {
      set(adminStatusRef, Date.now()).catch((err) => {
        if (user) { // Only show toast if user is still logged in
          console.error("Failed to update lastActive:", err);
          toast({
            title: "Error",
            description: "Couldn't update admin status: " + err.message,
            variant: "destructive",
          });
        }
      });
    };

    const debouncedUpdate = debounce(updateActivityInDB, 50);

    document.addEventListener("mousemove", debouncedUpdate);
    document.addEventListener("keydown", debouncedUpdate);

    return () => {
      document.removeEventListener("mousemove", debouncedUpdate);
      document.removeEventListener("keydown", debouncedUpdate);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current); // Clear any pending timeout
      }
    };
  }, [isAdmin, user, toast]);

  // Viewer count and location
  useEffect(() => {
    trackVisitorLocation().catch((err) => {
      console.error("Error tracking visitor location:", err);
    });
    incrementViewCount().catch((err) => {
      console.error("Error incrementing view count:", err);
    });

    const viewerCountRef = ref(database, "viewCount");
    const unsubscribe = onValue(
      viewerCountRef,
      (snapshot) => {
        setViewerCount(snapshot.val()?.count || 0);
        setViewerError(null);
      },
      (error) => {
        console.error("Error fetching viewer count:", error.code, error.message);
        setViewerError(error.code === "PERMISSION_DENIED" ? "Permission denied" : "Error loading viewers");
      }
    );

    return () => unsubscribe();
  }, []);

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

  // Handle comment reaction (like/fire/heart)
  const handleCommentReaction = async (commentId, reactionType) => {
    try {
      await addCommentReaction(commentId, reactionType);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add reaction",
        variant: "destructive",
      });
    }
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

  // Auth handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await loginWithEmail(loginEmail, loginPassword);
      setLoginEmail("");
      setLoginPassword("");
      setShowLogin(false);
      toast({
        title: "Login Successful",
        description: "Welcome back!",
      });
    } catch (error) {
      setLoginError(error.message);
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setShowLogin(false);
      toast({
        title: "Logged Out",
        description: "You’ve been logged out successfully.",
      });
    } catch (err) {
      console.error("Logout error:", err);
      toast({
        title: "Logout Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const statusColor = isOnline ? "bg-green-500" : "bg-red-500";
  const statusText = loading
    ? "Loading..."
    : isOnline
    ? "Online"
    : `Last Active: ${lastActivity || "Unknown"}`;

  return (
    <>
      <div className="relative flex flex-col items-center mt-8 mx-4">
        <Car />
        <div className="absolute top-0 flex gap-[120px] scale-[0.85] sm:gap-80 sm:scale-[1.0] mt-3">
          <AlertDialog open={mapOpen} onOpenChange={setMapOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-white hover:text-black">
                <Eye /> {viewerError ? "N/A" : viewerCount} Viewers
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black text-white border border-gray-400 shadow-lg scale-[0.9] sm:scale-[1]">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-base font-semibold">Audience Map</AlertDialogTitle>
                <AlertDialogDescription className="text-gray-300">
                  View the geographic distribution of your audience across the world.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <WorldMapDialog />
              <AlertDialogFooter>
                <AlertDialogCancel className="bg-black text-white hover:bg-red-400">Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

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
                          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg p-3 hover:bg-gray-700/50 transition-all duration-200">
                            <p className="text-white text-sm leading-relaxed">{c.text}</p>
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-gray-400 text-xs">
                                <ClientTimeDisplay timestamp={c.timestamp} fallback="Just now" />
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleCommentReaction(c.id, 'likes')}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                                >
                                  <span>👍</span>
                                  <span>{typeof c.likes === 'object' ? 0 : (c.likes || 0)}</span>
                                </button>
                                <button
                                  onClick={() => handleCommentReaction(c.id, 'fires')}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                                >
                                  <span>🔥</span>
                                  <span>{typeof c.fires === 'object' ? 0 : (c.fires || 0)}</span>
                                </button>
                                <button
                                  onClick={() => handleCommentReaction(c.id, 'hearts')}
                                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-xs"
                                >
                                  <span>❤️</span>
                                  <span>{typeof c.hearts === 'object' ? 0 : (c.hearts || 0)}</span>
                                </button>
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
                    className={`w-full p-3 bg-gray-900 text-white border ${
                      commentError ? "border-red-500" : "border-gray-600"
                    } rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 resize-none placeholder-gray-400`}
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
                  <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-600/50 rounded-lg p-2">
                    <p className="text-red-400 text-sm">
                      Comment cannot be empty!
                    </p>
                  </div>
                )}
              </div>
              
              <AlertDialogFooter className="flex gap-3 pt-4">
                <AlertDialogCancel className="bg-gray-800/50 backdrop-blur-sm text-white hover:bg-gray-700/50 border-gray-600/50 transition-all duration-200">
                  Cancel
                </AlertDialogCancel>
                <Button 
                  className="bg-white/90 backdrop-blur-sm text-black hover:bg-white transition-all duration-200" 
                  onClick={handleCommentSubmit}
                >
                  Submit
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="absolute bottom-[-45px] flex flex-col gap-y-1 items-center">
          <Avatar className="size-20 border">
            <AvatarImage src="/pfp.webp" alt="个人头像" />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 mt-1 mr-2">
            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-white text-xs">{statusText}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center mt-12">
        <h1 className="text-white font-extrabold text-2xl">Jkeroro</h1>
        <h2 className="text-white font-semibold text-sm">
          CN <span className="mx-1">✈️</span> HK <span className="mx-1">✈️</span> US
        </h2>
        <div className="flex flex-row gap-6 mt-6 text-white">
          <a
            href="https://www.tiktok.com/@jkeroromk"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaTiktok size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                TikTok
              </span>
            </div>
          </a>
          <a
            href="https://www.instagram.com/jkerorozz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaInstagram size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                Instagram
              </span>
            </div>
          </a>
          <a
            href="https://youtube.com/@jkeroro_mk?si=kONouwFGS9t-ti3V"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaYoutube size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                YouTube
              </span>
            </div>
          </a>
          <a
            href="https://www.twitch.tv/jkerorozz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaTwitch size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                Twitch
              </span>
            </div>
          </a>
          <a
            href="https://open.spotify.com/user/jkeroro"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaSpotify size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                Spotify
              </span>
            </div>
          </a>
          <a
            href="https://on.soundcloud.com/B1Fe1ewaen6xbNfv9"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center group"
          >
            <div className="relative flex flex-col items-center">
              <FaSoundcloud size={25} className="hover:scale-[2.0] transform transition-transform duration-300" />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none">
                SoundCloud
              </span>
            </div>
          </a>
        </div>
      </div>

      {showLogin && (
        <div className="mt-8 flex justify-center w-full">
          <div className="p-4 text-white border border-gray-400 w-[20rem] bg-transparent rounded mt-5">
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 w-full rounded"
              >
                Logout
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <h2 className="text-white font-bold mb-2">Admin Login</h2>
                <form onSubmit={handleLogin} className="flex flex-col gap-2">
                  <input
                    className="p-2 text-white rounded bg-transparent border border-white"
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    aria-label="邮箱地址"
                  />
                  <input
                    className="p-2 text-white rounded bg-transparent border border-white"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    aria-label="密码"
                  />
                  {loginError && <p className="text-red-500 text-sm">{loginError}</p>}
                  <button className="bg-blue-600 hover:bg-blue-700 py-2 text-white rounded" type="submit">
                    Log In
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
