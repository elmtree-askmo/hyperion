/**
 * Storage Service
 * Abstracts file storage to support both local filesystem and cloud storage (S3, R2, etc.)
 */
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createReadStream, createWriteStream } from 'fs';
import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

export interface StorageConfig {
  type: 'local' | 's3' | 'r2' | 'vercel-blob';
  basePath?: string;
  bucket?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly config: StorageConfig;
  private s3Client?: S3Client;

  constructor() {
    // Configure storage based on environment
    this.config = {
      type: (process.env.STORAGE_TYPE as any) || 'local',
      basePath: process.env.STORAGE_BASE_PATH || path.join(process.cwd(), 'videos'),
      bucket: process.env.STORAGE_BUCKET,
      region: process.env.STORAGE_REGION || 'auto',
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY,
      endpoint: process.env.STORAGE_ENDPOINT,
    };

    // Initialize S3 client for cloud storage
    if (this.config.type === 's3' || this.config.type === 'r2') {
      this.initializeS3Client();
    }

    this.logger.log(`Storage initialized with type: ${this.config.type}`);
  }

  /**
   * Initialize S3 client for AWS S3 or Cloudflare R2
   */
  private initializeS3Client(): void {
    if (!this.config.accessKeyId || !this.config.secretAccessKey) {
      throw new Error('S3 credentials (STORAGE_ACCESS_KEY_ID and STORAGE_SECRET_ACCESS_KEY) are required for cloud storage');
    }

    if (!this.config.bucket) {
      throw new Error('STORAGE_BUCKET is required for cloud storage');
    }

    const s3Config: any = {
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
    };

    // For Cloudflare R2, use custom endpoint
    if (this.config.type === 'r2' && this.config.endpoint) {
      s3Config.endpoint = this.config.endpoint;
    }

    this.s3Client = new S3Client(s3Config);
    this.logger.log(`S3 client initialized for ${this.config.type} with bucket: ${this.config.bucket}`);
  }

  /**
   * Get the public URL for a file
   */
  getPublicUrl(filePath: string): string {
    switch (this.config.type) {
      case 'local':
        // For local development, files are served by NestJS static middleware
        return `/videos/${filePath}`;

      case 's3':
      case 'r2':
        // For cloud storage, construct the public URL
        const baseUrl = process.env.STORAGE_PUBLIC_URL || `https://${this.config.bucket}.${this.config.endpoint}`;
        // Include basePath if it's set and not empty
        const fullPath = this.config.basePath && this.config.basePath !== path.join(process.cwd(), 'videos') ? `${this.config.basePath}/${filePath}` : filePath;
        return `${baseUrl}/${fullPath}`;

      case 'vercel-blob':
        // Vercel Blob Storage uses its own URL structure
        return `${process.env.VERCEL_BLOB_BASE_URL}/${filePath}`;

      default:
        return `/videos/${filePath}`;
    }
  }

  /**
   * Write a file to storage
   */
  async writeFile(filePath: string, data: Buffer | string): Promise<void> {
    switch (this.config.type) {
      case 'local':
        await this.writeLocalFile(filePath, data);
        break;

      case 's3':
      case 'r2':
        await this.writeCloudFile(filePath, data);
        break;

      case 'vercel-blob':
        await this.writeVercelBlob(filePath, data);
        break;

      default:
        throw new Error(`Unsupported storage type: ${this.config.type}`);
    }
  }

  /**
   * Read a file from storage
   */
  async readFile(filePath: string): Promise<Buffer> {
    switch (this.config.type) {
      case 'local':
        return await this.readLocalFile(filePath);

      case 's3':
      case 'r2':
        return await this.readCloudFile(filePath);

      case 'vercel-blob':
        return await this.readVercelBlob(filePath);

      default:
        throw new Error(`Unsupported storage type: ${this.config.type}`);
    }
  }

  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      switch (this.config.type) {
        case 'local':
          await fs.access(this.getLocalPath(filePath));
          return true;

        case 's3':
        case 'r2':
          return await this.cloudFileExists(filePath);

        case 'vercel-blob':
          return await this.vercelBlobExists(filePath);

        default:
          return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string): Promise<void> {
    switch (this.config.type) {
      case 'local':
        await fs.mkdir(this.getLocalPath(dirPath), { recursive: true });
        break;

      case 's3':
      case 'r2':
      case 'vercel-blob':
        // Cloud storage doesn't require directory creation
        break;

      default:
        throw new Error(`Unsupported storage type: ${this.config.type}`);
    }
  }

