'use client'

// 在浏览器里先把照片压一遍再上传：
// - 手机原图动辄 3~10MB，Vercel 的请求体上限是 4.5MB，大图会直接传不上去
// - 长边缩到 MAX_SIDE，转成 WebP（浏览器不支持编码 WebP 时退回 JPEG），一般 300~600KB
// - 顺便读出真实宽高，不用再手填
// - 手机竖拍的照片按 EXIF 方向摆正

const MAX_SIDE = 2000
const QUALITY = 0.82
// 本来就很小、尺寸也不大的图，就不重新编码了，免得越压越糊
const SKIP_BELOW_BYTES = 400 * 1024

export interface CompressedImage {
  file: File
  width: number
  height: number
}

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() }
    } catch {
      // 有的浏览器不认 imageOrientation 参数，下面用 <img> 再试一次
    }
  }
  const url = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = 'async'
    img.src = url
    await img.decode()
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error(
      /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name)
        ? '这个浏览器打不开 HEIC 照片。用 iPhone 的 Safari 直接选图会自动转成 JPEG，或者在电脑上先导出成 JPG。'
        : `打不开这张图片：${file.name}`
    )
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality))
}

function renameExt(name: string, ext: string) {
  const base = name.replace(/\.[^.]+$/, '') || 'photo'
  return `${base}.${ext}`
}

export async function compressImage(file: File): Promise<CompressedImage> {
  const { source, width, height, close } = await decode(file)
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height))
    const w = Math.round(width * scale)
    const h = Math.round(height * scale)

    const alreadyFine =
      scale === 1 &&
      file.size <= SKIP_BELOW_BYTES &&
      ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
    if (alreadyFine) return { file, width, height }

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) return { file, width, height }
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(source, 0, 0, w, h)

    // 老 Safari 不会编码 WebP，会悄悄给回 PNG，那样反而更大，所以检查一下类型
    let blob = await canvasToBlob(canvas, 'image/webp', QUALITY)
    let type = 'image/webp'
    if (!blob || blob.type !== 'image/webp') {
      blob = await canvasToBlob(canvas, 'image/jpeg', QUALITY)
      type = 'image/jpeg'
    }
    if (!blob) return { file, width, height }

    // 压完反而更大（少见，比如本来就是高压缩的小 JPEG）就用原图
    if (blob.size >= file.size && scale === 1 && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      return { file, width, height }
    }

    const out = new File([blob], renameExt(file.name, type === 'image/webp' ? 'webp' : 'jpg'), {
      type,
      lastModified: file.lastModified,
    })
    return { file: out, width: w, height: h }
  } finally {
    close()
  }
}
