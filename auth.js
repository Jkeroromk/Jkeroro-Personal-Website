"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const userJustLoggedOut = useRef(false); // 标记用户是否刚刚登出

  // 获取管理员状态
  const fetchAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/status');
      const data = await response.json();
      
      if (data.lastActive) {
        setLastActivity(new Date(data.lastActive).toLocaleString());
        // 如果用户刚刚登出，不更新 isOnline 状态（保持 false）
        // 只有在用户没有登出，或者当前是管理员且在线时，才更新状态
        if (!userJustLoggedOut.current || isAdmin) {
          setIsOnline(data.isOnline || false);
        }
      } else {
        setLastActivity(null);
        setIsOnline(false);
      }
    } catch (error) {
      console.error('Error fetching admin status:', error);
      setLastActivity(null);
      if (!userJustLoggedOut.current) {
        setIsOnline(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // 监听管理员状态变化（轮询）
  // 只在当前用户是管理员时才轮询，减少不必要的请求
  useEffect(() => {
    fetchAdminStatus();
    
    // 如果用户不是管理员，不需要频繁轮询
    if (!isAdmin) {
      // 非管理员用户，每 2 分钟检查一次（用于显示管理员是否在线）
      const interval = setInterval(fetchAdminStatus, 120000); // 每2分钟更新一次
      return () => clearInterval(interval);
    }
    
    // 管理员用户，每 30 秒更新一次状态
    const interval = setInterval(fetchAdminStatus, 30000); // 每30秒更新一次

    return () => clearInterval(interval);
  }, [isAdmin]);

  // 监听认证状态变化
  useEffect(() => {
    if (!supabase) return;

    // 获取初始会话
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        const adminEmail = session.user.email === "zzou2000@gmail.com";
        setIsAdmin(adminEmail);
        userJustLoggedOut.current = false; // 登录时清除登出标记
        if (adminEmail) {
          // 更新管理员状态（标记为在线）
          fetch('/api/admin/status', { method: 'POST' }).then(() => {
            setIsOnline(true);
          }).catch(console.error);
        } else {
          setIsOnline(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsOnline(false);
      }
      setLoading(false);
    });

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const adminEmail = session.user.email === "zzou2000@gmail.com";
        setIsAdmin(adminEmail);
        userJustLoggedOut.current = false; // 登录时清除登出标记
        if (adminEmail) {
          // 更新管理员状态（标记为在线）
          fetch('/api/admin/status', { method: 'POST' }).then(() => {
            setIsOnline(true);
          }).catch(console.error);
        } else {
          setIsOnline(false);
        }
      } else {
        // 登出时清除所有状态
        userJustLoggedOut.current = true; // 标记为登出
        setUser(null);
        setIsAdmin(false);
        setIsOnline(false);
        // 5秒后清除登出标记
        setTimeout(() => {
          userJustLoggedOut.current = false;
        }, 5000);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 监听管理员在线状态
  useEffect(() => {
    if (!isAdmin) {
      setIsOnline(false);
      return;
    }

    // 定期检查管理员状态
    const checkInterval = setInterval(() => {
      fetchAdminStatus();
    }, 30000); // 每30秒检查一次

    return () => clearInterval(checkInterval);
  }, [isAdmin]);

  const loginWithEmail = async (email, password) => {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      // 使用 Supabase 客户端登录
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      // 如果是管理员，更新状态（标记为在线）
      if (data.user?.email === 'zzou2000@gmail.com') {
        userJustLoggedOut.current = false; // 登录时清除登出标记
        await fetch('/api/admin/status', { method: 'POST' });
        setIsOnline(true);
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!supabase) {
      return;
    }

    try {
      // 标记用户刚刚登出，防止轮询覆盖状态
      userJustLoggedOut.current = true;
      
      // Supabase 登出
      await supabase.auth.signOut();
      
      // 立即清除本地状态
      setIsOnline(false);
      setIsAdmin(false);
      setUser(null);
      
      // 5秒后清除登出标记，允许正常轮询（此时 lastActive 应该已经超过5分钟了）
      setTimeout(() => {
        userJustLoggedOut.current = false;
      }, 5000);
    } catch (error) {
      console.error('Logout error:', error);
      userJustLoggedOut.current = false; // 出错时清除标记
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        auth: supabase?.auth || null,
        isAdmin,
        isOnline,
        lastActivity,
        loading,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
