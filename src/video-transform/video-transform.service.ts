import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoJob, JobStatus } from './entities/video-job.entity';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { YouTubeService } from './services/youtube.service';
import { ContentAnalysisService } from './services/content-analysis.service';

@Injectable()
export class VideoTransformService {
  constructor(
    @InjectRepository(VideoJob)
    private readonly videoJobRepository: Repository<VideoJob>,
    private readonly youtubeService: YouTubeService,
    private readonly contentAnalysisService: ContentAnalysisService,
  ) {}

  async createVideoJob(createVideoJobDto: CreateVideoJobDto, userId: string): Promise<VideoJob> {
    // Validate YouTube URL
    if (!this.youtubeService.isValidYouTubeUrl(createVideoJobDto.youtubeUrl)) {
      throw new BadRequestException('Invalid YouTube URL provided');
    }

    // Create new video job
    const videoJob = this.videoJobRepository.create({
      ...createVideoJobDto,
      userId,
      status: JobStatus.PENDING,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.videoJobRepository.save(videoJob);
  }

  async getVideoJobs(userId: string, queryDto: VideoJobQueryDto): Promise<VideoJob[]> {
    const query = this.videoJobRepository.createQueryBuilder('videoJob').where('videoJob.userId = :userId', { userId }).orderBy('videoJob.createdAt', 'DESC');

    if (queryDto.status) {
      query.andWhere('videoJob.status = :status', { status: queryDto.status });
    }

    if (queryDto.limit) {
      query.limit(queryDto.limit);
    }

    if (queryDto.offset) {
      query.offset(queryDto.offset);
    }

    return query.getMany();
  }

  async getVideoJob(id: string, userId: string): Promise<VideoJob> {
    const videoJob = await this.videoJobRepository.findOne({
      where: { id, userId },
    });

    if (!videoJob) {
      throw new NotFoundException('Video job not found');
    }

    return videoJob;
  }

  async startVideoProcessing(id: string, userId: string): Promise<VideoJob> {
    const videoJob = await this.getVideoJob(id, userId);

    if (videoJob.status !== JobStatus.PENDING) {
      throw new BadRequestException('Video job cannot be started in current status');
    }

    // Update job status to processing
    videoJob.status = JobStatus.PROCESSING;
    videoJob.updatedAt = new Date();
    await this.videoJobRepository.save(videoJob);

    // Start background processing
    this.processVideoInBackground(videoJob);

    return videoJob;
  }

  async getVideoSegments(id: string, userId: string): Promise<any> {
    const videoJob = await this.getVideoJob(id, userId);

    if (videoJob.status !== JobStatus.COMPLETED) {
      throw new BadRequestException('Video processing not completed yet');
    }

    return {
      videoJobId: videoJob.id,
      segments: videoJob.outputSegments || [],
      totalSegments: videoJob.outputSegments?.length || 0,
      originalDuration: videoJob.originalDuration,
      targetSegmentDuration: videoJob.targetSegmentDuration,
    };
  }

  private async processVideoInBackground(videoJob: VideoJob): Promise<void> {
    try {
      // Step 1: Extract video metadata from YouTube
      const videoMetadata = await this.youtubeService.getVideoMetadata(videoJob.youtubeUrl);

      // Step 2: Download video transcript/subtitles
      const transcript = await this.youtubeService.getVideoTranscript(videoJob.youtubeUrl);

      // Step 3: Analyze content and create segments optimized for Thai college students
      const segments = await this.contentAnalysisService.analyzeAndSegmentContent(videoMetadata, transcript, videoJob.targetSegmentDuration, videoJob.targetAudience);

      // Step 4: Generate educational enhancements for each segment
      const enhancedSegments = await Promise.all(
        segments.map(async (segment) => {
          const enhancements = await this.contentAnalysisService.generateEducationalEnhancements(segment, videoJob.targetAudience);
          return {
            ...segment,
            ...enhancements,
          };
        }),
      );

      // Update job with results
      videoJob.status = JobStatus.COMPLETED;
      videoJob.originalDuration = videoMetadata.duration;
      videoJob.outputSegments = enhancedSegments;
      videoJob.processedAt = new Date();
      videoJob.updatedAt = new Date();

      await this.videoJobRepository.save(videoJob);
    } catch (error) {
      // Handle processing error
      videoJob.status = JobStatus.FAILED;
      videoJob.errorMessage = error.message;
      videoJob.updatedAt = new Date();
      await this.videoJobRepository.save(videoJob);
    }
  }
}
