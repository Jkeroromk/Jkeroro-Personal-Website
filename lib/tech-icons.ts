/**
 * Tech Stack 图标库：后台选图标时从这里挑，首页按 icon key 找图标。
 * 要加新技术：在 TECH_ICONS 里加一项（react-icons 里找图标），后台下拉框就会出现。
 * 微软、Slack 等品牌已经不在 Simple Icons 里了，所以这几个用 Font Awesome / VS Code 图标集。
 */

import type { IconType } from 'react-icons'
import {
  SiHtml5, SiCss3, SiJavascript, SiTypescript, SiReact, SiNextdotjs, SiTailwindcss, SiVite, SiNodedotjs,
  SiExpress, SiThreedotjs, SiFramer, SiGreensock, SiPython, SiPostgresql, SiMysql, SiMongodb, SiRedis,
  SiPrisma, SiSupabase, SiFirebase, SiGraphql, SiUbuntu, SiKalilinux, SiCisco, SiWireshark, SiDocker,
  SiCloudflare, SiGnubash, SiGit, SiVercel, SiStripe, SiJira, SiNotion, SiFigma, SiPostman, SiOpenai,
} from 'react-icons/si'
import { FaWindows, FaApple, FaLinux, FaAws, FaGithub, FaSlack } from 'react-icons/fa'
import { VscVscode, VscTerminalPowershell } from 'react-icons/vsc'
import {
  TbApi, TbWorldWww, TbPhoneCall, TbNetwork, TbCpu, TbServer, TbShieldLock, TbTerminal2, TbCode,
} from 'react-icons/tb'

export interface TechIcon {
  key: string
  label: string
  Icon: IconType
  hover: string // Tailwind 悬停颜色（品牌色）
  group: string // 只用于后台下拉框分组
}

