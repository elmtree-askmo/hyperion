import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum VideoGenerationStatus {
  NOT_STARTED = 'not_started',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TargetAudience {
  THAI_COLLEGE_STUDENTS = 'thai_college_students',
  GENERAL = 'general',
}

@Entity('video_jobs')
export class VideoJob {
  @ApiProperty({ description: 'Unique identifier for the video job' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User ID who created the job' })
  @Column({ name: 'user_id' })
  userId: string;

  @ApiProperty({ description: 'YouTube video URL to be processed' })
  @Column({ name: 'youtube_url' })
  youtubeUrl: string;

  @ApiProperty({ description: 'Title for the video transformation job' })
  @Column()
  title: string;

  @ApiProperty({ description: 'Description of the video transformation job' })
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    description: 'Target duration for each video segment in seconds',
  })
  @Column({ name: 'target_segment_duration', default: 300 }) // 5 minutes default
  targetSegmentDuration: number;

  @ApiProperty({ description: 'Target audience for content optimization' })
  @Column({
    type: 'enum',
    enum: TargetAudience,
    default: TargetAudience.THAI_COLLEGE_STUDENTS,
    name: 'target_audience',
  })
  targetAudience: TargetAudience;

  @ApiProperty({ description: 'Current status of the video processing job' })
  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @ApiProperty({ description: 'Original video duration in seconds' })
  @Column({ name: 'original_duration', nullable: true })
  originalDuration?: number;

  @ApiProperty({ description: 'Generated video segments data' })
  @Column({ type: 'jsonb', name: 'output_segments', nullable: true })
  outputSegments?: any[];

  @ApiProperty({ description: 'Error message if processing failed' })
  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage?: string;

  @ApiProperty({ description: 'When the job was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the job was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ApiProperty({ description: 'When the job processing was completed' })
  @Column({ name: 'processed_at', nullable: true })
  processedAt?: Date;

  @ApiProperty({ description: 'Video generation status for each lesson' })
  @Column({
    type: 'enum',
    enum: VideoGenerationStatus,
    default: VideoGenerationStatus.NOT_STARTED,
    name: 'video_generation_status',
  })
  videoGenerationStatus: VideoGenerationStatus;

  @ApiProperty({ description: 'Video generation progress and metadata' })
  @Column({ type: 'jsonb', name: 'video_generation_data', nullable: true })
  videoGenerationData?: {
    currentLesson?: string;
    generatedVideos?: Array<{
      lessonPath: string;
      outputPath: string;
      generatedAt: Date;
      success: boolean;
      error?: string;
    }>;
    totalLessons?: number;
    completedLessons?: number;
  };

  @ApiProperty({ description: 'Additional processing preferences' })
  @Column({ type: 'jsonb', nullable: true })
  preferences?: {
    includeVietnameseSubtitles?: boolean;
    focusOnGrammar?: boolean;
    includeVocabularyHighlights?: boolean;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    generateQuizzes?: boolean;
  };
}
