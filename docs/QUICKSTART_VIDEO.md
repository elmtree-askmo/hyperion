# 视频生成快速入门指南

## 🎬 Remotion 视频生成系统已就绪！

系统已完整配置，可以生成高质量的教育视频。

## ⚡ 快速生成第一个视频

### 方法 1: 使用测试脚本（最简单）

```bash
npm run test:video
```

这将为 `henIVlCPVIY/lesson_1` 生成视频。

### 方法 2: 使用 API

1. 启动服务器：

```bash
npm run start:dev
```

2. 调用 API（需要先登录获取 JWT token）：

```bash
curl -X POST http://localhost:3000/video-transform/generate-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lessonPath": "henIVlCPVIY/lesson_1",
    "outputFileName": "my_first_video.mp4"
  }'
```

### 方法 3: 预览模式（开发调试）

实时预览视频，支持热重载：

```bash
npm run remotion:preview
```

浏览器会自动打开，显示视频预览界面。

## 📁 系统已创建的文件

### Remotion 项目结构

```
remotion/
├── src/
│   ├── components/
│   │   ├── TitleCard.tsx          ✅ 标题卡组件
│   │   ├── VocabularyCard.tsx     ✅ 词汇卡组件
│   │   ├── GrammarCard.tsx        ✅ 语法卡组件
│   │   ├── ObjectiveCard.tsx      ✅ 目标卡组件
│   │   ├── PracticeCard.tsx       ✅ 练习卡组件
│   │   ├── OutroCard.tsx          ✅ 结束卡组件
│   │   └── LessonComposition.tsx  ✅ 主合成组件
│   ├── styles/
│   │   └── theme.ts               ✅ 主题和样式配置
│   ├── utils/
│   │   └── animation.ts           ✅ 动画工具函数
│   ├── Root.tsx                   ✅ Remotion 根组件
│   └── index.ts                   ✅ 入口文件
├── remotion.config.ts             ✅ Remotion 配置
├── tsconfig.json                  ✅ TypeScript 配置
├── package.json                   ✅ 依赖配置
└── README.md                      ✅ 英文文档
```

### NestJS 集成

```
src/video-transform/
├── services/
│   └── remotion-video.service.ts  ✅ 视频生成服务
├── types/
│   └── lesson-data.types.ts       ✅ TypeScript 类型定义
├── dto/
│   └── generate-video.dto.ts      ✅ API DTO
├── video-transform.controller.ts  ✅ 已添加新 endpoint
└── video-transform.module.ts      ✅ 已注册服务
```

### 文档

```
├── REMOTION_USAGE.md              ✅ 完整使用文档（中文）
├── remotion/README.md             ✅ Remotion 文档（英文）
└── QUICKSTART_VIDEO.md            ✅ 本快速入门指南
```

### 测试脚本

```
scripts/
└── test-video-generation.ts       ✅ 视频生成测试脚本
```

## 🎯 视频规格

| 项目     | 值               |
| -------- | ---------------- |
| 分辨率   | 1080x1920 (9:16) |
| 帧率     | 30 FPS           |
| 编码     | H.264            |
| 音频     | AAC 128kbps      |
| 时长     | ~5 分钟          |
| 目标大小 | < 50MB           |

## 🎨 功能特性

### ✨ 动画效果

- ✅ 平滑的滑入/滑出动画
- ✅ 渐入渐出效果
- ✅ 缩放动画
- ✅ 词级高亮（用于练习部分）
- ✅ 弹簧物理动画

### 📋 内容组件

- ✅ **标题卡**: 课程标题 + 集数信息
- ✅ **词汇卡**: 单词 + 发音 + 定义 + 记忆技巧
- ✅ **语法卡**: 语法结构 + 例句
- ✅ **目标卡**: 学习目标说明
- ✅ **练习卡**: 互动练习 + 词级高亮
- ✅ **结束卡**: 总结 + 下一课预告

