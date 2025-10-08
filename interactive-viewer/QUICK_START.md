# Quick Start Guide - 交互式课程查看器

## 🚀 5分钟快速开始

### 第1步：安装依赖

```bash
cd interactive-viewer
npm install
```

### 第2步：启动开发服务器

```bash
npm run dev
```

### 第3步：打开浏览器

访问 `http://localhost:3001`

---

## 📋 前提条件

- Node.js 18+
- npm 或 yarn
- 后端服务运行在 `http://localhost:3000`（可选）

---

## 🎯 基本使用

### 视频模式

1. 应用启动后默认进入视频模式
2. 点击播放按钮开始观看
3. 当遇到词汇时，视频自动暂停并显示闪卡
4. 点击闪卡查看翻译
5. 点击"Continue Lesson"继续

### 练习模式

1. 点击顶部"✍️ Practice Mode"按钮
2. 阅读问题并输入答案
3. 点击"Submit Answer"提交
4. 查看标准答案
5. 滚动到底部查看所有词汇卡片

---

## 🔧 配置

### 修改课程数据源

编辑 `src/App.tsx`:

```typescript
// 默认加载 henIVlCPVIY/lesson_1
const data = await loadLessonData('henIVlCPVIY', 'lesson_1');

// 改为其他课程
const data = await loadLessonData('YOUR_VIDEO_ID', 'lesson_2');
```

### 连接到不同的后端

创建 `.env` 文件:

```env
VITE_API_URL=http://your-api-server.com
```

---

## 📂 项目结构

```
interactive-viewer/
├── src/
│   ├── components/          # UI组件
│   ├── store/              # 状态管理
│   ├── services/           # API服务
│   ├── types/              # TypeScript类型
│   └── styles/             # CSS样式
├── package.json
└── vite.config.ts
```

---

## 🐛 常见问题

### Q: 视频无法加载？

A: 确保后端服务正在运行：

```bash
cd ..
npm run start:dev
```

### Q: 闪卡不显示？

A: 检查课程数据文件是否存在：

```bash
ls ../videos/henIVlCPVIY/lesson_1/flashcards.json
```

### Q: 端口被占用？

A: 修改 `vite.config.ts` 中的端口：

```typescript
server: {
  port: 3002,  // 改为其他端口
}
```

---

## 🎨 快速自定义

### 修改主题色

编辑 `src/components/InteractiveFlashcard.css`:

```css
.flashcard-front {
  background: linear-gradient(135deg, #YOUR_COLOR1, #YOUR_COLOR2);
}
```

### 修改字体

编辑 `src/styles/global.css`:

```css
body {
  font-family: 'Your Font', sans-serif;
}
```

---

## 📦 构建生产版本

```bash
npm run build
```

输出目录: `dist/`

---

## 📚 更多信息

查看完整文档: [README.md](./README.md)

---

## 💡 提示

- 使用 **Space** 键播放/暂停视频
- 使用 **Ctrl+Enter** 提交练习答案
- 点击侧边栏的词汇可快速跳转
- 进度会在会话期间保存（刷新页面后重置）

---

## 🎉 开始学习吧！

现在你已经准备好使用交互式课程查看器了。祝学习愉快！
