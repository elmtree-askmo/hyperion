# 📖 如何在 Interactive Viewer 中查看 Lesson

## 🎯 快速开始（3步）

### 方法 1: 最快方式（推荐）

```bash
# 1. 启动后端（如果还没启动）
npm run start:dev

# 2. 在新终端启动前端
cd interactive-viewer
npm install  # 第一次需要安装依赖
npm run dev

# 3. 打开浏览器
# 自动访问 http://localhost:3001
```

### 方法 2: 使用启动脚本

```bash
./start-interactive-viewer.sh
```

---

## 📂 检查 Lesson 数据

你的 lesson_1 已经准备好了！让我们确认文件结构：

```bash
videos/henIVlCPVIY/lesson_1/
├── microlesson_script.json     ✅ (必需)
├── flashcards.json              ✅ (必需)
├── audio_segments.json          ✅ (必需)
├── final_synchronized_lesson.json ✅ (推荐)
└── final_microlesson.mp4        (可选)
```

## 🔧 配置 Viewer 加载你的 Lesson

### 选项 A: 修改默认加载的 Lesson（推荐）

编辑 `interactive-viewer/src/App.tsx`:

```typescript
// 找到这一行（大约在第 20 行）
const data = await loadLessonData('henIVlCPVIY', 'lesson_1');

// 如果要加载其他 lesson，修改为：
const data = await loadLessonData('henIVlCPVIY', 'lesson_2');
// 或
const data = await loadLessonData('YOUR_VIDEO_ID', 'lesson_1');
```

### 选项 B: 添加 Lesson 选择器（高级）

如果你想在界面上选择不同的 lesson，可以添加一个下拉菜单。

---

## 🚀 启动步骤详解

### 第 1 步：确保后端运行

```bash
# 在项目根目录
npm run start:dev

# 你应该看到：
# [Nest] Starting Nest application...
# [Nest] NestApplication successfully started
# Application is running on: http://localhost:3000
```

**测试后端 API：**

```bash
# 获取可用的 lessons
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY

# 应该返回：
# {
#   "videoId": "henIVlCPVIY",
#   "lessons": ["lesson_1", "lesson_2", "lesson_3"],
#   "count": 3
# }

# 获取 lesson_1 的数据
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY/lesson_1
```

### 第 2 步：启动前端

```bash
# 打开新终端，进入 interactive-viewer 目录
cd interactive-viewer

# 第一次需要安装依赖
npm install

# 启动开发服务器
npm run dev

# 你应该看到：
# VITE v5.x.x ready in xxx ms
# ➜  Local:   http://localhost:3001/
# ➜  Network: use --host to expose
```

### 第 3 步：在浏览器中打开

```bash
# 自动打开浏览器（Mac）
open http://localhost:3001

# 或手动在浏览器中输入
http://localhost:3001
```

---

## 🎬 使用 Interactive Viewer

### 视频模式 📺

1. **自动播放课程**
   - 页面加载后，会看到 Remotion Player 和课程内容
   - 点击播放按钮开始学习

2. **交互式 Flashcard**
   - 当视频播放到词汇时，会自动暂停
   - 弹出可点击的闪卡
   - 点击卡片查看翻译
   - 点击 "Show More Details" 展开详细信息
   - 点击 "Continue Lesson" 继续播放

3. **侧边栏导航**
   - 右侧显示所有词汇列表
   - 点击任意词汇跳转到对应时间点
   - ✓ 标记表示已学习的词汇

### 练习模式 ✍️

1. 点击顶部 "✍️ Practice Mode" 按钮

2. **完成练习题**
   - 阅读情境和问题
   - 在文本框输入答案
   - 点击 "💡 Show Hint" 查看提示（可选）
   - 点击 "Submit Answer" 提交
   - 查看标准答案并对比

3. **复习词汇**
   - 滚动到底部查看所有闪卡
   - 点击任意闪卡查看详情
   - 已学习的词汇会有绿色标记

### 进度追踪

底部显示：

- Flashcards: 4/5 (已完成/总数)
- Practices: 2/3 (已完成/总数)
- 进度条可视化

---

## 🔍 故障排除

### 问题 1: 页面显示 "Loading..."

**原因:** 后端未启动或数据加载失败

**解决:**

```bash
# 检查后端是否运行
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY/lesson_1

# 如果失败，检查后端日志
# 确保在项目根目录运行了 npm run start:dev
```

### 问题 2: 闪卡不显示

**原因:** Lesson 数据结构不匹配

**解决:**

```bash
# 检查 flashcards.json 格式
cat videos/henIVlCPVIY/lesson_1/flashcards.json

# 应该包含 "flashcards" 数组
```

