import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, Response, NotFoundException, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VideoTransformService } from './video-transform.service';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { RemotionVideoService } from './services/remotion-video.service';
import { GenerateVideoDto, VideoGenerationResponseDto } from './dto/generate-video.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@ApiTags('video-transform')
@Controller('video-transform')
export class VideoTransformController {
  constructor(
    private readonly videoTransformService: VideoTransformService,
    private readonly remotionVideoService: RemotionVideoService,
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
   * Get complete lesson data for interactive viewer (PUBLIC ENDPOINT - No Auth Required)
   * Must be before :id routes to avoid conflicts
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
      const lessonDir = path.join(process.cwd(), 'videos', videoId, lessonId);

      // Check if lesson directory exists
      try {
        await fs.access(lessonDir);
      } catch {
        throw new NotFoundException(`Lesson ${lessonId} not found for video ${videoId}`);
      }

      // Load all required files
      const [microlessonScript, flashcards, audioSegments, finalSynchronizedLesson] = await Promise.allSettled([
        this.readJsonFile(path.join(lessonDir, 'microlesson_script.json')),
        this.readJsonFile(path.join(lessonDir, 'flashcards.json')),
        this.readJsonFile(path.join(lessonDir, 'audio_segments.json')),
        this.readJsonFile(path.join(lessonDir, 'final_synchronized_lesson.json')),
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
        response.finalSynchronizedLesson = finalSynchronizedLesson.value;
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

  /**
   * Get list of available lessons for a video (PUBLIC ENDPOINT - No Auth Required)
   * Must be before :id routes to avoid conflicts
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
   * Helper method to read and parse JSON file
   */
  private async readJsonFile(filePath: string): Promise<any> {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}
