'use client';

import React from 'react';
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
  return (
    <div className="flex flex-col items-center mt-12" style={{ minHeight: '300px' }}>
      <h1 className="text-white font-extrabold text-2xl">Tech Stack</h1>
      <div className="grid grid-cols-5 gap-6 mt-6 text-white max-w-[600px] mx-4 sm:mx-0">
        {techStack.map(({ Icon, name }) => (
          <div key={name} className="flex flex-col items-center justify-center group w-[60px]">
            <div className="relative flex flex-col items-center mt-5">
              <Icon
                size={25}
                className="text-white transition-transform duration-300 ease-in-out group-hover:scale-[2] group-hover:rotate-y-360 will-change-transform"
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
