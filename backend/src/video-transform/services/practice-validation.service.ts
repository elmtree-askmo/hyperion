import { Injectable, Logger } from '@nestjs/common';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { LLMConfigService } from './llm-config.service';
import { ValidatePracticeAnswerDto, ValidatePracticeAnswerResponseDto } from '../dto/validate-practice-answer.dto';

@Injectable()
export class PracticeValidationService {
  private readonly logger = new Logger(PracticeValidationService.name);

  constructor(private readonly llmConfigService: LLMConfigService) {}

  /**
   * Validate student's practice answer using LLM as a teacher
   * @param dto Practice answer validation data
   * @returns Validation result with feedback
   */
  async validateAnswer(dto: ValidatePracticeAnswerDto): Promise<ValidatePracticeAnswerResponseDto> {
    try {
      this.logger.log('🎓 Validating practice answer with LLM...');

      const llm = this.llmConfigService.getLLMWithConfig({
        temperature: 0.3,
      });

      if (!llm) {
        throw new Error('LLM is not available');
      }

      // Create prompt template for answer validation
      const promptTemplate = PromptTemplate.fromTemplate(`
You are an experienced English teacher for Thai college students. Your role is to evaluate whether a student's answer to a practice question is correct.

CONTEXT:
{context}

QUESTION:
{question}

EXPECTED ANSWER (for reference):
{expectedAnswer}

STUDENT'S ANSWER:
{userAnswer}

Instructions:
1. Evaluate if the student's answer demonstrates understanding of the concept
2. Consider semantic meaning, not just exact wording
3. Accept answers that are substantially correct even if phrased differently
4. Be encouraging but honest

Respond ONLY with a valid JSON object in this exact format (no markdown, no code blocks):
{{
  "isCorrect": true or false,
  "feedbackTh": "ภาษาไทยเท่านั้น - คำติชมสั้น ๆ สำหรับนักเรียนชาวไทย",
  "feedbackEn": "English only - Short feedback for the student",
  "evaluation": "Brief explanation of why the answer is correct or incorrect"
}}

Examples of correct responses:

For CORRECT answer:
{{
  "isCorrect": true,
  "feedbackTh": "ยอดเยี่ยม! คำตอบของคุณถูกต้อง",
  "feedbackEn": "Excellent! Your answer is correct",
  "evaluation": "The student correctly identified the main concept and provided a clear explanation."
}}

For INCORRECT answer:
{{
  "isCorrect": false,
  "feedbackTh": "ลองอีกครั้ง คำตอบยังไม่ถูกต้อง",
  "feedbackEn": "Try again. Your answer is not quite correct",
  "evaluation": "The student's answer misses the key point about..."
}}

For PARTIALLY CORRECT answer (treat as correct with constructive feedback):
{{
  "isCorrect": true,
  "feedbackTh": "ดีมาก! คำตอบส่วนใหญ่ถูกต้อง",
  "feedbackEn": "Good job! Your answer is mostly correct",
  "evaluation": "The student shows good understanding but could elaborate more on..."
}}

Now evaluate the student's answer:
`);

      const outputParser = new StringOutputParser();
      const chain = RunnableSequence.from([promptTemplate, llm, outputParser]);

      const result = await chain.invoke({
        context: dto.context,
        question: dto.question,
        expectedAnswer: dto.expectedAnswer,
        userAnswer: dto.userAnswer,
      });

      // Parse the JSON response
      const cleanedResult = this.cleanJsonResponse(result);
      const validationResult = JSON.parse(cleanedResult);

      this.logger.log(`✅ Validation complete: ${validationResult.isCorrect ? 'CORRECT' : 'INCORRECT'}`);

      return {
        isCorrect: validationResult.isCorrect,
        feedbackTh: validationResult.feedbackTh,
        feedbackEn: validationResult.feedbackEn,
        evaluation: validationResult.evaluation,
      };
    } catch (error) {
      this.logger.error('❌ Failed to validate answer:', error);

      // Fallback response in case of error
      return {
        isCorrect: false,
        feedbackTh: 'เกิดข้อผิดพลาดในการตรวจคำตอบ กรุณาลองใหม่อีกครั้ง',
        feedbackEn: 'An error occurred while checking your answer. Please try again.',
        evaluation: 'System error during validation',
      };
    }
  }

  /**
   * Clean JSON response from LLM by removing markdown code blocks and extra whitespace
   */
  private cleanJsonResponse(response: string): string {
    let cleaned = response.trim();

    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\s*/g, '');
    cleaned = cleaned.replace(/```\s*/g, '');

    // Find the first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return cleaned;
  }
}
