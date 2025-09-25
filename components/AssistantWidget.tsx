'use client';

import React, { useState, useRef, useEffect } from 'react';
import { sseIterator } from '@/lib/ai/sse';

// 消息类型定义
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/**
 * 悬浮式 AI 助手组件
 * 使用 checkbox + CSS peer 实现开关，支持流式响应
 */
export default function AssistantWidget() {
  // 状态管理
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // 引用
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const checkboxRef = useRef<HTMLInputElement>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 确保组件在客户端挂载
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 初始化消息（避免 hydration 错误）
  useEffect(() => {
    if (isMounted && !isInitialized) {
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: '你好！我是 Jkeroro 的 AI 助手。有什么可以帮助您的吗？',
          timestamp: new Date()
        }
      ]);
      setIsInitialized(true);
    }
  }, [isMounted, isInitialized]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 处理键盘事件
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // ESC 键关闭浮窗
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (checkboxRef.current) {
          checkboxRef.current.checked = false;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // 发送消息
  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    };

    // 添加用户消息
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // 准备消息历史（包含系统提示词）
      const messageHistory = [
        {
          role: 'system' as const,
          content: "You are Jkeroro's helpful AI assistant. Answer concisely, bilingual (中文/English) if user mixes languages."
        },
        ...messages.map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: userMessage.content
        }
      ];

      // 调用 API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: messageHistory }),
      });

      // 检查请求是否成功
      if (!response.ok) {
        const errorText = await response.text();
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `请求失败：\n${errorText}`,
          timestamp: new Date()
        }]);
        setIsLoading(false);
        return;
      }

      // 创建助手消息
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };

      // 添加空的助手消息
      setMessages(prev => [...prev, assistantMessage]);

      // 使用 SSE 解析器处理流式响应
      let fullContent = '';
      for await (const token of sseIterator(response)) {
        fullContent += token;
        
        // 更新最后一条消息的内容
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            lastMessage.content = fullContent;
          }
          return newMessages;
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      
      // 添加错误消息
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: '抱歉，发生了错误。请稍后重试。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理表单提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  // 处理输入框回车
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // 避免 hydration 错误，只在客户端渲染
  if (!isMounted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* 隐藏的 checkbox，用于控制浮窗开关 */}
      <input
        ref={checkboxRef}
        type="checkbox"
        id="assistant-toggle"
        className="hidden peer"
        onChange={(e) => setIsOpen(e.target.checked)}
      />

      {/* 悬浮按钮 - 黑色圆圈配白色J字 */}
      <label
        htmlFor="assistant-toggle"
        className="flex items-center justify-center w-14 h-14 bg-black text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer hover:scale-105 peer-checked:bg-black relative overflow-hidden"
      >
        {/* 动态白色J字 */}
        <span className="text-lg font-bold relative z-10 animate-pulse">J</span>
        {/* 动态背景效果 */}
        <div className="absolute inset-0 bg-white opacity-0 peer-checked:opacity-10 transition-opacity duration-300 rounded-full"></div>
      </label>

      {/* 聊天窗口 - 纯黑白色主题 */}
      <div className="absolute bottom-16 right-0 w-96 h-[520px] bg-black border border-white/20 rounded-lg shadow-2xl opacity-0 invisible peer-checked:opacity-100 peer-checked:visible transition-all duration-300 transform peer-checked:translate-y-0 translate-y-4">
        {/* 窗口头部 */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 bg-black/80 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <h3 className="text-white font-semibold">J 助手</h3>
          </div>
          <label
            htmlFor="assistant-toggle"
            className="text-white/70 hover:text-white cursor-pointer transition-colors"
          >
            ✕
          </label>
        </div>

        {/* 消息区域 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[400px] modern-scrollbar">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-white text-black'
                    : 'bg-white/10 text-white'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm">
                  {message.content}
                </div>
                <div className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {/* 加载指示器 */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 text-white p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区域 */}
        <div className="p-4 border-t border-white/20 bg-black/80 rounded-b-lg">
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入消息..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 bg-white/10 text-white placeholder-white/50 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              发送
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
