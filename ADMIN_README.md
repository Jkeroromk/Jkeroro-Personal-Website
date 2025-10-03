# Admin Dashboard 使用说明

## 访问Admin后台

1. 访问 `/admin` 路由
2. 使用现有的管理员登录系统（Shift+Alt+L 或 Cmd+Shift+L）
3. 只有管理员权限的用户才能访问

## 功能说明

### 1. 图片管理 (Images)
- **查看**: 显示所有相册图片
- **添加**: 点击 "Add Image" 按钮
- **编辑**: 点击图片上的编辑按钮
- **删除**: 点击图片上的删除按钮
- **上传**: 支持拖拽上传图片文件
- **设置**: 可以设置图片尺寸和优先级

### 2. 音乐管理 (Music)
- **查看**: 显示所有音乐曲目
- **添加**: 点击 "Add Track" 按钮
- **编辑**: 点击曲目上的编辑按钮
- **删除**: 点击曲目上的删除按钮
- **上传**: 支持拖拽上传音频文件
- **设置**: 可以设置标题、艺术家和文件路径

### 3. 项目管理 (Projects)
- **查看**: 显示所有项目
- **添加**: 点击 "Add Project" 按钮
- **编辑**: 点击项目上的编辑按钮
- **删除**: 点击项目上的删除按钮
- **设置**: 可以设置标题、描述、图片、链接和分类

## 数据存储

- 数据存储在浏览器的 `localStorage` 中
- 键名: `jkeroro-website-data`
- 包含三个数组: `images`, `tracks`, `projects`

## 文件上传

### 支持的格式
- **图片**: PNG, JPG, WEBP (最大10MB)
- **音频**: MP3, WAV, OGG (最大10MB)

### 上传方式
1. 点击上传区域选择文件
2. 拖拽文件到上传区域
3. 文件会自动设置路径为 `/uploads/文件名`

## 数据导出/导入

### 导出数据
```javascript
// 在浏览器控制台执行
const data = JSON.parse(localStorage.getItem('jkeroro-website-data'))
console.log(JSON.stringify(data, null, 2))
```

### 导入数据
```javascript
// 在浏览器控制台执行
const newData = { /* 你的数据 */ }
localStorage.setItem('jkeroro-website-data', JSON.stringify(newData))
```

## 组件更新

### Album组件
- 自动从数据管理器加载图片
- 支持动态图片列表
- 保持原有的动画效果

### MusicPlayer组件
- 自动从数据管理器加载音乐
- 支持动态音乐列表
- 保持原有的播放功能

## 注意事项

1. **文件路径**: 上传的文件需要手动移动到 `public/uploads/` 目录
2. **数据备份**: 建议定期导出数据作为备份
3. **权限控制**: 只有管理员可以访问admin页面
4. **响应式**: 界面支持移动端和桌面端

## 技术栈

- **前端**: React, Next.js, TypeScript
- **UI**: Tailwind CSS, Framer Motion
- **状态管理**: React Hooks, localStorage
- **文件上传**: 原生HTML5 File API
- **数据管理**: 单例模式的DataManager类

## 扩展功能

可以考虑添加的功能：
- 服务器端文件上传
- 数据库存储
- 用户权限管理
- 批量操作
- 数据同步
- 版本控制
