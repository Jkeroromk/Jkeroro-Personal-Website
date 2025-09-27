import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";
import AssistantWidget from "@/components/AssistantWidget";
import LoadingScreen from "@/components/LoadingScreen";

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
    <html lang="en">
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
          strategy="lazyOnload"
        />
        {/* 关键资源预加载 */}
        <link rel="preload" as="image" href="/pfp.webp" type="image/webp" />
        <link rel="preload" as="image" href="/me.webp" type="image/webp" />
        <link rel="preload" as="image" href="/static/car.png" type="image/png" />
        <link rel="preload" as="image" href="/static/glow.png" type="image/png" />
        <link rel="preload" as="video" href="/background.mp4" type="video/mp4" />
        <link rel="preload" as="font" href="/_next/static/media/X7n64b87HvSqjb_WIi2yDCRwoQ_k7367_DWu89XgHPyh-s.p.87515403.woff2" type="font/woff2" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/192.png" />
        
        {/* DNS 预解析 */}
        <link rel="dns-prefetch" href="//kit.fontawesome.com" />
        <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
        <link rel="dns-prefetch" href="//cdn.jsdelivr.net" />
      </head>
      <body className={`${fredoka.className} antialiased modern-scrollbar`} style={{ backgroundColor: "#000000" }}>
        {children}
        <Toaster/>
        <AssistantWidget />
        <LoadingScreen />
      </body>
    </html>
  );
}
