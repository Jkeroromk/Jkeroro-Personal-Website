# 🌟 [Jkeroro.com](https://Jkeroro.com) - 个人博客 / Personal Blog

欢迎来到 **Jkeroro.com**！🌐 这是我个人的博客网站，专注于分享我在 **技术**、**创意**、**个人成长** 和 **产品设计** 方面的经验与探索。

Welcome to **Jkeroro.com**! 🌐 This is my personal blog website, focused on sharing my experiences and explorations in **technology**, **creativity**, **personal growth**, and **product design**.

---

## 📌 项目背景 / Project Background

**Jkeroro.com** 是我创建的个人网站，用于展示我在前端开发、技术分享和生活中的点滴。网站的内容涵盖：

**Jkeroro.com** is my personal website for showcasing my work in front-end development, technical sharing, and daily life. The website includes:

- **前端开发**  
  与开发者分享我的编码实践、最新的开发工具、以及项目经验。  
  **Front-end Development**: Sharing my coding practices, latest development tools, and project experiences with fellow developers.

- **个人品牌**  
  我以 **"Jkeroro"** 为品牌名，专注于提高人们的生产力和分享关于生活与工作的经验。  
  **Personal Brand**: Under the brand name **"Jkeroro"**, I focus on improving productivity and sharing experiences about life and work.

- **技术探索**  
  包括我的技术栈、使用的工具、框架等。  
  **Tech Exploration**: Sharing my tech stack, tools, frameworks, and more.

- **产品设计与灵感**  
  我会在博客中分享我在产品设计方面的心得与灵感。  
  **Product Design and Inspiration**: I share insights and inspirations in product design on my blog.

---

## 🚀 网站功能 / Features

- **响应式设计**  
  无论是在电脑、平板还是手机上浏览，网站都能提供良好的用户体验。  
  **Responsive Design**: The website provides a great user experience on desktop, tablet, and mobile devices.

- **动态内容**  
  博客文章及个人项目内容将定期更新。  
  **Dynamic Content**: Blog posts and personal projects are updated regularly.

- **访客统计地图**  
  展示全球访客的地理位置，与你分享网站的全球足迹。  
  **Visitor Map**: Displays the geographical locations of visitors worldwide to share the global footprint of the site.

- **互动评论系统**  
  用户可以发表评论并使用表情符号互动（点赞、火焰、爱心、大笑、惊讶）。  
  **Interactive Comment System**: Users can leave comments and react with emojis (likes, fires, hearts, laughs, wows).

- **管理员面板**  
  功能完整的管理后台，用于管理图片、音乐、项目和评论。  
  **Admin Dashboard**: Full-featured admin panel for managing images, music tracks, projects, and comments.

- **实时更新**  
  基于轮询的动态内容更新，包括评论、访问者统计和媒体内容。  
  **Real-time Updates**: Polling-based updates for dynamic content including comments, viewer counts, and media items.

---

## 🔧 技术栈 / Tech Stack

### 前端 / Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (动画 / animations)
- **GSAP** (滚动动画 / scroll animations)
- **Three.js** (3D 图形 / 3D graphics)
- **Radix UI** (组件库 / component library)

### 后端与数据库 / Backend & Database
- **Supabase** (身份验证和存储 / Authentication & Storage)
- **Prisma ORM** (数据库访问 / Database access)
- **PostgreSQL** (通过 Supabase / via Supabase)
- **Next.js API Routes** (服务器端逻辑 / Server-side logic)

### 其他工具 / Other Tools
- **OpenAI API** (AI 功能 / AI features)
- **ECharts** (数据可视化 / data visualization)
- **Vercel** (托管 / hosting)

---

## 🔄 从 Firebase 迁移 / Migration from Firebase

本项目已从 Firebase 迁移到 Supabase + Prisma：

### 变更内容 / What Changed
- **身份验证**：Firebase Auth → Supabase Auth  
  **Authentication**: Firebase Auth → Supabase Auth
- **数据库**：Firestore → PostgreSQL (通过 Supabase) + Prisma ORM  
  **Database**: Firestore → PostgreSQL (via Supabase) + Prisma ORM
- **存储**：Firebase Storage → Supabase Storage  
  **Storage**: Firebase Storage → Supabase Storage
- **实时更新**：Firebase Realtime Database → 基于 Supabase 的 API 轮询  
  **Real-time**: Firebase Realtime Database → API polling with Supabase

### 优势 / Benefits
- ✅ 开源且可自托管 / Open-source and self-hostable
- ✅ Prisma 提供更好的 TypeScript 支持 / Better TypeScript support with Prisma
- ✅ 更灵活的数据库查询 / More flexible database queries
- ✅ PostgreSQL 带来更好的性能 / Better performance with PostgreSQL
- ✅ 仅服务器端的数据库逻辑（更安全）/ Server-side only database logic (more secure)

---

## 🛠️ 安装与设置 / Setup & Installation

### 前置要求 / Prerequisites
- Node.js 18+ 
- npm 或 yarn
- PostgreSQL 数据库（通过 Supabase）

### 环境变量 / Environment Variables

