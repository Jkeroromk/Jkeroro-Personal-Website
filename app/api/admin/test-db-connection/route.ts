import { NextResponse } from 'next/server'
import { Client } from 'pg'

// 直接测试数据库连接（不通过 Prisma）
export async function GET() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const results: any = {
    timestamp: new Date().toISOString(),
    checks: [],
  }

  // 检查 1: DATABASE_URL 是否存在
  const databaseUrl = process.env.DATABASE_URL
  results.checks.push({
    name: 'DATABASE_URL exists',
    success: !!databaseUrl,
    details: databaseUrl ? `URL length: ${databaseUrl.length}` : 'Missing',
  })

  if (!databaseUrl) {
    return NextResponse.json(results, { status: 200 })
  }

  // 检查 2: 解析 URL
  let urlParsed = null
  try {
    urlParsed = new URL(databaseUrl.replace(/^postgresql:/, 'postgres:'))
    results.checks.push({
      name: 'Parse DATABASE_URL',
      success: true,
      details: {
        host: urlParsed.hostname,
        port: urlParsed.port,
        database: urlParsed.pathname.replace('/', ''),
        user: urlParsed.username,
        hasPassword: !!urlParsed.password,
      },
    })
  } catch (error) {
    results.checks.push({
      name: 'Parse DATABASE_URL',
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(results, { status: 200 })
  }

  // 检查 3: 直接连接测试（使用 pg）
  // 确保 DATABASE_URL 包含 SSL 配置
  // 对于 pg 客户端，我们使用 ssl 选项来接受自签名证书
  let connectionString = databaseUrl
  // 移除可能存在的 sslmode 参数，因为我们会在 Client 配置中处理
  connectionString = connectionString.replace(/[?&]sslmode=[^&]*/g, '')
  
  let client: Client | null = null
  try {
    // 对于 pg 客户端，使用 ssl 选项而不是 URL 参数
    client = new Client({
      connectionString: connectionString,
      ssl: {
        rejectUnauthorized: false, // Supabase 使用自签名证书，不验证证书
      },
    })

    await client.connect()
    results.checks.push({
      name: 'Direct PostgreSQL connection',
      success: true,
      details: 'Connected successfully',
    })

    // 检查 4: 执行简单查询
    const queryResult = await client.query('SELECT version(), current_database(), current_user')
    results.checks.push({
      name: 'Execute query',
      success: true,
      details: {
        version: queryResult.rows[0]?.version?.substring(0, 50) || 'N/A',
        database: queryResult.rows[0]?.current_database || 'N/A',
        user: queryResult.rows[0]?.current_user || 'N/A',
      },
    })

    // 检查 5: 检查表是否存在
    const tablesResult = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `)
    results.checks.push({
      name: 'Check tables',
      success: true,
      details: {
        tableCount: tablesResult.rows.length,
        tables: tablesResult.rows.map((r) => r.tablename),
      },
    })

    await client.end()
  } catch (error) {
    results.checks.push({
      name: 'Direct PostgreSQL connection',
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : null,
      },
    })
    if (client) {
      try {
        await client.end()
      } catch {
        // 忽略关闭错误
      }
    }
  }

  // 检查 6: Prisma 是否能初始化（不执行查询）
  try {
    const { prisma } = await import('@/lib/prisma')
    // 只是初始化，不查询
    await prisma.$disconnect()
    results.checks.push({
      name: 'Prisma Client initialization',
      success: true,
      details: 'Prisma Client can be initialized',
    })
  } catch (error) {
    results.checks.push({
      name: 'Prisma Client initialization',
      success: false,
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        isEngineError: error instanceof Error && error.message.includes('Query Engine'),
      },
    })
  }

  return NextResponse.json(results)
}

