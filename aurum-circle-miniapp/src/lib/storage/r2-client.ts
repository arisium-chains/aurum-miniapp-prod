import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  _Object,
} from "@aws-sdk/client-s3";
import { z } from "zod";

// Import Node.js types
import { Readable } from "stream";

// R2 Configuration Schema
const r2ConfigSchema = z.object({
  accountId: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucketName: z.string(),
  publicUrl: z.string().url().optional(),
});

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

export interface StorageOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  cacheControl?: string;
  contentDisposition?: string;
  contentEncoding?: string;
}

export interface ListObjectsOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface StorageObject {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  metadata?: Record<string, string>;
}

class R2Client {
  private client: S3Client;
  private config: R2Config;
  private bucketName: string;

  constructor(config: R2Config) {
    const validatedConfig = r2ConfigSchema.parse(config);
    this.config = validatedConfig;
    this.bucketName = validatedConfig.bucketName;

    this.client = new S3Client({
      region: "auto",
      endpoint: `https://${validatedConfig.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: validatedConfig.accessKeyId,
        secretAccessKey: validatedConfig.secretAccessKey,
      },
      maxAttempts: 3,
      retryMode: "standard",
    });
  }

  /**
   * Store a JSON object in R2
   */
  async storeJson(
    key: string,
    data: unknown,
    options?: StorageOptions
  ): Promise<void> {
    const jsonContent = JSON.stringify(data, null, 2);
    const finalOptions: StorageOptions = {
      contentType: "application/json",
      cacheControl: "no-cache, no-store, must-revalidate",
      ...options,
    };

    await this.store(key, jsonContent, finalOptions);
  }

  /**
   * Store binary data in R2
   */
  async store(
    key: string,
    data: string | Buffer | Readable,
    options?: StorageOptions
  ): Promise<void> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: data,
      ...this.buildStorageOptions(options),
    });

    await this.client.send(command);
  }

  /**
   * Retrieve a JSON object from R2
   */
  async getJson<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = await this.get(key);
      return JSON.parse(data.toString("utf-8"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("NoSuchKey")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Retrieve binary data from R2
   */
  async get(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    const response = await this.client.send(command);
    const chunks: Buffer[] = [];

    if (response.Body) {
      // Handle the stream properly with type checking
      const readableStream = response.Body as NodeJS.ReadableStream;
      for await (const chunk of readableStream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
    }

    return Buffer.concat(chunks);
  }

  /**
   * Delete an object from R2
   */
  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.client.send(command);
  }

  /**
   * List objects in R2
   */
  async listObjects(options: ListObjectsOptions = {}): Promise<{
    objects: StorageObject[];
    isTruncated: boolean;
    continuationToken?: string;
    nextContinuationToken?: string;
  }> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
      Prefix: options.prefix,
      MaxKeys: options.maxKeys || 1000,
      ContinuationToken: options.continuationToken,
    });

    const response = await this.client.send(command);

    const objects: StorageObject[] = (response.Contents || []).map(
      (obj: _Object) => ({
        key: obj.Key!,
        size: obj.Size!,
        lastModified: obj.LastModified!,
        etag: obj.ETag!,
        metadata:
          (obj as _Object & { Metadata?: Record<string, string> }).Metadata ||
          undefined,
      })
    );

    return {
      objects,
      isTruncated: response.IsTruncated || false,
      continuationToken: response.NextContinuationToken,
      nextContinuationToken: response.NextContinuationToken,
    };
  }

  /**
   * Check if an object exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      await this.get(key);
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes("NoSuchKey")) {
        return false;
      }
      throw error;
    }
  }

  /**
   * Get object metadata
   */
  async getMetadata(key: string): Promise<Record<string, string> | null> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.client.send(command);
      return response.Metadata || null;
    } catch (error) {
      if (error instanceof Error && error.message.includes("NoSuchKey")) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Generate a public URL for an object
   */
  getPublicUrl(key: string): string {
    if (this.config.publicUrl) {
      return `${this.config.publicUrl}/${key}`;
    }

    // Fallback to R2 native URL
    return `https://${this.config.accountId}.r2.cloudflarestorage.com/${this.bucketName}/${key}`;
  }

  /**
   * Build storage options with proper defaults
   */
  private buildStorageOptions(
    options?: StorageOptions
  ): Record<string, unknown> {
    const finalOptions: Record<string, unknown> = {
      ContentType: options?.contentType || "application/octet-stream",
    };

    if (options?.metadata) {
      finalOptions.Metadata = options.metadata;
    }

    if (options?.cacheControl) {
      finalOptions.CacheControl = options.cacheControl;
    }

    if (options?.contentDisposition) {
      finalOptions.ContentDisposition = options.contentDisposition;
    }

    if (options?.contentEncoding) {
      finalOptions.ContentEncoding = options.contentEncoding;
    }

    return finalOptions;
  }

  /**
   * Health check for R2 connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        MaxKeys: 1,
      });

      await this.client.send(command);
      return true;
    } catch (error) {
      console.error("R2 health check failed:", error);
      return false;
    }
  }
}

// Singleton instance
let r2ClientInstance: R2Client | null = null;

export function getR2Client(): R2Client {
  if (!r2ClientInstance) {
    const config: R2Config = {
      accountId: process.env.CLOUDFLARE_R2_ACCOUNT_ID!,
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY!,
      bucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL,
    };

    r2ClientInstance = new R2Client(config);
  }

  return r2ClientInstance;
}

export function createR2Client(config: R2Config): R2Client {
  return new R2Client(config);
}

// Export for direct use
export default R2Client;
