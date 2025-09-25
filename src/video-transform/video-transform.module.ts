import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoTransformController } from './video-transform.controller';
import { VideoTransformService } from './video-transform.service';
import { VideoJob } from './entities/video-job.entity';
import { YouTubeService } from './services/youtube.service';
import { ContentAnalysisService } from './services/content-analysis.service';
import { LangChainContentAnalysisService } from './services/langchain-content-analysis.service';
import { MicrolessonScriptService } from './services/microlesson-script.service';
import { ThaiContextEnhancerService } from './services/thai-context-enhancer.service';
import { DynamicSceneAnalyzerService } from './services/dynamic-scene-analyzer.service';
import { AudioSegmentsService } from './services/audio-segments.service';
import { TtsAudioSegmentsService } from './services/tts-audio-segments.service';
import { SynchronizedLessonService } from './services/synchronized-lesson.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoTransformController],
  providers: [
    VideoTransformService,
    YouTubeService,
    ContentAnalysisService,
    LangChainContentAnalysisService,
    MicrolessonScriptService,
    ThaiContextEnhancerService,
    DynamicSceneAnalyzerService,
    AudioSegmentsService,
    TtsAudioSegmentsService,
    SynchronizedLessonService,
  ],
  exports: [VideoTransformService],
})
export class VideoTransformModule {}
