'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import {
  SiHtml5,
  SiCss3,
  SiJavascript,
  SiReact,
  SiTailwindcss,
  SiNextdotjs,
  SiTypescript,
  SiNodedotjs,
  SiVite,
  SiFigma,
} from 'react-icons/si';

const techStack = [
  { Icon: SiHtml5, name: 'HTML5' },
  { Icon: SiCss3, name: 'CSS3' },
  { Icon: SiJavascript, name: 'JavaScript' },
  { Icon: SiReact, name: 'React' },
  { Icon: SiTailwindcss, name: 'Tailwind' },
  { Icon: SiNextdotjs, name: 'Next.js' },
  { Icon: SiTypescript, name: 'TypeScript' },
  { Icon: SiNodedotjs, name: 'Node.js' },
  { Icon: SiVite, name: 'Vite' },
  { Icon: SiFigma, name: 'Figma' },
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
        {techStack.map(({ Icon, name }, index) => (
          <div key={name} className="flex flex-col items-center justify-center group w-[60px]">
            <div className="relative flex flex-col items-center mt-5">
              <Icon
                size={25}
                className="text-white will-change-transform"
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
