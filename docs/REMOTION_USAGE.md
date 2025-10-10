# Remotion 视频生成系统使用指南

## 概述

这个系统使用 Remotion.dev 生成教育类微课视频，包含同步动画、背景图片、排版和词级对话时序。

## 技术规格

| 规格     | 值                   | 说明             |
| -------- | -------------------- | ---------------- |
| 宽高比   | 9:16 (1080x1920px)   | 针对移动设备优化 |
| 时长     | 5分钟 (300秒)        | 微学习最佳时长   |
| 帧率     | 30 FPS               | 流畅动画效果     |
| 格式     | MP4 (H.264)          | 通用兼容性       |
| 文件大小 | < 50MB               | 快速移动网络加载 |
| 音频     | 44.1kHz, 128kbps AAC | 高质量语音压缩   |

## 内容结构

1. **标题卡** (5-10秒): 课程标题和系列上下文
2. **词汇部分** (60-90秒): 5-7个关键词，带定义和例句
3. **对话练习** (120-180秒): 真实对话，词级时序
4. **语法要点** (30-60秒): 关键结构和泰语解释
5. **文化背景** (30-45秒): 西方商务/社交背景
6. **回顾总结** (15-30秒): 关键要点和下节预览

## 快速开始

### 1. 环境准备

确保已安装所有依赖：

```bash
cd /Users/cpuser/Cherrypicks/Source/elmtree-askmo/hyperion
npm install
```

### 2. 预览视频（开发模式）

在浏览器中预览视频，支持热重载：

```bash
npm run remotion:preview
```

这会打开浏览器窗口，显示视频合成预览。

### 3. 通过 API 生成视频

启动 NestJS 服务器：

```bash
npm run start:dev
```

然后调用 API：

```bash
curl -X POST http://localhost:3000/video-transform/generate-video \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "lessonPath": "henIVlCPVIY/lesson_1",
    "outputFileName": "final_video.mp4"
  }'
```

### 4. 通过测试脚本生成

直接运行测试脚本：

```bash
npm run test:video
```

## 数据文件要求

每个 lesson 文件夹需要包含以下 JSON 文件：

### 1. final_synchronized_lesson.json

包含所有片段的时序信息：

```json
{
  "lesson": {
    "segmentBasedTiming": [
      {
        "startTime": 0,
        "endTime": 18.08,
        "duration": 18.08,
        "screenElement": "title_card",
        "audioUrl": "/videos/lesson_1/lesson_segments/intro.wav",
        "text": "课程介绍文本",
        "vocabWord": "optional"
      }
    ]
  },
  "audioUrl": "synchronized_audio.mp3"
}
```

**screenElement 类型：**

- `title_card`: 标题卡
- `objective_card`: 学习目标卡
- `vocabulary_card`: 词汇卡
- `grammar_card`: 语法卡
- `practice_card`: 练习卡
- `outro_card`: 结束卡

### 2. microlesson_script.json

课程元数据和内容：

```json
{
  "lesson": {
    "title": "Service Industry Essentials: Hotels & Restaurants",
    "titleTh": "พื้นฐานอุตสาหกรรมบริการ",
    "duration": 600,
    "learningObjectives": [...],
    "keyVocabulary": [...],
    "grammarPoints": [...]
  },
  "seriesInfo": {
    "seriesTitle": "Practical English for Everyday Situations",
    "seriesTitleTh": "英语实用情境",
    "episodeNumber": 1,
    "totalEpisodes": 3,
    "description": "..."
  }
}
```

### 3. flashcards.json

词汇卡片数据：

```json
{
  "flashcards": [
    {
      "word": "recommend",
      "definition": "to suggest something as good or suitable",
      "thaiDefinition": "การเสนอให้ผู้อื่นลอง...",
      "thaiTranslation": "แนะนำ",
      "pronunciation": "เรค-คอม-เมนด์",
      "phonetic": "/ˌrek.əˈmend/",
      "memoryHook": "记忆技巧...",
      "contextExample": "使用例句...",
      "partOfSpeech": "verb",
      "difficulty": "medium"
    }
  ]
}
```

