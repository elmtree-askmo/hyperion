# 🔧 故障排除指南

## ❌ 常见错误及解决方案

---

### 错误 1: Backend 启动时出现 JSX 错误

#### 症状

```
interactive-viewer/src/App.tsx:2:30 - error TS6142: Module './components/LessonViewer' was resolved to '...', but '--jsx' is not set.
Cannot use JSX unless the '--jsx' flag is provided.
```

#### 原因

Backend 的 TypeScript 编译器错误地尝试编译 `interactive-viewer/` 目录中的 React 文件。

#### 解决方案 ✅

**已修复！** 在项目根目录的 `tsconfig.json` 中添加了排除规则：

```json
{
  "exclude": ["node_modules", "dist", "remotion", "interactive-viewer"]
}
```

#### 验证修复

```bash
# 重启 backend
npm run start:dev

# 应该只看到 backend 相关的编译输出
# ✓ 不应该有 interactive-viewer 的错误
```

---

### 错误 2: 端口被占用

#### 症状

```
Error: listen EADDRINUSE: address already in use :::3000
Error: listen EADDRINUSE: address already in use :::3001
```

#### 解决方案

**找到并终止占用端口的进程：**

```bash
# 查找占用 3000 端口的进程
lsof -i :3000

# 查找占用 3001 端口的进程
lsof -i :3001

# 终止进程（替换 <PID> 为实际进程ID）
kill -9 <PID>
```

**或者一键清理：**

```bash
# 终止所有 node 进程（谨慎使用）
pkill -f node

# 或者只终止 nest 和 vite
pkill -f "nest start"
pkill -f "vite"
```

---

### 错误 3: Module not found 错误

#### 症状

```
Cannot find module '@remotion/player'
Cannot find module 'framer-motion'
```

#### 解决方案

**安装依赖：**

```bash
# Backend 依赖
npm install

# Frontend 依赖
cd interactive-viewer
npm install
cd ..
```

---

### 错误 4: Lesson 数据无法加载

#### 症状

- 页面显示 "Loading lesson..."
- 或显示 "Failed to load lesson data"

#### 原因

1. Backend 未启动
2. Lesson 文件不存在或格式错误
3. API 路径错误

#### 解决方案

**1. 检查 Backend 是否运行：**

```bash
# 测试 API
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY/lesson_1

# 应该返回 JSON 数据
```

**2. 检查 Lesson 文件：**

```bash
# 确认文件存在
ls -lh videos/henIVlCPVIY/lesson_1/

# 应该有：
# ✓ microlesson_script.json
# ✓ flashcards.json
# ✓ audio_segments.json
# ✓ final_synchronized_lesson.json (推荐)
```

**3. 验证 JSON 格式：**

```bash
# 检查 JSON 是否有效
cat videos/henIVlCPVIY/lesson_1/microlesson_script.json | jq .

# 如果报错，说明 JSON 格式有问题
```

---

### 错误 5: Remotion Player 不显示

#### 症状

- 视频区域是空白的
- 控制台显示 "Composition not found"

#### 原因

1. `segmentBasedTiming` 数据缺失
2. Remotion 组件路径错误
3. Props 数据格式不匹配

#### 解决方案

**1. 检查 `final_synchronized_lesson.json`：**

```bash
cat videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json | jq '.segmentBasedTiming'

# 应该返回一个数组，包含时间轴数据
```

**2. 检查浏览器控制台：**

- 打开浏览器开发者工具 (F12)
- 查看 Console 标签页
- 查找具体错误信息

**3. 验证导入路径：**

```typescript
// interactive-viewer/src/components/LessonViewer.tsx
import { LessonComposition } from '../../../remotion/src/components/LessonComposition';
// ↑ 确保路径正确
```

---

### 错误 6: Flashcards 不显示

#### 症状

- 视频可以播放
- 但没有出现交互式闪卡
- 侧边栏的词汇列表是空的

#### 原因

1. `flashcards.json` 格式错误
2. `segmentBasedTiming` 中缺少 `vocabWord` 字段
3. 单词名称不匹配

#### 解决方案

**1. 检查 flashcards.json 格式：**

```bash
cat videos/henIVlCPVIY/lesson_1/flashcards.json | jq '.flashcards[0]'

# 应该返回类似：
# {
#   "word": "recommend",
#   "thaiTranslation": "แนะนำ",
#   ...
# }
```

**2. 检查 segmentBasedTiming 中的 vocabWord：**

```bash
cat videos/henIVlCPVIY/lesson_1/final_synchronized_lesson.json | jq '.segmentBasedTiming[] | select(.screenElement == "vocabulary_card")'

# 应该有 vocabWord 字段
```

**3. 验证单词匹配：**

```typescript
// 检查 lessonStore.ts 中的匹配逻辑
const timing = data.lesson.segmentBasedTiming.find((seg) => seg.vocabWord === flashcard.word);
```

---

### 错误 7: TypeScript 编译错误

#### 症状

