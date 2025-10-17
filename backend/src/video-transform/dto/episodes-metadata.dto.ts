import { ApiProperty } from '@nestjs/swagger';

/**
 * Episode metadata for episode list display
 */
export class EpisodeMetadataDto {
  @ApiProperty({ description: 'Episode number (1-based)', example: 1 })
  episodeNumber: number;

  @ApiProperty({ description: 'English title of the episode', example: 'Introduction to English Grammar' })
  title: string;

  @ApiProperty({ description: 'Thai title of the episode', example: 'บทนำไวยากรณ์ภาษาอังกฤษ' })
  titleTh: string;

  @ApiProperty({ description: 'URL to episode thumbnail image', example: '/videos/henIVlCPVIY/lesson_1/lesson_segments/segment_1.png' })
  thumbnail: string;

  @ApiProperty({ description: 'Duration of the episode in seconds', example: 300 })
  duration: number;
}

/**
 * Response DTO for episodes metadata endpoint
 */
export class EpisodesMetadataResponseDto {
  @ApiProperty({ description: 'YouTube video ID', example: 'henIVlCPVIY' })
  videoId: string;

  @ApiProperty({ description: 'Total number of episodes', example: 5 })
  totalEpisodes: number;

  @ApiProperty({
    description: 'Array of episode metadata',
    type: [EpisodeMetadataDto],
  })
  episodes: EpisodeMetadataDto[];
}
