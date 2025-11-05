const fs = require('fs');
const path = require('path');

// Vercel 构建后复制 Prisma Engine 文件
const copyPrismaEngine = () => {
  console.log('📦 Copying Prisma Query Engine for Vercel...');
  
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
    console.error('❌ Engine file not found in any expected location');
    console.error('   Searched locations:');
    possibleSources.forEach(src => console.error(`   - ${src}`));
    return false;
  }
  
  // 目标路径（Vercel 查找的位置）
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

