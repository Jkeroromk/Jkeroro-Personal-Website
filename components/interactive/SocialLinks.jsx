'use client'

import { FaTiktok } from "react-icons/fa6"
import { FaInstagram, FaYoutube, FaTwitch, FaSpotify, FaSoundcloud } from "react-icons/fa"

const SocialLinks = () => {
  return (
    <div className="flex flex-wrap justify-center gap-8 mt-6">
      <a
        href="https://www.tiktok.com/@jkeroro"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaTiktok size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-white" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            TikTok
          </span>
        </div>
      </a>
      <a
        href="https://www.instagram.com/jkerorozz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaInstagram size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-pink-500" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            Instagram
          </span>
        </div>
      </a>
      <a
        href="https://youtube.com/@jkeroro_mk?si=kONouwFGS9t-ti3V"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaYoutube size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-red-500" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            YouTube
          </span>
        </div>
      </a>
      <a
        href="https://www.twitch.tv/jkerorozz"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaTwitch size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-purple-500" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            Twitch
          </span>
        </div>
      </a>
      <a
        href="https://open.spotify.com/user/jkeroro"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaSpotify size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-green-500" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            Spotify
          </span>
        </div>
      </a>
      <a
        href="https://on.soundcloud.com/B1Fe1ewaen6xbNfv9"
        target="_blank"
        rel="noopener noreferrer"
        className="flex flex-col items-center justify-center group"
      >
        <div className="relative flex flex-col items-center">
          <FaSoundcloud size={25} className="hover:scale-[2.0] transform transition-transform duration-300 text-white hover:text-orange-500" />
          <span className="absolute top-full mt-4 font-bold text-sm opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-white">
            SoundCloud
          </span>
        </div>
      </a>
    </div>
  )
}

export default SocialLinks
