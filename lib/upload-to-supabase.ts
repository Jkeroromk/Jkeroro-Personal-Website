import { createServerClient } from '@/supabase'

export type UploadBucket = 'images' | 'audio'

export interface UploadResult {
  fileName: string
  publicUrl: string
}

/**
 * Upload a file buffer to Supabase Storage.
 * Throws with a user-friendly message on failure.
 */
export async function uploadToSupabase(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  bucket: UploadBucket
): Promise<UploadResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createServerClient()

  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
  if (bucketsError) {
    throw new Error(`Failed to access Supabase Storage: ${bucketsError.message}`)
  }
  if (!buckets?.some((b) => b.name === bucket)) {
    throw new Error(
      `Storage bucket "${bucket}" does not exist. Create it in Supabase Dashboard (Storage > New bucket).`
    )
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType, upsert: false })

  if (uploadError) {
    let msg = uploadError.message
    if (msg.includes('new row violates row-level security')) {
      msg = `Bucket "${bucket}" has RLS enabled. Disable RLS or add an upload policy.`
    } else if (msg.includes('JWT')) {
      msg = 'Auth failed. Check SUPABASE_SERVICE_ROLE_KEY.'
    } else if (msg.includes('permission') || msg.includes('denied')) {
      msg = `Permission denied for bucket "${bucket}". Check Supabase Dashboard permissions.`
    }
    throw new Error(msg)
  }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return { fileName, publicUrl: urlData.publicUrl }
}

/** Generate a timestamped, safe filename preserving extension. */
export function generateFileName(originalName: string, label?: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin'
  const safe = (label ?? originalName.replace(/\.[^.]+$/, ''))
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 60)
  return `${Date.now()}-${safe}.${ext}`
}
