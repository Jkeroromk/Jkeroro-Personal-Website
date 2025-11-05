import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 生产环境 seed 数据端点（仅管理员使用）
export async function POST() {
  try {
    // 这里可以添加管理员验证
    // const session = await getServerSession()
    // if (!session?.user?.isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    console.log('🌱 开始填充生产环境数据库...\n')

    // 创建示例图片
    console.log('📸 创建示例图片...')
    const images = await prisma.image.createMany({
      data: [
        {
          src: '/me.webp',
          alt: 'Jkeroro Personal Photo',
          width: 550,
          height: 384,
          order: 0,
          priority: true,
          imageOffsetX: 50,
          imageOffsetY: 50,
        },
        {
          src: '/header.webp',
          alt: 'Website Header Background',
          width: 1920,
          height: 1080,
          order: 1,
          priority: false,
          imageOffsetX: 50,
          imageOffsetY: 50,
        },
        {
          src: '/pfp.webp',
          alt: 'Profile Picture',
          width: 100,
          height: 100,
          order: 2,
          priority: false,
          imageOffsetX: 50,
          imageOffsetY: 50,
        },
        {
          src: '/static/car.webp',
          alt: 'Car Image',
          width: 800,
          height: 600,
          order: 3,
          priority: false,
          imageOffsetX: 50,
          imageOffsetY: 50,
        },
      ],
      skipDuplicates: true,
    })
    console.log(`✅ 创建了 ${images.count} 张图片\n`)

    // 创建示例音乐轨道
    console.log('🎵 创建示例音乐轨道...')
    const tracks = await prisma.track.createMany({
      data: [
        {
          title: 'Track 1',
          subtitle: 'Artist 1',
          src: '/public/uploads/1759944957539-2hollis_-_poster_boy__official_audio_.mp3',
          order: 0,
        },
        {
          title: 'Track 2',
          subtitle: 'Artist 2',
          src: '/public/uploads/1759945198863-h6itam__ICEDMANE__DYSMANE_-_CANTO_DE_LUNA__SUPER_SLOWED_.mp3',
          order: 1,
        },
        {
          title: 'Track 3',
          subtitle: 'Artist 3',
          src: '/public/uploads/1759946716549-Instruments_of_Retribution.mp3',
          order: 2,
        },
      ],
      skipDuplicates: true,
    })
    console.log(`✅ 创建了 ${tracks.count} 首音乐\n`)

    // 创建示例项目
    console.log('🚀 创建示例项目...')
    const projects = await prisma.project.createMany({
      data: [
        {
          title: 'Personal Website',
          description: 'My personal portfolio and blog website.',
          image: '/pfp.webp',
          link: 'https://jkeroro.com',
          category: 'personal',
        },
        {
          title: '3D Art Project',
          description: 'Exploring 3D graphics with Three.js.',
          image: '/static/glow.png',
          link: '#',
          category: 'creative',
        },
        {
          title: 'Open Source Tool',
          description: 'A utility for developers to boost productivity.',
          image: '/next.svg',
          link: '#',
          category: 'tech',
        },
      ],
      skipDuplicates: true,
    })
    console.log(`✅ 创建了 ${projects.count} 个项目\n`)

    // 创建示例评论
    console.log('💬 创建示例评论...')
    const comments = await prisma.comment.createMany({
      data: [
        {
          text: 'This is a great website!',
          likes: 5,
          fires: 2,
          hearts: 1,
          laughs: 0,
          wows: 0,
        },
        {
          text: 'Awesome content, keep it up!',
          likes: 10,
          fires: 3,
          hearts: 5,
          laughs: 1,
          wows: 2,
        },
      ],
      skipDuplicates: true,
    })
    console.log(`✅ 创建了 ${comments.count} 条评论\n`)

    // 初始化访问统计
    console.log('📊 初始化访问统计...')
    await prisma.viewCount.upsert({
      where: { id: 'main' },
      update: { count: 0 },
      create: { id: 'main', count: 0 },
    })
    console.log('✅ 访问统计已初始化\n')

    // 初始化管理员状态
    console.log('👤 初始化管理员状态...')
    await prisma.adminStatus.upsert({
      where: { id: 'admin' },
      update: { lastActive: new Date() },
      create: { id: 'admin', lastActive: new Date() },
    })
    console.log('✅ 管理员状态已初始化\n')

    console.log('✨ 数据库填充完成！')

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        images: images.count,
        tracks: tracks.count,
        projects: projects.count,
        comments: comments.count,
      },
    })
  } catch (error) {
    console.error('❌ Seed 失败:', error)
    return NextResponse.json(
      {
        error: 'Failed to seed database',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

