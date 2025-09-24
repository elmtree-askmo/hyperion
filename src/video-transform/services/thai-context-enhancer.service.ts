import { Injectable } from '@nestjs/common';
import { DynamicSceneAnalyzerService } from './dynamic-scene-analyzer.service';

interface ThaiContextExample {
  englishPhrase: string;
  thaiContext: string;
  situation: string;
  memoryHook: string;
  pronunciation: string;
}

interface LearningObjective {
  statement: string;
  statementTh: string;
  stepByStepExplanation: string[];
  thaiContextExamples: ThaiContextExample[];
  memoryHooks: string[];
  summaryPoints: string[];
}

@Injectable()
export class ThaiContextEnhancerService {
  constructor(private readonly dynamicSceneAnalyzer: DynamicSceneAnalyzerService) {}

  generateLearningObjectives(segmentData: any, fullLessonAnalysis?: any): LearningObjective[] {
    const objectives: LearningObjective[] = [];

    // 使用动态场景分析器分析内容
    if (fullLessonAnalysis) {
      const sceneAnalysis = this.dynamicSceneAnalyzer.analyzeLessonContent(fullLessonAnalysis);

      // 基于主要场景生成学习目标
      for (const scene of sceneAnalysis.primaryScenes.slice(0, 2)) {
        const objective = this.createDynamicObjective(scene, sceneAnalysis);
        objectives.push(objective);
      }

      // 如果主要场景不足，添加次要场景
      if (objectives.length < 2 && sceneAnalysis.secondaryScenes.length > 0) {
        const secondaryObjective = this.createDynamicObjective(sceneAnalysis.secondaryScenes[0], sceneAnalysis);
        objectives.push(secondaryObjective);
      }
    } else {
      // 后备方案：使用原有的固定场景方法
      if (segmentData.keyTopics) {
        for (const topic of segmentData.keyTopics.slice(0, 3)) {
          const objective = this.createObjectiveForTopic(topic, segmentData);
          objectives.push(objective);
        }
      }
    }

    return objectives.length > 0 ? objectives : this.createDefaultObjectives();
  }

  private createDynamicObjective(scene: any, sceneAnalysis: any): LearningObjective {
    const sceneName = scene.sceneName.replace('_', ' ');
    const keywords = scene.keywords.slice(0, 5);

    return {
      statement: `Master ${sceneName} interactions in English with Thai cultural context`,
      statementTh: `เรียนรู้การสื่อสารเรื่อง${sceneName}เป็นภาษาอังกฤษในบริบทวัฒนธรรมไทย`,
      stepByStepExplanation: this.generateStepByStepExplanation(scene),
      thaiContextExamples: this.generateDynamicThaiExamples(scene, keywords),
      memoryHooks: this.generateDynamicMemoryHooks(keywords),
      summaryPoints: this.generateDynamicSummaryPoints(scene, sceneAnalysis),
    };
  }

  private generateStepByStepExplanation(scene: any): string[] {
    const baseSteps = [
      '1. Listen to the conversation and identify key vocabulary',
      '2. Understand the cultural context and appropriate behavior',
      '3. Practice pronunciation with Thai phonetic guides',
      '4. Role-play the scenario with increasing complexity',
      '5. Apply learned phrases in real-life situations',
    ];

    // 根据场景调整步骤
    if (scene.sceneName.includes('restaurant') || scene.sceneName.includes('food')) {
      baseSteps[1] = '2. Learn Thai dining etiquette and food ordering customs';
      baseSteps[4] = '4. Practice ordering different types of Thai and international food';
    } else if (scene.sceneName.includes('technology') || scene.sceneName.includes('ai')) {
      baseSteps[1] = '2. Understand technical terminology in Thai context';
      baseSteps[4] = '4. Practice explaining technical concepts in simple English';
    } else if (scene.sceneName.includes('work') || scene.sceneName.includes('business')) {
      baseSteps[1] = '2. Learn Thai workplace hierarchy and communication style';
      baseSteps[4] = '4. Practice professional conversations and presentations';
    }

    return baseSteps;
  }

