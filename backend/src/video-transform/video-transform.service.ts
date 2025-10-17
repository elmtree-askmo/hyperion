import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoJob, JobStatus, VideoGenerationStatus } from './entities/video-job.entity';
import { CreateVideoJobDto } from './dto/create-video-job.dto';
import { VideoJobQueryDto } from './dto/video-job-query.dto';
import { EpisodeMetadataDto, EpisodesMetadataResponseDto } from './dto/episodes-metadata.dto';
import { YouTubeService } from './services/youtube.service';
import { LangChainContentAnalysisService } from './services/langchain-content-analysis.service';
import { MicrolessonScriptService } from './services/microlesson-script.service';
import { AudioSegmentsService } from './services/audio-segments.service';
import { TtsAudioSegmentsService } from './services/tts-audio-segments.service';
import { SynchronizedLessonService } from './services/synchronized-lesson.service';
import { GeminiImageService } from './services/gemini-image.service';
import { FlashcardsService } from './services/flashcards.service';
import { RemotionVideoService } from './services/remotion-video.service';
import { StorageService } from './services/storage.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VideoTransformService {
  private readonly logger = new Logger(VideoTransformService.name);
  constructor(
    @InjectRepository(VideoJob)
    private readonly videoJobRepository: Repository<VideoJob>,
    private readonly youtubeService: YouTubeService,
    private readonly langChainContentAnalysisService: LangChainContentAnalysisService,
    private readonly microlessonScriptService: MicrolessonScriptService,
    private readonly audioSegmentsService: AudioSegmentsService,
    private readonly ttsAudioSegmentsService: TtsAudioSegmentsService,
    private readonly synchronizedLessonService: SynchronizedLessonService,
    private readonly geminiImageService: GeminiImageService,
    private readonly flashcardsService: FlashcardsService,
    private readonly remotionVideoService: RemotionVideoService,
    private readonly storageService: StorageService,
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

  async getJobLessons(id: string, userId: string): Promise<any> {
    const videoJob = await this.getVideoJob(id, userId);

    // Extract video ID from YouTube URL
    const videoId = this.extractVideoIdFromUrl(videoJob.youtubeUrl);

    // Build the path to the video folder
    const videoFolderPath = path.join(process.cwd(), 'videos', videoId);

    // Check if the folder exists
    if (!fs.existsSync(videoFolderPath)) {
      throw new NotFoundException(`Video folder not found for job ${id}`);
    }

    // Read all directories in the video folder
    const items = fs.readdirSync(videoFolderPath, { withFileTypes: true });

    // Filter lesson folders (lesson_1, lesson_2, etc.)
    const lessons = items
      .filter((item) => item.isDirectory() && item.name.startsWith('lesson_'))
      .map((item) => `${videoId}/${item.name}`)
      .sort(); // Sort to ensure consistent order

    return {
      videoJobId: videoJob.id,
      videoId: videoId,
      lessons: lessons,
      totalLessons: lessons.length,
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
      this.logger.log(`✅ Generated ${microlessonScripts.length} microlesson scripts for series`);

      // Step 4: Generate audio content for each episode in the series
      // Get the series structure to process each episode
      if (lessonAnalysis.seriesStructure?.episodes) {
        for (const episode of lessonAnalysis.seriesStructure.episodes) {
          this.logger.log(`🎵 Processing audio for Episode ${episode.episodeNumber}: ${episode.title}`);

          // Step 4.1: Generate Vocabulary Flashcards for this episode
          await this.flashcardsService.generateFlashcards(videoId, episode.episodeNumber);

          // Step 4.2: Create Audio Segments Structure for this episode
          await this.audioSegmentsService.generateAudioSegmentsForEpisode(videoId, episode.episodeNumber);

          // Step 4.3: Generate Individual TTS Audio Segments for this episode
          await this.ttsAudioSegmentsService.generateTtsAudioSegmentsForEpisode(videoId, episode.episodeNumber);

          // Step 4.4: AI Background Image Generation
          await this.geminiImageService.generateImagesForEpisode(videoId, episode.episodeNumber);

          // Step 4.5: Create Synchronized Lesson for this episode
          await this.synchronizedLessonService.generateSynchronizedLessonForEpisode(videoId, episode.episodeNumber);
        }
      } else {
        this.logger.log('No episodes found in series structure');
        throw new BadRequestException('No episodes found in series structure');
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

  /**
   * Generate video with status tracking
   */
  async generateVideoWithStatusUpdate(
    jobId: string,
    lessonPath: string,
    outputPath: string,
  ): Promise<{
    success: boolean;
    outputPath: string;
    error?: string;
    videoGenerationStatus: string;
    currentLesson?: string;
  }> {
    // Get the video job
    const videoJob = await this.videoJobRepository.findOne({
      where: { id: jobId },
    });

    if (!videoJob) {
      throw new NotFoundException('Video job not found');
    }

    // Define status update callback
    const onStatusUpdate = async (status: 'generating' | 'completed' | 'failed', data?: any) => {
      this.logger.log(`Video generation status update: ${status} for lesson: ${data?.lessonPath}`);

      // Update video generation status
      if (status === 'generating') {
        videoJob.videoGenerationStatus = VideoGenerationStatus.GENERATING;
        videoJob.videoGenerationData = {
          ...videoJob.videoGenerationData,
          currentLesson: data?.lessonPath,
        };
      } else if (status === 'completed') {
        videoJob.videoGenerationStatus = VideoGenerationStatus.COMPLETED;

        // Add to generated videos list
        const generatedVideos = videoJob.videoGenerationData?.generatedVideos || [];
        generatedVideos.push({
          lessonPath: data?.lessonPath,
          outputPath: data?.outputPath,
          generatedAt: new Date(),
          success: true,
        });

        videoJob.videoGenerationData = {
          ...videoJob.videoGenerationData,
          generatedVideos,
          completedLessons: generatedVideos.length,
        };
      } else if (status === 'failed') {
        videoJob.videoGenerationStatus = VideoGenerationStatus.FAILED;

        // Add to generated videos list with error
        const generatedVideos = videoJob.videoGenerationData?.generatedVideos || [];
        generatedVideos.push({
          lessonPath: data?.lessonPath,
          outputPath: '',
          generatedAt: new Date(),
          success: false,
          error: data?.error,
        });

        videoJob.videoGenerationData = {
          ...videoJob.videoGenerationData,
          generatedVideos,
        };
      }

      // Save the updated job
      await this.videoJobRepository.save(videoJob);
    };

    // Generate video with status tracking
    const result = await this.remotionVideoService.generateVideo(lessonPath, outputPath, onStatusUpdate);

    return {
      success: result.success,
      outputPath: result.outputPath,
      error: result.error,
      videoGenerationStatus: videoJob.videoGenerationStatus,
      currentLesson: videoJob.videoGenerationData?.currentLesson,
    };
  }

  /**
   * Get video generation status for a job
   */
  async getVideoGenerationStatus(id: string, userId: string): Promise<any> {
    const videoJob = await this.getVideoJob(id, userId);

    return {
      videoJobId: videoJob.id,
      videoGenerationStatus: videoJob.videoGenerationStatus,
      currentLesson: videoJob.videoGenerationData?.currentLesson,
      generatedVideos: videoJob.videoGenerationData?.generatedVideos || [],
      totalLessons: videoJob.videoGenerationData?.totalLessons,
      completedLessons: videoJob.videoGenerationData?.completedLessons,
    };
  }

  /**
   * Get episodes metadata for a video
   * Retrieves title, thumbnail, and duration for all episodes
   */
  async getEpisodesMetadata(videoId: string): Promise<EpisodesMetadataResponseDto> {
    try {
      // Try to discover lessons by attempting to load them (works for both local and S3)
      // We'll try lessons 1-10 and collect the ones that exist
      const episodes: EpisodeMetadataDto[] = [];
      const maxLessonsToTry = 10;

      for (let lessonNumber = 1; lessonNumber <= maxLessonsToTry; lessonNumber++) {
        const lessonDir = `lesson_${lessonNumber}`;
        const lessonBasePath = `${videoId}/${lessonDir}`;

        // Check if microlesson_script.json exists for this lesson
        const microlessonPath = `${lessonBasePath}/microlesson_script.json`;
        const exists = await this.storageService.fileExists(microlessonPath);

        if (!exists) {
          // If lesson N doesn't exist, assume there are no more lessons
          break;
        }

        // Initialize default values
        let title = `Episode ${lessonNumber}`;
        let titleTh = `บทที่ ${lessonNumber}`;
        let thumbnail = this.storageService.getPublicUrl(`${lessonBasePath}/placeholder.png`);
        let duration = 300;

        try {
          // Load microlesson_script.json for title
          const microlessonData = await this.readJsonFileFromStorage(microlessonPath);
          if (microlessonData?.lesson?.title) {
            title = microlessonData.lesson.title;
          }
          if (microlessonData?.lesson?.titleTh) {
            titleTh = microlessonData.lesson.titleTh;
          }

          // Load final_synchronized_lesson.json for thumbnail and duration
          const synchronizedPath = `${lessonBasePath}/final_synchronized_lesson.json`;
          const synchronizedExists = await this.storageService.fileExists(synchronizedPath);

          if (synchronizedExists) {
            const synchronizedData = await this.readJsonFileFromStorage(synchronizedPath);

            if (synchronizedData?.lesson?.segmentBasedTiming) {
              const segments = synchronizedData.lesson.segmentBasedTiming;

              // Get thumbnail from first segment
              // Transform URL if it's a local path (for backward compatibility)
              if (segments[0]?.backgroundUrl) {
                const bgUrl = segments[0].backgroundUrl;
                // If it's a local path starting with /videos/, transform it
                if (bgUrl.startsWith('/videos/')) {
                  const relativePath = bgUrl.replace('/videos/', '');
                  thumbnail = this.storageService.getPublicUrl(relativePath);
                } else {
                  // Already a public URL or external URL
                  thumbnail = bgUrl;
                }
              }

              // Get duration from last segment
              if (segments.length > 0) {
                const lastSegment = segments[segments.length - 1];
                if (lastSegment?.endTime) {
                  duration = lastSegment.endTime;
                }
              }
            }
          }
        } catch (error) {
          this.logger.warn(`Could not load complete metadata for lesson_${lessonNumber}:`, error.message);
          // Continue with default values
        }

        episodes.push({
          episodeNumber: lessonNumber,
          title,
          titleTh,
          thumbnail,
          duration,
        });
      }

      if (episodes.length === 0) {
        throw new NotFoundException(`No lessons found for video ${videoId}`);
      }

      return {
        videoId,
        totalEpisodes: episodes.length,
        episodes,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to retrieve episodes metadata for video ${videoId}:`, error.message);
      throw new BadRequestException('Failed to retrieve episodes metadata');
    }
  }

  /**
   * Helper method to read JSON file from storage (local or cloud)
   */
  private async readJsonFileFromStorage(filePath: string): Promise<any> {
    const buffer = await this.storageService.readFile(filePath);
    const content = buffer.toString('utf-8');
    return JSON.parse(content);
  }

  /**
   * Helper method to read JSON file from local filesystem (deprecated)
   * @deprecated Use readJsonFileFromStorage instead
   */
  private async readJsonFile(filePath: string): Promise<any> {
    const content = await fs.promises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  }
}