export const TECH_ICONS: TechIcon[] = [
  // Web & 软件开发
  { key: 'html5',      label: 'HTML5',       Icon: SiHtml5,        hover: 'group-hover:text-orange-500', group: 'Web & Software' },
  { key: 'css3',       label: 'CSS3',        Icon: SiCss3,         hover: 'group-hover:text-blue-500',   group: 'Web & Software' },
  { key: 'javascript', label: 'JavaScript',  Icon: SiJavascript,   hover: 'group-hover:text-yellow-400', group: 'Web & Software' },
  { key: 'typescript', label: 'TypeScript',  Icon: SiTypescript,   hover: 'group-hover:text-blue-500',   group: 'Web & Software' },
  { key: 'react',      label: 'React',       Icon: SiReact,        hover: 'group-hover:text-cyan-400',   group: 'Web & Software' },
  { key: 'nextjs',     label: 'Next.js',     Icon: SiNextdotjs,    hover: 'group-hover:text-zinc-300',   group: 'Web & Software' },
  { key: 'tailwind',   label: 'Tailwind',    Icon: SiTailwindcss,  hover: 'group-hover:text-teal-400',   group: 'Web & Software' },
  { key: 'vite',       label: 'Vite',        Icon: SiVite,         hover: 'group-hover:text-purple-500', group: 'Web & Software' },
  { key: 'nodejs',     label: 'Node.js',     Icon: SiNodedotjs,    hover: 'group-hover:text-green-500',  group: 'Web & Software' },
  { key: 'express',    label: 'Express',     Icon: SiExpress,      hover: 'group-hover:text-zinc-300',   group: 'Web & Software' },
  { key: 'threejs',    label: 'Three.js',    Icon: SiThreedotjs,   hover: 'group-hover:text-zinc-300',   group: 'Web & Software' },
  { key: 'framer',     label: 'Framer Motion', Icon: SiFramer,     hover: 'group-hover:text-pink-400',   group: 'Web & Software' },
  { key: 'gsap',       label: 'GSAP',        Icon: SiGreensock,    hover: 'group-hover:text-lime-400',   group: 'Web & Software' },
  { key: 'python',     label: 'Python',      Icon: SiPython,       hover: 'group-hover:text-yellow-300', group: 'Web & Software' },
  { key: 'restapi',    label: 'REST APIs',   Icon: TbApi,          hover: 'group-hover:text-sky-300',    group: 'Web & Software' },
  { key: 'graphql',    label: 'GraphQL',     Icon: SiGraphql,      hover: 'group-hover:text-pink-500',   group: 'Web & Software' },
  // 数据库 & 后端服务
  { key: 'postgresql', label: 'PostgreSQL',  Icon: SiPostgresql,   hover: 'group-hover:text-sky-400',    group: 'Data & Backend' },
  { key: 'mysql',      label: 'MySQL',       Icon: SiMysql,        hover: 'group-hover:text-sky-500',    group: 'Data & Backend' },
  { key: 'mongodb',    label: 'MongoDB',     Icon: SiMongodb,      hover: 'group-hover:text-green-500',  group: 'Data & Backend' },
  { key: 'redis',      label: 'Redis',       Icon: SiRedis,        hover: 'group-hover:text-red-500',    group: 'Data & Backend' },
  { key: 'prisma',     label: 'Prisma',      Icon: SiPrisma,       hover: 'group-hover:text-indigo-300', group: 'Data & Backend' },
  { key: 'supabase',   label: 'Supabase',    Icon: SiSupabase,     hover: 'group-hover:text-emerald-400', group: 'Data & Backend' },
  { key: 'firebase',   label: 'Firebase',    Icon: SiFirebase,     hover: 'group-hover:text-amber-400',  group: 'Data & Backend' },
  // IT 支持 & 基础设施
  { key: 'windows',    label: 'Windows',     Icon: FaWindows,      hover: 'group-hover:text-sky-400',    group: 'IT & Infrastructure' },
  { key: 'macos',      label: 'macOS',       Icon: FaApple,        hover: 'group-hover:text-zinc-300',   group: 'IT & Infrastructure' },
  { key: 'linux',      label: 'Linux',       Icon: FaLinux,        hover: 'group-hover:text-yellow-300', group: 'IT & Infrastructure' },
  { key: 'ubuntu',     label: 'Ubuntu',      Icon: SiUbuntu,       hover: 'group-hover:text-orange-500', group: 'IT & Infrastructure' },
  { key: 'kali',       label: 'Kali Linux',  Icon: SiKalilinux,    hover: 'group-hover:text-blue-400',   group: 'IT & Infrastructure' },
  { key: 'dns',        label: 'DNS',         Icon: TbWorldWww,     hover: 'group-hover:text-sky-300',    group: 'IT & Infrastructure' },
  { key: 'voip',       label: 'VoIP',        Icon: TbPhoneCall,    hover: 'group-hover:text-emerald-400', group: 'IT & Infrastructure' },
  { key: 'networking', label: 'Networking',  Icon: TbNetwork,      hover: 'group-hover:text-sky-400',    group: 'IT & Infrastructure' },
  { key: 'hardware',   label: 'Hardware',    Icon: TbCpu,          hover: 'group-hover:text-lime-400',   group: 'IT & Infrastructure' },
  { key: 'server',     label: 'Servers',     Icon: TbServer,       hover: 'group-hover:text-zinc-300',   group: 'IT & Infrastructure' },
  { key: 'security',   label: 'Security',    Icon: TbShieldLock,   hover: 'group-hover:text-emerald-400', group: 'IT & Infrastructure' },
  { key: 'cisco',      label: 'Cisco',       Icon: SiCisco,        hover: 'group-hover:text-sky-400',    group: 'IT & Infrastructure' },
  { key: 'wireshark',  label: 'Wireshark',   Icon: SiWireshark,    hover: 'group-hover:text-sky-500',    group: 'IT & Infrastructure' },
  { key: 'docker',     label: 'Docker',      Icon: SiDocker,       hover: 'group-hover:text-sky-500',    group: 'IT & Infrastructure' },
  { key: 'cloudflare', label: 'Cloudflare',  Icon: SiCloudflare,   hover: 'group-hover:text-orange-400', group: 'IT & Infrastructure' },
  { key: 'aws',        label: 'AWS',         Icon: FaAws,          hover: 'group-hover:text-amber-400',  group: 'IT & Infrastructure' },
  { key: 'bash',       label: 'Bash',        Icon: SiGnubash,      hover: 'group-hover:text-zinc-300',   group: 'IT & Infrastructure' },
  { key: 'powershell', label: 'PowerShell',  Icon: VscTerminalPowershell, hover: 'group-hover:text-sky-400', group: 'IT & Infrastructure' },
  { key: 'terminal',   label: 'Terminal',    Icon: TbTerminal2,    hover: 'group-hover:text-zinc-300',   group: 'IT & Infrastructure' },
  // 工具 & 平台
  { key: 'git',        label: 'Git',         Icon: SiGit,          hover: 'group-hover:text-orange-500', group: 'Tools & Platforms' },
  { key: 'github',     label: 'GitHub',      Icon: FaGithub,       hover: 'group-hover:text-zinc-300',   group: 'Tools & Platforms' },
  { key: 'vscode',     label: 'VS Code',     Icon: VscVscode,      hover: 'group-hover:text-sky-500',    group: 'Tools & Platforms' },
  { key: 'vercel',     label: 'Vercel',      Icon: SiVercel,       hover: 'group-hover:text-zinc-300',   group: 'Tools & Platforms' },
  { key: 'stripe',     label: 'Stripe',      Icon: SiStripe,       hover: 'group-hover:text-indigo-400', group: 'Tools & Platforms' },
  { key: 'jira',       label: 'Jira',        Icon: SiJira,         hover: 'group-hover:text-blue-500',   group: 'Tools & Platforms' },
  { key: 'notion',     label: 'Notion',      Icon: SiNotion,       hover: 'group-hover:text-zinc-300',   group: 'Tools & Platforms' },
  { key: 'figma',      label: 'Figma',       Icon: SiFigma,        hover: 'group-hover:text-pink-500',   group: 'Tools & Platforms' },
  { key: 'postman',    label: 'Postman',     Icon: SiPostman,      hover: 'group-hover:text-orange-500', group: 'Tools & Platforms' },
  { key: 'slack',      label: 'Slack',       Icon: FaSlack,        hover: 'group-hover:text-purple-400', group: 'Tools & Platforms' },
  { key: 'openai',     label: 'OpenAI',      Icon: SiOpenai,       hover: 'group-hover:text-zinc-300',   group: 'Tools & Platforms' },
  { key: 'other',      label: 'Other',       Icon: TbCode,         hover: 'group-hover:text-zinc-300',   group: 'Tools & Platforms' },
]

