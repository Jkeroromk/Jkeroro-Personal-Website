'use client'

import React, { useEffect, useRef } from "react";
import '../../app/globals.css'

/**
 * 墨迹拖尾（安静版）：鼠标位置是一个白色小笔尖，后面拖出一条很细、很快就淡掉的墨线，
 * 只用来提示鼠标在哪，不抢页面内容的注意力。整层用 mix-blend-mode: difference（见 globals.css 的 .cursor），
 * 所以划过白色卡片时墨线会变成黑色。
 *
 * 保留了原来的行为：
 * - 鼠标在对话框或地图上时，隐藏笔尖和墨线、恢复系统光标（body.show-cursor）
 * - 记录 window.lastMouseX / lastMouseY，供 HomeLayout 在动画结束后定位
 * - 触屏设备由 globals.css 直接隐藏
 * - 系统开了"减弱动态效果"时不画墨线，只保留笔尖，这样网站隐藏了系统光标也不会找不到鼠标
 */

const INK_LIFE_MS = 420; // 一段墨线从出现到完全消失的时间
const INK_WIDTH = 3.5; // 墨线最粗处（px），紧贴笔尖
const INK_OPACITY = 0.55; // 墨线最浓处的不透明度
const MAX_POINTS = 400;
const TIP_SIZE = 10;

const isOverDialogOrMap = (x, y) => {
  const inside = (el) => {
    const rect = el.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  };
  for (const dialog of document.querySelectorAll('[data-radix-dialog-content]')) {
    if (inside(dialog)) return true;
  }
  const mapContainer = document.querySelector('[data-map-container]');
  return Boolean(mapContainer && inside(mapContainer));
};

const MouseTrail = () => {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const tipRef = useRef(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const tip = tipRef.current;
    if (!wrap || !canvas || !tip) return;

    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let points = [];
    let strokeId = 0;
    let hidden = false;
    let rafId = 0;
    let needsClear = false;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const placeTip = (x, y) => {
      tip.style.transform = `translate3d(${x - TIP_SIZE / 2}px, ${y - TIP_SIZE / 2}px, 0)`;
    };

    const setHidden = (value) => {
      if (hidden === value) return;
      hidden = value;
      wrap.style.opacity = value ? '0' : '1';
      document.body.classList.toggle('show-cursor', value);
      if (value) strokeId += 1; // 回来时重新起笔，不和之前的墨线连起来
    };

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;
      window.lastMouseX = x;
      window.lastMouseY = y;

      if (isOverDialogOrMap(x, y)) {
        setHidden(true);
        return;
      }
      setHidden(false);
      placeTip(x, y);
      if (reduceMotion) return;

      const now = performance.now();
      const last = points[points.length - 1];
      let pressure = 1;
      if (last && last.id === strokeId) {
        // 移动快时线稍微细一点，变化幅度很小
        const speed = (Math.hypot(x - last.x, y - last.y) / Math.max(1, now - last.t)) * 16;
        pressure = last.p * 0.6 + Math.max(0.6, Math.min(1, 1.1 - speed / 80)) * 0.4;
      }
      points.push({ x, y, t: now, p: pressure, id: strokeId });
      if (points.length > MAX_POINTS) points = points.slice(-MAX_POINTS);
    };

    // 鼠标离开窗口：藏起笔尖，下次进来重新起笔
    const handleMouseOut = (e) => {
      if (e.relatedTarget) return;
      strokeId += 1;
      wrap.style.opacity = '0';
      hidden = true;
    };

    const draw = () => {
      const now = performance.now();
      points = points.filter((p) => now - p.t < INK_LIFE_MS);

      if (points.length || needsClear) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        needsClear = points.length > 0;

        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < points.length; i++) {
          const a = points[i - 1];
          const b = points[i];
          if (a.id !== b.id) continue;
          const z = points[i - 2];
          // 用相邻点的中点做二次曲线，线条更圆滑
          const from = z && z.id === a.id ? { x: (z.x + a.x) / 2, y: (z.y + a.y) / 2 } : a;
          const to = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const life = Math.max(0, 1 - (now - b.t) / INK_LIFE_MS);
          ctx.strokeStyle = `rgba(255,255,255,${(INK_OPACITY * life).toFixed(3)})`;
          ctx.lineWidth = Math.max(0.5, INK_WIDTH * b.p * life);
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.quadraticCurveTo(a.x, a.y, to.x, to.y);
          ctx.stroke();
        }

      }
      rafId = requestAnimationFrame(draw);
    };

    resize();
    // 初始位置：最近一次记录的鼠标位置，没有就放屏幕中心，避免笔尖停在左上角
    placeTip(
      window.lastMouseX ?? window.innerWidth / 2,
      window.lastMouseY ?? window.innerHeight / 2
    );
    document.body.classList.remove('show-cursor');

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', resize);
    document.addEventListener('mouseout', handleMouseOut);
    if (!reduceMotion) rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('mouseout', handleMouseOut);
      document.body.classList.remove('show-cursor');
    };
  }, []);

  return (
    <div className="cursor" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} className="ink-canvas" />
      <div ref={tipRef} className="ink-tip" />
    </div>
  );
};

export default MouseTrail;
