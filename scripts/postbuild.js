const fs = require('fs');
const path = require('path');

// 构建后复制 Prisma Engine 文件（开发和生产环境都需要）
const copyPrismaEngine = () => {
  const isVercel = process.env.VERCEL === '1'
  const isProduction = process.env.NODE_ENV === 'production'
  
  // 检查是否使用 Prisma Accelerate
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_POOLER_URL
  const isAccelerate = databaseUrl?.startsWith('prisma://')
  
  if (isAccelerate) {
    console.log('✅ 使用 Prisma Accelerate，跳过引擎文件复制');
    return true;
  }
  
  console.log(`📦 Copying Prisma Query Engine... (${isVercel ? 'Vercel' : 'Local'} ${isProduction ? 'Production' : 'Development'})`);
  
  const engineFile = 'libquery_engine-rhel-openssl-3.0.x.so.node';
  
  // 可能的源路径
  const possibleSources = [
    path.join(__dirname, '../lib/generated/prisma', engineFile),
    path.join(__dirname, '../node_modules/.prisma/client', engineFile),
    path.join(__dirname, '../node_modules/@prisma/client', engineFile),
  ];
  
  let enginePath = null;
  for (const source of possibleSources) {
    if (fs.existsSync(source)) {
      enginePath = source;
      console.log(`✅ Found engine at: ${source}`);
      break;
    }
  }
  
  if (!enginePath) {
    console.warn('⚠️  Engine file not found in any expected location');
    console.warn('   Searched locations:');
    possibleSources.forEach(src => console.warn(`   - ${src}`));
    // 在开发环境不失败，只是警告
    if (!isVercel) {
      console.warn('   Continuing build (this is OK for local development)...');
      return true;
    }
    return false;
  }
  
  // 目标路径
  const targets = [
    path.join(__dirname, '../.next/server/chunks', engineFile),
    path.join(__dirname, '../.next/server', engineFile),
    path.join(__dirname, '../lib/generated/prisma', engineFile),
  ];
  
  let copied = false;
  targets.forEach(target => {
    const targetDir = path.dirname(target);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    try {
      fs.copyFileSync(enginePath, target);
      console.log(`✅ Copied engine to: ${target}`);
      copied = true;
    } catch (error) {
      console.warn(`⚠️  Failed to copy to ${target}:`, error.message);
    }
  });
  
  return copied;
};

if (require.main === module) {
  const success = copyPrismaEngine();
  process.exit(success ? 0 : 1);
}

module.exports = copyPrismaEngine;

