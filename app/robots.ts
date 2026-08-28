import { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jkeroro.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /loading 只是过渡动画页没有可索引内容，/admin 和 /api 是后台和接口
      disallow: ['/loading', '/admin', '/api/'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
