/**
 * DTO for video generation request
 */
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateVideoDto {
  @ApiProperty({
    description: 'Path to the lesson folder (e.g., "henIVlCPVIY/lesson_1")',
    example: 'henIVlCPVIY/lesson_1',
  })
  @IsString()
  @IsNotEmpty()
  lessonPath: string;

  @ApiProperty({
    description: 'Output file name (optional, defaults to final_video.mp4)',
    example: 'lesson_1_final.mp4',
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
  jobId?: string;
}
