// Supabase Edge Function: import-audio
// 负责从 YouTube CDN 下载音频并上传到 Supabase Storage
// 在 Supabase 的 Deno 环境运行，没有 Vercel 的 60s 超时限制

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 验证用户 JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return Response.json({ error: '未授权' }, { status: 401, headers: corsHeaders })
    }

    const supabaseUrl      = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey   = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey          = Deno.env.get('SUPABASE_ANON_KEY')!

    // 用 anon key + 用户 token 验证身份
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) {
      return Response.json({ error: '认证失败' }, { status: 401, headers: corsHeaders })
    }

    const { audioUrl, ext, httpHeaders, title } = await req.json()

    if (!audioUrl) {
      return Response.json({ error: '缺少 audioUrl 参数' }, { status: 400, headers: corsHeaders })
    }

    // 下载音频（Edge Function 无超时限制，下多久都没问题）
    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': httpHeaders?.['User-Agent'] || 'Mozilla/5.0',
        'Referer': 'https://www.youtube.com/',
      },
    })

    if (!audioRes.ok) {
      return Response.json(
        { error: `音频下载失败 (${audioRes.status})` },
        { status: 500, headers: corsHeaders }
      )
    }

    const audioBlob = await audioRes.blob()

    // 用 service role 上传到 Supabase Storage
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const safeTitle   = title.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 60)
    const fileName    = `${Date.now()}-${safeTitle}.${ext}`
    const contentType = ext === 'm4a' ? 'audio/mp4' : ext === 'webm' ? 'audio/webm' : 'audio/mpeg'

    const { error: uploadError } = await adminClient.storage
      .from('audio')
      .upload(fileName, audioBlob, { contentType, upsert: false })

    if (uploadError) {
      return Response.json(
        { error: `上传失败: ${uploadError.message}` },
        { status: 500, headers: corsHeaders }
      )
    }

    const { data: urlData } = adminClient.storage.from('audio').getPublicUrl(fileName)

    return Response.json({ publicUrl: urlData.publicUrl }, { headers: corsHeaders })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500, headers: corsHeaders }
    )
  }
})