const BY_KEY = new Map(TECH_ICONS.map((t) => [t.key, t]))

/** 找不到（比如以后删了某个图标）就用通用代码图标，页面不会挂 */
export function getTechIcon(key: string): TechIcon {
  return BY_KEY.get(key) ?? BY_KEY.get('other')!
}

export function isKnownTechIcon(key: string) {
  return BY_KEY.has(key)
}

export interface TechStackItem {
  id?: string
  icon: string
  name: string
  category: string
  visible: boolean
}

/** 首页数据还没从数据库回来时先用这份（和数据库预置的一样） */
export const DEFAULT_TECH_STACK: TechStackItem[] = [
  { icon: 'html5',      name: 'HTML5',      category: 'Frontend', visible: true },
  { icon: 'css3',       name: 'CSS3',       category: 'Frontend', visible: true },
  { icon: 'javascript', name: 'JavaScript', category: 'Frontend', visible: true },
  { icon: 'typescript', name: 'TypeScript', category: 'Frontend', visible: true },
  { icon: 'react',      name: 'React',      category: 'Frontend', visible: true },
  { icon: 'nextjs',     name: 'Next.js',    category: 'Frontend', visible: true },
  { icon: 'tailwind',   name: 'Tailwind',   category: 'Frontend', visible: true },
  { icon: 'nodejs',     name: 'Node.js',    category: 'Backend & Tools', visible: true },
  { icon: 'vite',       name: 'Vite',       category: 'Backend & Tools', visible: true },
  { icon: 'figma',      name: 'Figma',      category: 'Backend & Tools', visible: true },
]

export const MAX_TECH_ITEMS = 80
