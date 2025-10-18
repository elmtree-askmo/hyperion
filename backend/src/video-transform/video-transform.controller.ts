import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, Response, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VideoTransformService } from './video-transform.service';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { RemotionVideoService } from './services/remotion-video.service';
import { StorageService } from './services/storage.service';
import { GenerateVideoDto, VideoGenerationResponseDto } from './dto/generate-video.dto';
import { ValidatePracticeAnswerDto, ValidatePracticeAnswerResponseDto } from './dto/validate-practice-answer.dto';
import { PracticeValidationService } from './services/practice-validation.service';
import * as fs from 'fs/promises';
import * as path from 'path';

@ApiTags('video-transform')
@Controller('video-transform')
export class VideoTransformController {
  constructor(
    private readonly videoTransformService: VideoTransformService,
    private readonly remotionVideoService: RemotionVideoService,
    private readonly storageService: StorageService,
    private readonly practiceValidationService: PracticeValidationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new video transformation job' })
  @ApiResponse({
    status: 201,
    description: 'Video transformation job created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async createVideoJob(@Body() createVideoJobDto: CreateVideoJobDto, @Request() req: any) {
    return this.videoTransformService.createVideoJob(createVideoJobDto, req.user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all video transformation jobs for current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Video jobs retrieved successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getVideoJobs(@Query() queryDto: VideoJobQueryDto, @Request() req: any) {
    return this.videoTransformService.getVideoJobs(req.user.id, queryDto);
  }

  /**
   * Get episodes metadata for a video (PUBLIC ENDPOINT - No Auth Required)
   * Returns title, thumbnail, and duration for all episodes
   * IMPORTANT: Must be before lessons/:videoId/:lessonId to avoid route conflicts
   */
  @Get('lessons/:videoId/episodes')
  @ApiOperation({ summary: 'Get episodes metadata for interactive viewer' })
  @ApiResponse({
    status: 200,
    description: 'Episodes metadata retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getEpisodesMetadata(@Param('videoId') videoId: string) {
    return this.videoTransformService.getEpisodesMetadata(videoId);
  }

  /**
   * Get list of available lessons for a video (PUBLIC ENDPOINT - No Auth Required)
   * IMPORTANT: Must be before lessons/:videoId/:lessonId to avoid route conflicts
   */
  @Get('lessons/:videoId')
  @ApiOperation({ summary: 'Get list of available lessons for a video' })
  @ApiResponse({
    status: 200,
    description: 'Lessons list retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video not found.' })
  async getAvailableLessons(@Param('videoId') videoId: string) {
    try {
      const videosDir = path.join(process.cwd(), 'videos', videoId);

      // Check if video directory exists
      try {
        await fs.access(videosDir);
      } catch {
        throw new NotFoundException(`Video ${videoId} not found`);
      }

      // Read all directories that start with "lesson_"
      const entries = await fs.readdir(videosDir, { withFileTypes: true });
      const lessons = entries
        .filter((entry) => entry.isDirectory() && entry.name.startsWith('lesson_'))
        .map((entry) => entry.name)
        .sort();

      return {
        videoId,
        lessons,
        count: lessons.length,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve lessons');
    }
  }

  /**
   * Get complete lesson data for interactive viewer (PUBLIC ENDPOINT - No Auth Required)
   * IMPORTANT: Must be after specific routes like /episodes to avoid conflicts
   */
  @Get('lessons/:videoId/:lessonId')
  @ApiOperation({ summary: 'Get complete lesson data for interactive viewer' })
  @ApiResponse({
    status: 200,
    description: 'Lesson data retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Lesson not found.' })
  async getLessonData(@Param('videoId') videoId: string, @Param('lessonId') lessonId: string) {
    try {
      // Use storage-agnostic paths (works for both local and cloud storage)
      const lessonBasePath = `${videoId}/${lessonId}`;

      // Check if main lesson file exists
      const microlessonExists = await this.storageService.fileExists(`${lessonBasePath}/microlesson_script.json`);
      if (!microlessonExists) {
        throw new NotFoundException(`Lesson ${lessonId} not found for video ${videoId}`);
      }

      // Load all required files using StorageService
      const [microlessonScript, flashcards, audioSegments, finalSynchronizedLesson] = await Promise.allSettled([
        this.readJsonFileFromStorage(`${lessonBasePath}/microlesson_script.json`),
        this.readJsonFileFromStorage(`${lessonBasePath}/flashcards.json`),
        this.readJsonFileFromStorage(`${lessonBasePath}/audio_segments.json`),
        this.readJsonFileFromStorage(`${lessonBasePath}/final_synchronized_lesson.json`),
      ]);

      // Build response with available data
      const response: any = {
        videoId,
        lessonId,
      };

      if (microlessonScript.status === 'fulfilled') {
        response.microlessonScript = microlessonScript.value;
      }

      if (flashcards.status === 'fulfilled') {
        response.flashcards = flashcards.value.flashcards || flashcards.value;
      }

      if (audioSegments.status === 'fulfilled') {
        response.audioSegments = audioSegments.value.audioSegments || audioSegments.value.segments || audioSegments.value;
      }

      if (finalSynchronizedLesson.status === 'fulfilled') {
        // Transform local URLs to storage URLs (supports both local and S3)
        const transformedLesson = this.transformLessonUrls(finalSynchronizedLesson.value, videoId, lessonId);
        response.finalSynchronizedLesson = transformedLesson;
      }

      // Check if we have at least the basic data
      if (!response.microlessonScript) {
        throw new NotFoundException('Lesson data incomplete: missing microlesson_script.json');
      }

      return response;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve lesson data');
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific video transformation job' })
  @ApiResponse({
    status: 200,
    description: 'Video job retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getVideoJob(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.getVideoJob(id, req.user.id);
  }

  @Post(':id/start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start processing a video transformation job' })
  @ApiResponse({
    status: 200,
    description: 'Video processing started successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  @ApiResponse({ status: 400, description: 'Video job cannot be started.' })
  async startVideoProcessing(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.startVideoProcessing(id, req.user.id);
  }

  @Get(':id/segments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get generated video segments for a job' })
  @ApiResponse({
    status: 200,
    description: 'Video segments retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  async getVideoSegments(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.getVideoSegments(id, req.user.id);
  }

  @Get(':id/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lessons for a video job' })
  @ApiResponse({
    status: 200,
    description: 'Lessons list retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  async getJobLessons(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.getJobLessons(id, req.user.id);
  }

  @Post('generate-video')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate final MP4 video using Remotion' })
  @ApiResponse({
    status: 200,
    description: 'Video generation started successfully.',
    type: VideoGenerationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 404, description: 'Lesson data not found.' })
  async generateVideo(@Body() generateVideoDto: GenerateVideoDto, @Request() req: any): Promise<VideoGenerationResponseDto> {
    const { jobId, lessonPath, outputFileName } = generateVideoDto;

    // Verify job ownership
    await this.videoTransformService.getVideoJob(jobId, req.user.id);

    // Default output file name
    const fileName = outputFileName || 'final_video.mp4';
    const outputPath = `videos/${lessonPath}/${fileName}`;

    // Generate video with status updates
    const result = await this.videoTransformService.generateVideoWithStatusUpdate(jobId, lessonPath, outputPath);

    return {
      success: result.success,
      outputPath: result.outputPath,
      error: result.error,
      jobId: jobId,
      videoGenerationStatus: result.videoGenerationStatus,
      currentLesson: result.currentLesson,
    };
  }

  @Get(':id/video-generation-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get video generation status for a job' })
  @ApiResponse({
    status: 200,
    description: 'Video generation status retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  async getVideoGenerationStatus(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.getVideoGenerationStatus(id, req.user.id);
  }

  /**
   * Validate practice exercise answer using LLM (PUBLIC ENDPOINT - No Auth Required)
   * Used by interactive viewer practice mode
   */
  @Post('validate-practice-answer')
  @ApiOperation({ summary: 'Validate practice exercise answer with LLM' })
  @ApiResponse({
    status: 200,
    description: 'Answer validated successfully.',
    type: ValidatePracticeAnswerResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  async validatePracticeAnswer(@Body() validateDto: ValidatePracticeAnswerDto): Promise<ValidatePracticeAnswerResponseDto> {
    return this.practiceValidationService.validateAnswer(validateDto);
  }

  /**
   * Helper method to transform URLs in synchronized lesson data
   * Converts local /videos/ paths to storage-appropriate URLs (local or S3)
   */
  private transformLessonUrls(lessonData: any, videoId: string, lessonId: string): any {
    if (!lessonData?.lesson?.segmentBasedTiming) {
      return lessonData;
    }

    // Deep clone to avoid mutating original data
    const transformed = JSON.parse(JSON.stringify(lessonData));

    // Transform each segment's URLs
    transformed.lesson.segmentBasedTiming = transformed.lesson.segmentBasedTiming.map((segment: any) => {
      // Transform audioUrl if it starts with /videos/
      if (segment.audioUrl && segment.audioUrl.startsWith('/videos/')) {
        const relativePath = segment.audioUrl.replace('/videos/', '');
        segment.audioUrl = this.storageService.getPublicUrl(relativePath);
      }

      // Transform backgroundUrl if it starts with /videos/
      if (segment.backgroundUrl && segment.backgroundUrl.startsWith('/videos/')) {
        const relativePath = segment.backgroundUrl.replace('/videos/', '');
        segment.backgroundUrl = this.storageService.getPublicUrl(relativePath);
      }

      return segment;
    });

    return transformed;
  }

  /**
   * Helper method to read and parse JSON file from storage (local or cloud)
   */
  private async readJsonFileFromStorage(filePath: string): Promise<any> {
    const buffer = await this.storageService.readFile(filePath);
    const content = buffer.toString('utf-8');
    return JSON.parse(content);
  }

  /**
   * Helper method to read and parse JSON file from local filesystem (deprecated)
   * @deprecated Use readJsonFileFromStorage instead
   */
  private async readJsonFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}
