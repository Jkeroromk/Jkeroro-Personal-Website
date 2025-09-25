import { NextRequest } from 'next/server';

export const runtime = 'edge';

// 环境变量
const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || 'accounts/fireworks/models/gpt-oss-20b';

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
    if (!PROVIDER_API_KEY) {
      return new Response('Missing PROVIDER_API_KEY', {
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

    // 3. 调用 Fireworks API
    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROVIDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
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