### 🎵 音频同步

- ✅ 自动音频同步
- ✅ 词级时序支持
- ✅ 多音频片段拼接

### 🎨 视觉设计

- ✅ 移动优化（9:16 纵向）
- ✅ 现代化 UI 设计
- ✅ 泰语字体支持
- ✅ 可自定义主题颜色

## 📊 输入数据格式

系统使用以下 JSON 文件作为输入：

1. **final_synchronized_lesson.json** - 时序信息
2. **microlesson_script.json** - 课程内容
3. **flashcards.json** - 词汇卡数据
4. **audio_segments.json** - 音频元数据

示例数据已存在于: `videos/henIVlCPVIY/lesson_1/`

## 🚀 下一步操作

### 1. 生成测试视频

```bash
npm run test:video
```

### 2. 查看生成的视频

输出路径: `videos/henIVlCPVIY/lesson_1/test_final_video.mp4`

### 3. 自定义主题

编辑: `remotion/src/styles/theme.ts`

### 4. 修改组件

编辑: `remotion/src/components/*.tsx`

### 5. 调试动画

```bash
npm run remotion:preview
```

## 🔧 常用命令

```bash
# 预览视频（开发模式）
npm run remotion:preview

# 生成测试视频
npm run test:video

# 启动后端服务
npm run start:dev

# 构建项目
npm run build
```

## 📝 API 使用示例

### 生成视频

```javascript
// POST /video-transform/generate-video
const response = await fetch('http://localhost:3000/video-transform/generate-video', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_JWT_TOKEN',
  },
  body: JSON.stringify({
    lessonPath: 'henIVlCPVIY/lesson_1',
    outputFileName: 'final_video.mp4',
  }),
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   outputPath: 'videos/henIVlCPVIY/lesson_1/final_video.mp4'
// }
```

## 🎬 视频内容流程

1. **标题卡** (0-18s)
   - 课程标题（英文 + 泰文）
   - 集数信息
   - 动画入场效果

2. **学习目标** (18-51s)
   - 两个主要学习目标
   - 清晰的说明文本

3. **词汇部分** (51-148s)
   - 8个关键词汇
   - 每个词汇包含：发音、定义、记忆技巧

4. **语法要点** (148-205s)
   - 3个主要语法结构
   - 实用例句

5. **练习环节** (205-258s)
   - 3个实践场景
   - 词级高亮效果

6. **总结** (258-273s)
   - 课程回顾
   - 下一课预告

## 💡 技巧和最佳实践

### 性能优化

- 使用静态文件路径
- 压缩图片和音频
- 简化复杂动画

### 内容创建

- 保持文本简洁
- 使用一致的字体大小
- 确保音频质量

### 调试

- 使用预览模式实时查看
- 检查控制台日志
- 验证 JSON 数据结构

## 🆘 遇到问题？

### 常见问题解决

1. **视频生成失败**
   - 检查 JSON 文件是否完整
   - 验证音频文件路径
   - 查看错误日志

2. **音频不同步**
   - 检查 final_synchronized_lesson.json 时序
   - 验证音频文件时长
   - 确认 FPS 设置正确

3. **渲染速度慢**
   - 减少并发数
   - 简化动画效果
   - 使用更快的机器

### 获取帮助

- 查看完整文档: `REMOTION_USAGE.md`
- Remotion 官方文档: https://www.remotion.dev/docs
- 查看示例数据: `videos/henIVlCPVIY/lesson_1/`

## ✅ 系统状态

- ✅ Remotion 已安装并配置
- ✅ 所有组件已创建
- ✅ NestJS 服务已集成
- ✅ API 端点已添加
- ✅ 类型定义已创建
- ✅ 测试脚本已准备
- ✅ 文档已完成

## 🎉 准备就绪！

现在你可以开始生成精美的教育视频了！

运行以下命令开始：

```bash
npm run test:video
```

Good luck! 🚀
