import { Controller, Post, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { VideoTransformService } from './video-transform.service';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';

@ApiTags('video-transform')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('video-transform')
export class VideoTransformController {
  constructor(private readonly videoTransformService: VideoTransformService) {}

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
}
