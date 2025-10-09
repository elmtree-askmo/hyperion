# Flashcard Mode - Quick Start Guide

## 🚀 如何使用新的 Flashcard Mode

### 启动步骤

1. **启动交互式查看器**

   ```bash
   cd interactive-viewer
   npm run dev
   ```

2. **打开浏览器**
   - 访问 `http://localhost:5173`
   - 选择一个课程（例如：henIVlCPVIY - Lesson 1）

3. **切换到 Flashcard Mode**
   - 点击顶部的 **📚 Flashcard Mode** 按钮（位于中间）

### 功能说明

#### 三种模式

```
📺 Video Mode      →  观看视频，词汇会在适当时机弹出
📚 Flashcard Mode  →  专注复习所有词汇卡片（NEW！）
✍️ Practice Mode   →  完成练习题，测试理解程度
```

#### Flashcard Mode 特点

**页面布局：**

- 📊 **顶部统计栏**：显示总卡片数和已掌握数量
- 🎴 **网格布局**：所有词汇卡片以网格形式展示
- 📈 **底部进度条**：实时显示学习进度

**卡片交互：**

1. **初始状态**：卡片显示锁定图标 🔒
2. **点击解锁**：显示英文单词、发音、音标
3. **再次点击**：翻转显示泰语翻译和释义
4. **点击 "Show More Details"**：查看记忆技巧和例句

**自动进度追踪：**

- ✅ 解锁的卡片自动标记为"已掌握"
- 📊 统计数据实时更新
- 💾 进度在所有模式间共享

### 示例截图布局

```
┌─────────────────────────────────────────────────────┐
│  📚 Review Vocabulary                               │
│                                                     │
│  Review and memorize all vocabulary from this      │
│  lesson. Click each card to reveal the word and    │
│  flip to see the translation.                      │
│                                                     │
│  Total Cards: 3  •  Mastered: 1                    │
└─────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  📚 Vocabulary   │  │  📚 Vocabulary   │  │  📚 Vocabulary   │
│                  │  │  👆 Click to flip│  │                  │
│  recommend       │  │                  │  │      🔒          │
│  [rek-kəm-mend] │  │  vegetarian      │  │  Click to unlock │
│  /ˌrek.əˈmend/  │  │  [vej-i-ter-ian]│  │                  │
│                  │  │  /ˌvɛdʒɪˈtɛriən/│  │                  │
│  ▼ Show Details  │  │  ▼ Show Details  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘

────────────────────────────────────────────────────────
Flashcards: 1 / 3
█████████████████░░░░░░░░░░░░░░░░░░░░░░░░░ 33%
```

### 响应式设计

**桌面（> 1024px）：**

- 网格显示 2 列
- 每张卡片最大宽度 600px

**平板（768px - 1024px）：**

- 网格显示 1 列
- 卡片全宽显示

**手机（< 768px）：**

- 单列布局
- 模式按钮垂直堆叠
- 卡片和按钮全宽

### 进度条说明

**Flashcard Mode：**

- 只显示 Flashcard 进度
- 格式：`Flashcards: X / Y`
- 进度条：已掌握卡片的百分比

**Practice Mode：**

- 只显示 Practice 进度
- 格式：`Practices: X / Y`
- 进度条：已完成练习的百分比

**Video Mode：**

- 不显示进度条
- 使用侧边栏显示词汇列表

### 与其他模式的切换

**从 Video Mode 切换：**

- 想要专注复习词汇时
- 视频看完后集中记忆
- 预习即将学习的单词

**切换到 Practice Mode：**

- 完成词汇复习后
- 想要通过练习巩固
- 测试理解程度

### 最佳实践

1. **预习**：看视频前先在 Flashcard Mode 浏览所有词汇
2. **观看**：Video Mode 观看课程，遇到词汇时主动思考
3. **复习**：视频结束后返回 Flashcard Mode 集中复习
4. **测试**：在 Practice Mode 完成练习题，检验理解
5. **循环**：定期返回 Flashcard Mode 复习巩固记忆

### 快捷键（计划中）

未来版本将支持：

- `←` `→`：切换卡片
- `Space`：翻转卡片
- `1` `2` `3`：切换模式

### 故障排除

**问题：卡片显示为窄条**

- 这个问题已在最新版本修复
- 确保使用了最新的 CSS 样式

**问题：进度不保存**

- 进度存储在浏览器本地
- 清除缓存会重置进度
- 未来版本将支持云同步

**问题：卡片不翻转**

- 确保已经点击解锁（第一次点击）
- 第二次点击才会翻转
- 检查浏览器控制台是否有错误

### 技术细节

**文件位置：**

- 组件：`interactive-viewer/src/components/LessonViewer.tsx`
- 样式：`interactive-viewer/src/components/LessonViewer.css`
- 卡片：`interactive-viewer/src/components/InteractiveFlashcard.tsx`

**数据来源：**

- 从 `final_synchronized_lesson.json` 读取词汇
- 使用 `flashcards.json` 的详细信息
- 进度保存在 `useLessonStore`

### 开发测试

**启动开发服务器：**

```bash
cd interactive-viewer
npm run dev
```

**检查控制台：**

```javascript
// 在浏览器控制台查看状态
localStorage.getItem('lesson-store');
```

**查看网络请求：**

- 打开开发者工具 → Network
- 确认 flashcards.json 加载成功

## 🎉 享受学习！

Flashcard Mode 让词汇学习更加专注和高效。祝你学习愉快！
