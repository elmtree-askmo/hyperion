import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { ProxyConfigService } from './proxy-config.service';

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'png' | 'jpeg';
}

@Injectable()
export class GeminiImageService {
  private readonly logger = new Logger(GeminiImageService.name);
  private readonly genAI: GoogleGenAI;

  // Default optimization settings for web usage
  private readonly defaultOptimizationOptions: ImageOptimizationOptions = {
    maxWidth: 1920, // Full HD width
    maxHeight: 1080, // Full HD height
    quality: 80, // Good balance between quality and file size
    format: 'webp', // WebP has better compression than PNG/JPEG
  };

  constructor(private readonly proxyConfigService: ProxyConfigService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }

    // Create GoogleGenAI instance
    const genAIConfig: any = {
      apiKey,
      httpOptions: {
        timeout: 180000,
      },
    };

    this.genAI = new GoogleGenAI(genAIConfig);
  }

  /**
   * Optimize image for web usage
   * @param inputPath - Path to the original image
   * @param options - Optimization options (uses defaults if not provided)
   * @returns Path to the optimized image
   */
  private async optimizeImage(inputPath: string, options: ImageOptimizationOptions = {}): Promise<string> {
    const opts = { ...this.defaultOptimizationOptions, ...options };
    const ext = path.extname(inputPath);
    const baseName = path.basename(inputPath, ext);
    const dir = path.dirname(inputPath);

    // Create optimized filename with format extension (no "_optimized" suffix)
    const optimizedPath = path.join(dir, `${baseName}.${opts.format}`);

    try {
      const startTime = Date.now();
      this.logger.log(`🔧 Optimizing image: ${inputPath}`);

      // Get original file size
      const originalStats = fs.statSync(inputPath);
      const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);

      // Create sharp instance with the input image
      let sharpInstance = sharp(inputPath);

      // Resize if dimensions are specified
      if (opts.maxWidth || opts.maxHeight) {
        sharpInstance = sharpInstance.resize(opts.maxWidth, opts.maxHeight, {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true, // Don't upscale if image is smaller
        });
      }

      // Apply format-specific optimization
      switch (opts.format) {
        case 'webp':
          sharpInstance = sharpInstance.webp({ quality: opts.quality });
          break;
        case 'jpeg':
          sharpInstance = sharpInstance.jpeg({ quality: opts.quality, mozjpeg: true });
          break;
        case 'png':
          sharpInstance = sharpInstance.png({ quality: opts.quality, compressionLevel: 9 });
          break;
      }

      // Save the optimized image
      await sharpInstance.toFile(optimizedPath);

      // Get optimized file size
      const optimizedStats = fs.statSync(optimizedPath);
      const optimizedSizeMB = (optimizedStats.size / (1024 * 1024)).toFixed(2);
      const reduction = ((1 - optimizedStats.size / originalStats.size) * 100).toFixed(1);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`✅ Image optimized: ${originalSizeMB}MB → ${optimizedSizeMB}MB (${reduction}% reduction) in ${duration}s`);
      this.logger.log(`📁 Saved to: ${optimizedPath}`);

      return optimizedPath;
    } catch (error) {
      this.logger.error(`Failed to optimize image ${inputPath}:`, error);
      throw error;
    }
  }

  async generateImage(prompt: string, filePath: string, optimize: boolean = true): Promise<{ originalPath: string; optimizedPath?: string }> {
    try {
      const startTime = Date.now();
      const response = await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-image-preview',
        contents: prompt,
      });

      // Ensure the directory for the file exists, not the file itself
      const fileDir = path.dirname(filePath);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          this.logger.log(part.text);
        } else if (part.inlineData) {
          const imageData = part.inlineData.data;
          const buffer = Buffer.from(imageData, 'base64');

          // Save original image
          fs.writeFileSync(filePath, buffer);
          const duration = ((Date.now() - startTime) / 1000).toFixed(2);

          // Get original file size
          const originalStats = fs.statSync(filePath);
          const originalSizeMB = (originalStats.size / (1024 * 1024)).toFixed(2);

          this.logger.log(`📸 Original image saved: ${filePath} (${originalSizeMB}MB, ${duration}s)`);

          // Optimize image for web usage
          let optimizedPath: string | undefined;
          if (optimize) {
            try {
              optimizedPath = await this.optimizeImage(filePath);
            } catch (optimizeError) {
              this.logger.warn(`Failed to optimize image, using original: ${optimizeError.message}`);
            }
          }

          return { originalPath: filePath, optimizedPath };
        }
      }

      throw new Error('Image data not found in response.');
    } catch (error) {
      this.logger.error('Error generating image with @google/genai:', error);
      throw new Error('Failed to generate image using @google/genai. The model might not be available or the API has changed.');
    }
  }

  async generateImagesForEpisode(videoId: string, episodeNumber: number): Promise<void> {
    const videosDir = path.join(process.cwd(), 'videos');
    const lessonDir = path.join(videosDir, videoId, `lesson_${episodeNumber}`);
    const audioSegmentsPath = path.join(lessonDir, 'audio_segments.json');
    const lessonSegmentsDir = path.join(lessonDir, 'lesson_segments');

    this.logger.log(`🖼️ Generating images for video ${videoId}, episode ${episodeNumber}`);

    try {
      // Read audio segments file
      if (!fs.existsSync(audioSegmentsPath)) {
        this.logger.error(`Audio segments file not found: ${audioSegmentsPath}`);
        return;
      }

      const audioSegmentsData = JSON.parse(fs.readFileSync(audioSegmentsPath, 'utf8'));
      const audioSegments = audioSegmentsData.audioSegments;

      // Ensure lesson_segments directory exists
      if (!fs.existsSync(lessonSegmentsDir)) {
        fs.mkdirSync(lessonSegmentsDir, { recursive: true });
      }

      // Generate images for each segment that has backgroundImageDescription
      for (const segment of audioSegments) {
        if (segment.backgroundImageDescription) {
          try {
            this.logger.log(`🖼️ Generating image for segment: ${segment.id}`);

            // Generate image using the background description
            const filePath = path.join(lessonSegmentsDir, `${segment.id}.png`);
            // Only generate the image if the file does not already exist
            if (!fs.existsSync(filePath)) {
              const result = await this.generateImage(segment.backgroundImageDescription, filePath);
              this.logger.log(`✅ Generated and saved images for segment ${segment.id}:`);
              this.logger.log(`   - Original: ${result.originalPath}`);
              if (result.optimizedPath) {
                this.logger.log(`   - Optimized: ${result.optimizedPath}`);
              }
            } else {
              this.logger.log(`Image for segment ${segment.id} already exists at ${filePath}, skipping generation.`);
            }
          } catch (error) {
            this.logger.error(`Failed to generate image for segment ${segment.id}:`, error);
          }
        }
      }

      this.logger.log(`🖼️ Completed image generation for video ${videoId}, episode ${episodeNumber}`);
    } catch (error) {
      this.logger.error(`Failed to generate episode images for video ${videoId}, episode ${episodeNumber}:`, error);
      throw error;
    }
  }
}