  /**
   * Get local file system path
   */
  private getLocalPath(filePath: string): string {
    return path.join(this.config.basePath, filePath);
  }

  /**
   * Write file to local filesystem
   */
  private async writeLocalFile(filePath: string, data: Buffer | string): Promise<void> {
    const fullPath = this.getLocalPath(filePath);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);
  }

  /**
   * Read file from local filesystem
   */
  private async readLocalFile(filePath: string): Promise<Buffer> {
    const fullPath = this.getLocalPath(filePath);
    return await fs.readFile(fullPath);
  }

  /**
   * Write file to cloud storage (S3/R2)
   * Uploads a file to S3-compatible storage (AWS S3 or Cloudflare R2)
   */
  private async writeCloudFile(filePath: string, data: Buffer | string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

      // Determine content type based on file extension
      const contentType = this.getContentType(filePath);

      const command = new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: this.config.basePath ? path.join(this.config.basePath, filePath) : filePath,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);
      this.logger.log(`File uploaded to cloud storage: ${filePath}`);
    } catch (error) {
      this.logger.error(`Failed to upload file to cloud storage: ${error.message}`, error.stack);
      throw new Error(`Cloud storage upload failed: ${error.message}`);
    }
  }

  /**
   * Read file from cloud storage (S3/R2)
   * Downloads a file from S3-compatible storage and returns it as a Buffer
   */
  private async readCloudFile(filePath: string): Promise<Buffer> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: this.config.basePath ? path.join(this.config.basePath, filePath) : filePath,
      });

      const response = await this.s3Client.send(command);

      // Convert the readable stream to a buffer
      if (!response.Body) {
        throw new Error('Empty response body from S3');
      }

      const chunks: Uint8Array[] = [];
      const stream = response.Body as Readable;

      return new Promise((resolve, reject) => {
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
      });
    } catch (error) {
      this.logger.error(`Failed to read file from cloud storage: ${error.message}`, error.stack);
      throw new Error(`Cloud storage download failed: ${error.message}`);
    }
  }

  /**
   * Check if file exists in cloud storage
   * Uses HeadObject to check existence without downloading the file
   */
  private async cloudFileExists(filePath: string): Promise<boolean> {
    if (!this.s3Client) {
      throw new Error('S3 client not initialized');
    }

    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: this.config.basePath ? path.join(this.config.basePath, filePath) : filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      // HeadObject throws an error if the object doesn't exist
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }

      this.logger.error(`Failed to check file existence in cloud storage: ${error.message}`, error.stack);
      throw new Error(`Cloud storage head object failed: ${error.message}`);
    }
  }

  /**
   * Write file to Vercel Blob Storage
   * Note: Requires @vercel/blob package
   */
  private async writeVercelBlob(filePath: string, data: Buffer | string): Promise<void> {
    // TODO: Implement Vercel Blob upload
    // This requires installing @vercel/blob
    this.logger.warn('Vercel Blob storage not yet implemented. Install @vercel/blob and implement this method.');
    throw new Error('Vercel Blob storage not yet implemented');
  }

  /**
   * Read file from Vercel Blob Storage
   */
  private async readVercelBlob(filePath: string): Promise<Buffer> {
    // TODO: Implement Vercel Blob download
    this.logger.warn('Vercel Blob storage not yet implemented.');
    throw new Error('Vercel Blob storage not yet implemented');
  }

  /**
   * Check if file exists in Vercel Blob Storage
   */
  private async vercelBlobExists(filePath: string): Promise<boolean> {
    // TODO: Implement Vercel Blob head check
    this.logger.warn('Vercel Blob storage not yet implemented.');
    return false;
  }

  /**
   * Get storage configuration
   */
  getConfig(): StorageConfig {
    return { ...this.config };
  }

  /**
   * Determine content type based on file extension
   */
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes: Record<string, string> = {
      '.json': 'application/json',
      '.txt': 'text/plain',
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.ts': 'application/typescript',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.pdf': 'application/pdf',
      '.zip': 'application/zip',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}
