import { Injectable } from '@nestjs/common';

interface SceneAnalysis {
  sceneName: string;
  confidence: number;
  keywords: string[];
  thaiContext: string;
  commonSituations: string[];
}

interface DynamicSceneData {
  primaryScenes: SceneAnalysis[];
  secondaryScenes: SceneAnalysis[];
  suggestedVocabulary: string[];
  culturalElements: string[];
  practicalApplications: string[];
}

@Injectable()
export class DynamicSceneAnalyzerService {
  analyzeLessonContent(lessonAnalysis: any): DynamicSceneData {
    const segments = lessonAnalysis.segments || [];
    const vocabulary = lessonAnalysis.vocabulary || [];
    const title = lessonAnalysis.title || '';
    const description = lessonAnalysis.seriesStructure?.description || '';

    // 分析所有可能的场景
    const allScenes = this.identifyScenes(segments, vocabulary, title, description);

    // 按信心度排序
    const sortedScenes = [...allScenes].sort((a, b) => b.confidence - a.confidence);

    return {
      primaryScenes: sortedScenes.slice(0, 2), // 主要场景
      secondaryScenes: sortedScenes.slice(2, 5), // 次要场景
      suggestedVocabulary: this.extractRelevantVocabulary(sortedScenes, vocabulary),
      culturalElements: this.identifyCulturalElements(sortedScenes),
      practicalApplications: this.generatePracticalApplications(sortedScenes),
    };
  }

  private identifyScenes(segments: any[], vocabulary: any[], title: string, description: string): SceneAnalysis[] {
    const scenes: SceneAnalysis[] = [];
    const allText = this.combineTextContent(segments, title, description);
    const keyTopics = this.extractKeyTopics(segments);

    // 预定义场景模式 + 动态扩展
    const scenePatterns = this.getScenePatterns();

    for (const pattern of scenePatterns) {
      const confidence = this.calculateSceneConfidence(allText, keyTopics, vocabulary, pattern);

      if (confidence > 0.1) {
        // 阈值：10%以上相关性才考虑
        scenes.push({
          sceneName: pattern.name,
          confidence,
          keywords: pattern.keywords.filter((keyword) => allText.toLowerCase().includes(keyword.toLowerCase())),
          thaiContext: pattern.thaiContext,
          commonSituations: pattern.situations,
        });
      }
    }

    // 动态识别新场景
    const dynamicScenes = this.identifyDynamicScenes(allText, keyTopics, vocabulary);
    scenes.push(...dynamicScenes);

    return scenes;
  }

  private getScenePatterns() {
    return [
      this.createCoffeeShopPattern(),
      this.createRestaurantPattern(),
      this.createHotelPattern(),
      this.createTransportationPattern(),
      this.createShoppingPattern(),
      this.createHealthcarePattern(),
      this.createEducationPattern(),
      this.createWorkplacePattern(),
      this.createTechnologyPattern(),
      this.createEntertainmentPattern(),
      this.createEmergencyPattern(),
      this.createSocialPattern(),
    ];
  }

  private createCoffeeShopPattern() {
    return {
      name: 'coffee_shop',
      keywords: ['coffee', 'cafe', 'latte', 'americano', 'order', 'drink', 'milk', 'sugar'],
      thaiContext: 'การสั่งกาแฟในร้านกาแฟไทย เช่น True Coffee, Amazon, Starbucks',
      situations: ['ordering drinks', 'asking about menu', 'payment', 'finding seats'],
    };
  }

  private createRestaurantPattern() {
    return {
      name: 'restaurant',
      keywords: ['restaurant', 'food', 'menu', 'order', 'spicy', 'thai', 'dish', 'bill'],
      thaiContext: 'การรับประทานอาหารในร้านอาหารไทยหรือร้านอาหารนานาชาติ',
      situations: ['making reservations', 'ordering food', 'dietary preferences', 'paying bill'],
    };
  }

  private createHotelPattern() {
    return {
      name: 'hotel',
      keywords: ['hotel', 'room', 'reservation', 'check-in', 'check-out', 'service', 'reception'],
      thaiContext: 'การใช้บริการโรงแรมในประเทศไทย',
      situations: ['checking in/out', 'room service', 'asking for directions', 'complaints'],
    };
  }

  private createTransportationPattern() {
    return {
      name: 'transportation',
      keywords: ['bts', 'mrt', 'taxi', 'bus', 'airport', 'train', 'ticket', 'station'],
      thaiContext: 'การใช้ระบบขนส่งสาธารณะในกรุงเทพและประเทศไทย',
      situations: ['buying tickets', 'asking directions', 'airport procedures', 'ride-sharing'],
    };
  }

  private createShoppingPattern() {
    return {
      name: 'shopping',
      keywords: ['shop', 'buy', 'price', 'discount', 'mall', 'market', 'payment', 'size'],
      thaiContext: 'การช้อปปิ้งในห้างสรรพสินค้า ตลาด และร้านค้าต่างๆ ในไทย',
      situations: ['bargaining', 'trying on clothes', 'returning items', 'asking for help'],
    };
  }