在根目录创建 `.env.local` 文件：

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (Prisma)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# OpenAI (可选，用于 AI 功能)
OPENAI_API_KEY=your_openai_api_key
```

**⚠️ 重要提示**：`.env.local` 文件已在 `.gitignore` 中，不应提交到 git。  
**⚠️ Important**: The `.env.local` file is already in `.gitignore` and should never be committed to git.

### 安装步骤 / Installation Steps

1. 克隆仓库：  
   Clone the repository:
```bash
git clone https://github.com/yourusername/Jkeroro-Personal-Website.git
cd Jkeroro-Personal-Website
```

2. 安装依赖：  
   Install dependencies:
```bash
npm install
```

3. 生成 Prisma Client：  
   Generate Prisma Client:
```bash
npm run prisma:generate
```

4. 运行数据库迁移：  
   Run database migrations:
```bash
npm run prisma:migrate
```

5. 启动开发服务器：  
   Start the development server:
```bash
npm run dev
```

6. 在浏览器中打开 [http://localhost:3000](http://localhost:3000)

---

## 📦 数据库架构 / Database Schema

项目使用 Prisma ORM 和 PostgreSQL。主要模型包括：

The project uses Prisma ORM with PostgreSQL. The main models include:

- **User** - 用户账户 / User accounts
- **Image** - 相册图片 / Gallery images
- **Track** - 音乐曲目 / Music tracks
- **Project** - 作品集项目 / Portfolio projects
- **Comment** - 用户评论 / User comments
- **CommentReaction** - 评论反应（点赞、火焰等）/ Comment reactions (likes, fires, etc.)
- **ViewCount** - 全局访问计数器 / Global view counter
- **CountryVisit** - 访客国家统计 / Visitor country statistics
- **AdminStatus** - 管理员在线状态跟踪 / Admin online status tracking

完整架构定义请查看 `prisma/schema.prisma`。  
See `prisma/schema.prisma` for the complete schema definition.

---

## 📁 项目结构 / Project Structure

```
├── app/                    # Next.js App Router 页面
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   ├── home/              # 主页
│   └── loading/           # 加载页面
├── components/            # React 组件
│   ├── admin/            # 管理组件
│   ├── effects/          # 视觉效果
│   ├── interactive/      # 交互组件
│   ├── layout/           # 布局组件
│   ├── loading/          # 加载组件
│   └── ui/               # UI 组件 (shadcn/ui)
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具库
│   ├── generated/        # 生成的 Prisma Client
│   └── prisma.ts         # Prisma 客户端单例
├── prisma/               # Prisma 架构和配置
├── public/               # 静态资源
└── supabase.js           # Supabase 客户端配置
```

---

## 🚀 部署 / Deployment

项目已配置为在 Vercel 上部署：

The project is configured for deployment on Vercel:

1. 将代码推送到 GitHub  
   Push your code to GitHub
2. 在 Vercel 中连接仓库  
   Connect your repository to Vercel
3. 在 Vercel 仪表板中添加环境变量  
   Add environment variables in Vercel dashboard
4. 部署！  
   Deploy!

构建过程将自动：  
The build process will automatically:
- 生成 Prisma Client / Generate Prisma Client
- 构建 Next.js 应用 / Build Next.js application
- 优化资源 / Optimize assets

---

## 📝 可用脚本 / Available Scripts

- `npm run dev` - 启动开发服务器 / Start development server
- `npm run build` - 构建生产版本 / Build for production
- `npm run start` - 启动生产服务器 / Start production server
- `npm run lint` - 运行 ESLint / Run ESLint
- `npm run prisma:generate` - 生成 Prisma Client / Generate Prisma Client
- `npm run prisma:migrate` - 运行数据库迁移 / Run database migrations
- `npm run prisma:studio` - 打开 Prisma Studio (数据库 GUI) / Open Prisma Studio (database GUI)

---

## 🌱 未来计划 / Future Plans

- 实现更多的互动功能，包括语音识别和 AI 助手。  
  Implement more interactive features, including voice recognition and AI assistant.

- 将 Live2D 角色与 AI 语音结合，提供更加生动的互动体验。  
  Combine Live2D characters with AI voice to provide a more lively interactive experience.

- 开发专注于二次元风格的 3D 互动页面，结合 Three.js。  
  Develop 3D interactive pages focusing on anime-style elements using Three.js.

- 使用 Supabase Realtime 订阅实现实时更新。  
  Real-time updates using Supabase Realtime subscriptions.

---

## 📬 联系我 / Contact Me

- **电子邮件**：[zzou2000@gmail.com](mailto:zzou2000@gmail.com)  
  **Email**: [zzou2000@gmail.com](mailto:zzou2000@gmail.com)

- **LinkedIn**：[Zexin Zou](https://www.linkedin.com/in/zexin-zou/)  
  **LinkedIn**: [Zexin Zou](https://www.linkedin.com/in/zexin-zou/)

- **个人网站**：[Jkeroro.com](https://Jkeroro.com)  
  **Website**: [Jkeroro.com](https://Jkeroro.com)

---

## 🙏 感谢你的访问！期待与你的互动！  
Thank you for visiting my website, and I look forward to interacting with you! ✨

---

## 📄 许可证 / License

本项目为私有和专有项目。  
This project is private and proprietary.
