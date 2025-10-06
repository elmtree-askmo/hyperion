export interface AudioSegment {
  id: string;
  text: string;
  description?: string;
  screenElement: string;
  visualDescription?: string;
  vocabWord?: string;
  backgroundImageDescription?: string;
  metadata?: {
    thaiTranslation?: string;
    memoryHook?: string;
    contextExample?: string;
  };
}

export interface AudioSegmentsResponse {
  audioSegments: AudioSegment[];
}
