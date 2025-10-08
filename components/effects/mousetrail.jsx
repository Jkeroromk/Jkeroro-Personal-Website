'use client'

import React, { useEffect, useRef } from "react";
import '../../app/globals.css'

const MouseTrail = () => {
  const animationRef = useRef(null);
  const isActiveRef = useRef(true);
  const coordsRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // 重置状态，确保每次都是全新的初始化
    isActiveRef.current = true;
    
    // 等待DOM完全渲染
    const initializeMouseTrail = () => {
      const circles = document.querySelectorAll(".circle");
      const cursor = document.querySelector(".cursor");

      // 检查元素是否存在
      if (!circles.length || !cursor) {
        // 如果元素不存在，延迟重试
        setTimeout(initializeMouseTrail, 100);
        return;
      }

      // 获取当前鼠标位置，避免跳到左上角
      const getCurrentMousePosition = () => {
        // 尝试从最近的鼠标事件获取位置
        if (window.lastMouseX !== undefined && window.lastMouseY !== undefined) {
          return { x: window.lastMouseX, y: window.lastMouseY };
        }
        // 如果没有记录，使用屏幕中心位置
        return { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      };

      const initialPos = getCurrentMousePosition();
      coordsRef.current = initialPos;

      // Initialize circle positions with current mouse position
      circles.forEach(function (circle) {
        circle.x = initialPos.x;
        circle.y = initialPos.y;
        circle.style.backgroundColor = "white";
        // 立即设置圆圈位置，避免跳到左上角
        circle.style.left = (initialPos.x - 12) + "px";
        circle.style.top = (initialPos.y - 12) + "px";
      });

      // 立即设置光标位置
      cursor.style.top = initialPos.x;
      cursor.style.left = initialPos.y;

      // Update mouse position coordinates
      const handleMouseMove = (e) => {
        if (!isActiveRef.current) return;
        coordsRef.current.x = e.clientX;
        coordsRef.current.y = e.clientY;
        // 记录全局鼠标位置，供路由切换时使用
        window.lastMouseX = e.clientX;
        window.lastMouseY = e.clientY;
      };

      window.addEventListener("mousemove", handleMouseMove);

      function animateCircles() {
        if (!isActiveRef.current) return;
        
        // 重新查询DOM元素，确保获取最新的引用
        const currentCircles = document.querySelectorAll(".circle");
        const currentCursor = document.querySelector(".cursor");
        
        if (!currentCircles.length || !currentCursor) {
          animationRef.current = requestAnimationFrame(animateCircles);
          return;
        }

        let x = coordsRef.current.x;
        let y = coordsRef.current.y;

        currentCursor.style.top = x;
        currentCursor.style.left = y;

        currentCircles.forEach(function (circle, index) {
          circle.style.left = x - 12 + "px";
          circle.style.top = y - 12 + "px";
          circle.style.scale = (currentCircles.length - index) / currentCircles.length;
          circle.x = x;
          circle.y = y;

          const nextCircle = currentCircles[index + 1] || currentCircles[0];
          x += (nextCircle.x - x) * 0.3;
          y += (nextCircle.y - y) * 0.3;
        });

        animationRef.current = requestAnimationFrame(animateCircles);
      }

      animateCircles();

      // 清理函数
      return () => {
        isActiveRef.current = false;
        window.removeEventListener("mousemove", handleMouseMove);
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    };

    // 延迟初始化，确保DOM完全渲染
    const timeoutId = setTimeout(initializeMouseTrail, 100);

    return () => {
      clearTimeout(timeoutId);
      isActiveRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div className="cursor">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="circle"></div>
      ))}
    </div>
  );
};

export default MouseTrail;