  private generateDynamicThaiExamples(scene: any, keywords: string[]): ThaiContextExample[] {
    const examples: ThaiContextExample[] = [];
    const sceneName = scene.sceneName;

    // 基于场景和关键词生成示例
    if (sceneName.includes('technology') || sceneName.includes('ai')) {
      examples.push({
        englishPhrase: `How do I use this ${keywords[0] || 'feature'}?`,
        thaiContext: `ถามวิธีใช้${keywords[0] || 'ฟีเจอร์'}ในแอปหรือเว็บไซต์ไทย`,
        situation: 'Getting help with Thai digital services',
        memoryHook: `${keywords[0]} = จำผ่านการใช้งานจริง`,
        pronunciation: this.generatePronunciation(`How do I use this ${keywords[0] || 'feature'}?`),
      });
    } else if (sceneName.includes('transportation')) {
      examples.push({
        englishPhrase: `Where is the ${keywords[0] || 'station'}?`,
        thaiContext: `ถามหาสถานี${keywords[0] || 'รถไฟฟ้า'}ในกรุงเทพหรือเมืองใหญ่`,
        situation: 'Navigating Bangkok public transportation',
        memoryHook: `${keywords[0]} = เชื่อมโยงกับเส้นทางที่คุ้นเคย`,
        pronunciation: this.generatePronunciation(`Where is the ${keywords[0] || 'station'}?`),
      });
    } else if (sceneName.includes('healthcare')) {
      examples.push({
        englishPhrase: `I need to see a ${keywords[0] || 'doctor'}`,
        thaiContext: `ขอพบ${keywords[0] || 'หมอ'}ในโรงพยาบาลหรือคลินิกในไทย`,
        situation: 'Seeking medical care in Thailand',
        memoryHook: `${keywords[0]} = จำผ่านสถานการณ์จำเป็น`,
        pronunciation: this.generatePronunciation(`I need to see a ${keywords[0] || 'doctor'}`),
      });
    } else {
      // 通用示例
      examples.push({
        englishPhrase: `Can you help me with ${keywords[0] || 'this'}?`,
        thaiContext: scene.thaiContext || `การขอความช่วยเหลือเกี่ยวกับ${keywords[0] || 'สิ่งนี้'}`,
        situation: scene.commonSituations?.[0] || 'General assistance request',
        memoryHook: `${keywords[0]} = จำผ่านการปฏิบัติจริง`,
        pronunciation: this.generatePronunciation(`Can you help me with ${keywords[0] || 'this'}?`),
      });
    }

    return examples;
  }

  private generateDynamicMemoryHooks(keywords: string[]): string[] {
    const hooks: string[] = [];

    for (const keyword of keywords.slice(0, 3)) {
      // 尝试生成记忆钩子
      const specificHook = this.generateSpecificMemoryHook(keyword);
      if (specificHook) {
        hooks.push(specificHook);
      } else {
        hooks.push(`จำคำว่า "${keyword}" ผ่านการเชื่อมโยงกับประสบการณ์ส่วนตัว`);
      }
    }

    hooks.push('ใช้เทคนิคการจำแบบเสียงสัมผัสกับภาษาไทย');
    hooks.push('ฝึกใช้คำศัพท์ในบริบทจริงทุกวัน');

    return hooks;
  }

