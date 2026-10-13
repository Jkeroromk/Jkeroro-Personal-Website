#!/usr/bin/env node

/**
 * 只在正式环境（Vercel Production）构建时执行 prisma migrate deploy。
 *
 * 预览环境和线上共用同一个数据库，如果预览构建也跑 migration，
 * 一个还没合并的 PR 就会先把线上数据库结构改掉（之前删字段时就出过事）。
 * 现在预览构建只跳过 migration，其他照常；合并到 main 上线时才真正改数据库。
 *
 * 本地手动构建（不在 Vercel 上）也跳过，需要时自己跑 npm run prisma:migrate:deploy。
 */

const { spawnSync } = require('child_process')

const env = process.env.VERCEL_ENV

if (env !== 'production') {
  console.log(`⏭️  跳过数据库 migration（当前环境：${env || '本地'}，只有 production 构建才会执行）`)
  process.exit(0)
}

console.log('🚀 Production 构建：执行 prisma migrate deploy')
const result = spawnSync('node', ['scripts/run-with-ssl.js', 'prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: process.env,
})

if (result.status !== 0) {
  // 和原来的行为一致：migration 失败不阻断部署，只打印提示
  console.log('⚠️ Migration skipped (may already be applied)')
}