### 4. audio_segments.json

音频片段元数据：

```json
{
  "audioSegments": [
    {
      "id": "intro",
      "text": "音频文本",
      "description": "片段描述",
      "screenElement": "title_card",
      "visualDescription": "视觉描述",
      "backgroundImageDescription": "背景图描述"
    }
  ]
}
```

## 组件说明

### TitleCard（标题卡）

显示课程标题、集数信息，带渐入和缩放动画。

**Props:**

- `title`: 英文标题
- `titleTh`: 泰文标题
- `episodeNumber`: 集数
- `totalEpisodes`: 总集数
- `audioUrl`: 音频文件路径（可选）
- `backgroundImage`: 背景图片路径（可选）

### VocabularyCard（词汇卡）

展示单词、发音、定义和记忆技巧。

**Props:**

- `word`: 单词
- `thaiTranslation`: 泰语翻译
- `pronunciation`: 发音
- `definition`: 英文定义
- `thaiDefinition`: 泰语定义
- `memoryHook`: 记忆技巧
- `contextExample`: 上下文例句
- `audioUrl`: 音频文件路径（可选）

### GrammarCard（语法卡）

显示语法结构和例句。

**Props:**

- `text`: 语法说明文本
- `examples`: 例句数组（可选）
- `audioUrl`: 音频文件路径（可选）

### PracticeCard（练习卡）

显示练习文本，带词级高亮效果。

**Props:**

- `text`: 练习文本
- `durationInFrames`: 持续帧数（可选）
- `audioUrl`: 音频文件路径（可选）

### ObjectiveCard（目标卡）

展示学习目标。

**Props:**

- `text`: 目标文本
- `audioUrl`: 音频文件路径（可选）

### OutroCard（结束卡）

课程总结和下一课预告。

**Props:**

- `text`: 总结文本
- `episodeNumber`: 当前集数
- `totalEpisodes`: 总集数
- `audioUrl`: 音频文件路径（可选）

## 动画效果

系统包含以下动画工具（`remotion/src/utils/animation.ts`）：

### useSlideIn

平滑滑入动画，使用弹簧物理效果。

```typescript
const slideIn = useSlideIn(delay);
// Returns 0 to 1 progress value
```

### useFadeIn

渐入动画。

```typescript
const fadeIn = useFadeIn(delay, duration);
// Returns 0 to 1 opacity value
```

### useScaleIn

缩放动画。

```typescript
const scale = useScaleIn(delay);
// Returns 0.8 to 1 scale value
```

### useWordHighlight

词级高亮动画，用于练习卡。

```typescript
const { isActive, opacity } = useWordHighlight(wordIndex, totalWords, durationInFrames);
```

## 主题定制

编辑 `remotion/src/styles/theme.ts` 来自定义样式：

```typescript
export const theme = {
  colors: {
    primary: '#FF6B6B', // 主色
    secondary: '#4ECDC4', // 次要色
    accent: '#FFE66D', // 强调色
    background: '#1A1A2E', // 背景色
    text: '#FFFFFF', // 文本色
  },
  fonts: {
    primary: 'Noto Sans Thai, Inter, sans-serif',
    heading: 'Sarabun, Inter, sans-serif',
  },
  spacing: {
    xs: 8,
    sm: 16,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
};
```

## 视频配置

在 `remotion/remotion.config.ts` 中配置：

```typescript
import { Config } from '@remotion/cli/config';

Config.setConcurrency(1); // 并发渲染数
Config.setVideoImageFormat('png'); // 图片格式
Config.setOverwriteOutput(true); // 覆盖已存在文件
```

## API 端点

### POST /video-transform/generate-video

生成视频。

