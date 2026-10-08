'use client'

import { FaTiktok } from "react-icons/fa6"
import { FaInstagram, FaYoutube, FaTwitch, FaSpotify, FaSoundcloud, FaGithub, FaLinkedin, FaDiscord } from "react-icons/fa"
import { SiXiaohongshu } from "react-icons/si"

// 两行：上面是内容平台，下面是音乐、职业和社交；间距对齐 Tech Stack（5 列 grid）
const ROWS = [
  [
    { name: "TikTok", href: "https://www.tiktok.com/@jkeroro", Icon: FaTiktok, hover: "hover:text-white" },
    { name: "Instagram", href: "https://www.instagram.com/jkerorozz", Icon: FaInstagram, hover: "hover:text-pink-500" },
    { name: "YouTube", href: "https://youtube.com/@jkeroro_mk?si=kONouwFGS9t-ti3V", Icon: FaYoutube, hover: "hover:text-red-500" },
    { name: "Twitch", href: "https://www.twitch.tv/jkerorozz", Icon: FaTwitch, hover: "hover:text-purple-500" },
    { name: "Rednote", href: "https://www.xiaohongshu.com/user/profile/678e5f43000000000e0107ac", Icon: SiXiaohongshu, hover: "hover:text-red-500" },
  ],
  [
    { name: "Spotify", href: "https://open.spotify.com/user/jkeroro", Icon: FaSpotify, hover: "hover:text-green-500" },
    { name: "SoundCloud", href: "https://on.soundcloud.com/B1Fe1ewaen6xbNfv9", Icon: FaSoundcloud, hover: "hover:text-orange-500" },
    { name: "GitHub", href: "https://github.com/Jkeroromk", Icon: FaGithub, hover: "hover:text-gray-400" },
    { name: "LinkedIn", href: "https://www.linkedin.com/in/zexin-zou/", Icon: FaLinkedin, hover: "hover:text-blue-500" },
    { name: "Discord", href: "https://discord.gg/eD7ZRcg22H", Icon: FaDiscord, hover: "hover:text-indigo-500" },
  ],
]

const SocialLinks = () => {
  return (
    // gap-y-14：图标 hover 放大 2 倍 + 下方文字（mt-4 + 一行字）约 45px，
    // 留出余量，第一行的文字不会压到第二行的图标
    <div className="flex flex-col items-center gap-y-14 mt-6">
      {ROWS.map((row, i) => (
        <div key={i} className="grid grid-cols-5 gap-6 max-w-[600px] mx-4 sm:mx-0">
          {row.map(({ name, href, Icon, hover }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={name}
              className="flex flex-col items-center justify-center group w-[60px]"
            >
              <div className="relative flex flex-col items-center">
                <Icon size={25} className={`hover:scale-[2.0] transform transition-transform duration-300 text-white ${hover}`} />
                <span className="absolute top-full mt-4 font-bold text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
                  {name}
                </span>
              </div>
            </a>
          ))}
        </div>
      ))}
    </div>
  )
}

export default SocialLinks
