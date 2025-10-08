import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { tmpdir } from 'os'
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL, FirebaseStorage } from 'firebase/storage'

// Firebase 配置
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "jkeroro-website.firebaseapp.com",
  projectId: "jkeroro-website",
  storageBucket: "jkeroro-website.appspot.com",
  messagingSenderId: "518841981397",
  appId: "1:518841981397:web:ac6b8202d7c29dc45ec55c",
  databaseURL: "https://jkeroro-website-default-rtdb.firebaseio.com/"
};

// 初始化 Firebase
let app: FirebaseApp | null, storage: FirebaseStorage | null;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  app = null;
  storage = null;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 })
    }

    // 检查文件大小 (10MB 限制)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        success: false, 
        error: 'File too large. Maximum size is 10MB.' 
      }, { status: 400 })
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/wav', 'audio/ogg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid file type. Allowed: JPG, PNG, WEBP, MP3, WAV, OGG' 
      }, { status: 400 })
    }

    // 优先使用 Firebase Storage
    if (storage) {
      try {
        // 生成唯一文件名
        const timestamp = Date.now()
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${timestamp}-${cleanFileName}`
        
        // 创建 Firebase Storage 引用
        const storageRef = ref(storage, `uploads/${fileName}`)
        
        // 将文件转换为 ArrayBuffer
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        
        // 上传到 Firebase Storage
        const snapshot = await uploadBytes(storageRef, buffer, {
          contentType: file.type,
          customMetadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString()
          }
        })
        
        // 获取下载 URL
        const downloadURL = await getDownloadURL(snapshot.ref)
        
        return NextResponse.json({ 
          success: true, 
          fileName: fileName,
          filePath: downloadURL,
          isFirebase: true,
          message: 'File uploaded to Firebase Storage successfully'
        })
        
      } catch (firebaseError) {
        console.error('Firebase Storage upload failed:', firebaseError)
        // 如果 Firebase 上传失败，回退到本地存储
      }
    }

    // 回退到本地存储（开发环境或 Firebase 失败时）
    const isProduction = process.env.NODE_ENV === 'production'
    const uploadsDir = isProduction 
      ? join(tmpdir(), 'uploads')
      : join(process.cwd(), 'public', 'uploads')

    // 确保uploads目录存在
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // 生成唯一文件名，清理文件名中的特殊字符
    const timestamp = Date.now()
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `${timestamp}-${cleanFileName}`
    const filePath = join(uploadsDir, fileName)

    // 将文件写入磁盘
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 在部署环境中，文件存储在 /tmp 目录，需要特殊处理
    if (isProduction) {
      return NextResponse.json({ 
        success: true, 
        fileName: fileName,
        filePath: `/api/file/${fileName}`,
        isTemporary: true,
        message: 'File uploaded successfully (temporary storage)'
      })
    } else {
      return NextResponse.json({ 
        success: true, 
        fileName: fileName,
        filePath: `/uploads/${fileName}`,
        message: 'File uploaded to local storage successfully'
      })
    }

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ 
      success: false, 
      error: `Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 })
  }
}
