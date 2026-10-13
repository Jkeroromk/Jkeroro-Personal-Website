/**
 * 留言自动过滤：新留言 / 评论写入前先过一遍。
 * 1. 规则：带链接、拉人加联系方式、常见广告词、大量重复字符 → 直接判为可疑
 * 2. 规则没命中时，用网站聊天同一个 AI 模型判断一次是不是广告 / 辱骂
 * 可疑的留言照样存下来，只是先隐藏（hidden = true），在后台 Comments 里放行或删除。
 * AI 调用失败、超时或没配置 key 时不拦，留言正常显示（宁可漏过，也不误伤正常留言）。
 */

import { PROVIDER } from '@/lib/ai/provider'

export interface ModerationResult {
  hidden: boolean
  reason: string | null
}

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|net|org|xyz|top|io|co|cn|ru|shop|site|link|click|info|biz|vip|cc|me)\b)/i
const CONTACT = /(加微|加v|加我|vx[:：\s]|wechat|whats\s?app|telegram|t\.me\/|qq群|qq[:：]|私聊|联系方式)/i
const SPAM_WORDS =
  /(casino|betting|porn|sex\s?cam|viagra|cialis|crypto\s?(signal|invest)|bitcoin\s?invest|forex|payday\s?loan|seo\s?service|backlinks?|博彩|赌场|彩票|色情|约炮|代开|发票|兼职日结|刷单|网贷|贷款|代孕)/i
const REPEATED = /(.)\1{9,}/

function ruleCheck(text: string): string | null {
  if (LINK.test(text)) return 'Contains a link'
  if (CONTACT.test(text)) return 'Asks to contact off-site'
  if (SPAM_WORDS.test(text)) return 'Spam keywords'
  if (REPEATED.test(text)) return 'Repeated characters'
  return null
}

const SYSTEM = `You moderate short guestbook messages on a personal website.
Reply with exactly one word:
- SPAM for advertising, scams, SEO, promotions or bot-like gibberish
- ABUSE for harassment, hate, threats or sexual content
- OK for anything else, including casual, silly, critical or non-English messages
Do not explain.`

async function aiCheck(text: string): Promise<string | null> {
  if (!PROVIDER.key) return null
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(PROVIDER.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PROVIDER.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: PROVIDER.model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: text.slice(0, 1000) },
        ],
        max_tokens: 300,
        temperature: 0,
      }),
      signal: controller.signal,
    })
    if (!res.ok) {
      console.warn('Moderation provider error', res.status)
      return null
    }
    const data = await res.json()
    const answer = String(data?.choices?.[0]?.message?.content ?? '').toUpperCase()
    if (/\bSPAM\b/.test(answer)) return 'AI: looks like spam'
    if (/\bABUSE\b/.test(answer)) return 'AI: looks abusive'
    return null
  } catch (error) {
    console.warn('Moderation check skipped:', error instanceof Error ? error.message : error)
    return null
  } finally {
    clearTimeout(timer)
  }
}

export async function moderate(parts: (string | null | undefined)[]): Promise<ModerationResult> {
  const text = parts.filter(Boolean).join('\n').trim()
  if (!text) return { hidden: false, reason: null }
  const reason = ruleCheck(text) ?? (await aiCheck(text))
  return { hidden: Boolean(reason), reason }
}
