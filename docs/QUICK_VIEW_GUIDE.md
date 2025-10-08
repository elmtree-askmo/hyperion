# 🚀 快速查看 Lesson 指南

## ⚡ 最快方式（1 个命令）

```bash
./view-lesson.sh henIVlCPVIY lesson_1
```

这个脚本会：

- ✅ 检查 lesson 文件是否存在
- ✅ 自动配置 viewer
- ✅ 启动后端和前端
- ✅ 自动打开浏览器

---

## 📚 查看不同的 Lesson

### 查看 lesson_2

```bash
./view-lesson.sh henIVlCPVIY lesson_2
```

### 查看 lesson_3

```bash
./view-lesson.sh henIVlCPVIY lesson_3
```

### 查看其他视频的 lesson

```bash
./view-lesson.sh YOUR_VIDEO_ID lesson_1
```

---

## 🔧 手动方式

如果你想手动控制每一步：

### 步骤 1: 启动后端

```bash
npm run start:dev
```

### 步骤 2: 启动前端

```bash
cd interactive-viewer
npm run dev
```

### 步骤 3: 打开浏览器

```
http://localhost:3001
```

---

## 📊 你的 Lesson 数据

当前可用的 lessons:

```
videos/henIVlCPVIY/
├── lesson_1/  ✅ 已准备好
│   ├── microlesson_script.json
│   ├── flashcards.json
│   ├── audio_segments.json
│   ├── final_synchronized_lesson.json
│   └── final_microlesson.mp4
├── lesson_2/  (如果有)
└── lesson_3/  (如果有)
```

---

## 🎯 在 Viewer 中你可以做什么

### 📺 视频模式

1. **观看课程视频**
   - Remotion Player 播放精美的动画
   - 自动同步字幕和视觉效果

2. **交互式 Flashcard** 🃏
   - 视频播放到词汇时自动暂停
   - 点击卡片查看翻译
   - 3D 翻转动画
   - 展开查看详细信息：
     - 💡 记忆技巧
     - 📝 情境例句
     - 🔤 英文定义

3. **侧边栏导航** 🗂️
   - 查看所有词汇列表
   - 点击跳转到任意词汇
   - ✓ 标记已学习的词汇

### ✍️ 练习模式

1. **完成练习题**
   - 阅读情境和问题
   - 输入你的答案
   - 💡 查看提示（如果需要）
   - 提交后对比标准答案

2. **复习所有词汇**
   - 浏览所有 flashcard
   - 按自己的节奏学习

3. **进度追踪** 📈
   - 查看已完成的 flashcards
   - 查看已完成的 practices
   - 可视化进度条

---

## 🐛 遇到问题？

### 问题：页面一直显示 "Loading..."

**解决：**

```bash
# 检查后端是否运行
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY/lesson_1

# 如果没有响应，重启后端
npm run start:dev
```

### 问题：Flashcards 不显示

**解决：**

```bash
# 检查 flashcards.json 是否存在和格式正确
cat videos/henIVlCPVIY/lesson_1/flashcards.json | head -20

# 应该包含一个 "flashcards" 数组
```

### 问题：端口被占用

**解决：**

```bash
# 查找占用端口的进程
lsof -i :3001

# 终止进程
kill -9 <PID>
```

---

## 💡 提示

### 键盘快捷键

- **Space**: 播放/暂停视频
- **Double-click**: 全屏
- **Ctrl+Enter**: 提交练习答案（在文本框中）

### 最佳实践

1. **首次学习**: 使用 📺 视频模式，跟随课程学习
2. **复习巩固**: 使用 ✍️ 练习模式，完成所有练习
3. **查漏补缺**: 使用侧边栏跳转到薄弱词汇

---

## 📞 需要更多帮助？

查看完整文档：

| 文档                                                           | 说明          |
| -------------------------------------------------------------- | ------------- |
| [HOW_TO_VIEW_LESSONS.md](./HOW_TO_VIEW_LESSONS.md)             | 详细使用指南  |
| [QUICK_START.md](./interactive-viewer/QUICK_START.md)          | 5分钟快速开始 |
| [README.md](./interactive-viewer/README.md)                    | 完整功能说明  |
| [IMPLEMENTATION_SUMMARY_CN.md](./IMPLEMENTATION_SUMMARY_CN.md) | 技术实现总结  |

---

## ✅ 检查清单

在查看 lesson 之前，确保：

- [ ] 已安装 Node.js 18+
- [ ] 已安装依赖 (`npm install`)
- [ ] Lesson 文件存在于 `videos/` 目录
- [ ] 后端在 port 3000 运行
- [ ] 前端在 port 3001 运行

---

## 🎉 开始学习！

```bash
# 运行这个命令，立即开始：
./view-lesson.sh henIVlCPVIY lesson_1
```

**祝学习愉快！** 🚀📚✨
