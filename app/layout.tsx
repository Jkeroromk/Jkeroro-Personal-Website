import type { Metadata } from "next";
import { Fredoka } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { Toaster } from "@/components/ui/toaster";

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
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.birds.min.js"
          strategy="beforeInteractive"
        />
        <link rel="preload" as="image" href="/pfp.jpg"></link>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/192.png" />
      </head>
      <body className={`${fredoka.className} antialiased`} style={{ backgroundColor: "#000000" }}>
        {children}
        <Toaster/>
      </body>
    </html>
  );
}
