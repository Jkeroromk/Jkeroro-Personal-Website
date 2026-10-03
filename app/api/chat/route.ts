import { NextRequest } from 'next/server';

// 使用 Node.js runtime 以支持更好的数据库连接和错误处理
// export const runtime = 'edge'; // 已移除，避免禁用静态生成的警告

// 环境变量
// 优先使用 Meta Model API（Muse Spark，OpenAI 兼容）；未配置 MODEL_API_KEY 时回退到 Fireworks
const META_API_KEY = process.env.MODEL_API_KEY;
const META_MODEL = process.env.MUSE_MODEL || 'muse-spark-1.3';
const FIREWORKS_API_KEY = process.env.PROVIDER_API_KEY;
const FIREWORKS_MODEL = process.env.MODEL_NAME || 'accounts/fireworks/models/gpt-oss-20b';

const PROVIDER = META_API_KEY
  ? { url: 'https://api.meta.ai/v1/chat/completions', key: META_API_KEY, model: META_MODEL }
  : { url: 'https://api.fireworks.ai/inference/v1/chat/completions', key: FIREWORKS_API_KEY, model: FIREWORKS_MODEL };

/**
 * GET /api/chat - 探活测试
 */
export async function GET() {
  return new Response('OK chat route (use POST)', {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

/**
 * POST /api/chat - 处理聊天请求
 */
export async function POST(req: NextRequest) {
  try {
    // 1. 校验 API Key
    if (!PROVIDER.key) {
      return new Response('Missing MODEL_API_KEY (Meta) or PROVIDER_API_KEY (Fireworks)', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 2. 解析请求体
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('JSON parsing error:', error);
      return new Response('Invalid JSON in request body', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const { messages } = requestBody;

    // 验证消息格式
    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages must be an array', {
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 3. 调用模型 API（Meta Muse Spark 或 Fireworks，均为 OpenAI 兼容格式）
    const response = await fetch(PROVIDER.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROVIDER.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: PROVIDER.model,
        messages,
        stream: true,
      }),
    });

    // 4. 处理错误响应 - 透传错误信息
    if (!response.ok) {
      const errorText = await response.text();
      return new Response(errorText, {
        status: response.status,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    // 5. 成功时透传 SSE 流
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

/**
 * OPTIONS /api/chat - CORS 预检
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}