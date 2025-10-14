'use client';

import React, { useRef, useEffect } from 'react';
// 只导入需要的 GSAP 功能
import { gsap } from 'gsap/dist/gsap';
// 使用更精确的导入来减少包大小
import { SiHtml5, SiCss3, SiJavascript, SiReact, SiTailwindcss, SiNextdotjs, SiTypescript, SiNodedotjs, SiVite, SiFigma } from 'react-icons/si';

const techStack = [
  { Icon: SiHtml5, name: 'HTML5', color: 'hover:text-orange-500' },
  { Icon: SiCss3, name: 'CSS3', color: 'hover:text-blue-500' },
  { Icon: SiJavascript, name: 'JavaScript', color: 'hover:text-yellow-500' },
  { Icon: SiReact, name: 'React', color: 'hover:text-cyan-400' },
  { Icon: SiTailwindcss, name: 'Tailwind', color: 'hover:text-teal-400' },
  { Icon: SiNextdotjs, name: 'Next.js', color: 'hover:text-gray-800' },
  { Icon: SiTypescript, name: 'TypeScript', color: 'hover:text-blue-600' },
  { Icon: SiNodedotjs, name: 'Node.js', color: 'hover:text-green-600' },
  { Icon: SiVite, name: 'Vite', color: 'hover:text-purple-500' },
  { Icon: SiFigma, name: 'Figma', color: 'hover:text-pink-500' },
];

const Stack = () => {
  const iconRefs = useRef([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      iconRefs.current.forEach((icon) => {
        if (!icon) return;

        gsap.set(icon, { transformOrigin: 'center' }); // Pre-set for smoother animations

        icon.addEventListener('mouseenter', () =>
          gsap.to(icon, {
            scale: 2,
            rotationY: 360,
            duration: 0.3,
            ease: 'power2.inOut',
            overwrite: 'auto', // Prevents animation pile-up
          })
        );

        icon.addEventListener('mouseleave', () =>
          gsap.to(icon, {
            scale: 1,
            rotationY: 0,
            duration: 0.3,
            ease: 'power2.inOut',
            overwrite: 'auto',
          })
        );
      });
    });

    return () => {
      iconRefs.current.forEach((icon) => {
        if (icon) {
          icon.removeEventListener('mouseenter', () => {});
          icon.removeEventListener('mouseleave', () => {});
        }
      });
      ctx.revert(); // Cleanup GSAP context
    };
  }, []);

  return (
    <div className="flex flex-col items-center mt-16" style={{ minHeight: '100px' }}>
      <h1 className="text-white font-extrabold text-2xl">Tech Stack</h1>
      <div className="grid grid-cols-5 gap-6 mt-6 text-white max-w-[600px] mx-4 sm:mx-0">
        {techStack.map(({ Icon, name, color }, index) => (
          <div key={name} className="flex flex-col items-center justify-center group w-[60px]">
            <div className="relative flex flex-col items-center mt-5">
              <Icon
                size={25}
                className={`text-white will-change-transform transition-colors duration-300 ${color}`}
                ref={(el) => (iconRefs.current[index] = el)}
              />
              <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white text-center">
                {name}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stack;
