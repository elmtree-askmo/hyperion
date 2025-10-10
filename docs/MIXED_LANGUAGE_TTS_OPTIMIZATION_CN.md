# 混合语言 TTS 优化说明

## 概述

优化了 `audio_segments.json` 的生成，支持将泰文和英文分开处理，对英文部分使用较慢的语速，提升英语学习体验。

## 解决的问题

之前音频片段中泰文和英文混在一起，无法：

- 对英文和泰文应用不同的语速
- 为学习者提供更慢、更清晰的英文发音
- 同时保持泰文讲解的自然语速

## 实现方案

1. 将泰文和英文文本分离成独立的部分（textParts）
2. 为每个部分生成独立的音频文件，应用适当的语速
3. 使用 ffmpeg 将音频文件无缝合并
4. 所有部分都使用同一个高质量语音（th-TH-Chirp3-HD-Achird）

## 主要改动

### 1. 数据结构更新

新增了 `TextPart` 接口和 `AudioSegment.textParts` 字段：

```typescript
interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number; // 默认: th=1.0, en=0.8
}
```

### 2. LLM 提示词更新

更新了 `audio-segments.service.ts` 中的 prompt，让 LLM 同时生成 `text` 和 `textParts`。

示例输出：

```json
{
  "text": "คำศัพท์: restaurant — ร้านอาหาร",
  "textParts": [
    { "text": "คำศัพท์: ", "language": "th" },
    { "text": "restaurant", "language": "en", "speakingRate": 0.8 },
    { "text": " — ร้านอาหาร", "language": "th" }
  ]
}
```

### 3. TTS 服务增强

在 `tts-audio-segments.service.ts` 中新增：

- `generateTtsAudioWithParts()` - 处理多部分文本并生成音频
- `mergeAudioFiles()` - 使用 ffmpeg 合并音频文件

## 技术参数

- **语音**: th-TH-Chirp3-HD-Achird（泰文和英文都用同一个）
- **格式**: WAV LINEAR16, 24000 Hz
- **泰文语速**: 1.0（正常）
- **英文语速**: 0.8（慢 25%，更清晰）

## 优势

1. ✅ **更好的学习体验** - 英文发音更慢更清晰，便于学习和跟读
2. ✅ **自然的泰文讲解** - 泰文保持正常语速
3. ✅ **无缝音频** - 同一个语音保证过渡自然流畅
4. ✅ **向后兼容** - 旧的 audio_segments.json 仍然可用
5. ✅ **高质量** - 无重新编码，无质量损失

## 使用方法

### 重新生成音频片段

删除旧文件并重新生成即可：

```bash
# 删除现有的音频片段文件
rm videos/henIVlCPVIY/lesson_1/audio_segments.json
rm videos/henIVlCPVIY/lesson_1/lesson_segments/*.wav
rm videos/henIVlCPVIY/lesson_1/lesson_segments/timing-metadata.json

# 通过 API 或服务重新生成
# LLM 会自动生成新的 textParts 结构
```

### 测试

运行测试脚本验证混合语言 TTS：

```bash
npm run build
node dist/scripts/test-mixed-language-tts.js
```

测试文件会生成在 `audios/test-mixed-language/` 目录。

## 音频生成流程

1. LLM 生成包含 `textParts` 的 audio_segments.json
2. TTS 服务检测到 `textParts` 字段
3. 为每个 part 生成临时音频文件（`segment_id_part_0.wav` 等）
4. 使用 ffmpeg 合并所有临时文件
5. 删除临时文件，保留最终的合并音频
6. 计算总时长并保存到 timing-metadata.json

## 示例片段结构

```json
{
  "id": "vocab_restaurant",
  "text": "คำศัพท์: restaurant — ร้านอาหาร ใช้เมื่อพูดถึงสถานที่กินข้าว เช่น Let's go to a Japanese restaurant near Siam",
  "textParts": [
    { "text": "คำศัพท์: ", "language": "th" },
    { "text": "restaurant", "language": "en", "speakingRate": 0.8 },
    { "text": " — ร้านอาหาร ใช้เมื่อพูดถึงสถานที่กินข้าว เช่น ", "language": "th" },
    { "text": "Let's go to a Japanese restaurant near Siam", "language": "en", "speakingRate": 0.8 }
  ],
  "screenElement": "vocabulary_card",
  "vocabWord": "restaurant"
}
```

## 相关文件

- `src/video-transform/dto/audio-segments.dto.ts` - 数据结构定义
- `src/video-transform/types/lesson-data.types.ts` - 类型定义
- `src/video-transform/services/audio-segments.service.ts` - LLM 生成服务
- `src/video-transform/services/tts-audio-segments.service.ts` - TTS 合成和合并服务
- `scripts/test-mixed-language-tts.ts` - 测试脚本
- `docs/MIXED_LANGUAGE_TTS_OPTIMIZATION.md` - 详细英文文档

## 注意事项

1. 需要确保 ffmpeg 已安装并可访问
2. 多部分生成会调用多次 TTS API，生成时间会稍长
3. 保持 `text` 字段用于显示和向后兼容
4. `textParts` 的内容必须与 `text` 字段一致
