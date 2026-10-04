import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt';
import { checkChatLimit, getClientIp } from '@/lib/ai/rate-limit';

// 优先使用 Meta Model API（Muse Spark，OpenAI 兼容）；未配置 MODEL_API_KEY 时回退到 Fireworks
// trim + 去掉误粘贴的引号，防止复制 key 时带上空格/换行
const cleanKey = (v?: string) => v?.trim().replace(/^['"]|['"]$/g, '') || undefined;
const META_API_KEY = cleanKey(process.env.MODEL_API_KEY);
const META_MODEL = process.env.MUSE_MODEL || 'muse-spark-1.3';
const FIREWORKS_API_KEY = cleanKey(process.env.PROVIDER_API_KEY);
const FIREWORKS_MODEL = process.env.MODEL_NAME || 'accounts/fireworks/models/gpt-oss-120b';

const PROVIDER = META_API_KEY
  ? { url: 'https://api.meta.ai/v1/chat/completions', key: META_API_KEY, model: META_MODEL }
  : { url: 'https://api.fireworks.ai/inference/v1/chat/completions', key: FIREWORKS_API_KEY, model: FIREWORKS_MODEL };

// 防滥用：限制上下文长度和输出长度，避免被当成免费的通用 AI 接口
const MAX_MESSAGES = 16; // 最多带最近 16 条历史
const MAX_MESSAGE_CHARS = 2000; // 单条消息上限
const MAX_TOTAL_CHARS = 12000; // 整个上下文上限
const MAX_OUTPUT_TOKENS = 800;

// 允许调用的站点（同源请求总是允许，这里是额外白名单）
const ALLOWED_HOSTS = ['jkeroro.com', 'www.jkeroro.com', 'jkeroro.vercel.app', 'localhost'];

const text = (body: string, status: number, headers: Record<string, string> = {}) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', ...headers } });

/** 只接受来自本站页面的请求（挡住别的网站直接调用；curl 伪造 Origin 的情况交给限流兜底） */
function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    const { hostname, host } = new URL(origin);
    return host === req.headers.get('host') || ALLOWED_HOSTS.includes(hostname);
  } catch {
    return false;
  }
}

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function isChatMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== 'object') return false;
  const { role, content } = m as { role?: unknown; content?: unknown };
  return (role === 'user' || role === 'assistant') && typeof content === 'string' && content.trim().length > 0;
}

/** 清洗客户端传来的对话：丢掉 system 等角色、截断长度；不合规时返回错误信息 */
function sanitizeMessages(input: unknown): ChatMessage[] | string {
  if (!Array.isArray(input)) return 'Messages must be an array';

  const messages: ChatMessage[] = input
    .filter(isChatMessage)
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-MAX_MESSAGES);

  const last = messages[messages.length - 1];
  if (!last || last.role !== 'user') return 'Last message must be from the user';
  if (last.content.length > MAX_MESSAGE_CHARS) return `Message too long (max ${MAX_MESSAGE_CHARS} characters)`;

  // 历史消息过长时截断，总长度超限时从最早的开始丢
  const trimmed = messages.map((m) => ({ ...m, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  let total = trimmed.reduce((n, m) => n + m.content.length, 0);
  while (total > MAX_TOTAL_CHARS && trimmed.length > 1) {
    const dropped = trimmed.shift();
    total -= dropped ? dropped.content.length : 0;
  }
  return trimmed;
}

/**
 * GET /api/chat - 探活测试
 */
export async function GET() {
  return text('OK chat route (use POST)', 200);
}

/**
 * POST /api/chat - 处理聊天请求
 */
export async function POST(req: NextRequest) {
  try {
    if (!isAllowedOrigin(req)) {
      return text('Forbidden', 403);
    }

    if (!PROVIDER.key) {
      return text('Chat is not configured', 503);
    }

    let requestBody: { messages?: unknown } | null;
    try {
      requestBody = await req.json();
    } catch {
      return text('Invalid JSON in request body', 400);
    }

    const messages = sanitizeMessages(requestBody?.messages);
    if (typeof messages === 'string') {
      return text(messages, 400);
    }

    // 限流（每 IP 每分钟 / 每天，以及全站每天总量）
    const limit = await checkChatLimit(getClientIp(req.headers));
    if (!limit.ok) {
      const msg =
        limit.reason === 'global'
          ? 'Muse 今天聊得太多了，明天再来吧'
          : limit.reason === 'day'
            ? '今天的对话次数用完了，明天再来吧'
            : '发得有点快，休息一下再试';
      return text(msg, 429, { 'Retry-After': String(limit.retryAfter) });
    }

    // 系统提示词只用服务端的版本，客户端传来的 system 消息一律忽略
    const response = await fetch(PROVIDER.url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PROVIDER.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PROVIDER.model,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
        stream: true,
        max_tokens: MAX_OUTPUT_TOKENS,
      }),
    });

    if (!response.ok) {
      // 不把上游的原始错误透传给前端
      console.error('Chat provider error', response.status, await response.text().catch(() => ''));
      // 只回传上游的状态码（方便排查：401 key 无效 / 402 余额不足 / 404 模型不存在 / 429 上游限流）
      return text(`Upstream error (${response.status})`, 502);
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return text('Internal server error', 500);
  }
}
