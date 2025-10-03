'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/auth';
import { useToast } from '@/hooks/use-toast';

/**
 * 悬浮式登录按钮组件
 * 和AI助手一样的尺寸和动态闪烁效果
 */
export default function LoginButton() {
  const { user, isAdmin, loginWithEmail, logout } = useAuth();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // 确保组件在客户端挂载
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 登录处理
  const handleLogin = async (e: React.FormEvent) => {
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
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setLoginError(errorMessage);
      toast({
        title: "Login Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // 登出处理
  const handleLogout = async () => {
    try {
      await logout();
      setShowLogin(false);
      toast({
        title: "Logged Out",
        description: "See you next time!",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      toast({
        title: "Logout Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // 防止服务端渲染问题
  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-20 right-6 z-50">
      {/* 登录按钮 */}
      <button
        onClick={() => setShowLogin(!showLogin)}
        className="flex items-center justify-center w-10 h-10 bg-white/5 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 relative overflow-hidden border border-white/20"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* 动态白色图标 */}
        <span className="text-sm font-bold relative z-10 animate-pulse">
          L
        </span>
        {/* 动态背景效果 */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 animate-pulse opacity-50"></div>
      </button>

      {/* 登录对话框 */}
      {showLogin && (
        <div className="absolute bottom-16 right-0 w-72 bg-white/5 border border-white/20 rounded-lg shadow-2xl" style={{ backdropFilter: 'blur(20px)' }}>
          {/* 窗口头部 */}
          <div className="flex items-center justify-between p-3 border-b border-white/20 bg-white/5 rounded-t-lg" style={{ backdropFilter: 'blur(10px)' }}>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <h3 className="text-white font-semibold text-sm">
                {isAdmin ? 'Admin Panel' : 'Admin Login'}
              </h3>
            </div>
            <button
              onClick={() => setShowLogin(false)}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          {/* 内容区域 */}
          <div className="p-4">
            {isAdmin ? (
              // 已登录状态
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-white text-sm mb-2">Welcome back!</p>
                  <p className="text-white/60 text-xs">{user?.email}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open('/admin', '_blank')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    Open Admin
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded text-sm transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              // 未登录状态
              <form onSubmit={handleLogin} className="space-y-3">
                <div>
                  <input
                    className="w-full p-2 text-white rounded bg-white/10 border border-white/20 placeholder-white/50 text-sm"
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <input
                    className="w-full p-2 text-white rounded bg-white/10 border border-white/20 placeholder-white/50 text-sm"
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                {loginError && (
                  <p className="text-red-400 text-xs">{loginError}</p>
                )}
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition-colors"
                >
                  Login
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
