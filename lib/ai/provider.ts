/**
 * AI 模型提供方（OpenAI 兼容接口），聊天和留言审核共用。
 * 优先使用 Meta Model API（Muse Spark）；未配置 MODEL_API_KEY 时回退到 Fireworks。
 */

// trim + 去掉误粘贴的引号，防止复制 key 时带上空格/换行
const cleanKey = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, '') || undefined

const META_API_KEY = cleanKey(process.env.MODEL_API_KEY)
const META_MODEL = process.env.MUSE_MODEL || 'muse-spark-1.3'
const FIREWORKS_API_KEY = cleanKey(process.env.PROVIDER_API_KEY)
const FIREWORKS_MODEL = process.env.MODEL_NAME || 'accounts/fireworks/models/gpt-oss-120b'

export const PROVIDER = META_API_KEY
  ? { url: 'https://api.meta.ai/v1/chat/completions', key: META_API_KEY, model: META_MODEL }
  : { url: 'https://api.fireworks.ai/inference/v1/chat/completions', key: FIREWORKS_API_KEY, model: FIREWORKS_MODEL }
