import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withTimeout, getDbErrorInfo } from '@/lib/db-error-handler'

// 获取纪念日背景图列表
export async function GET() {
  try {
    const settings = await withTimeout(
      prisma.anniversarySettings.findUnique({
        where: { id: 'main' },
      }),
      8000
    )

    // 处理背景图数据：可能是数组、单个值或 null
          let backgroundImages: string[] = []
          if (settings?.backgroundImages) {
            if (Array.isArray(settings.backgroundImages)) {
              backgroundImages = settings.backgroundImages as string[]
      } else if (typeof settings.backgroundImages === 'string') {
        // 兼容旧数据：单个字符串
        backgroundImages = [settings.backgroundImages]
      } else if (typeof settings.backgroundImages === 'object') {
        // 如果是对象，尝试转换为数组
        try {
          backgroundImages = Object.values(settings.backgroundImages) as string[]
        } catch {
          backgroundImages = []
        }
      }
    }

    // 处理图片位置数据
    let imagePositions: Record<string, { x: number; y: number }> = {}
    if (settings?.imagePositions && typeof settings.imagePositions === 'object') {
      imagePositions = settings.imagePositions as Record<string, { x: number; y: number }>
    }

    return NextResponse.json({
      backgroundImages: backgroundImages,
      imagePositions: imagePositions,
    })
  } catch (error) {
    const errorInfo = getDbErrorInfo(error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    console.error('Get anniversary background error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.constructor.name : typeof error,
      message: errorMessage,
    })
    
    // 检查是否是列不存在的错误
    if (errorMessage.includes('column') && 
        (errorMessage.includes('background_images') || errorMessage.includes('background_image'))) {
      return NextResponse.json(
        { 
          error: 'Database column not found',
          message: 'Please run SQL migration: scripts/migrate-anniversary-to-multiple-images.sql',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }
    
    if (errorInfo.shouldReturnEmpty) {
      return NextResponse.json({
        backgroundImages: [],
        imagePositions: {},
      })
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorInfo.errorMessage : undefined,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    )
  }
}

// 添加背景图
export async function POST(request: NextRequest) {
  try {
    const { backgroundImage } = await request.json()

    if (!backgroundImage) {
      return NextResponse.json(
        { error: 'backgroundImage is required' },
        { status: 400 }
      )
    }

    console.log('Adding anniversary background:', { backgroundImage })

    // 获取当前设置
    const currentSettings = await withTimeout(
      prisma.anniversarySettings.findUnique({
        where: { id: 'main' },
      }),
      8000
    )

    const currentImages = Array.isArray(currentSettings?.backgroundImages)
      ? currentSettings.backgroundImages
      : (currentSettings?.backgroundImages ? [currentSettings.backgroundImages] : [])

    // 添加新图片到数组
    const updatedImages = [...currentImages, backgroundImage]

    // 获取当前位置数据
    let imagePositions: Record<string, { x: number; y: number }> = {}
    if (currentSettings?.imagePositions && typeof currentSettings.imagePositions === 'object') {
      imagePositions = currentSettings.imagePositions as Record<string, { x: number; y: number }>
    }

    // 为新图片设置默认位置
    if (!imagePositions[backgroundImage]) {
      imagePositions[backgroundImage] = { x: 50, y: 50 }
    }

    const settings = await withTimeout(
      prisma.anniversarySettings.upsert({
        where: { id: 'main' },
        update: {
          backgroundImages: updatedImages,
          imagePositions: imagePositions,
        },
        create: {
          id: 'main',
          backgroundImages: [backgroundImage],
          imagePositions: { [backgroundImage]: { x: 50, y: 50 } },
        },
      }),
      8000
    )

    console.log('Add successful:', settings)

    const resultImages = Array.isArray(settings.backgroundImages) 
      ? settings.backgroundImages 
      : []
    const resultPositions = settings.imagePositions && typeof settings.imagePositions === 'object'
      ? settings.imagePositions as Record<string, { x: number; y: number }>
      : {}

    return NextResponse.json({
      success: true,
      backgroundImages: resultImages,
      imagePositions: resultPositions,
    })
  } catch (error) {
    console.error('Update anniversary background error:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.constructor.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    })
    
    const errorInfo = getDbErrorInfo(error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // 检查是否是表不存在的错误
    if (errorMessage.includes('does not exist') || 
        errorMessage.includes('P2021') ||
        errorMessage.includes('anniversary_settings') ||
        errorMessage.includes('model AnniversarySettings')) {
      return NextResponse.json(
        { 
          error: 'Database table not found',
          message: 'Please run database migration: npm run prisma:migrate:deploy',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }
    
    // 检查是否是列不存在的错误
    if (errorMessage.includes('column') && 
        (errorMessage.includes('image_offset_x') || errorMessage.includes('image_offset_y'))) {
      return NextResponse.json(
        { 
          error: 'Database column not found',
          message: 'Please run SQL migration to add position columns. Check scripts/add-anniversary-position-columns.sql',
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          errorInfo,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

// 删除背景图
export async function DELETE(request: NextRequest) {
  try {
    const { imageUrl } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    console.log('Deleting anniversary background:', imageUrl)

    // 获取当前设置
    const currentSettings = await withTimeout(
      prisma.anniversarySettings.findUnique({
        where: { id: 'main' },
      }),
      8000
    )

    const currentImages = Array.isArray(currentSettings?.backgroundImages)
      ? (currentSettings.backgroundImages as string[])
      : (currentSettings?.backgroundImages ? [currentSettings.backgroundImages as string] : [])

    // 从数组中移除指定图片
    const updatedImages = currentImages.filter((img) => img !== imageUrl)

    // 获取当前位置数据并删除对应图片的位置
    let imagePositions: Record<string, { x: number; y: number }> = {}
    if (currentSettings?.imagePositions && typeof currentSettings.imagePositions === 'object') {
      imagePositions = { ...currentSettings.imagePositions as Record<string, { x: number; y: number }> }
      delete imagePositions[imageUrl]
    }

    const settings = await withTimeout(
      prisma.anniversarySettings.upsert({
        where: { id: 'main' },
        update: {
          backgroundImages: updatedImages,
          imagePositions: imagePositions,
        },
        create: {
          id: 'main',
          backgroundImages: [],
          imagePositions: {},
        },
      }),
      8000
    )

    console.log('Delete successful:', settings)

    const resultImages = Array.isArray(settings.backgroundImages) 
      ? settings.backgroundImages 
      : []
    const resultPositions = settings.imagePositions && typeof settings.imagePositions === 'object'
      ? settings.imagePositions as Record<string, { x: number; y: number }>
      : {}

    return NextResponse.json({
      success: true,
      backgroundImages: resultImages,
      imagePositions: resultPositions,
    })
  } catch (error) {
    console.error('Delete anniversary background error:', error)
    const errorInfo = getDbErrorInfo(error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          errorInfo,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

// 更新图片位置
export async function PUT(request: NextRequest) {
  try {
    const { imageUrl, imageOffsetX, imageOffsetY } = await request.json()

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      )
    }

    console.log('Updating image position:', { imageUrl, imageOffsetX, imageOffsetY })

    // 获取当前设置
    const currentSettings = await withTimeout(
      prisma.anniversarySettings.findUnique({
        where: { id: 'main' },
      }),
      8000
    )

    // 获取当前位置数据
    let imagePositions: Record<string, { x: number; y: number }> = {}
    if (currentSettings?.imagePositions && typeof currentSettings.imagePositions === 'object') {
      imagePositions = { ...currentSettings.imagePositions as Record<string, { x: number; y: number }> }
    }

    // 更新指定图片的位置
    if (imageOffsetX !== undefined && imageOffsetY !== undefined) {
      imagePositions[imageUrl] = { x: imageOffsetX, y: imageOffsetY }
    }

    const settings = await withTimeout(
      prisma.anniversarySettings.upsert({
        where: { id: 'main' },
        update: {
          imagePositions: imagePositions,
        },
        create: {
          id: 'main',
          backgroundImages: [],
          imagePositions: imagePositions,
        },
      }),
      8000
    )

    console.log('Update successful:', settings)

    const resultImages = Array.isArray(settings.backgroundImages) 
      ? settings.backgroundImages 
      : []
    const resultPositions = settings.imagePositions && typeof settings.imagePositions === 'object'
      ? settings.imagePositions as Record<string, { x: number; y: number }>
      : {}

    return NextResponse.json({
      success: true,
      backgroundImages: resultImages,
      imagePositions: resultPositions,
    })
  } catch (error) {
    console.error('Update anniversary background list error:', error)
    const errorInfo = getDbErrorInfo(error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? {
          errorInfo,
          stack: error instanceof Error ? error.stack : undefined,
        } : undefined,
      },
      { status: 500 }
    )
  }
}

