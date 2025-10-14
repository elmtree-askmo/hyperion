import { ApiProperty } from '@nestjs/swagger';

export class TimingMetadataDto {
  @ApiProperty({ description: 'Unique identifier for the audio segment' })
  segmentId: string;

  @ApiProperty({ description: 'Name of the generated audio file' })
  fileName: string;

  @ApiProperty({ description: 'Duration of the audio segment in seconds' })
  duration: number;

  @ApiProperty({ description: 'Start time in the overall lesson timeline' })
  startTime: number;

  @ApiProperty({ description: 'End time in the overall lesson timeline' })
  endTime: number;

  @ApiProperty({ description: 'Text content of the segment' })
  text: string;
}

export class TtsTimingMetadataResponse {
  @ApiProperty({
    type: [TimingMetadataDto],
    description: 'Array of timing metadata for each audio segment',
  })
  segments: TimingMetadataDto[];

  @ApiProperty({ description: 'Total duration of all segments combined' })
  totalDuration: number;

  @ApiProperty({ description: 'ISO timestamp when the TTS audio was generated' })
  generatedAt: string;
}