  private createHealthcarePattern() {
    return {
      name: 'healthcare',
      keywords: ['hospital', 'doctor', 'medicine', 'pharmacy', 'appointment', 'symptoms', 'health'],
      thaiContext: 'การใช้บริการสาธารณสุขและโรงพยาบาลในประเทศไทย',
      situations: ['making appointments', 'describing symptoms', 'pharmacy visits', 'insurance'],
    };
  }

  private createEducationPattern() {
    return {
      name: 'education',
      keywords: ['school', 'university', 'study', 'learn', 'student', 'teacher', 'class', 'exam'],
      thaiContext: 'ระบบการศึกษาและชีวิตนักเรียนนักศึกษาในประเทศไทย',
      situations: ['enrollment', 'asking questions in class', 'group projects', 'exam preparation'],
    };
  }

  private createWorkplacePattern() {
    return {
      name: 'workplace',
      keywords: ['work', 'office', 'meeting', 'colleague', 'boss', 'project', 'email', 'presentation'],
      thaiContext: 'สภาพแวดล้อมการทำงานและวัฒนธรรมองค์กรในประเทศไทย',
      situations: ['job interviews', 'daily communication', 'meetings', 'networking'],
    };
  }

  private createTechnologyPattern() {
    return {
      name: 'technology',
      keywords: ['computer', 'internet', 'app', 'software', 'digital', 'online', 'ai', 'prompt'],
      thaiContext: 'การใช้เทคโนโลยีและดิจิทัลในชีวิตประจำวันของคนไทย',
      situations: ['tech support', 'online services', 'digital payments', 'social media'],
    };
  }

  private createEntertainmentPattern() {
    return {
      name: 'entertainment',
      keywords: ['movie', 'music', 'game', 'party', 'festival', 'concert', 'fun', 'hobby'],
      thaiContext: 'กิจกรรมบันเทิงและวัฒนธรรมการพักผ่อนของคนไทย',
      situations: ['buying tickets', 'making plans', 'cultural events', 'socializing'],
    };
  }

  private createEmergencyPattern() {
    return {
      name: 'emergency',
      keywords: ['emergency', 'help', 'police', 'fire', 'accident', 'lost', 'problem', 'urgent'],
      thaiContext: 'สถานการณ์ฉุกเฉินและการขอความช่วยเหลือในประเทศไทย',
      situations: ['calling for help', 'reporting incidents', 'getting assistance', 'insurance claims'],
    };
  }

  private createSocialPattern() {
    return {
      name: 'social_interaction',
      keywords: ['friend', 'family', 'social', 'party', 'introduce', 'greet', 'goodbye', 'invite'],
      thaiContext: 'การสร้างสัมพันธ์และปฏิสัมพันธ์ทางสังคมในวัฒนธรรมไทย',
      situations: ['making friends', 'social gatherings', 'cultural etiquette', 'networking'],
    };
  }

  private identifyDynamicScenes(allText: string, keyTopics: string[], vocabulary: any[]): SceneAnalysis[] {
    const dynamicScenes: SceneAnalysis[] = [];

    // 基于关键词组合识别新场景
    const topicCombinations = this.findTopicCombinations(keyTopics);

    for (const combination of topicCombinations) {
      if (combination.topics.length >= 2) {
        const sceneName = this.generateSceneName(combination.topics);
        const confidence = combination.frequency / keyTopics.length;

        if (confidence > 0.15) {
          // 15%以上相关性
          dynamicScenes.push({
            sceneName,
            confidence,
            keywords: combination.topics,
            thaiContext: this.generateThaiContext(combination.topics),
            commonSituations: this.generateSituations(combination.topics),
          });
        }
      }
    }

    return dynamicScenes;
  }

  private combineTextContent(segments: any[], title: string, description: string): string {
    const segmentTexts = segments.map((seg) => `${seg.title || ''} ${seg.content || ''} ${(seg.keyTopics || []).join(' ')}`).join(' ');

    return `${title} ${description} ${segmentTexts}`.toLowerCase();
  }

  private extractKeyTopics(segments: any[]): string[] {
    const allTopics: string[] = [];

    for (const segment of segments) {
      if (segment.keyTopics) {
        allTopics.push(...segment.keyTopics);
      }
    }

    return [...new Set(allTopics)]; // 去重
  }

