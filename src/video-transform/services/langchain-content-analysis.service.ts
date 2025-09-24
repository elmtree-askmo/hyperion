import { Injectable } from '@nestjs/common';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { VideoMetadata } from './youtube.service';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// Core interfaces for lesson analysis
export interface LearningObjective {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  skills: string[];
}

export interface PrerequisiteKnowledge {
  id: string;
  topic: string;
  level: 'basic' | 'intermediate' | 'advanced';
  description: string;
  suggestedResources?: string[];
}

export interface ContentSegment {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds (should be ~5 minutes = 300 seconds)
  content: string;
  keyTopics: string[];
  learningObjectives: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[]; // IDs of prerequisite knowledge
}

export interface SeriesStructure {
  totalSeries: number;
  seriesTitle: string;
  description: string;
  episodes: SeriesEpisode[];
  learningPath: string[];
  estimatedTotalTime: number; // in minutes
}

export interface SeriesEpisode {
  episodeNumber: number;
  title: string;
  description: string;
  segments: string[]; // segment IDs
  estimatedTime: number; // in minutes
  objectives: string[]; // objective IDs
}

export interface LessonAnalysis {
  videoId: string;
  title: string;
  totalDuration: number; // in seconds
  language: string;
  targetAudience: string;
  analyzedAt: string;
  learningObjectives: LearningObjective[];
  prerequisites: PrerequisiteKnowledge[];
  segments: ContentSegment[];
  seriesStructure: SeriesStructure;
  metadata: {
    originalVideoLength: number;
    targetSegmentLength: number;
    actualSegments: number;
    averageSegmentLength: number;
  };
}

@Injectable()
export class LangChainContentAnalysisService {
  private readonly llm;
  private readonly openaiClient: ChatOpenAI;
  private readonly openrouterClient: ChatOpenAI;
  private readonly groqClient: ChatGroq;

  constructor() {
    // Initialize OpenAI client
    this.openaiClient = new ChatOpenAI({
      model: 'gpt-5',
      temperature: 0, // Lower temperature for more consistent analysis
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.openrouterClient = new ChatOpenAI({
      // model: 'deepseek/deepseek-chat-v3.1:free',
      model: 'openai/gpt-oss-120b:free',
      temperature: 0,
      apiKey: process.env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
      },
    });

    // Initialize Groq client
    this.groqClient = new ChatGroq({
      model: 'openai/gpt-oss-120b',
      temperature: 0, // Lower temperature for more consistent analysis
      apiKey: process.env.GROQ_API_KEY,
    });

    // Select LLM provider based on environment variable
    const llmProvider = process.env.LLM_PROVIDER || 'openrouter';
    switch (llmProvider.toLowerCase()) {
      case 'openai':
        this.llm = this.openaiClient;
        console.log('🤖 Using OpenAI LLM provider');
        break;
      case 'groq':
        this.llm = this.groqClient;
        console.log('🤖 Using Groq LLM provider');
        break;
      case 'openrouter':
      default:
        this.llm = this.openrouterClient;
        console.log('🤖 Using OpenRouter LLM provider');
        break;
    }

    // LangSmith is automatically enabled when environment variables are set
    if (process.env.LANGCHAIN_TRACING_V2 === 'true' && process.env.LANGCHAIN_API_KEY) {
      console.log(`🔍 LangSmith tracing enabled for project: ${process.env.LANGCHAIN_PROJECT || 'hyperion'}`);
    } else {
      console.log('⚠️  LangSmith not configured (optional for debugging)');
    }
  }

  /**
   * Main method to analyze video content and generate comprehensive lesson analysis
   */
  async analyzeVideoContent(
    metadata: VideoMetadata,
    transcript: string,
    targetAudience: string = 'thai_college_students',
    targetSegmentDuration: number = 300, // 5 minutes in seconds
    videoUrl?: string,
  ): Promise<LessonAnalysis> {
    console.log('Starting comprehensive video content analysis...');

    // Extract core learning objectives
    const learningObjectives = await this.extractLearningObjectives(transcript, metadata, targetAudience);

    // Identify prerequisite knowledge
    const prerequisites = await this.identifyPrerequisites(transcript, learningObjectives, targetAudience);

    // Map content to 5-minute segments
    const segments = await this.mapContentToSegments(transcript, metadata, targetSegmentDuration, learningObjectives);

    // Generate series structure
    const seriesStructure = await this.generateSeriesStructure(segments, learningObjectives, metadata);

    // Create comprehensive analysis
    const analysis: LessonAnalysis = {
      videoId: this.extractVideoId(videoUrl || ''),
      title: metadata.title || 'Unknown Title',
      totalDuration: metadata.duration || 0,
      language: 'english',
      targetAudience,
      analyzedAt: new Date().toISOString(),
      learningObjectives,
      prerequisites,
      segments,
      seriesStructure,
      metadata: {
        originalVideoLength: metadata.duration || 0,
        targetSegmentLength: targetSegmentDuration,
        actualSegments: segments.length,
        averageSegmentLength: segments.length > 0 ? Math.round(segments.reduce((sum, s) => sum + s.duration, 0) / segments.length) : 0,
      },
    };

    // Save analysis to lesson_analysis.json in videos/{videoId}/ directory
    await this.saveLessonAnalysis(analysis);

    console.log('Content analysis completed successfully');
    return analysis;
  }

  /**
   * Extract core learning objectives from the video content
   */
  private async extractLearningObjectives(transcript: string, metadata: VideoMetadata, targetAudience: string): Promise<LearningObjective[]> {
    const prompt = PromptTemplate.fromTemplate(`
You are an expert educational content analyst. Analyze the following video transcript and extract core learning objectives.

Video Title: {title}
Target Audience: {audience}
Video Duration: {duration} seconds

Transcript:
{transcript}

Extract 3-6 core learning objectives that students should achieve after watching this video. For each objective:
1. Create a unique ID (use format: obj_1, obj_2, etc.)
2. Provide a clear, actionable title
3. Write a detailed description
4. Assess difficulty level (beginner/intermediate/advanced)
5. Estimate time needed to master (in minutes)
6. List specific skills developed

Respond in JSON format:
[
  {{
    "id": "obj_1",
    "title": "Clear, actionable title",
    "description": "Detailed description of what students will learn",
    "difficulty": "beginner|intermediate|advanced",
    "estimatedTime": 30,
    "skills": ["skill1", "skill2", "skill3"]
  }}
]
`);

    try {
      const chain = RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);

      const result = await chain.invoke(
        {
          title: metadata.title || 'Unknown',
          audience: targetAudience,
          duration: metadata.duration || 0,
          // transcript: this.truncateText(transcript, 4000), // Limit for token efficiency
          transcript: transcript,
        },
        {
          // LangSmith configuration for this specific call
          tags: ['learning-objectives', 'content-analysis', targetAudience],
          metadata: {
            step: 'extract_learning_objectives',
            video_title: metadata.title,
            video_duration: metadata.duration,
            target_audience: targetAudience,
            transcript_length: transcript.length,
          },
        },
      );

      return JSON.parse(this.extractJSONFromResponse(result));
    } catch (error) {
      console.error('Error extracting learning objectives:', error);
      return this.getFallbackLearningObjectives();
    }
  }

