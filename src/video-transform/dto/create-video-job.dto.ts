import { IsString, IsUrl, IsOptional, IsNumber, IsEnum, IsObject, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TargetAudience } from '../entities/video-job.entity';

export class CreateVideoJobDto {
  @ApiProperty({
    description: 'YouTube video URL to be processed',
    example: 'https://www.youtube.com/watch?v=henIVlCPVIY',
  })
  @IsUrl({}, { message: 'Please provide a valid YouTube URL' })
  @IsString()
  youtubeUrl: string;

  @ApiProperty({
    description: 'Title for the video transformation job',
    example: 'Everyday English Conversation Practice | 30 Minutes English Listening',
  })
  @IsString()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the video transformation job',
    example:
      'You must do everyday English conversation practice to improve your English listening and speaking skills. If you want to understand native speakers instantly, you should listen to our everyday English conversation lessons repeatedly. \n\nIn this video, you will listen to several everyday English conversation examples in real life. So you will learn English vocabulary fast and you will improve your speaking.\n\nEnglish Tools & Courses \ud83d\udc49https://www.power-english.net/courses\n\nPlease listen to this lesson 2 times every day for one week so that you will be able to use English vocabulary and sentences automatically. \n\nYou can also watch our short stories to learn English. Just listen to our mini-stories and answer the easy questions out loud. Repeat the lessons every day for one week and you will improve your listening and speaking fast.\n\nShort Stories In English \ud83d\udc49 https://www.youtube.com/watch?v=FqmiLz29f9E&list=PLpODSd__yLPVVlSZo3RpAOiRZWHaUAoDb&index=1\n\n\u2b50 The Best English Courses \u2b50 \n------------------------------------------------------- \n\nEnglish Easy Practice \ud83d\udc49 https://englisheasypractice.com/ \n\nEnglish video lessons \ud83d\udc49https://www.gr8english.com/\n\n -------------------- \n\ud83d\udc49 Please share and like if you enjoyed the video :)\n\n\n\u2b50 Contents of this video\u2b50 \n\n00:00 - Everyday English Conversation\n00:32 - English at the hotel\n02:39 - English at the restaurant\n05:08 - English at the library\n07:38 - English at the coffee shop\n10:06 - English at the bank\n11:46 - English at the bookstore\n14:01 - English at the grocery store\n17:10 - English at the movie theater\n19:06 - English conversation for daily routine activities\n28:52 - English speaking practice\n\nThanks for watching our English video lessons \u2764\ufe0f \n\n#englishlistening #englishconversation #englishpractice',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Target duration for each video segment in seconds (5-10 minutes recommended)',
    example: 300,
    minimum: 180,
    maximum: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(180, {
    message: 'Segment duration should be at least 3 minutes (180 seconds)',
  })
  @Max(600, {
    message: 'Segment duration should not exceed 10 minutes (600 seconds)',
  })
  targetSegmentDuration?: number = 300;

  @ApiPropertyOptional({
    description: 'Target audience for content optimization',
    enum: TargetAudience,
    example: TargetAudience.THAI_COLLEGE_STUDENTS,
  })
  @IsOptional()
  @IsEnum(TargetAudience)
  targetAudience?: TargetAudience = TargetAudience.THAI_COLLEGE_STUDENTS;

  @ApiPropertyOptional({
    description: 'Additional processing preferences',
    example: {
      includeVietnameseSubtitles: false,
      focusOnGrammar: true,
      includeVocabularyHighlights: true,
      difficultyLevel: 'intermediate',
      generateQuizzes: true,
    },
  })
  @IsOptional()
  @IsObject()
  preferences?: {
    includeVietnameseSubtitles?: boolean;
    focusOnGrammar?: boolean;
    includeVocabularyHighlights?: boolean;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    generateQuizzes?: boolean;
  };
}