  private generateSpecificMemoryHook(word: string): string | null {
    const memoryHooks: { [key: string]: string } = {
      // เทคโนโลยี
      computer: 'คอมพิวเตอร์ = "คอม พิว เตอร์" (คอมมาพิวท์เตอร์)',
      internet: 'อินเทอร์เน็ต = "อิน เทอร์ เน็ต" (เข้าไปในเทอร์เน็ต)',
      software: 'ซอฟต์แวร์ = "ซอฟต์ แวร์" (ซอฟต์คือนุ่ม)',
      application: 'แอปพลิเคชัน = "แอป พลิ เค ชัน" (แอปพลิเคชั่น)',

      // การขนส่ง
      station: 'สเตชัน = "สเต ชัน" (สถานีรถไฟ)',
      platform: 'แพลตฟอร์ม = "แพลต ฟอร์ม" (แพลตฟอร์ม)',
      ticket: 'ทิกเก็ต = "ทิก เก็ต" (ตั๋ว)',
      schedule: 'เชดดูล = "เช็ด ดูล" (เช็ดดูตาราง)',

      // สุขภาพ
      hospital: 'โรงพยาบาล = "โรง พยา บาล" (โรงรักษาพยาบาล)',
      medicine: 'เมดิซิน = "เม ดิ ซิน" (ยารักษาโรค)',
      appointment: 'อพพอยท์เมนท์ = "อพ พอยท์ เมนท์" (นัดหมาย)',

      // ธุรกิจ
      meeting: 'มีตติ้ง = "มีต ติ้ง" (ประชุม)',
      presentation: 'เพรสเซนเทชัน = "เพรส เซน เท ชัน" (นำเสนอ)',
      project: 'โปรเจ็กต์ = "โปร เจ็กต์" (โครงการ)',
    };

    return memoryHooks[word.toLowerCase()] || null;
  }

  private generateDynamicSummaryPoints(scene: any, sceneAnalysis: any): string[] {
    const points: string[] = [
      `เรียนรู้คำศัพท์และวลีสำคัญเกี่ยวกับ${scene.sceneName.replace('_', ' ')}`,
      'ฝึกการออกเสียงและสำเนียงที่ถูกต้อง',
      'เข้าใจบริบทวัฒนธรรมไทยที่เกี่ยวข้อง',
    ];

    // 添加场景特定的要点
    if (sceneAnalysis.culturalElements?.length > 0) {
      points.push(`เรียนรู้องค์ประกอบทางวัฒนธรรม: ${sceneAnalysis.culturalElements.slice(0, 2).join(', ')}`);
    }

    if (sceneAnalysis.practicalApplications?.length > 0) {
      points.push('นำไปปฏิบัติในสถานการณ์จริงทันที');
    }

    return points;
  }

  private generatePronunciation(phrase: string): string {
    // 简单的发音生成 - 可以后续改进
    return phrase
      .toLowerCase()
      .replace(/how/g, 'ฮาว')
      .replace(/do/g, 'ดู')
      .replace(/i/g, 'ไอ')
      .replace(/use/g, 'ยูส')
      .replace(/this/g, 'ดิส')
      .replace(/where/g, 'แวร์')
      .replace(/is/g, 'อิส')
      .replace(/the/g, 'เดอะ')
      .replace(/can/g, 'แคน')
      .replace(/you/g, 'ยู')
      .replace(/help/g, 'เฮลป์')
      .replace(/me/g, 'มี')
      .replace(/with/g, 'วิธ')
      .replace(/need/g, 'นีด')
      .replace(/to/g, 'ทู')
      .replace(/see/g, 'ซี')
      .replace(/a/g, 'อะ');
  }

  private createDefaultObjectives(): LearningObjective[] {
    return [
      {
        statement: 'Learn practical English vocabulary and phrases for daily communication',
        statementTh: 'เรียนรู้คำศัพท์และวลีภาษาอังกฤษที่ใช้ในการสื่อสารประจำวัน',
        stepByStepExplanation: [
          '1. Listen and identify key vocabulary words',
          '2. Practice pronunciation with Thai phonetic guides',
          '3. Understand cultural context and usage',
          '4. Apply in conversation practice',
          '5. Use in real-life situations',
        ],
        thaiContextExamples: [
          {
            englishPhrase: 'How can I help you?',
            thaiContext: 'การเสนอความช่วยเหลือในสถานการณ์ต่างๆ',
            situation: 'General helpfulness in Thai culture',
            memoryHook: 'help = เฮลป์ (ช่วยเหลือ)',
            pronunciation: 'ฮาว แคน ไอ เฮลป์ ยู?',
          },
        ],
        memoryHooks: ['เชื่อมโยงคำศัพท์กับประสบการณ์จริง', 'ใช้เสียงสัมผัสภาษาไทย'],
        summaryPoints: ['เน้นคำศัพท์ที่ใช้บ่อย', 'ฝึกในบริบทวัฒนธรรมไทย'],
      },
    ];
  }

