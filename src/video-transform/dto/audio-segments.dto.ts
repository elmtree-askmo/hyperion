export interface TextPart {
  text: string;
  language: 'th' | 'en';
  speakingRate?: number; // Default: th=1.0, en=0.8
}

export interface AudioSegment {
  id: string;
  text: string; // Full text for display and backward compatibility
  textParts?: TextPart[]; // Separated Thai and English parts for TTS
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