  /**
   * Identify prerequisite knowledge needed for the content
   */
  private async identifyPrerequisites(transcript: string, learningObjectives: LearningObjective[], targetAudience: string): Promise<PrerequisiteKnowledge[]> {
    const prompt = PromptTemplate.fromTemplate(`
You are an expert educational content analyst. Based on the following video transcript and learning objectives, identify prerequisite knowledge that students need before engaging with this content.

Target Audience: {audience}

Learning Objectives:
{objectives}

Transcript (excerpt):
{transcript}

Identify 2-5 prerequisite knowledge areas. For each prerequisite:
1. Create a unique ID (use format: prereq_1, prereq_2, etc.)
2. Name the topic clearly
3. Specify the required level (basic/intermediate/advanced)
4. Provide a detailed description
5. Optionally suggest learning resources

Consider the target audience's typical background and learning context.

Respond in JSON format:
[
  {{
    "id": "prereq_1",
    "topic": "Clear topic name",
    "level": "basic|intermediate|advanced",
    "description": "Detailed description of what students should know",
    "suggestedResources": ["resource1", "resource2"]
  }}
]
`);
    try {
      const chain = RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);

      const objectivesSummary = learningObjectives.map((obj) => `${obj.id}: ${obj.title}`).join('\n');

      const result = await chain.invoke(
        {
          audience: targetAudience,
          objectives: objectivesSummary,
          // transcript: this.truncateText(transcript, 3000),
          transcript: transcript,
        },
        {
          // LangSmith configuration for prerequisites identification
          tags: ['prerequisites', 'content-analysis', targetAudience],
          metadata: {
            step: 'identify_prerequisites',
            target_audience: targetAudience,
            objectives_count: learningObjectives.length,
            transcript_length: transcript.length,
          },
        },
      );

      return JSON.parse(this.extractJSONFromResponse(result));
    } catch (error) {
      console.error('Error extracting prerequisites:', error);
      return this.getFallbackPrerequisites();
    }
  }

  /**
   * Map content to logical 5-minute segments
   */
  private async mapContentToSegments(transcript: string, metadata: VideoMetadata, targetDuration: number, learningObjectives: LearningObjective[]): Promise<ContentSegment[]> {
    const totalDuration = metadata.duration || 0;
    const estimatedSegments = Math.ceil(totalDuration / targetDuration);

    const prompt = PromptTemplate.fromTemplate(`
You are an expert educational content analyst. Analyze the video transcript and divide it into logical learning segments of approximately {targetDuration} seconds each.

Video Duration: {totalDuration} seconds
Estimated Segments: {estimatedSegments}
Target Segment Duration: {targetDuration} seconds

Learning Objectives:
{objectives}

Transcript:
{transcript}

Create {estimatedSegments} logical segments that:
1. Each segment should be close to {targetDuration} seconds (5 minutes)
2. Break at natural learning boundaries (topic changes, concept completion)
3. Each segment should build upon previous ones
4. Map content to relevant learning objectives

For each segment provide:
- Unique ID (seg_1, seg_2, etc.)
- Descriptive title
- Start and end times (in seconds)
- Key topics covered
- Related learning objective IDs
- Difficulty assessment
- Prerequisites from earlier segments

Respond in JSON format:
[
  {{
    "id": "seg_1",
    "title": "Segment title",
    "startTime": 0,
    "endTime": 300,
    "duration": 300,
    "content": "Brief summary of content covered",
    "keyTopics": ["topic1", "topic2"],
    "learningObjectives": ["obj_1", "obj_2"],
    "difficulty": "beginner|intermediate|advanced",
    "prerequisites": ["prereq_1"]
  }}
]
`);
    try {
      const chain = RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);

      const objectivesSummary = learningObjectives.map((obj) => `${obj.id}: ${obj.title}`).join('\n');

      const result = await chain.invoke(
        {
          totalDuration,
          estimatedSegments,
          targetDuration,
          objectives: objectivesSummary,
          // transcript: this.truncateText(transcript, 5000),
          transcript: transcript,
        },
        {
          // LangSmith configuration for content segmentation
          tags: ['content-segmentation', 'content-analysis', `${estimatedSegments}-segments`],
          metadata: {
            step: 'map_content_to_segments',
            total_duration: totalDuration,
            target_duration: targetDuration,
            estimated_segments: estimatedSegments,
            objectives_count: learningObjectives.length,
            transcript_length: transcript.length,
          },
        },
      );

      return JSON.parse(this.extractJSONFromResponse(result));
    } catch (error) {
      console.error('Error extracting segments:', error);
      return this.getFallbackSegments(totalDuration, targetDuration);
    }
  }

  /**
   * Generate series structure for the content
   */
  private async generateSeriesStructure(segments: ContentSegment[], learningObjectives: LearningObjective[], metadata: VideoMetadata): Promise<SeriesStructure> {
    const prompt = PromptTemplate.fromTemplate(`
You are an expert educational content designer. Based on the analyzed video segments and learning objectives, design an optimal series structure for learning.

Video Title: {title}
Total Segments: {totalSegments}
Total Duration: {duration} minutes

Segments:
{segments}

Learning Objectives:
{objectives}

Design a series structure that:
1. Groups segments into logical episodes (2-4 segments per episode)
2. Creates a clear learning progression
3. Ensures each episode has focused objectives
4. Provides clear titles and descriptions
5. Estimates realistic time requirements

Respond in JSON format:
{{
  "totalSeries": 1,
  "seriesTitle": "Comprehensive series title",
  "description": "Series overview and what students will achieve",
  "episodes": [
    {{
      "episodeNumber": 1,
      "title": "Episode title",
      "description": "What this episode covers",
      "segments": ["seg_1", "seg_2"],
      "estimatedTime": 30,
      "objectives": ["obj_1", "obj_2"]
    }}
  ],
  "learningPath": ["Episode 1", "Episode 2"],
  "estimatedTotalTime": 60
}}
`);
    try {
      const chain = RunnableSequence.from([prompt, this.llm, new StringOutputParser()]);

      const segmentsSummary = segments.map((seg) => `${seg.id}: ${seg.title} (${seg.duration}s)`).join('\n');
      const objectivesSummary = learningObjectives.map((obj) => `${obj.id}: ${obj.title}`).join('\n');

      const result = await chain.invoke(
        {
          title: metadata.title || 'Unknown',
          totalSegments: segments.length,
          duration: Math.round((metadata.duration || 0) / 60),
          segments: segmentsSummary,
          objectives: objectivesSummary,
        },
        {
          // LangSmith configuration for series structure generation
          tags: ['series-structure', 'content-analysis', `${segments.length}-segments`],
          metadata: {
            step: 'generate_series_structure',
            video_title: metadata.title,
            total_segments: segments.length,
            video_duration_minutes: Math.round((metadata.duration || 0) / 60),
            objectives_count: learningObjectives.length,
          },
        },
      );

      return JSON.parse(this.extractJSONFromResponse(result));
    } catch (error) {
      console.error('Error extracting series structure:', error);
      return this.getFallbackSeriesStructure(segments, learningObjectives, metadata);
    }
  }

  /**
   * Save lesson analysis to JSON file in videos/{videoId}/ directory
   */
  private async saveLessonAnalysis(analysis: LessonAnalysis): Promise<void> {
    try {
      const videoId = analysis.videoId || 'unknown';
      const videosDir = join(process.cwd(), 'videos', videoId);

      // Ensure the videos/{videoId} directory exists
      await mkdir(videosDir, { recursive: true });

      const filePath = join(videosDir, 'lesson_analysis.json');
      await writeFile(filePath, JSON.stringify(analysis, null, 2), 'utf8');
      console.log(`Lesson analysis saved to: ${filePath}`);
    } catch (error) {
      console.error('Error saving lesson analysis:', error);
      throw error;
    }
  }

  // Utility methods
  private truncateText(text: string, maxLength: number): string {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  private extractJSONFromResponse(response: string): string {
    // Extract JSON from response that might contain additional text
    const jsonRegex = /\[[\s\S]*\]|\{[\s\S]*\}/;
    const jsonMatch = jsonRegex.exec(response);
    return jsonMatch ? jsonMatch[0] : response;
  }

  private extractVideoId(url: string): string {
    const videoIdRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = videoIdRegex.exec(url);
    return match ? match[1] : 'unknown';
  }

  // Fallback methods for error cases
  private getFallbackLearningObjectives(): LearningObjective[] {
    return [
      {
        id: 'obj_1',
        title: 'Understand Core Concepts',
        description: 'Students will understand the main concepts presented in the video',
        difficulty: 'intermediate',
        estimatedTime: 30,
        skills: ['comprehension', 'analysis', 'application'],
      },
    ];
  }

  private getFallbackPrerequisites(): PrerequisiteKnowledge[] {
    return [
      {
        id: 'prereq_1',
        topic: 'Basic English Comprehension',
        level: 'basic',
        description: 'Students should have basic English listening and comprehension skills',
        suggestedResources: ['English fundamentals course'],
      },
    ];
  }

  private getFallbackSegments(totalDuration: number, targetDuration: number): ContentSegment[] {
    const numSegments = Math.ceil(totalDuration / targetDuration);
    const segments: ContentSegment[] = [];

    for (let i = 0; i < numSegments; i++) {
      const startTime = i * targetDuration;
      const endTime = Math.min((i + 1) * targetDuration, totalDuration);

      segments.push({
        id: `seg_${i + 1}`,
        title: `Learning Segment ${i + 1}`,
        startTime,
        endTime,
        duration: endTime - startTime,
        content: `Content for segment ${i + 1}`,
        keyTopics: ['General Topic'],
        learningObjectives: ['obj_1'],
        difficulty: 'intermediate',
        prerequisites: i > 0 ? [`seg_${i}`] : [],
      });
    }

    return segments;
  }

  private getFallbackSeriesStructure(segments: ContentSegment[], learningObjectives: LearningObjective[], metadata: VideoMetadata): SeriesStructure {
    const episodeSize = Math.max(2, Math.ceil(segments.length / 3)); // 2-3 episodes
    const episodes: SeriesEpisode[] = [];

    for (let i = 0; i < segments.length; i += episodeSize) {
      const episodeSegments = segments.slice(i, i + episodeSize);
      const estimatedTime = episodeSegments.reduce((sum, seg) => sum + seg.duration, 0) / 60;

      episodes.push({
        episodeNumber: Math.floor(i / episodeSize) + 1,
        title: `Episode ${Math.floor(i / episodeSize) + 1}`,
        description: `Learning episode covering ${episodeSegments.length} segments`,
        segments: episodeSegments.map((seg) => seg.id),
        estimatedTime: Math.round(estimatedTime),
        objectives: learningObjectives.slice(0, 2).map((obj) => obj.id),
      });
    }

    return {
      totalSeries: 1,
      seriesTitle: metadata.title || 'Learning Series',
      description: 'Comprehensive learning series based on video content',
      episodes,
      learningPath: episodes.map((ep) => ep.title),
      estimatedTotalTime: Math.round((metadata.duration || 0) / 60),
    };
  }
}
