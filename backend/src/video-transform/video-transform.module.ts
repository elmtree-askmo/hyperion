import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoTransformController } from './video-transform.controller';
import { VideoTransformService } from './video-transform.service';
import { VideoJob } from './entities/video-job.entity';
import { YouTubeService } from './services/youtube.service';
import { LangChainContentAnalysisService } from './services/langchain-content-analysis.service';
import { MicrolessonScriptService } from './services/microlesson-script.service';
import { LLMEnhancedMicrolessonService } from './services/llm-enhanced-microlesson.service';
import { AudioSegmentsService } from './services/audio-segments.service';
import { TtsAudioSegmentsService } from './services/tts-audio-segments.service';
import { SynchronizedLessonService } from './services/synchronized-lesson.service';
import { LLMConfigService } from './services/llm-config.service';
import { GeminiImageService } from './services/gemini-image.service';
import { ProxyConfigService } from './services/proxy-config.service';
import { FlashcardsService } from './services/flashcards.service';
import { RemotionVideoService } from './services/remotion-video.service';
import { StorageService } from './services/storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoTransformController],
  providers: [
    ProxyConfigService,
    LLMConfigService,
    StorageService,
    VideoTransformService,
    YouTubeService,
    LangChainContentAnalysisService,
    MicrolessonScriptService,
    LLMEnhancedMicrolessonService,
    AudioSegmentsService,
    TtsAudioSegmentsService,
    SynchronizedLessonService,
    GeminiImageService,
    FlashcardsService,
    RemotionVideoService,
  ],
  exports: [VideoTransformService, StorageService],
})
export class VideoTransformModule {}