```
error TS2322: Type '...' is not assignable to type '...'
error TS2339: Property '...' does not exist on type '...'
```

#### 解决方案

**1. 清理编译缓存：**

```bash
# Backend
rm -rf dist/
rm -f tsconfig.tsbuildinfo

# Frontend
cd interactive-viewer
rm -rf dist/
rm -f tsconfig.tsbuildinfo
cd ..
```

**2. 重新安装依赖：**

```bash
# Backend
rm -rf node_modules/
npm install

# Frontend
cd interactive-viewer
rm -rf node_modules/
npm install
cd ..
```

**3. 检查 TypeScript 版本：**

```bash
# Backend 应该使用 ~5.1.3
grep typescript package.json

# Frontend 应该使用 ^5.3.3
grep typescript interactive-viewer/package.json
```

---

### 错误 8: CORS 错误

#### 症状

```
Access to fetch at 'http://localhost:3000/api/...' from origin 'http://localhost:3001' has been blocked by CORS policy
```

#### 解决方案

**在 Backend 中启用 CORS：**

```typescript
// src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用 CORS
  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  await app.listen(3000);
}
```

---

### 错误 9: 视频播放卡顿

#### 症状

- 视频播放不流畅
- 动画掉帧
- 响应缓慢

#### 解决方案

**1. 优化浏览器：**

- 使用 Chrome 或 Edge（性能最好）
- 关闭其他标签页
- 禁用不必要的浏览器扩展

**2. 检查系统资源：**

```bash
# Mac
top -l 1 | grep "CPU usage"

# 如果 CPU 使用率 > 80%，关闭其他应用
```

**3. 降低视频质量（如果需要）：**

```typescript
// LessonViewer.tsx
<Player
  compositionWidth={1280}  // 从 1920 降低
  compositionHeight={720}  // 从 1080 降低
  // ...
/>
```

---

## 🛠️ 调试技巧

### 1. 查看后端日志

```bash
# 实时查看
tail -f backend.log

# 或者在终端直接运行（不使用脚本）
npm run start:dev
```

### 2. 查看前端日志

```bash
# 实时查看
tail -f frontend.log

# 或者查看浏览器控制台
# F12 -> Console 标签
```

### 3. 检查网络请求

在浏览器中：

1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 刷新页面
4. 查看所有 API 请求
5. 检查失败的请求（红色）

### 4. 验证数据结构

```bash
# 使用 jq 美化 JSON
cat videos/henIVlCPVIY/lesson_1/microlesson_script.json | jq '.'

# 检查特定字段
cat videos/henIVlCPVIY/lesson_1/microlesson_script.json | jq '.lesson.title'

# 统计数组长度
cat videos/henIVlCPVIY/lesson_1/flashcards.json | jq '.flashcards | length'
```

---

## 🧪 测试清单

运行这些命令来验证一切正常：

```bash
# ✓ 1. 检查文件完整性
ls -lh videos/henIVlCPVIY/lesson_1/

# ✓ 2. 测试 Backend API
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY

# ✓ 3. 测试 lesson 数据加载
curl http://localhost:3000/api/video-transform/lessons/henIVlCPVIY/lesson_1

# ✓ 4. 验证 JSON 格式
cat videos/henIVlCPVIY/lesson_1/microlesson_script.json | jq '.' > /dev/null && echo "✓ Valid JSON"

# ✓ 5. 检查端口占用
lsof -i :3000 && echo "Backend running"
lsof -i :3001 && echo "Frontend running"
```

---

## 📞 获取帮助

如果问题仍然存在：

1. **查看完整日志：**

   ```bash
   cat backend.log
   cat frontend.log
   ```

2. **检查浏览器控制台：**
   - F12 打开开发者工具
   - 查看 Console 和 Network 标签

3. **查看相关文档：**
   - [QUICK_VIEW_GUIDE.md](./QUICK_VIEW_GUIDE.md)
   - [HOW_TO_VIEW_LESSONS.md](./HOW_TO_VIEW_LESSONS.md)
   - [IMPLEMENTATION_SUMMARY_CN.md](./IMPLEMENTATION_SUMMARY_CN.md)

4. **尝试完全重启：**

   ```bash
   # 清理所有进程
   pkill -f node

   # 清理编译产物
   rm -rf dist/ interactive-viewer/dist/

   # 重新启动
   ./view-lesson.sh henIVlCPVIY lesson_1
   ```

---

## ✅ 预防措施

为避免未来出现问题：

1. **定期更新依赖：**

   ```bash
   npm update
   cd interactive-viewer && npm update
   ```

2. **保持代码同步：**

   ```bash
   git pull origin develop
   npm install
   cd interactive-viewer && npm install
   ```

3. **备份重要数据：**

   ```bash
   # 备份 lesson 数据
   cp -r videos/ videos_backup/
   ```

4. **使用版本控制：**
   ```bash
   # 提交前测试
   npm run start:dev
   cd interactive-viewer && npm run dev
   ```

---

**最后更新:** 2025-10-08  
**适用版本:** Interactive Viewer v1.0.0
