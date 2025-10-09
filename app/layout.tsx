import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { ConditionalToaster } from "@/components/ui/conditional-toaster";

const fredoka = Fredoka({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jkeroro",
  description: "Welcome to my Cozy Place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <Script
          src="https://kit.fontawesome.com/7db96a5cb9.js"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"
          strategy="afterInteractive"
        />
        {/* 关键资源预加载 - 只预加载loading页面立即需要的资源 */}
        {/* 移除字体预加载，因为可能导致警告 */}
        
        {/* 延迟预加载 - 这些资源在home页面中才会使用 */}
        <link rel="prefetch" as="image" href="/pfp.webp" type="image/webp" />
        <link rel="prefetch" as="image" href="/me.webp" type="image/webp" />
        <link rel="prefetch" as="image" href="/static/car.png" type="image/png" />
        <link rel="prefetch" as="image" href="/static/glow.png" type="image/png" />
        <link rel="prefetch" as="video" href="/background.mp4" type="video/mp4" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/192.png" />
        
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="//kit.fontawesome.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
      </head>
      <body className={`${fredoka.className} antialiased modern-scrollbar bg-black`}>
        {children}
        <ConditionalToaster/>
      </body>
    </html>
  );
}
