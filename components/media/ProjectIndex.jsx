"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { outfit, jetbrainsMono } from "@/lib/fonts";

/**
 * 作品区：居中的项目索引 + 翻页（原来是 carousel）。
 * - 一列白色大字的项目名，每页 PER_PAGE 个，用左右按钮 / 页码翻页，不用一直往下滚
 * - 大屏且有鼠标：悬停某一行时其他行变暗，项目截图从鼠标旁边浮出来，带点延迟地跟着走
 * - 点击某一行展开：描述 + 链接
 * - 手机 / 平板 / 窄窗口没有浮动预览，截图改为显示在展开的内容里
 */

const PER_PAGE = 4;
const PREVIEW_W = 420;
const PREVIEW_H = 262; // 16:10，和网站截图的比例一致

const pad = (n) => String(n).padStart(2, "0");

const hasImage = (project) => Boolean(project.image && project.image.trim() !== "");

// 截图只在展开项目 / 悬停预览时才渲染，所以直接加载（loading="eager"）。
// 用 lazy 的话，iOS Safari 对一开始高度为 0、正在展开动画里的图片判断不出"已进入视口"，
// 会一直不去加载，只剩下模糊占位。模糊占位也去掉了：Safari 渲染它会变成一片蓝色。
const ProjectImage = ({ project, sizes }) =>
  hasImage(project) ? (
    <Image
      src={project.image}
      alt=""
      fill
      sizes={sizes}
      loading="eager"
      className="object-cover"
      style={{ objectPosition: `${project.cropX ?? 50}% ${project.cropY ?? 50}%` }}
      unoptimized={project.image.startsWith("/api/file/") || project.image.startsWith("https://")}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-white/70 text-2xl font-extrabold px-6 text-center">
      {project.title}
    </div>
  );

