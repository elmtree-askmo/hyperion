export interface AudioSegment {
  id: string;
  text: string; // English-only text for audio generation
  textTh?: string; // Thai text for display purposes
  screenElement: string;
  visualDescription?: string;
  vocabWord?: string;
  metadata?: {
    thaiTranslation?: string;
    memoryHook?: string;
    contextExample?: string;
  };
}

export interface AudioSegmentsResponse {
  audioSegments: AudioSegment[];
}
