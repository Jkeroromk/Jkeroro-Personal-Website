export interface Project {
  name: string
  description: string
  tags: string[]
  github: string
  demo?: string
  image?: string
}

const projects: Project[] = [
  {
    name: 'Hive',
    description: '一个实时协作的任务管理平台，支持团队看板、多用户同步与权限管理。',
    tags: ['Next.js', 'TypeScript', 'Prisma', 'Supabase', 'Framer Motion'],
    github: 'https://github.com/Jkeroromk/Hive',
    demo: 'https://hive.jkeroro.com',
    image: '/projects/hive.png',
  },
  {
    name: 'Lock',
    description: '专注模式工具，帮助用户屏蔽干扰、追踪专注时长并可视化生产力数据。',
    tags: ['React', 'Tailwind CSS', 'Node.js', 'SQLite'],
    github: 'https://github.com/Jkeroromk/Lock',
    demo: 'https://lock.jkeroro.com',
    image: '/projects/lock.png',
  },
  {
    name: 'Personal Website',
    description: '你现在正在浏览的个人网站，集成音乐播放器、留言墙、动态背景等功能。',
    tags: ['Next.js', 'Tailwind CSS', 'Framer Motion', 'GSAP', 'Supabase'],
    github: 'https://github.com/Jkeroromk/Jkeroro-Personal-Website',
    image: '/projects/website.png',
  },
  {
    name: 'Weather Dashboard',
    description: '基于 OpenWeather API 的天气可视化面板，支持城市搜索与历史趋势图表。',
    tags: ['React', 'ECharts', 'REST API', 'Vite'],
    github: 'https://github.com/Jkeroromk/weather-dashboard',
    image: '/projects/weather.png',
  },
]

export default projects
