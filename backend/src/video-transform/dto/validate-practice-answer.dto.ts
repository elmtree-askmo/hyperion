import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidatePracticeAnswerDto {
  @ApiProperty({ description: 'Context of the practice exercise' })
  @IsString()
  @IsNotEmpty()
  context: string;

  @ApiProperty({ description: 'The question being asked' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'Expected answer for reference' })
  @IsString()
  @IsNotEmpty()
  expectedAnswer: string;

  @ApiProperty({ description: 'User submitted answer' })
  @IsString()
  @IsNotEmpty()
  userAnswer: string;
}

export class ValidatePracticeAnswerResponseDto {
  @ApiProperty({ description: 'Whether the answer is correct' })
  isCorrect: boolean;

  @ApiProperty({ description: 'Feedback message in Thai' })
  feedbackTh: string;

  @ApiProperty({ description: 'Feedback message in English' })
  feedbackEn: string;

  @ApiProperty({ description: 'Detailed evaluation (optional)' })
  evaluation?: string;
}