  private calculateSceneConfidence(allText: string, keyTopics: string[], vocabulary: any[], pattern: any): number {
    let score = 0;
    let totalPossible = 0;

    // 关键词匹配分数
    for (const keyword of pattern.keywords) {
      totalPossible += 1;
      if (allText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    // 主题匹配分数
    for (const topic of keyTopics) {
      for (const keyword of pattern.keywords) {
        if (topic.toLowerCase().includes(keyword.toLowerCase())) {
          score += 0.5;
          break;
        }
      }
    }

    // 词汇匹配分数
    for (const vocab of vocabulary) {
      if (vocab.word) {
        for (const keyword of pattern.keywords) {
          if (vocab.word.toLowerCase().includes(keyword.toLowerCase()) || keyword.toLowerCase().includes(vocab.word.toLowerCase())) {
            score += 0.3;
            break;
          }
        }
      }
    }

    return totalPossible > 0 ? Math.min(score / totalPossible, 1.0) : 0;
  }

  private findTopicCombinations(keyTopics: string[]): Array<{ topics: string[]; frequency: number }> {
    const combinations = new Map<string, number>();

    // 找到经常一起出现的主题组合
    for (let i = 0; i < keyTopics.length; i++) {
      for (let j = i + 1; j < keyTopics.length; j++) {
        const combo = [keyTopics[i], keyTopics[j]].sort((a, b) => a.localeCompare(b)).join('_');
        combinations.set(combo, (combinations.get(combo) || 0) + 1);
      }
    }

    return Array.from(combinations.entries()).map(([combo, freq]) => ({
      topics: combo.split('_'),
      frequency: freq,
    }));
  }

  private generateSceneName(topics: string[]): string {
    // 基于主题生成场景名称
    const cleanTopics = topics.map((topic) => topic.replace(/[^a-zA-Z0-9]/g, '').toLowerCase());
    return cleanTopics.join('_');
  }

  private generateThaiContext(topics: string[]): string {
    // 根据主题动态生成泰国文化背景
    const contextMappings: { [key: string]: string } = {
      business: 'สภาพแวดล้อมธุรกิจและการทำงานในประเทศไทย',
      technology: 'การใช้เทคโนโลยีในชีวิตประจำวันของคนไทย',
      travel: 'การท่องเที่ยวและสถานที่น่าสนใจในประเทศไทย',
      culture: 'วัฒนธรรมและประเพณีไทย',
      language: 'การเรียนรู้และใช้ภาษาในบริบทไทย',
    };

    // ค้นหาคำที่ตรงกัน
    for (const topic of topics) {
      for (const [key, context] of Object.entries(contextMappings)) {
        if (topic.toLowerCase().includes(key)) {
          return context;
        }
      }
    }

    // ค่าเริ่มต้น
    return `การใช้ภาษาอังกฤษในบริบท${topics.join('และ')}ในประเทศไทย`;
  }

  private generateSituations(topics: string[]): string[] {
    // 根据主题生成常见情况
    const baseSituations = ['asking for information', 'making requests', 'expressing preferences', 'problem solving', 'social interaction'];

    // 根据具体主题添加特定情况
    const specificSituations: string[] = [];

    if (topics.some((t) => t.includes('technology') || t.includes('ai'))) {
      specificSituations.push('technical support', 'explaining features', 'troubleshooting');
    }

    if (topics.some((t) => t.includes('business') || t.includes('work'))) {
      specificSituations.push('professional meetings', 'project discussions', 'networking');
    }

    return [...baseSituations, ...specificSituations].slice(0, 4);
  }

  private extractRelevantVocabulary(scenes: SceneAnalysis[], vocabulary: any[]): string[] {
    const relevantVocab: string[] = [];
    const sceneKeywords = scenes.flatMap((scene) => scene.keywords);

    for (const vocab of vocabulary) {
      if (vocab.word) {
        // 检查词汇是否与场景相关
        const isRelevant = sceneKeywords.some(
          (keyword) =>
            vocab.word.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(vocab.word.toLowerCase()) ||
            vocab.definition?.toLowerCase().includes(keyword.toLowerCase()),
        );

        if (isRelevant) {
          relevantVocab.push(vocab.word);
        }
      }
    }

    return relevantVocab.slice(0, 15); // 限制数量
  }

  private identifyCulturalElements(scenes: SceneAnalysis[]): string[] {
    const culturalElements: string[] = [];

    // 基于场景识别文化元素
    for (const scene of scenes) {
      if (scene.sceneName.includes('restaurant') || scene.sceneName.includes('food')) {
        culturalElements.push('Thai dining etiquette', 'spice levels', 'popular dishes');
      }
      if (scene.sceneName.includes('social') || scene.sceneName.includes('interaction')) {
        culturalElements.push('wai greeting', 'respect for elders', 'face-saving');
      }
      if (scene.sceneName.includes('work') || scene.sceneName.includes('business')) {
        culturalElements.push('hierarchy awareness', 'formal address', 'meeting culture');
      }
      if (scene.sceneName.includes('transportation') || scene.sceneName.includes('travel')) {
        culturalElements.push('Bangkok traffic', 'tuk-tuk bargaining', 'temple visits');
      }
    }

    return [...new Set(culturalElements)];
  }

  private generatePracticalApplications(scenes: SceneAnalysis[]): string[] {
    const applications: string[] = [];

    for (const scene of scenes) {
      applications.push(
        `Practice ${scene.sceneName.replace('_', ' ')} conversations with Thai friends`,
        `Use ${scene.sceneName.replace('_', ' ')} vocabulary in real situations`,
        `Role-play ${scene.sceneName.replace('_', ' ')} scenarios`,
      );
    }

    return [...new Set(applications)].slice(0, 10);
  }
}
