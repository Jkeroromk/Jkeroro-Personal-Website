const fs = require('fs');
const path = require('path');

// 复制 Prisma Query Engine 到 Next.js 构建目录
const copyPrismaEngine = () => {
  const prismaClientPath = require.resolve('@prisma/client');
  const prismaDir = path.dirname(prismaClientPath);
  
  // 查找 engine 文件（Vercel 使用 rhel-openssl-3.0.x）
  const engineFiles = [
    'libquery_engine-rhel-openssl-3.0.x.so.node',
    'query_engine-rhel-openssl-3.0.x.so.node',
  ];

  const customOutputPath = path.join(__dirname, '../lib/generated/prisma');
  
  // 在构建时，.next 目录可能还不存在，所以先查找 engine 文件
  let foundEngine = null;
  
  // 从自定义输出路径查找 engine
  if (fs.existsSync(customOutputPath)) {
    engineFiles.forEach(engineFile => {
      const enginePath = path.join(customOutputPath, engineFile);
      if (fs.existsSync(enginePath)) {
        foundEngine = enginePath;
        console.log(`✅ Found engine: ${engineFile}`);
      }
    });
  }

  // 如果没找到，从默认 Prisma 目录查找
  if (!foundEngine) {
    const defaultEngineDir = path.join(prismaDir, '..', '.prisma', 'client');
    if (fs.existsSync(defaultEngineDir)) {
      engineFiles.forEach(engineFile => {
        const enginePath = path.join(defaultEngineDir, engineFile);
        if (fs.existsSync(enginePath)) {
          foundEngine = enginePath;
          console.log(`✅ Found engine in default location: ${engineFile}`);
        }
      });
    }
  }

  if (!foundEngine) {
    console.warn('⚠️  Warning: Prisma engine file not found. This may cause issues in production.');
    console.warn('   Make sure binaryTargets includes "rhel-openssl-3.0.x" in prisma/schema.prisma');
  }
};

if (require.main === module) {
  copyPrismaEngine();
}

module.exports = copyPrismaEngine;

