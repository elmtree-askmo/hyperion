import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, Response } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VideoTransformService } from './video-transform.service';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { RemotionVideoService } from './services/remotion-video.service';
import { GenerateVideoDto, VideoGenerationResponseDto } from './dto/generate-video.dto';

@ApiTags('video-transform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('video-transform')
export class VideoTransformController {
  constructor(
    private readonly videoTransformService: VideoTransformService,
    private readonly remotionVideoService: RemotionVideoService,
  ) {}

  @Post()
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

  @Get(':id')
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
  @ApiOperation({ summary: 'Get video generation status for a job' })
  @ApiResponse({
    status: 200,
    description: 'Video generation status retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Video job not found.' })
  async getVideoGenerationStatus(@Param('id') id: string, @Request() req: any) {
    return this.videoTransformService.getVideoGenerationStatus(id, req.user.id);
  }
}
