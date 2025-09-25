import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoJob, JobStatus } from './entities/video-job.entity';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { YouTubeService } from './services/youtube.service';
import { LangChainContentAnalysisService } from './services/langchain-content-analysis.service';
import { MicrolessonScriptService } from './services/microlesson-script.service';
import { AudioSegmentsService } from './services/audio-segments.service';
import { TtsAudioSegmentsService } from './services/tts-audio-segments.service';
import { SynchronizedLessonService } from './services/synchronized-lesson.service';

@Injectable()
export class VideoTransformService {
  constructor(
    @InjectRepository(VideoJob)
    private readonly videoJobRepository: Repository<VideoJob>,
    private readonly youtubeService: YouTubeService,
    private readonly langChainContentAnalysisService: LangChainContentAnalysisService,
    private readonly microlessonScriptService: MicrolessonScriptService,
    private readonly audioSegmentsService: AudioSegmentsService,
    private readonly ttsAudioSegmentsService: TtsAudioSegmentsService,
    private readonly synchronizedLessonService: SynchronizedLessonService,
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

    if (videoJob.status !== JobStatus.PENDING && videoJob.status !== JobStatus.PROCESSING) {
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

      if (videoMetadata && videoJob.title !== videoMetadata.title) {
        videoJob.title = videoMetadata.title;
        videoJob.description = videoMetadata.description;
        videoJob.updatedAt = new Date();
        await this.videoJobRepository.save(videoJob);
      }

      // Step 2: Download video transcript/subtitles
      const transcript = await this.youtubeService.getVideoTranscript(videoJob.youtubeUrl);

      // Step 3.1: Comprehensive content analysis
      const lessonAnalysis = await this.langChainContentAnalysisService.analyzeVideoContent(
        videoMetadata,
        transcript,
        videoJob.targetAudience,
        videoJob.targetSegmentDuration,
        videoJob.youtubeUrl,
      );

      // Extract segments and analysis data
      const enhancedSegments = lessonAnalysis.segments.map((segment) => ({
        segmentNumber: parseInt(segment.id.split('_')[1]) || 1,
        startTime: segment.startTime,
        endTime: segment.endTime,
        title: segment.title,
        content: segment.content,
        keyTopics: segment.keyTopics,
        difficulty: segment.difficulty,
        estimatedComprehensionTime: Math.round(segment.duration / 60), // Convert to minutes
        vocabularyLevel: this.mapDifficultyToLevel(segment.difficulty),
        grammarFocus: segment.keyTopics.slice(0, 3), // Use key topics as grammar focus
        // Add lesson analysis data
        learningObjectives: segment.learningObjectives,
        prerequisites: segment.prerequisites,
        lessonAnalysis: {
          objectives: lessonAnalysis.learningObjectives,
          prerequisites: lessonAnalysis.prerequisites,
          seriesStructure: lessonAnalysis.seriesStructure,
        },
      }));

      const videoId = this.extractVideoIdFromUrl(videoJob.youtubeUrl);

      // Step 3.2: Generate microlesson scripts for Thai context (multiple episodes)
      const microlessonScripts = await this.microlessonScriptService.generateMicrolessonScript(videoId);
      console.log(`✅ Generated ${microlessonScripts.length} microlesson scripts for series`);

      // Step 4: Generate audio content for each episode in the series
      // Get the series structure to process each episode
      if (lessonAnalysis.seriesStructure?.episodes) {
        for (const episode of lessonAnalysis.seriesStructure.episodes) {
          console.log(`🎵 Processing audio for Episode ${episode.episodeNumber}: ${episode.title}`);

          // Step 4.1: Create Audio Segments Structure for this episode
          await this.audioSegmentsService.generateAudioSegmentsForEpisode(videoId, episode.episodeNumber);

          // Step 4.2: Generate Individual TTS Audio Segments for this episode
          await this.ttsAudioSegmentsService.generateTtsAudioSegmentsForEpisode(videoId, episode.episodeNumber);

          // Step 4.3: Create Synchronized Lesson for this episode
          await this.synchronizedLessonService.generateSynchronizedLessonForEpisode(videoId, episode.episodeNumber);
        }
      } else {
        // Fallback to old behavior for single microlesson
        console.log('🎵 Processing audio for single microlesson (fallback mode)');

        // Step 4.1: Create Audio Segments Structure
        await this.audioSegmentsService.generateAudioSegments(videoId);

        // Step 4.2: Generate Individual TTS Audio Segments
        await this.ttsAudioSegmentsService.generateTtsAudioSegments(videoId);

        // Step 4.3: Create Synchronized Lesson with segmentBasedTiming
        await this.synchronizedLessonService.generateSynchronizedLesson(videoId);
      }

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

  private mapDifficultyToLevel(difficulty: 'beginner' | 'intermediate' | 'advanced'): number {
    const levelMap = {
      beginner: 3,
      intermediate: 6,
      advanced: 9,
    };
    return levelMap[difficulty] || 5;
  }

  private extractVideoIdFromUrl(youtubeUrl: string): string {
    // Extract video ID from YouTube URL
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    const match = regex.exec(youtubeUrl);
    return match ? match[1] : youtubeUrl;
  }
}