**请求体：**

```json
{
  "lessonPath": "henIVlCPVIY/lesson_1",
  "outputFileName": "final_video.mp4"
}
```

**响应：**

```json
{
  "success": true,
  "outputPath": "videos/henIVlCPVIY/lesson_1/final_video.mp4",
  "error": null
}
```

## 故障排除

### 问题：音频不播放

**解决方案：**

1. 确认音频文件存在于指定路径
2. 检查音频格式（推荐 WAV）
3. 验证文件权限

### 问题：视频生成失败

**解决方案：**

1. 检查所有必需的 JSON 文件是否存在
2. 验证 JSON 结构是否正确
3. 查看控制台日志获取具体错误

### 问题：渲染速度慢

**解决方案：**

1. 减少视频时长
2. 简化动画效果
3. 增加并发数：
   ```typescript
   Config.setConcurrency(2);
   ```

## 性能优化建议

1. **使用静态文件**: 将音频/图片放在 `public` 文件夹
2. **优化图片**: 压缩图片后再使用
3. **限制动画复杂度**: 简单动画渲染更快
4. **利用缓存**: Remotion 自动缓存帧

## 开发工作流

### 1. 开发新组件

```bash
# 在 remotion/src/components/ 创建新组件
# 在 LessonComposition.tsx 中集成
npm run remotion:preview  # 实时预览
```

### 2. 调试动画

```bash
npm run remotion:preview
# 调整动画参数，实时查看效果
```

### 3. 测试完整流程

```bash
npm run test:video
# 检查生成的视频文件
```

## 文件结构

```
hyperion/
├── remotion/                        # Remotion 项目
│   ├── src/
│   │   ├── components/             # 视频组件
│   │   ├── styles/                 # 主题样式
│   │   ├── utils/                  # 工具函数
│   │   ├── Root.tsx               # Remotion 根
│   │   └── index.ts               # 入口点
│   ├── remotion.config.ts         # Remotion 配置
│   ├── tsconfig.json              # TypeScript 配置
│   └── README.md                  # 英文文档
├── src/video-transform/
│   ├── services/
│   │   └── remotion-video.service.ts  # 视频生成服务
│   ├── types/
│   │   └── lesson-data.types.ts      # 类型定义
│   └── dto/
│       └── generate-video.dto.ts     # DTO 定义
├── videos/                         # 视频数据目录
│   └── henIVlCPVIY/
│       └── lesson_1/
│           ├── final_synchronized_lesson.json
│           ├── microlesson_script.json
│           ├── flashcards.json
│           └── audio_segments.json
└── REMOTION_USAGE.md              # 本文档
```

## 未来增强

- [ ] 实时进度跟踪
- [ ] AI 生成背景图片
- [ ] 对话角色动画
- [ ] 视频内交互式问答
- [ ] 多语言支持
- [ ] Remotion Lambda 云端渲染

## 参考资源

- [Remotion 官方文档](https://www.remotion.dev/docs)
- [Remotion 示例](https://www.remotion.dev/showcase)
- [React 文档](https://react.dev)

## 常见问题

### Q: 如何更改视频分辨率？

A: 编辑 `remotion/src/styles/theme.ts` 中的 `VIDEO_CONFIG`:

```typescript
export const VIDEO_CONFIG = {
  width: 1080,
  height: 1920,
  fps: 30,
};
```

### Q: 如何添加自定义字体？

A: 在 `theme.ts` 中更新字体配置，并确保字体已安装或通过 Google Fonts 加载。

### Q: 视频文件太大怎么办？

A: 调整编码参数：

```bash
npx remotion render Lesson output.mp4 \
  --crf 28 \                    # 提高 CRF 值（降低质量）
  --video-bitrate 3000000       # 降低比特率
```

### Q: 如何批量生成多个视频？

A: 创建批处理脚本循环调用 API 或服务。

## 许可证

MIT
