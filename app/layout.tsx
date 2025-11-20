import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import { ConditionalToaster } from "@/components/ui/conditional-toaster";
import ClientScripts from "@/components/ClientScripts";

const fredoka = Fredoka({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jkeroro",
  description: "Jkeroro - Unlock your productivity with AI, 3D creativity, and personal brand projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* 关键资源预加载 */}
        <link rel="preload" as="image" href="/pfp.webp" type="image/webp" />
        
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
        
        {/* 客户端脚本组件 */}
        <ClientScripts />
        
        {/* 元数据 */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/192.png" />
      </head>
      <body className={`${fredoka.className} antialiased bg-black`} suppressHydrationWarning>
        {children}
        <ConditionalToaster/>
      </body>
    </html>
  );
}
