# 🌟 [Jkeroro.com](https://Jkeroro.com) - Personal Website

Welcome to **Jkeroro.com**! 🌐 This is my personal website, focused on sharing my experiences and explorations in **technology**, **creativity**, **personal growth**, and **product design**.

---

## 📌 Project Background

**Jkeroro.com** is my personal website for showcasing my work in front-end development, technical sharing, and daily life. The website includes:

- **Front-end Development**  
  Sharing coding practices, latest development tools, and project experiences with fellow developers.

- **Personal Brand**  
  Under the brand name **"Jkeroro"**, I focus on improving productivity and sharing experiences about life and work.

- **Tech Exploration**  
  Sharing my tech stack, tools, frameworks, and more.

- **Product Design and Inspiration**  
  Sharing insights and inspirations in product design.

---

## 🚀 Features

- **Responsive Design**  
  The website provides a great user experience on desktop, tablet, and mobile devices.

- **Dynamic Content**  
  Blog posts and personal projects are updated regularly.

- **Visitor Statistics Map**  
  A feature that displays the geographical locations of visitors worldwide to share the global footprint of the site.

- **Interactive Comment System**  
  Users can leave comments and react with emojis (likes, fires, hearts, laughs, wows).

- **Admin Dashboard**  
  Full-featured admin panel for managing images, music tracks, projects, and comments.

- **Real-time Updates**  
  Polling-based updates for dynamic content including comments, viewer counts, and media items.

---

## 🔧 Tech Stack

### Frontend
- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **Framer Motion** (animations)
- **GSAP** (scroll animations)
- **Three.js** (3D graphics)
- **Radix UI** (component library)

### Backend & Database
- **Supabase** (Authentication & Storage)
- **Prisma ORM** (Database access)
- **PostgreSQL** (via Supabase)
- **Next.js API Routes** (Server-side logic)

### Other Tools
- **OpenAI API** (AI features)
- **ECharts** (data visualization)
- **Vercel** (hosting)

---

## 🛠️ Setup & Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (via Supabase)

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database (Prisma)
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# OpenAI (optional, for AI features)
OPENAI_API_KEY=your_openai_api_key
```

**⚠️ Important**: The `.env.local` file is already in `.gitignore` and should never be committed to git.

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/Jkeroro-Personal-Website.git
cd Jkeroro-Personal-Website
```

2. Install dependencies:
```bash
npm install
```

3. Generate Prisma Client:
```bash
npm run prisma:generate
```

4. Run database migrations:
```bash
npm run prisma:migrate
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Database Schema

The project uses Prisma ORM with PostgreSQL. The main models include:

- **User** - User accounts
- **Image** - Gallery images
- **Track** - Music tracks
- **Project** - Portfolio projects
- **Comment** - User comments
- **CommentReaction** - Comment reactions (likes, fires, etc.)
- **ViewCount** - Global view counter
- **CountryVisit** - Visitor country statistics
- **AdminStatus** - Admin online status tracking

See `prisma/schema.prisma` for the complete schema definition.

---

## 🔄 Migration from Firebase

This project has been migrated from Firebase to Supabase + Prisma:

### What Changed
- **Authentication**: Firebase Auth → Supabase Auth
- **Database**: Firestore → PostgreSQL (via Supabase) + Prisma ORM
- **Storage**: Firebase Storage → Supabase Storage
- **Real-time**: Firebase Realtime Database → API polling with Supabase

### Benefits
- ✅ Open-source and self-hostable
- ✅ Better TypeScript support with Prisma
- ✅ More flexible database queries
- ✅ Better performance with PostgreSQL
- ✅ Server-side only database logic (more secure)

---

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   ├── home/              # Home page
│   └── loading/           # Loading page
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── effects/          # Visual effects
│   ├── interactive/      # Interactive components
│   ├── layout/           # Layout components
│   ├── loading/          # Loading components
│   └── ui/               # UI components (shadcn/ui)
├── hooks/                # Custom React hooks
├── lib/                  # Utility libraries
│   ├── generated/        # Generated Prisma client
│   └── prisma.ts         # Prisma client singleton
├── prisma/               # Prisma schema and config
├── public/               # Static assets
└── supabase.js           # Supabase client configuration
```

---

## 🚀 Deployment

The project is configured for deployment on Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The build process will automatically:
- Generate Prisma Client
- Build Next.js application
- Optimize assets

---

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)

---

## 🌱 Future Plans

- Implement more interactive features, including voice recognition and AI assistant
- Combine Live2D characters with AI voice for more lively interactions
- Develop 3D interactive pages with anime-style elements using Three.js
- Real-time updates using Supabase Realtime subscriptions

---

## 📬 Contact Me

- **Email**: [zzou2000@gmail.com](mailto:zzou2000@gmail.com)
- **LinkedIn**: [Zexin Zou](https://www.linkedin.com/in/zexin-zou/)
- **Website**: [Jkeroro.com](https://Jkeroro.com)

---

## 🙏 Thank you for visiting!

Thank you for visiting my website, and I look forward to interacting with you! ✨

---

## 📄 License

This project is private and proprietary.
