"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useProjects } from "@/hooks/useProjects";

// 通用模糊占位 dataURL（灰色单像素 JPEG），原来在 tabs.jsx 的 carousel 里
const BLUR_DATA_URL =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUEA/8QAIBAAAQQCAgMAAAAAAAAAAAAAAQIDBAUREiExQf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwGq2JuQhsO5bMxjKmTKFe7YGfRtW6p0cXhAUHFFKlKJ3wBJJ9mvpSlApSlApSlB//2Q==";

// 标签颜色（与后台 ProjectEditModal 保持一致）
const getCategoryColor = (category) => {
  switch (category) {
    case "personal":
      return "bg-purple-700/30 border-purple-600 text-purple-800";
    case "work":
      return "bg-green-700/30 border-green-600 text-green-800";
    case "school":
      return "bg-blue-700/30 border-blue-600 text-blue-800";
    default:
      return "bg-gray-700/30 border-gray-600 text-gray-800";
  }
};

const pad = (n) => String(n).padStart(2, "0");

const hasImage = (project) => Boolean(project.image && project.image.trim() !== "");

// 后台没填的段落直接跳过
const storyRows = (project) =>
  [
    { label: "Problem", text: project.problem },
    { label: "Approach", text: project.approach },
    { label: "Result", text: project.result },
  ].filter((row) => row.text && row.text.trim() !== "");

const ProjectImage = ({ project, sizes, priority = false }) =>
  hasImage(project) ? (
    <Image
      src={project.image}
      alt={project.title}
      fill
      sizes={sizes}
      priority={priority}
      className="object-cover"
      style={{ objectPosition: `${project.cropX ?? 50}% ${project.cropY ?? 50}%` }}
      placeholder="blur"
      blurDataURL={BLUR_DATA_URL}
      unoptimized={project.image.startsWith("/api/file/") || project.image.startsWith("https://")}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm bg-gray-800">
      No image
    </div>
  );

const CategoryTag = ({ category }) =>
  category ? (
    <span
      className={`px-2 py-0.5 border-l-2 text-xs font-light tracking-wide uppercase ${getCategoryColor(category)}`}
    >
      {category}
    </span>
  ) : null;

const StoryText = ({ project, headingLevel: Heading = "h3" }) => {
  const rows = storyRows(project);
  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <Heading className="text-2xl sm:text-3xl font-extrabold text-black leading-tight">
          {project.title}
        </Heading>
        <CategoryTag category={project.category} />
      </div>
      <p className="text-gray-800 text-base leading-relaxed">{project.description}</p>
      {rows.length > 0 && (
        <dl className="flex flex-col gap-4 pt-4 border-t border-black/15">
          {rows.map((row) => (
            <div key={row.label} className="flex flex-col gap-1">
              <dt className="text-[11px] font-bold tracking-[0.14em] uppercase text-black/55">
                {row.label}
              </dt>
              <dd className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-line">
                {row.text}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {project.link && (
        <a
          href={project.link}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-1.5 text-sm font-bold text-black border-b-2 border-black pb-0.5 hover:text-blue-600 hover:border-blue-600 transition-colors"
        >
          View project
          <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
        </a>
      )}
    </>
  );
};

const ProjectStory = () => {
  const { projects, error, loaded } = useProjects();
  const [active, setActive] = useState(0);
  const itemRefs = useRef([]);
  const reduceMotion = useReducedMotion();

  // 项目被删掉后，别让 active 指到不存在的位置
  useEffect(() => {
    if (active > projects.length - 1) setActive(Math.max(0, projects.length - 1));
  }, [projects.length, active]);

  // 哪段文字经过屏幕中线，右边就切到哪个项目（只在大屏两栏布局下有意义）
  useEffect(() => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) return;
    const elements = itemRefs.current.filter(Boolean);
    if (!elements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(Number(entry.target.dataset.index));
        });
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [projects]);

  const scrollToProject = useCallback(
    (index) => {
      itemRefs.current[index]?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "center",
      });
    },
    [reduceMotion]
  );

  if (error) {
    return <p className="text-red-600 font-bold text-center py-8">{error}</p>;
  }

  if (!projects.length) {
    return (
      <p className="text-white/70 font-bold text-center py-8">
        {loaded ? "No projects yet." : "Loading projects..."}
      </p>
    );
  }

  const current = projects[Math.min(active, projects.length - 1)];

  return (
    <div className="w-full">
      {/* 手机 / 平板：普通竖排卡片，不做 sticky */}
      <div className="flex flex-col gap-8 lg:hidden w-full max-w-[550px] mx-auto">
        {projects.map((project) => (
          <article
            key={project.id}
            className="bg-white bg-opacity-80 border-2 border-black rounded-3xl overflow-hidden"
          >
            <div className="relative h-60 sm:h-80 overflow-hidden bg-gray-800">
              <ProjectImage project={project} sizes="(max-width: 640px) 100vw, 550px" />
            </div>
            <div className="p-5 flex flex-col gap-4">
              <StoryText project={project} />
            </div>
          </article>
        ))}
      </div>

      {/* 大屏：左边文字逐段滚动，右边图片面板固定并跟着切换 */}
      <div className="hidden lg:grid grid-cols-2 gap-12 w-[min(1080px,92vw)] mx-auto">
        <div className="flex flex-col">
          {projects.map((project, index) => (
            <article
              key={project.id}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              data-index={index}
              className="min-h-[75vh] flex items-center py-10"
            >
              <div
                className={`w-full bg-white bg-opacity-80 border-2 border-black rounded-3xl p-7 flex flex-col gap-4 transition-all duration-500 ${
                  index === active ? "opacity-100 shadow-[0_0_20px_white]" : "opacity-40"
                }`}
              >
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-black/55">
                  {pad(index + 1)} / {pad(projects.length)}
                </span>
                <StoryText project={project} />
              </div>
            </article>
          ))}
        </div>

        <div>
          <div className="sticky top-[12vh] h-[76vh] flex flex-col gap-4">
            <div className="relative flex-1 bg-gray-800 border-2 border-black rounded-3xl overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div
                  key={current.id}
                  className="absolute inset-0"
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduceMotion ? 0.15 : 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProjectImage project={current} sizes="540px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute left-6 right-6 bottom-6 flex items-end justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold tracking-[0.14em] uppercase text-white/70">
                        {pad(active + 1)} / {pad(projects.length)}
                      </span>
                      <span className="text-2xl font-extrabold text-white leading-tight">
                        {current.title}
                      </span>
                    </div>
                    {current.link && (
                      <a
                        href={current.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-black/70 backdrop-blur-sm rounded-full border border-white/30 text-white text-sm font-medium hover:bg-black/90 transition-colors"
                      >
                        View Project
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* 进度条，点击跳到对应项目 */}
            <div className="flex gap-2">
              {projects.map((project, index) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => scrollToProject(index)}
                  aria-label={`跳到 ${project.title}`}
                  aria-current={index === active ? "true" : undefined}
                  className="flex-1 py-3 group"
                >
                  <span
                    className={`block h-1 rounded-full transition-colors duration-300 ${
                      index === active ? "bg-white" : "bg-white/30 group-hover:bg-white/60"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectStory;
