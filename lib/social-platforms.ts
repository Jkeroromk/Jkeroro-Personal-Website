/**
 * 社交平台：图标 + 默认名字 + 悬停颜色
 * 后台选平台时从这里挑，首页按 platform key 找图标。
 * 要加新平台：在 PLATFORMS 里加一项（react-icons 里找图标），后台下拉框就会出现。
 */

import type { IconType } from 'react-icons'
import { FaTiktok, FaXTwitter, FaThreads, FaBluesky } from 'react-icons/fa6'
import {
  FaInstagram, FaYoutube, FaTwitch, FaSpotify, FaSoundcloud, FaGithub, FaLinkedin, FaDiscord,
  FaFacebook, FaReddit, FaSteam, FaPinterest, FaMedium, FaWeixin, FaTelegram, FaApple, FaGlobe, FaLink,
} from 'react-icons/fa'
import { SiXiaohongshu, SiBilibili, SiSinaweibo, SiNeteasecloudmusic, SiDouban, SiKick } from 'react-icons/si'

export interface SocialPlatform {
  key: string
  label: string
  Icon: IconType
  hover: string // Tailwind 悬停颜色（用在 group 上，悬停整个图标块时变色）
}

export const PLATFORMS: SocialPlatform[] = [
  { key: 'tiktok',     label: 'TikTok',      Icon: FaTiktok,            hover: 'group-hover:text-white' },
  { key: 'instagram',  label: 'Instagram',   Icon: FaInstagram,         hover: 'group-hover:text-pink-500' },
  { key: 'youtube',    label: 'YouTube',     Icon: FaYoutube,           hover: 'group-hover:text-red-500' },
  { key: 'twitch',     label: 'Twitch',      Icon: FaTwitch,            hover: 'group-hover:text-purple-500' },
  { key: 'kick',       label: 'Kick',        Icon: SiKick,              hover: 'group-hover:text-green-400' },
  { key: 'rednote',    label: 'Rednote',     Icon: SiXiaohongshu,       hover: 'group-hover:text-red-500' },
  { key: 'bilibili',   label: 'Bilibili',    Icon: SiBilibili,          hover: 'group-hover:text-sky-400' },
  { key: 'weibo',      label: 'Weibo',       Icon: SiSinaweibo,         hover: 'group-hover:text-red-400' },
  { key: 'douban',     label: 'Douban',      Icon: SiDouban,            hover: 'group-hover:text-green-500' },
  { key: 'wechat',     label: 'WeChat',      Icon: FaWeixin,            hover: 'group-hover:text-green-500' },
  { key: 'spotify',    label: 'Spotify',     Icon: FaSpotify,           hover: 'group-hover:text-green-500' },
  { key: 'soundcloud', label: 'SoundCloud',  Icon: FaSoundcloud,        hover: 'group-hover:text-orange-500' },
  { key: 'applemusic', label: 'Apple Music', Icon: FaApple,             hover: 'group-hover:text-rose-400' },
  { key: 'netease',    label: 'NetEase Music', Icon: SiNeteasecloudmusic, hover: 'group-hover:text-red-500' },
  { key: 'github',     label: 'GitHub',      Icon: FaGithub,            hover: 'group-hover:text-gray-400' },
  { key: 'linkedin',   label: 'LinkedIn',    Icon: FaLinkedin,          hover: 'group-hover:text-blue-500' },
  { key: 'medium',     label: 'Medium',      Icon: FaMedium,            hover: 'group-hover:text-gray-300' },
  { key: 'discord',    label: 'Discord',     Icon: FaDiscord,           hover: 'group-hover:text-indigo-500' },
  { key: 'telegram',   label: 'Telegram',    Icon: FaTelegram,          hover: 'group-hover:text-sky-400' },
  { key: 'x',          label: 'X',           Icon: FaXTwitter,          hover: 'group-hover:text-white' },
  { key: 'threads',    label: 'Threads',     Icon: FaThreads,           hover: 'group-hover:text-white' },
  { key: 'bluesky',    label: 'Bluesky',     Icon: FaBluesky,           hover: 'group-hover:text-sky-400' },
  { key: 'facebook',   label: 'Facebook',    Icon: FaFacebook,          hover: 'group-hover:text-blue-500' },
  { key: 'reddit',     label: 'Reddit',      Icon: FaReddit,            hover: 'group-hover:text-orange-500' },
  { key: 'pinterest',  label: 'Pinterest',   Icon: FaPinterest,         hover: 'group-hover:text-red-500' },
  { key: 'steam',      label: 'Steam',       Icon: FaSteam,             hover: 'group-hover:text-sky-300' },
  { key: 'website',    label: 'Website',     Icon: FaGlobe,             hover: 'group-hover:text-sky-300' },
  { key: 'other',      label: 'Link',        Icon: FaLink,              hover: 'group-hover:text-gray-300' },
]

const BY_KEY = new Map(PLATFORMS.map(p => [p.key, p]))

/** 找不到（比如以后删了某个平台）就用通用链接图标，页面不会挂 */
export function getPlatform(key: string): SocialPlatform {
  return BY_KEY.get(key) ?? BY_KEY.get('other')!
}

export function isKnownPlatform(key: string) {
  return BY_KEY.has(key)
}

export interface SocialLinkItem {
  id?: string
  platform: string
  name: string
  url: string
  category: string
  visible: boolean
}

/** 首页数据还没从数据库回来时先用这份（和数据库预置的一样） */
export const DEFAULT_SOCIAL_LINKS: SocialLinkItem[] = [
  { platform: 'tiktok',     name: 'TikTok',     url: 'https://www.tiktok.com/@jkeroro', category: 'Social', visible: true },
  { platform: 'instagram',  name: 'Instagram',  url: 'https://www.instagram.com/jkerorozz', category: 'Social', visible: true },
  { platform: 'youtube',    name: 'YouTube',    url: 'https://youtube.com/@jkeroro_mk?si=kONouwFGS9t-ti3V', category: 'Social', visible: true },
  { platform: 'twitch',     name: 'Twitch',     url: 'https://www.twitch.tv/jkerorozz', category: 'Social', visible: true },
  { platform: 'rednote',    name: 'Rednote',    url: 'https://www.xiaohongshu.com/user/profile/678e5f43000000000e0107ac', category: 'Social', visible: true },
  { platform: 'spotify',    name: 'Spotify',    url: 'https://open.spotify.com/user/jkeroro', category: 'Music', visible: true },
  { platform: 'soundcloud', name: 'SoundCloud', url: 'https://on.soundcloud.com/B1Fe1ewaen6xbNfv9', category: 'Music', visible: true },
  { platform: 'github',     name: 'GitHub',     url: 'https://github.com/Jkeroromk', category: 'Work & Community', visible: true },
  { platform: 'linkedin',   name: 'LinkedIn',   url: 'https://www.linkedin.com/in/zexin-zou/', category: 'Work & Community', visible: true },
  { platform: 'discord',    name: 'Discord',    url: 'https://discord.gg/eD7ZRcg22H', category: 'Work & Community', visible: true },
]

export const MAX_SOCIAL_LINKS = 20
export const LINKS_PER_ROW = 5
