import { Outfit, JetBrains_Mono } from "next/font/google";

// 作品区用的字体：标题 Outfit，小标签 JetBrains Mono（其余部分仍是 layout 里的 Fredoka）
export const outfit = Outfit({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});
