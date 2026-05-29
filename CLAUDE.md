# Jkeroro Personal Website — Portfolio

## 项目概述
Jason 的个人品牌网站，展示前端工程 + 寿司厨师双重身份，风格: cozy、有个性、不像模板。

## Tech Stack
| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 动效 | Framer Motion |
| 部署 | Vercel |
| 域名 | jkeroro.com |

## 设计风格
- 整体基调: 温暖、cozy、有质感，不要冷冰冰的科技感
- 配色: 暖色调为主（米白、浅棕、橙黄），搭配深色文字
- 字体: 标题用有个性的字体，正文清晰易读
- 动效: 平滑自然，不过度炫技，进入动画不超过 0.4s

## 目录结构
```
Jkeroro-Personal-Website/
├── app/              # Next.js App Router 页面
├── components/       # 可复用组件
│   ├── ui/          # 基础 UI 组件
│   └── sections/    # 页面区块组件
├── lib/              # 工具函数
├── public/           # 静态资源
└── styles/           # 全局样式
```

## 编码规范
- 语言: TypeScript，严格模式
- 组件: 函数组件 + Hooks
- 样式: Tailwind 优先，复杂动画用 Framer Motion
- 图片: 全部使用 Next.js `<Image>` 组件
- SEO: 每个页面必须有完整的 metadata

## Commit 格式
```
feat(section): 简短描述
fix(component): 简短描述
style(ui): 简短描述
```

## 完成任务后必做
1. 运行 `npm run build` 确认无编译错误
2. 检查移动端响应式是否正常（至少考虑 375px 宽度）
3. 在 issue 评论中输出: `DONE: <一句话总结做了什么>`

## 重要约束
- 保持整体风格统一，不要引入与现有设计冲突的元素
- 所有文案默认英文，除非 issue 特别说明
- 不要使用 `any` 类型
- 动效必须支持 `prefers-reduced-motion`
