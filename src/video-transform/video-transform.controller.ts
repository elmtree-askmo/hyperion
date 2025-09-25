import { Controller, Post, Get, Param, Body, UseGuards, Request, Query, Response } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VideoTransformService } from './video-transform.service';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { TtsAudioSegmentsService, TtsTimingMetadata } from './services/tts-audio-segments.service';
import { TtsTimingMetadataResponse } from './dto/tts-timing-metadata.dto';

@ApiTags('video-transform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('video-transform')
export class VideoTransformController {
  constructor(
    private readonly videoTransformService: VideoTransformService,
    private readonly ttsAudioSegmentsService: TtsAudioSegmentsService,
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

  @Get(':id/tts-timing')
  @ApiOperation({ summary: 'Get TTS timing metadata for a video job' })
  @ApiResponse({
    status: 200,
    description: 'TTS timing metadata retrieved successfully.',
    type: TtsTimingMetadataResponse,
  })
  @ApiResponse({ status: 404, description: 'Video job or TTS data not found.' })
  async getTtsTimingMetadata(@Param('id') id: string, @Request() req: any): Promise<TtsTimingMetadata> {
    // Verify user owns the video job
    const videoJob = await this.videoTransformService.getVideoJob(id, req.user.id);
    const videoId = this.extractVideoIdFromUrl(videoJob.youtubeUrl);

    const timingMetadata = await this.ttsAudioSegmentsService.getTtsTimingMetadata(videoId);
    if (!timingMetadata) {
      throw new Error('TTS timing metadata not found');
    }

    return timingMetadata;
  }

  @Get(':id/tts-audio/:segmentId')
  @ApiOperation({ summary: 'Download TTS audio file for a specific segment' })
  @ApiResponse({
    status: 200,
    description: 'Audio file retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Audio file not found.' })
  async getTtsAudioSegment(@Param('id') id: string, @Param('segmentId') segmentId: string, @Request() req: any, @Response() res: any) {
    // Verify user owns the video job
    const videoJob = await this.videoTransformService.getVideoJob(id, req.user.id);
    const videoId = this.extractVideoIdFromUrl(videoJob.youtubeUrl);

    const audioBuffer = await this.ttsAudioSegmentsService.getSegmentAudioFile(videoId, segmentId);
    if (!audioBuffer) {
      return res.status(404).json({ message: 'Audio file not found' });
    }

    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': `attachment; filename="${segmentId}.wav"`,
    });

    return res.send(audioBuffer);
  }

  private extractVideoIdFromUrl(youtubeUrl: string): string {
    // Extract video ID from YouTube URL
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = regex.exec(youtubeUrl);
    return match ? match[1] : youtubeUrl;
  }
}