### 问题 3: 视频无法播放

**原因:** Remotion Player 配置问题

**解决:**

- 检查浏览器控制台错误
- 确认 `final_synchronized_lesson.json` 存在
- 查看是否有 segmentBasedTiming 数据

### 问题 4: 端口被占用

**错误:** `EADDRINUSE: address already in use :::3001`

**解决:**

```bash
# 找到占用端口的进程
lsof -i :3001

# 杀掉进程
kill -9 <PID>

# 或者修改端口（编辑 vite.config.ts）
server: {
  port: 3002,  // 改为其他端口
}
```

---

## 📊 验证 Lesson 数据完整性

运行以下命令检查你的 lesson 数据：

```bash
# 检查必需文件
ls -lh videos/henIVlCPVIY/lesson_1/

# 验证 JSON 格式
cat videos/henIVlCPVIY/lesson_1/microlesson_script.json | jq .
cat videos/henIVlCPVIY/lesson_1/flashcards.json | jq .
cat videos/henIVlCPVIY/lesson_1/audio_segments.json | jq .
cat videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json | jq .

# 如果没有 jq，安装它
brew install jq  # Mac
```

---

## 🎨 自定义配置

### 修改加载的 Video ID

编辑 `interactive-viewer/src/App.tsx`:

```typescript
// 第 14 行左右
useEffect(() => {
  const loadLesson = async () => {
    try {
      setLoading(true);
      // 修改这里 ↓
      const data = await loadLessonData('henIVlCPVIY', 'lesson_1');
      setLessonData(data);
      setLoading(false);
    } catch (err) {
      // ...
    }
  };
  loadLesson();
}, [setLessonData]);
```

### 添加 Lesson 选择器

创建 `interactive-viewer/src/components/LessonSelector.tsx`:

```typescript
import React, { useState, useEffect } from 'react';

export const LessonSelector: React.FC<{
  videoId: string;
  onSelect: (lessonId: string) => void;
}> = ({ videoId, onSelect }) => {
  const [lessons, setLessons] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/video-transform/lessons/${videoId}`)
      .then((res) => res.json())
      .then((data) => setLessons(data.lessons));
  }, [videoId]);

  return (
    <select onChange={(e) => onSelect(e.target.value)}>
      {lessons.map((lesson) => (
        <option key={lesson} value={lesson}>
          {lesson}
        </option>
      ))}
    </select>
  );
};
```

---

## 🌐 部署到生产环境

### 构建生产版本

```bash
cd interactive-viewer
npm run build

# 输出在 dist/ 目录
ls -lh dist/
```

### 使用 Nginx 部署

```nginx
server {
  listen 80;
  server_name your-domain.com;

  # 前端静态文件
  root /path/to/interactive-viewer/dist;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  # 代理后端 API
  location /api {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  # 视频文件
  location /videos {
    alias /path/to/hyperion/videos;
    autoindex off;
  }
}
```

---

## 📝 快速参考

### 常用命令

```bash
# 启动后端
npm run start:dev

# 启动前端
cd interactive-viewer && npm run dev

# 构建生产版本
cd interactive-viewer && npm run build

# 检查 linter
npm run lint

# 测试 API
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY
```

### API 端点

| 端点                                              | 方法 | 说明         |
| ------------------------------------------------- | ---- | ------------ |
| `/api/video-transform/lessons/:videoId`           | GET  | 获取课程列表 |
| `/api/video-transform/lessons/:videoId/:lessonId` | GET  | 获取课程数据 |

### 文件路径

| 路径                                 | 说明            |
| ------------------------------------ | --------------- |
| `videos/henIVlCPVIY/lesson_1/`       | Lesson 数据目录 |
| `interactive-viewer/src/App.tsx`     | 主应用入口      |
| `interactive-viewer/src/components/` | UI 组件         |
| `interactive-viewer/src/store/`      | 状态管理        |

---

## 🎉 成功！

如果一切正常，你应该能看到：

1. ✅ Interactive Viewer 加载成功
2. ✅ 课程标题和元数据显示
3. ✅ Remotion Player 可以播放
4. ✅ Flashcards 可以点击交互
5. ✅ Practice 练习题可以输入答案
6. ✅ 进度追踪正常工作

**享受你的交互式学习体验！** 🚀

---

## 📚 相关文档

- [快速开始指南](./interactive-viewer/QUICK_START.md)
- [完整使用手册](./interactive-viewer/README.md)
- [实施总结](./IMPLEMENTATION_SUMMARY_CN.md)
- [改造对比](./BEFORE_AFTER_COMPARISON.md)

---

**最后更新:** 2025-10-08  
**适用于:** Interactive Lesson Viewer v1.0.0
