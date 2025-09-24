import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoTransformController } from './video-transform.controller';
import { VideoTransformService } from './video-transform.service';
import { VideoJob } from './entities/video-job.entity';
import { YouTubeService } from './services/youtube.service';
import { ContentAnalysisService } from './services/content-analysis.service';
import { LangChainContentAnalysisService } from './services/langchain-content-analysis.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoJob])],
  controllers: [VideoTransformController],
  providers: [VideoTransformService, YouTubeService, ContentAnalysisService, LangChainContentAnalysisService],
  exports: [VideoTransformService],
})
export class VideoTransformModule {}
