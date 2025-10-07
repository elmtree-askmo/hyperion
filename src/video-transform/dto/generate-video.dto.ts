/**
 * DTO for video generation request
 */
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty({
    description: 'Video job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  jobId: string;

  @ApiProperty({
    description: 'Path to the lesson folder (e.g., "henIVlCPVIY/lesson_1")',
    example: 'henIVlCPVIY/lesson_1',
  })
  @IsString()
  @IsNotEmpty()
  lessonPath: string;

  @ApiProperty({
    description: 'Output file name (optional, defaults to final_video.mp4)',
    example: 'final_microlesson.mp4',
    required: false,
  })
  @IsString()
  @IsOptional()
  outputFileName?: string;
}

export class VideoGenerationResponseDto {
  @ApiProperty({
    description: 'Whether the video generation was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'Path to the generated video file',
  })
  outputPath?: string;

  @ApiProperty({
    description: 'Error message if generation failed',
  })
  error?: string;

  @ApiProperty({
    description: 'Job ID for tracking progress',
  })
  jobId: string;

  @ApiProperty({
    description: 'Video generation status',
  })
  videoGenerationStatus: string;

  @ApiProperty({
    description: 'Current lesson being processed',
  })
  currentLesson?: string;
}
