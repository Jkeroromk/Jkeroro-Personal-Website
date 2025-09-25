import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const PROVIDER_API_KEY = process.env.PROVIDER_API_KEY;
const MODEL_NAME = process.env.MODEL_NAME || 'accounts/fireworks/models/llama-v3-8b-instruct';

export async function POST(request: NextRequest) {
  if (!PROVIDER_API_KEY) {
    return new Response('Missing PROVIDER_API_KEY', { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    const body = await request.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages)) {
      return new Response('Messages must be an array', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const response = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PROVIDER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(`Fireworks API Error: ${errorText}`, { 
        status: response.status,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    return new Response('Error: ' + (error as Error).message, { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