// 跟随鼠标的截图预览。用 portal 挂到 body 上，避免被外层带 transform 的容器影响 position: fixed
const FloatingPreview = ({ items, hoveredId, reduceMotion }) => {
  const ref = useRef(null);
  const target = useRef({ x: 0, y: 0 });
  const pos = useRef({ x: 0, y: 0, rot: 0 });
  const wasVisible = useRef(false);
  const hiddenAt = useRef(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleMove = (e) => {
      target.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (hoveredId == null) {
      // 从一行移到相邻一行时会短暂变成 null，不立刻重置，预览继续平滑滑过去
      hiddenAt.current = performance.now();
      return;
    }
    if (performance.now() - hiddenAt.current > 300) wasVisible.current = false;
    let raf = 0;
    const tick = () => {
      const el = ref.current;
      if (el) {
        const { x, y } = target.current;
        const maxX = window.innerWidth - PREVIEW_W - 16;
        let tx = x + 32;
        if (tx > maxX) tx = x - PREVIEW_W - 32;
        tx = Math.max(16, Math.min(maxX, tx));
        const ty = Math.max(16, Math.min(window.innerHeight - PREVIEW_H - 16, y - PREVIEW_H / 2));

        // 刚出现时直接放到鼠标旁边，不从上一次的位置飞过来
        if (!wasVisible.current || reduceMotion) {
          pos.current = { x: tx, y: ty, rot: 0 };
          wasVisible.current = true;
        } else {
          const lastX = pos.current.x;
          pos.current.x += (tx - pos.current.x) * 0.14;
          pos.current.y += (ty - pos.current.y) * 0.14;
          const tilt = Math.max(-9, Math.min(9, (pos.current.x - lastX) * 0.5));
          pos.current.rot += (tilt - pos.current.rot) * 0.2;
        }
        el.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0) rotate(${pos.current.rot}deg)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [hoveredId, reduceMotion]);

  if (!mounted) return null;

  return createPortal(
    <div
      ref={ref}
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] pointer-events-none"
      style={{ width: PREVIEW_W, height: PREVIEW_H, willChange: "transform" }}
    >
      {/* 外层负责跟随鼠标的位移，内层负责出现 / 消失的淡入和缩放 */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-[0_30px_70px_rgba(0,0,0,0.55)] transition duration-300 ease-out ${
          hoveredId != null ? "opacity-100 scale-100" : "opacity-0 scale-[0.86]"
        }`}
      >
        {items.map((project) => (
          <div
            key={project.id}
            className={`absolute inset-0 transition-opacity duration-300 ${
              hoveredId === project.id ? "opacity-100" : "opacity-0"
            }`}
          >
            <ProjectImage project={project} sizes={`${PREVIEW_W}px`} />
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

const ProjectIndex = () => {
  const { projects, error, loaded } = useProjects();
  const reduceMotion = useReducedMotion();
  const [page, setPage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [canFloat, setCanFloat] = useState(false);

  // 只有大屏且有鼠标时才做跟随鼠标的预览；窄窗口放不下 420px 的预览，会挡住文字
  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const update = () => {
      setCanFloat(mq.matches);
      if (!mq.matches) setHoveredId(null);
    };
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);

  const pageCount = Math.max(1, Math.ceil(projects.length / PER_PAGE));
  const currentPage = Math.min(page, pageCount - 1);
  const start = currentPage * PER_PAGE;
  const items = projects.slice(start, start + PER_PAGE);

  // 后台删了项目导致页数变少时，退回最后一页
  useEffect(() => {
    if (page > pageCount - 1) setPage(pageCount - 1);
  }, [page, pageCount]);

  const goTo = useCallback(
    (next) => {
      if (next < 0 || next >= pageCount || next === currentPage) return;
      setDirection(next > currentPage ? 1 : -1);
      setPage(next);
      setOpenId(null);
      setHoveredId(null);
    },
    [currentPage, pageCount]
  );

  const heading = (
    <h2 className="text-white font-bold text-[28px] sm:text-3xl tracking-[-0.01em] text-center">
      Personal Project Collection
    </h2>
  );

  if (error || !projects.length) {
    return (
      <div className={`${outfit.className} w-full flex flex-col items-center gap-6`}>
        {heading}
        {error ? (
          <p className="text-red-600 font-bold text-center">{error}</p>
        ) : (
          <p className="text-white/70 text-center">{loaded ? "No projects yet." : "Loading projects..."}</p>
        )}
      </div>
    );
  }

  const offset = reduceMotion ? 0 : 40;
  const listVariants = {
    enter: {},
    center: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
    exit: { opacity: 0, transition: { duration: 0.15 } },
  };
  const rowVariants = {
    enter: (dir) => ({ opacity: 0, x: offset * dir }),
    center: { opacity: 1, x: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  };

  const divider =
    "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent";

  return (
    <div className={`${outfit.className} w-full flex flex-col items-center`}>
      {heading}
      <p className={`${jetbrainsMono.className} mt-2.5 text-[11px] tracking-[0.12em] uppercase text-white/45 text-center px-4`}>
        {pad(projects.length)} projects · {canFloat ? "hover to preview, click to open" : "tap or click to open"}
      </p>

      <div
        className={`relative w-full max-w-[880px] mt-7 sm:mt-9 ${
          pageCount > 1 ? "min-h-[400px] sm:min-h-[460px] lg:min-h-[504px]" : ""
        }`}
        onMouseLeave={() => setHoveredId(null)}
      >
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.ul
            key={currentPage}
            custom={direction}
            variants={listVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="relative after:block after:h-px after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent"
          >
            {items.map((project, j) => {
              const index = start + j;
              const isOpen = openId === project.id;
              const dimmed = canFloat && hoveredId != null && hoveredId !== project.id;
              const panelId = `project-panel-${project.id}`;

              return (
                <motion.li
                  key={project.id}
                  custom={direction}
                  variants={rowVariants}
                  className={`relative ${divider}`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => {
                      setOpenId(isOpen ? null : project.id);
                      // 展开后内容就在下面，不再让浮动预览挡住它
                      setHoveredId(null);
                    }}
                    onMouseEnter={() => canFloat && !isOpen && setHoveredId(project.id)}
                    onMouseLeave={() => canFloat && setHoveredId(null)}
                    onFocus={() => setHoveredId(null)}
                    className="w-full flex flex-col items-center gap-2.5 sm:gap-3 py-[18px] sm:py-[22px] px-2 text-center text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-4 rounded-md"
                  >
                    <span className={`${jetbrainsMono.className} flex items-center gap-2.5 text-[11px] sm:text-xs tracking-[0.14em] uppercase text-white/50`}>
                      {pad(index + 1)} · {project.category || "project"}
                      {project.pinned && <span className="text-white/80">· featured</span>}
                      <Plus
                        className={`w-3 h-3 transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}
                        aria-hidden="true"
                      />
                    </span>
                    <span
                      className={`text-[34px] sm:text-5xl lg:text-[54px] font-bold tracking-[-0.03em] leading-none transition-[opacity,transform] duration-500 ${
                        dimmed ? "opacity-30" : "opacity-100"
                      } ${canFloat && hoveredId === project.id ? "scale-[1.04]" : "scale-100"}`}
                    >
                      {project.title}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        key="panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reduceMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex flex-col items-center text-center gap-5 sm:gap-6 px-1 sm:px-2 pt-1 pb-8 sm:pb-10">
                          {!canFloat && hasImage(project) && (
                            <div className="relative w-full max-w-[560px] aspect-[16/10] rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 bg-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.45)]">
                              <ProjectImage project={project} sizes="(max-width: 640px) 100vw, 560px" />
                            </div>
                          )}
                          <p className="max-w-[600px] text-[17px] sm:text-xl leading-relaxed text-white/85">
                            {project.description}
                          </p>
                          {project.link && (
                            <a
                              href={project.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-white border-b border-white pb-0.5 hover:text-white/80 hover:border-white/80 transition-colors"
                            >
                              View project
                              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </motion.ul>
        </AnimatePresence>
      </div>

      {pageCount > 1 && (
        <nav aria-label="Project pages" className="flex items-center gap-3 sm:gap-6 mt-5 sm:mt-6">
          <button
            type="button"
            aria-label="Previous page"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage === 0}
            className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white transition-colors hover:bg-white hover:text-black disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="flex gap-2">
            {Array.from({ length: pageCount }, (_, n) => (
              <button
                key={n}
                type="button"
                aria-label={`Page ${n + 1}`}
                aria-current={n === currentPage ? "page" : undefined}
                onClick={() => goTo(n)}
                className="w-7 h-11 flex items-center group"
              >
                <span
                  className={`block w-full h-0.5 rounded-full transition-colors duration-300 ${
                    n === currentPage ? "bg-white" : "bg-white/25 group-hover:bg-white/60"
                  }`}
                />
              </button>
            ))}
          </div>

          <span className={`${jetbrainsMono.className} min-w-[56px] text-center text-[11px] sm:text-xs tracking-[0.12em] text-white`}>
            {pad(currentPage + 1)} / {pad(pageCount)}
          </span>

          <button
            type="button"
            aria-label="Next page"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage === pageCount - 1}
            className="w-11 h-11 rounded-full border border-white/30 flex items-center justify-center text-white transition-colors hover:bg-white hover:text-black disabled:opacity-25 disabled:hover:bg-transparent disabled:hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </nav>
      )}

      {canFloat && <FloatingPreview items={items} hoveredId={hoveredId} reduceMotion={reduceMotion} />}
    </div>
  );
};

export default ProjectIndex;