  private createObjectiveForTopic(topic: string, segmentData: any): LearningObjective {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('coffee') || topicLower.includes('cafe')) {
      return this.createCoffeeShopObjective();
    } else if (topicLower.includes('restaurant') || topicLower.includes('food')) {
      return this.createRestaurantObjective();
    } else if (topicLower.includes('hotel')) {
      return this.createHotelObjective();
    } else if (topicLower.includes('bank')) {
      return this.createBankObjective();
    } else if (topicLower.includes('shopping') || topicLower.includes('grocery')) {
      return this.createShoppingObjective();
    } else if (topicLower.includes('daily') || topicLower.includes('routine')) {
      return this.createDailyRoutineObjective();
    } else {
      return this.createGeneralObjective(topic);
    }
  }

  private createCoffeeShopObjective(): LearningObjective {
    return {
      statement: 'Master coffee shop interactions in English for Thai coffee culture contexts',
      statementTh: 'เรียนรู้การสื่อสารในร้านกาแฟเป็นภาษาอังกฤษในบริบทวัฒนธรรมกาแฟไทย',
      stepByStepExplanation: [
        "1. Learn to greet staff politely: 'Good morning/afternoon'",
        "2. State your order clearly: 'I'd like to order...'",
        "3. Specify preferences: 'With oat milk, please'",
        "4. Ask about options: 'Do you have any dairy-free alternatives?'",
        "5. Complete the transaction: 'I'll pay by card, thank you'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: "I'd like an iced americano with oat milk, please",
          thaiContext: 'สั่งเครื่องดื่มที่ True Coffee หรือ Amazon Coffee',
          situation: 'Ordering at a popular Thai coffee chain',
          memoryHook: "จำว่า 'I'd like' = 'ผมต้องการ' สุภาพกว่า 'I want'",
          pronunciation: 'ไอด์ ไลค์ แอน ไอซ์ด อเมริกาโน่ วิธ โอ๊ต มิลค์ พลีซ',
        },
        {
          englishPhrase: 'Do you have any loyalty points program?',
          thaiContext: 'ถามเรื่องโปรแกรมสะสมแต้มที่ร้านกาแฟไทย',
          situation: 'Asking about True Card or similar programs',
          memoryHook: 'loyalty = ความภักดี, points = แต้ม (เหมือนการ์ดสะสมแต้ม)',
          pronunciation: 'ดู ยู แฮฟ เอนี่ ลอยัลตี้ พอยท์ โปรแกรม?',
        },
      ],
      memoryHooks: ["จำ 'iced' โดยนึกถึงน้ำแข็ง (ice) + ed = เย็น", 'oat milk = นมข้าวโอ๊ต (โอ๊ต เหมือนเสียงแมว)', 'americano = อเมริกาโน่ (เหมือนชาวอเมริกัน ดื่มกาแฟดำ)'],
      summaryPoints: [
        "ใช้ 'I'd like' แทน 'I want' เพื่อความสุภาพ",
        'เรียนรู้ชื่อเครื่องดื่มและตัวเลือกนมต่างๆ',
        'ฝึกการถามเรื่องโปรแกรมสะสมแต้มและการชำระเงิน',
        'จำรูปแบบการสั่งซื้อที่สุภาพและชัดเจน',
      ],
    };
  }

  private createRestaurantObjective(): LearningObjective {
    return {
      statement: 'Navigate Thai restaurant experiences using appropriate English phrases',
      statementTh: 'ใช้ภาษาอังกฤษในร้านอาหารไทยได้อย่างเหมาะสม',
      stepByStepExplanation: [
        "1. Make a reservation: 'I'd like to book a table for [number] people'",
        "2. Request menu recommendations: 'What do you recommend?'",
        "3. Specify dietary requirements: 'I'm vegetarian' or 'Not too spicy, please'",
        "4. Order food and drinks: 'I'll have the... and to drink...'",
        "5. Ask for the bill: 'Could I have the bill, please?'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: 'Not too spicy, please. Medium level is fine',
          thaiContext: 'ขอไม่เผ็ดมาก เผ็ดปานกลางพอ (สำหรับร้านอาหารไทยที่มีลูกค้าต่างชาติ)',
          situation: 'Ordering pad thai or som tam at a tourist-friendly restaurant',
          memoryHook: 'spicy = เผ็ด (เหมือน spice = เครื่องเทศ), medium = กลาง',
          pronunciation: 'น็อต ทู สไปซี่ พลีซ. มีเดียม เลเวล อิส ไฟน์',
        },
        {
          englishPhrase: 'Could you recommend a good vegetarian dish?',
          thaiContext: 'ขอแนะนำอาหารเจหรืออาหารมังสวิรัติ',
          situation: 'Asking for vegetarian options in Thai restaurants',
          memoryHook: 'vegetarian = คนกินเจ (จำว่า vege = ผัก + tarian = คนที่กิน)',
          pronunciation: 'คูด ยู เรคคอมเมนด์ อะ กูด เวจเทเรียน ดิช?',
        },
      ],
      memoryHooks: ['reservation = การจอง (จำว่า reserve = สำรอง)', 'spicy = เผ็ด (เหมือนคำว่า spice เครื่องเทศ)', 'vegetarian = มังสวิรัติ (vege = ผัก)'],
      summaryPoints: [
        'เรียนรู้การจองโต๊ะและการสั่งอาหารภาษาอังกฤษ',
        'ฝึกการระบุความต้องการพิเศษ เช่น ไม่เผ็ด หรือ เจ',
        'จำรูปแบบการขอแนะนำเมนูจากพนักงาน',
        'รู้จักการขอบิลและการชำระเงินด้วยภาษาอังกฤษ',
      ],
    };
  }

  private createHotelObjective(): LearningObjective {
    return {
      statement: 'Handle hotel interactions confidently in English for Thai hospitality contexts',
      statementTh: 'จัดการกับการสื่อสารในโรงแรมด้วยภาษาอังกฤษในบริบทการบริการไทย',
      stepByStepExplanation: [
        "1. Check-in process: 'I have a reservation under [name]'",
        "2. Ask about hotel facilities: 'What time does the pool close?'",
        "3. Request recommendations: 'Can you recommend a good local restaurant?'",
        "4. Report issues: 'There's a problem with the air conditioning'",
        "5. Check-out: 'I'd like to check out, please'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: 'Can you arrange a taxi to Chatuchak Market?',
          thaiContext: 'ขอให้โรงแรมจัดแท็กซี่ไปตลาดจตุจักร',
          situation: 'Getting transportation to popular Bangkok tourist spots',
          memoryHook: 'arrange = จัดการ (AR-range = จัด-ระเบียบ)',
          pronunciation: 'แคน ยู อะเรนจ์ อะ แท็กซี่ ทู ชาตุชัก มาร์เก็ต?',
        },
        {
          englishPhrase: 'What time is breakfast served?',
          thaiContext: 'ถามเวลาเสิร์ฟอาหารเช้าในโรงแรม',
          situation: 'Inquiring about hotel breakfast timings',
          memoryHook: 'served = เสิร์ฟ (serve = บริการ + ed)',
          pronunciation: 'วอท ไทม์ อิส เบรกฟาสต์ เซิร์ฟวด์?',
        },
      ],
      memoryHooks: ['reservation = การจอง (reserve = สำรอง + ation)', 'facilities = สิ่งอำนวยความสะดวก (facility = ความสะดวก)', 'recommendation = การแนะนำ (recommend + ation)'],
      summaryPoints: [
        'เรียนรู้กระบวนการเช็คอิน-เช็คเอาท์',
        'ฝึกการถามเรื่องสิ่งอำนวยความสะดวกในโรงแรม',
        'รู้จักการขอความช่วยเหลือและการแนะนำสถานที่',
        'เรียนรู้การรายงานปัญหาในห้องพักด้วยภาษาอังกฤษ',
      ],
    };
  }

  private createBankObjective(): LearningObjective {
    return {
      statement: 'Conduct basic banking transactions in English within Thai banking system',
      statementTh: 'ทำธุรกรรมทางการเงินพื้นฐานด้วยภาษาอังกฤษในระบบธนาคารไทย',
      stepByStepExplanation: [
        "1. Greet the teller: 'Good morning, I'd like to...'",
        "2. State your transaction: 'I want to deposit/withdraw money'",
        "3. Provide identification: 'Here's my ID card and bank book'",
        "4. Specify amount: 'I'd like to deposit 5,000 baht'",
        "5. Confirm transaction: 'Please confirm the amount is correct'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: "I'd like to open a savings account",
          thaiContext: 'ขอเปิดบัญชีออมทรัพย์ที่ธนาคารไทย เช่น กสิกรไทย หรือ ไทยพาณิชย์',
          situation: 'Opening account at Kasikorn Bank or SCB',
          memoryHook: 'savings = การออม (save = ประหยัด + ings)',
          pronunciation: 'ไอด์ ไลค์ ทู โอเพ่น อะ เซฟวิงส์ แอคเคาท์',
        },
        {
          englishPhrase: "What's the current exchange rate for USD?",
          thaiContext: 'ถามอัตราแลกเปลี่ยนเงินดอลลาร์ที่ธนาคาร',
          situation: 'Currency exchange at Thai banks',
          memoryHook: 'exchange = แลกเปลี่ยน (ex-change = เปลี่ยน-ออก)',
          pronunciation: 'วอทส์ เดอะ เคอร์เรนท์ เอ็กซ์เชนจ์ เรท ฟอร์ ยูเอสดี?',
        },
      ],
      memoryHooks: ['deposit = ฝากเงิน (de-posit = วาง-ลง)', 'withdraw = ถอนเงิน (with-draw = ด้วย-ดึง)', 'account = บัญชี (a-count = การ-นับ)'],
      summaryPoints: ['เรียนรู้คำศัพท์การธนาคารพื้นฐาน', 'ฝึกการฝาก-ถอนเงินด้วยภาษาอังกฤษ', 'รู้จักการถามอัตราแลกเปลี่ยนเงินตรา', 'เรียนรู้การเปิดบัญชีธนาคารใหม่'],
    };
  }

  private createShoppingObjective(): LearningObjective {
    return {
      statement: 'Navigate shopping experiences in English at Thai retail environments',
      statementTh: 'ช้อปปิ้งด้วยภาษาอังกฤษในร้านค้าปลีกไทย',
      stepByStepExplanation: [
        "1. Ask for assistance: 'Excuse me, where can I find...'",
        "2. Inquire about products: 'Do you have this in a different size/color?'",
        "3. Ask about prices: 'How much does this cost?'",
        "4. Request discounts: 'Is there any discount available?'",
        "5. Complete purchase: 'I'll take this one, please'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: 'Is there a promotion on this item?',
          thaiContext: 'ถามโปรโมชั่นสินค้าที่ Big C, Lotus หรือ Central',
          situation: 'Shopping at major Thai retail chains',
          memoryHook: 'promotion = โปรโมชั่น (promote = ส่งเสริม + tion)',
          pronunciation: 'อิส แดร์ อะ โปรโมชั่น ออน ดิส ไอเทม?',
        },
        {
          englishPhrase: 'Where is the fresh produce section?',
          thaiContext: 'หาแผนกผักผลไม้สดในซูเปอร์มาร์เก็ต',
          situation: 'Finding fresh fruits and vegetables at Tops or Villa Market',
          memoryHook: 'produce = ผลิตภัณฑ์เกษตร (product = ผลิตภัณฑ์)',
          pronunciation: 'แวร์ อิส เดอะ เฟรช โปรดิวส์ เซ็คชั่น?',
        },
      ],
      memoryHooks: ['discount = ส่วนลด (dis-count = ลด-การนับ)', 'promotion = โปรโมชั่น (ส่งเสริมการขาย)', 'section = แผนก (แบ่งส่วน)'],
      summaryPoints: ['เรียนรู้การถามหาสินค้าในซูเปอร์มาร์เก็ต', 'ฝึกการสอบถามราคาและขอส่วนลด', 'รู้จักแผนกต่างๆ ในห้างสรรพสินค้า', 'เรียนรู้การชำระเงินและขอใบเสร็จ'],
    };
  }

  private createDailyRoutineObjective(): LearningObjective {
    return {
      statement: 'Describe and discuss daily routines in English with Thai cultural context',
      statementTh: 'บรรยายและพูดคุยเรื่องกิจวัตรประจำวันเป็นภาษาอังกฤษในบริบทวัฒนธรรมไทย',
      stepByStepExplanation: [
        "1. Use time expressions: 'I usually wake up at 6 AM'",
        "2. Describe activities: 'I have breakfast before going to work'",
        "3. Talk about habits: 'I always pray before meals'",
        "4. Discuss preferences: 'I prefer taking the BTS to work'",
        "5. Compare routines: 'Thai students study later than Western students'",
      ],
      thaiContextExamples: [
        {
          englishPhrase: 'I take the BTS to university every day',
          thaiContext: 'ใช้รถไฟฟ้าไปมหาวิทยาลัยทุกวัน (สำหรับนักเรียนกรุงเทพ)',
          situation: "Describing daily commute using Bangkok's public transport",
          memoryHook: 'BTS = Bangkok Transit System (รถไฟฟ้าบีทีเอส)',
          pronunciation: 'ไอ เทค เดอะ บีทีเอส ทู ยูนิเวอร์ซิตี้ เอฟวรี่ เดย์',
        },
        {
          englishPhrase: 'I always wai before entering the temple',
          thaiContext: 'ไหว้ก่อนเข้าวัด (อธิบายประเพณีไทยให้ชาวต่างชาติฟัง)',
          situation: 'Explaining Thai religious customs to foreigners',
          memoryHook: 'wai = การไหว้ (ท่าทางการแสดงความเคารพแบบไทย)',
          pronunciation: 'ไอ ออลเวยส์ ไหว้ บีฟอร์ เอนเทอริง เดอะ เทมเปิล',
        },
      ],
      memoryHooks: ['routine = กิจวัตร (route = เส้นทาง + ine = แบบ)', 'habit = นิสัย (การกระทำประจำ)', 'temple = วัด (สถานที่ศักดิ์สิทธิ์)'],
      summaryPoints: ['เรียนรู้การบรรยายกิจวัตรประจำวัน', 'ฝึกใช้คำแสดงเวลาและความถี่', 'อธิบายวัฒนธรรมไทยเป็นภาษาอังกฤษ', 'เปรียบเทียบวิถีชีวิตไทยกับต่างประเทศ'],
    };
  }

  private createGeneralObjective(topic: string): LearningObjective {
    return {
      statement: `Learn essential English vocabulary and phrases related to ${topic}`,
      statementTh: `เรียนรู้คำศัพท์และวลีภาษาอังกฤษที่จำเป็นเกี่ยวกับ ${topic}`,
      stepByStepExplanation: [
        `1. Identify key vocabulary related to ${topic}`,
        '2. Practice pronunciation and meaning',
        '3. Use words in simple sentences',
        '4. Apply in Thai cultural contexts',
        '5. Practice with conversation examples',
      ],
      thaiContextExamples: [
        {
          englishPhrase: `I'm interested in learning about ${topic}`,
          thaiContext: `การแสดงความสนใจเรียนรู้เรื่อง ${topic}`,
          situation: 'General interest expression',
          memoryHook: `${topic} = หัวข้อสำคัญที่ต้องเรียนรู้`,
          pronunciation: `ไอม์ อินเทอเรสเต็ด อิน เลิร์นนิง อะเบาท์ ${topic}`,
        },
      ],
      memoryHooks: [`Remember ${topic} by connecting it to daily life`, 'Practice using the vocabulary in context', 'Associate with Thai equivalents'],
      summaryPoints: [`เรียนรู้คำศัพท์หลักเกี่ยวกับ ${topic}`, 'ฝึกการออกเสียงและความหมาย', 'นำไปใช้ในบริบทชีวิตจริง', 'เชื่อมโยงกับวัฒนธรรมไทย'],
    };
  }

  generateThaiMnemonics(vocabulary: string[]): { [word: string]: string } {
    const mnemonics: { [word: string]: string } = {};

    // Common Thai mnemonics for English words
    const commonMnemonics: { [key: string]: string } = {
      coffee: 'คอฟฟี่ = เสียงเหมือน "กบเฟี้ย" (กบที่ดื่มกาแฟ)',
      hotel: 'โฮเทล = "โห เทล" (โห! ที่นี่เทลขนาดนี้)',
      restaurant: 'เรสเทอรองต์ = "เรส เท่ รอง ต้อง" (รสชาติเท่านี้ รองไม่ได้ ต้องกิน)',
      spicy: 'สไปซี่ = "สไป ซี่" (ไปที่ซี่โครงเผ็ดๆ)',
      vegetarian: 'เวจเทเรียน = "เวจ เท เรียน" (ผักเท่านั้น ต้องเรียนรู้)',
      deposit: 'ดีพอซิต = "ดี พอ ซิต" (ดีพอ นั่งเงินไว้)',
      withdraw: 'วิธดรอ = "วิธ ดรอ" (วิธีดึงเงินออก)',
      discount: 'ดิสเคาท์ = "ดิส เคาท์" (ดีส์ นับเงินลด)',
      promotion: 'โปรโมชั่น = "โปร โม ชั่น" (โปรแกรมโมชั่นลด)',
      reservation: 'เรเซอร์เวชั่น = "เร เซอร์ เว ชั่น" (เร้าเซอร์วิสเวลาชั้น)',
      schedule: 'เชดดูล = "เช็ด ดูล" (เช็ดดูตารางเวลา)',
      automatic: 'ออโตเมติก = "ออโต้ เม ติก" (รถออโต้เมื่อติก)',
      fluent: 'ฟลูเอ็นท์ = "ฟลู เอ็นท์" (ไหลเหมือนเป็นธรรมชาติ)',
      repetition: 'รีพีทิชั่น = "รี พีท ชั่น" (ทำรีพีทช่วงนั้น)',
    };

    for (const vocab of vocabulary) {
      const word = vocab.split('(')[0].trim().toLowerCase();
      if (commonMnemonics[word]) {
        mnemonics[vocab] = commonMnemonics[word];
      } else {
        // Generate a simple phonetic mnemonic
        mnemonics[vocab] = this.generatePhoneticMnemonic(word);
      }
    }

    return mnemonics;
  }

  private generatePhoneticMnemonic(word: string): string {
    // Simple phonetic mnemonic generation
    const phoneticMap: { [key: string]: string } = {
      a: 'เอ',
      e: 'เอ',
      i: 'อิ',
      o: 'โอ',
      u: 'อู',
      b: 'บ',
      c: 'ซ',
      d: 'ด',
      f: 'ฟ',
      g: 'ก',
      h: 'ห',
      j: 'จ',
      k: 'ค',
      l: 'ล',
      m: 'ม',
      n: 'น',
      p: 'ป',
      q: 'ค',
      r: 'ร',
      s: 'ส',
      t: 'ท',
      v: 'ว',
      w: 'ว',
      x: 'ซ',
      y: 'ย',
      z: 'ซ',
    };

    let phonetic = '';
    for (const char of word.toLowerCase()) {
      phonetic += phoneticMap[char] || char;
    }

    return `${word} = ออกเสียง "${phonetic}" (จำด้วยการออกเสียงที่คล้ายไทย)`;
  }
}
