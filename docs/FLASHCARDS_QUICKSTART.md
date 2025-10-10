# Flashcards Feature - Quick Start Guide

## 🎯 概述

Flashcards功能已成功集成到Hyperion视频转换系统中。该功能会自动为每个课程生成包含泰语发音、翻译和记忆技巧的词汇闪卡。

## ✅ 已完成的功能

### 1. 核心服务

- ✅ `FlashcardsService` - 完整的闪卡生成服务
- ✅ LLM集成（OpenAI/Groq/OpenRouter）
- ✅ 自动文件保存和缓存
- ✅ 错误处理和后备机制

### 2. 自动化集成

- ✅ 集成到视频处理流程中
- ✅ 每个课程自动生成闪卡
- ✅ 失败时优雅降级（不影响其他步骤）

### 3. 测试和文档

- ✅ 完整的测试脚本
- ✅ 详细的API文档
- ✅ 使用指南和故障排查

## 🚀 快速开始

### 1. 环境配置

确保 `.env` 文件中配置了LLM API密钥：

```bash
# 选择一个LLM提供商
LLM_PROVIDER=openai  # 或 'groq' 或 'openrouter'

# 添加对应的API密钥
OPENAI_API_KEY=your-openai-api-key
# 或
GROQ_API_KEY=your-groq-api-key
# 或
OPENROUTER_API_KEY=your-openrouter-api-key
```

### 2. 安装依赖

所有依赖已包含在现有的 `package.json` 中：

```bash
npm install
```

### 3. 运行测试

```bash
# 构建项目
npm run build

# 运行flashcards测试
node dist/scripts/test-flashcards-service.js

# 或使用 ts-node
npx ts-node scripts/test-flashcards-service.ts
```

## 📝 使用方法

### 方法1：自动生成（推荐）

闪卡会在视频处理流程中自动生成。只需创建和启动video job：

```bash
# 1. 创建video job
POST /video-transform
{
  "youtubeUrl": "https://www.youtube.com/watch?v=VIDEO_ID",
  "targetAudience": "Thai college students",
  "targetSegmentDuration": 300
}

# 2. 启动处理
POST /video-transform/:jobId/start

# 处理完成后，flashcards会自动保存在：
# videos/{videoId}/lesson_{number}/flashcards.json
```

### 方法2：代码中使用

```typescript
import { FlashcardsService } from './services/flashcards.service';

// 注入服务
constructor(private flashcardsService: FlashcardsService) {}

// 生成闪卡
const flashcards = await this.flashcardsService.generateFlashcards(
  'henIVlCPVIY',  // videoId
  1               // lessonNumber
);

console.log(`Generated ${flashcards.length} flashcards`);
```

## 📊 输出示例

生成的闪卡保存在 `videos/{videoId}/lesson_{number}/flashcards.json`:

```json
{
  "flashcards": [
    {
      "word": "recommend",
      "definition": "to suggest that someone or something would be good or suitable for a particular purpose",
      "thaiDefinition": "แนะนำหรือบอกให้คนอื่นรู้ว่าสิ่งใดดีหรือเหมาะสมสำหรับวัตถุประสงค์เฉพาะ",
      "thaiTranslation": "แนะนำ",
      "pronunciation": "เรค-คอม-เมนด์",
      "phonetic": "/ˌrekəˈmend/",
      "memoryHook": "จำด้วยเสียง เร-คอม-เมนด์ คล้ายคำที่คนไทยพูดว่า 'เรคอมเมนต์' เวลาโพสต์ถามเพื่อน",
      "contextExample": "Can you recommend a good phone? I need this at Central World. - ขอแนะนำโทรศัพท์ที่ Central World",
      "partOfSpeech": "verb",
      "difficulty": "medium"
    }
  ]
}
```

## 🔍 处理流程

视频处理时，flashcards生成的位置：

```
1. YouTube metadata extraction
2. Transcript download
3. Content analysis
4. Microlesson script generation
   ↓
   For each episode:
   4.1 Audio segments generation
   4.2 TTS audio generation
   4.3 Synchronized lesson creation
   → 4.4 Flashcards generation ← 新增！
   4.5 Image generation
```

## 🛠️ 文件结构

```
src/video-transform/
├── services/
│   ├── flashcards.service.ts          ← 核心服务
│   └── FLASHCARDS.md                  ← 详细文档
├── video-transform.module.ts          ← 已添加FlashcardsService
├── video-transform.controller.ts      ← 无需单独API端点
└── video-transform.service.ts         ← 已集成到处理流程

scripts/
├── test-flashcards-service.ts         ← 测试脚本
└── README.md                          ← 已更新

videos/
└── {videoId}/
    └── lesson_{number}/
        ├── microlesson_script.json    (输入)
        └── flashcards.json            (输出) ← 新增！

FLASHCARDS_IMPLEMENTATION.md           ← 完整实现文档
FLASHCARDS_QUICKSTART.md              ← 本文档
```

## ⚡ 特性亮点

### 1. LLM驱动

- 使用先进的LLM生成高质量内容
- 创造性的记忆技巧
- 贴近泰国文化的例句

### 2. 泰语发音

- 泰文音标（如：เรค-คอม-เมนด์）
- IPA音标（如：/ˌrekəˈmend/）
- 适合泰国学习者的发音指导

### 3. 文化相关

- 使用真实的泰国地点（BTS, Central World, TRUE Coffee等）
- 贴近大学生日常场景
- 本地化的学习情境

### 4. 智能分类

- 词性标注（noun, verb, adjective等）
- 难度分级（easy, medium, hard）
- 基于泰国学习者视角评估

### 5. 可靠性

- 自动重试机制
- 后备方案（LLM失败时）
- 文件缓存避免重复生成

## 🐛 故障排查

### 问题1：LLM API错误

```
❌ Flashcard generation failed: API key not found
```

**解决方案**：检查 `.env` 文件中的API密钥配置

### 问题2：找不到课程数据

```
❌ Microlesson script not found for lesson 1
```

**解决方案**：确保先运行完整的视频处理流程，生成microlesson_script.json

### 问题3：速率限制

```
❌ Rate limit exceeded
```

**解决方案**：等待片刻后重试，或升级API计划

### 问题4：JSON解析失败

```
⚠️  Failed to parse LLM flashcards response
```

**解决方案**：服务会自动使用后备方案，生成基础版闪卡

## 📚 更多资源

- 📖 [完整实现文档](./FLASHCARDS_IMPLEMENTATION.md)
- 🔧 [服务API文档](./src/video-transform/services/FLASHCARDS.md)
- 🧪 [测试脚本指南](./scripts/README.md)

## 🎓 示例项目

现有的测试数据可以用来验证功能：

```bash
videoId: henIVlCPVIY
lessons: 1, 2, 3
```

运行测试查看完整示例：

```bash
npx ts-node scripts/test-flashcards-service.ts
```

## ✨ 下一步

1. **验证功能**：运行测试脚本确认一切正常
2. **查看输出**：检查生成的 `flashcards.json` 文件
3. **测试API**：使用Postman或curl测试API端点
4. **集成前端**：将闪卡数据展示给用户
5. **收集反馈**：根据实际使用情况优化

## 🤝 贡献

如需增强功能或报告问题，请联系开发团队。

---

**版本**: 1.0.0  
**更新日期**: 2025-10-07  
**状态**: ✅ 生产就绪
