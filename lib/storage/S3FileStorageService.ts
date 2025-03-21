import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types';

import {
  FileStorageService,
  FileMetadata,
  UploadOptions,
  DownloadOptions,
  FileFilter,
  StorageProviderType,
  StorageConfig
} from './FileStorageService';

/**
 * S3 文件存储配置
 */
export interface S3StorageConfig extends StorageConfig {
  type: StorageProviderType.S3;
  /** 临时URL有效期（秒），默认3600 */
  defaultUrlExpiration?: number;
  /** S3 配置 */
  providerOptions: {
    /** AWS区域 */
    region: string;
    /** 访问密钥ID */
    accessKeyId?: string;
    /** 秘密访问密钥 */
    secretAccessKey?: string;
    /** 会话令牌（临时凭证） */
    sessionToken?: string;
    /** 自定义终端节点（用于MinIO等兼容S3的服务） */
    endpoint?: string;
    /** 是否禁用SSL */
    forcePathStyle?: boolean;
  };
}

/**
 * 缓存的文件元数据
 */
interface CachedFileMetadata {
  metadata: FileMetadata;
  lastUpdated: Date;
}

/**
 * S3 文件存储服务
 * 
 * 基于 AWS S3 或兼容 S3 API 的存储服务实现
 */
export class S3FileStorageService implements FileStorageService {
  private config: S3StorageConfig;
  private s3Client: S3Client;
  // 元数据缓存，避免频繁请求S3
  private metadataCache: Map<string, CachedFileMetadata>;
  // 缓存过期时间（毫秒）
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟

  /**
   * 创建 S3 文件存储服务
   * @param config S3 存储配置
   */
  constructor(config: S3StorageConfig) {
    this.config = {
      ...config,
      defaultUrlExpiration: config.defaultUrlExpiration || 3600
    };

    // 创建 S3 客户端
    this.s3Client = new S3Client({
      region: config.providerOptions.region,
      credentials: config.providerOptions.accessKeyId && config.providerOptions.secretAccessKey ? {
        accessKeyId: config.providerOptions.accessKeyId,
        secretAccessKey: config.providerOptions.secretAccessKey,
        sessionToken: config.providerOptions.sessionToken
      } : undefined,
      endpoint: config.providerOptions.endpoint,
      forcePathStyle: config.providerOptions.forcePathStyle
    });

    this.metadataCache = new Map<string, CachedFileMetadata>();
  }

  /**
   * 生成文件 ID
   */
  private generateFileId(): string {
    return uuidv4();
  }

  /**
   * 生成 S3 对象键
   * @param fileId 文件ID
   * @param filename 文件名
   */
  private generateObjectKey(fileId: string, filename: string): string {
    // 使用ID的前两个字符作为子目录前缀，避免单一目录下文件过多
    const subDirPrefix = fileId.substring(0, 2);
    return `${subDirPrefix}/${fileId}_${filename}`;
  }

  /**
   * 解析对象键中的文件ID
   * @param objectKey S3对象键
   */
  private parseFileIdFromKey(objectKey: string): string | null {
    const parts = objectKey.split('/');
    if (parts.length < 2) return null;
    
    const filename = parts[parts.length - 1];
    const idParts = filename.split('_');
    if (idParts.length < 2) return null;
    
    return idParts[0];
  }

  /**
   * 生成文件元数据
   * @param fileId 文件ID
   * @param objectKey S3对象键
   * @param options 上传选项
   * @param size 文件大小
   */
  private async generateFileMetadata(
    fileId: string,
    objectKey: string,
    options: UploadOptions,
    size: number
  ): Promise<FileMetadata> {
    const filename = options.filename || path.basename(objectKey);
    const mimeType = options.contentType || mime.lookup(filename) || 'application/octet-stream';

    // 创建元数据
    const metadata: FileMetadata = {
      id: fileId,
      filename,
      mimetype: mimeType,
      size,
      uploadedAt: new Date(),
      userId: options.userId,
      entityId: options.entityId,
      entityType: options.entityType,
      path: objectKey,
      url: await this.getDownloadUrl(fileId),
      access: options.access || 'private',
      metadata: options.metadata
    };

    // 更新缓存
    this.updateMetadataCache(fileId, metadata);

    return metadata;
  }

  /**
   * 更新元数据缓存
   * @param fileId 文件ID
   * @param metadata 文件元数据
   */
  private updateMetadataCache(fileId: string, metadata: FileMetadata): void {
    this.metadataCache.set(fileId, {
      metadata,
      lastUpdated: new Date()
    });
  }

  /**
   * 从缓存获取元数据
   * @param fileId 文件ID
   */
  private getCachedMetadata(fileId: string): FileMetadata | null {
    const cached = this.metadataCache.get(fileId);
    if (!cached) return null;

    // 检查缓存是否过期
    if (Date.now() - cached.lastUpdated.getTime() > this.CACHE_TTL) {
      this.metadataCache.delete(fileId);
      return null;
    }

    return cached.metadata;
  }

  /**
   * 从 S3 对象提取元数据
   * @param fileId 文件ID
   * @param objectKey S3对象键
   */
  private async extractMetadataFromS3(fileId: string, objectKey: string): Promise<FileMetadata | null> {
    try {
      // 获取对象头信息
      const headResult = await this.s3Client.send(
        new HeadObjectCommand({
          Bucket: this.config.basePath,
          Key: objectKey
        })
      );

      // 从用户定义的元数据中提取信息
      const userMetadata = headResult.Metadata || {};

      // 构造文件元数据
      const metadata: FileMetadata = {
        id: fileId,
        filename: userMetadata.filename || path.basename(objectKey),
        mimetype: headResult.ContentType || 'application/octet-stream',
        size: headResult.ContentLength || 0,
        uploadedAt: userMetadata.uploadedAt ? new Date(userMetadata.uploadedAt) : new Date(),
        userId: userMetadata.userId,
        entityId: userMetadata.entityId,
        entityType: userMetadata.entityType,
        path: objectKey,
        url: await this.getDownloadUrl(fileId),
        access: (userMetadata.access as 'public' | 'private' | 'protected') || 'private',
        metadata: userMetadata.fileMetadata ? JSON.parse(userMetadata.fileMetadata) : undefined
      };

      // 更新缓存
      this.updateMetadataCache(fileId, metadata);

      return metadata;
    } catch (error) {
      console.error('Failed to extract metadata from S3:', error);
      return null;
    }
  }

  /**
   * 将元数据转换为 S3 用户定义的元数据
   * @param metadata 文件元数据
   */
  private convertMetadataToS3UserMetadata(metadata: FileMetadata): Record<string, string> {
    return {
      filename: metadata.filename,
      uploadedAt: metadata.uploadedAt.toISOString(),
      userId: metadata.userId || '',
      entityId: metadata.entityId || '',
      entityType: metadata.entityType || '',
      access: metadata.access,
      fileMetadata: metadata.metadata ? JSON.stringify(metadata.metadata) : '{}'
    };
  }

  /**
   * 上传文件
   * @param file 文件数据
   * @param options 上传选项
   */
  async uploadFile(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<FileMetadata> {
    // 生成文件ID
    const fileId = this.generateFileId();
    
    // 安全的文件名
    const safeFilename = options.filename?.replace(/[^a-zA-Z0-9_.-]/g, '_') || `file_${Date.now()}`;
    
    // 生成 S3 对象键
    const objectKey = this.generateObjectKey(fileId, safeFilename);
    
    try {
      // 处理文件内容
      let body: Buffer | Readable;
      let contentLength: number;
      
      if (Buffer.isBuffer(file)) {
        body = file;
        contentLength = file.length;
      } else {
        // 对于流，我们需要将其转换为buffer以获取大小
        const chunks: Buffer[] = [];
        for await (const chunk of file) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        body = Buffer.concat(chunks);
        contentLength = body.length;
      }
      
      // 检测MIME类型
      const contentType = options.contentType || mime.lookup(safeFilename) || 'application/octet-stream';
      
      // 创建文件元数据
      const metadata = await this.generateFileMetadata(fileId, objectKey, options, contentLength);
      
      // 上传文件到 S3
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.config.basePath,
          Key: objectKey,
          Body: body,
          ContentType: contentType,
          ContentLength: contentLength,
          Metadata: this.convertMetadataToS3UserMetadata(metadata),
          ACL: options.access === 'public' ? 'public-read' : 'private'
        })
      );
      
      return metadata;
    } catch (error) {
      console.error('Failed to upload file to S3:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * 通过URL上传文件
   * @param url 文件URL
   * @param options 上传选项
   */
  async uploadFromUrl(url: string, options: UploadOptions): Promise<FileMetadata> {
    try {
      // 获取远程文件
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
      }
      
      // 从响应头获取文件名
      const contentDisposition = response.headers.get('content-disposition');
      let filename = '';
      
      if (contentDisposition) {
        const match = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      
      // 使用URL的最后一部分作为文件名（如果没有从Content-Disposition获取到）
      if (!filename) {
        const urlObj = new URL(url);
        filename = path.basename(urlObj.pathname);
      }
      
      // 如果没有获取到文件名，使用时间戳
      if (!filename) {
        filename = `download_${Date.now()}`;
      }
      
      // 使用提供的选项中的文件名或获取到的文件名
      const fileOptions: UploadOptions = {
        ...options,
        filename: options.filename || filename,
        contentType: options.contentType || response.headers.get('content-type') || undefined
      };
      
      // 读取响应体
      const buffer = Buffer.from(await response.arrayBuffer());
      
      // 上传文件
      return this.uploadFile(buffer, fileOptions);
    } catch (error: any) {
      console.error('Failed to upload from URL:', error);
      throw new Error(`Failed to upload from URL: ${error.message}`);
    }
  }

  /**
   * 下载文件
   * @param fileId 文件ID
   * @param options 下载选项
   */
  async downloadFile(fileId: string, options?: DownloadOptions): Promise<Buffer | string> {
    // 如果请求URL而不是内容
    if (options?.asUrl) {
      return this.getDownloadUrl(fileId, options.expiresIn);
    }
    
    // 获取文件元数据
    const metadata = await this.getFileMetadata(fileId);
    
    try {
      // 从 S3 下载文件
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.basePath,
          Key: metadata.path
        })
      );
      
      // 读取流
      const chunks: Buffer[] = [];
      
      if (response.Body) {
        // @ts-expect-error 类型定义问题
        for await (const chunk of response.Body) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
      }
      
      return Buffer.concat(chunks);
    } catch (error: any) {
      console.error('Failed to download file from S3:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * 获取文件详情
   * @param fileId 文件ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    // 先尝试从缓存获取
    const cachedMetadata = this.getCachedMetadata(fileId);
    if (cachedMetadata) {
      return cachedMetadata;
    }
    
    // 查找对象键
    const objects = await this.s3Client.send(
      new ListObjectsV2Command({
        Bucket: this.config.basePath,
        Prefix: `${fileId.substring(0, 2)}/${fileId}_`
      })
    );
    
    if (!objects.Contents || objects.Contents.length === 0) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    // 找到匹配的对象
    const objectKey = objects.Contents[0].Key;
    if (!objectKey) {
      throw new Error(`File path not found: ${fileId}`);
    }
    
    // 从 S3 提取元数据
    const metadata = await this.extractMetadataFromS3(fileId, objectKey);
    if (!metadata) {
      throw new Error(`Failed to extract metadata: ${fileId}`);
    }
    
    return metadata;
  }

  /**
   * 更新文件元数据
   * @param fileId 文件ID
   * @param metadata 更新的元数据
   */
  async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
    // 获取现有元数据
    const existingMetadata = await this.getFileMetadata(fileId);
    
    // 保护不可修改的字段，使用解构赋值但不使用这些字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, path, size, uploadedAt, ...updatableFields } = metadata;
    
    // 更新元数据
    const updatedMetadata: FileMetadata = {
      ...existingMetadata,
      ...updatableFields
    };
    
    // 更新 S3 对象的元数据
    await this.s3Client.send(
      new CopyObjectCommand({
        Bucket: this.config.basePath,
        CopySource: `${this.config.basePath}/${existingMetadata.path}`,
        Key: existingMetadata.path,
        Metadata: this.convertMetadataToS3UserMetadata(updatedMetadata),
        MetadataDirective: 'REPLACE',
        ACL: updatedMetadata.access === 'public' ? 'public-read' : 'private',
        ContentType: updatedMetadata.mimetype
      })
    );
    
    // 更新缓存
    this.updateMetadataCache(fileId, updatedMetadata);
    
    return updatedMetadata;
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // 获取文件元数据
      const metadata = await this.getFileMetadata(fileId).catch(() => null);
      
      if (!metadata) {
        return false;
      }
      
      // 从 S3 删除对象
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.config.basePath,
          Key: metadata.path
        })
      );
      
      // 从缓存中删除
      this.metadataCache.delete(fileId);
      
      return true;
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      return false;
    }
  }

  /**
   * 批量删除文件
   * @param fileIds 文件ID数组
   */
  async deleteFiles(fileIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // 并行删除文件
    await Promise.all(
      fileIds.map(async (fileId) => {
        const success = await this.deleteFile(fileId);
        results.set(fileId, success);
      })
    );
    
    return results;
  }

  /**
   * 查找文件
   * @param filter 过滤条件
   * @param limit 限制数量
   * @param offset 偏移量
   */
  async findFiles(filter: FileFilter, limit?: number, offset?: number): Promise<FileMetadata[]> {
    try {
      // 列出所有对象
      const objects = await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.config.basePath
        })
      );
      
      if (!objects.Contents || objects.Contents.length === 0) {
        return [];
      }
      
      // 提取文件ID和元数据
      const filesMetadata: FileMetadata[] = [];
      
      for (const object of objects.Contents) {
        if (!object.Key) continue;
        
        const fileId = this.parseFileIdFromKey(object.Key);
        if (!fileId) continue;
        
        // 尝试从缓存获取元数据
        let metadata = this.getCachedMetadata(fileId);
        
        // 如果缓存中没有，从 S3 提取
        if (!metadata) {
          metadata = await this.extractMetadataFromS3(fileId, object.Key);
          if (!metadata) continue;
        }
        
        // 应用过滤器
        if (this.matchesFilter(metadata, filter)) {
          filesMetadata.push(metadata);
        }
      }
      
      // 应用分页
      const startIndex = offset || 0;
      const endIndex = limit ? startIndex + limit : filesMetadata.length;
      
      return filesMetadata.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Failed to find files in S3:', error);
      return [];
    }
  }

  /**
   * 检查文件是否符合过滤条件
   * @param metadata 文件元数据
   * @param filter 过滤条件
   */
  private matchesFilter(metadata: FileMetadata, filter: FileFilter): boolean {
    if (filter.userId && metadata.userId !== filter.userId) {
      return false;
    }
    
    if (filter.entityId && metadata.entityId !== filter.entityId) {
      return false;
    }
    
    if (filter.entityType && metadata.entityType !== filter.entityType) {
      return false;
    }
    
    if (filter.access && metadata.access !== filter.access) {
      return false;
    }
    
    if (filter.filename) {
      const pattern = new RegExp(filter.filename.replace(/\*/g, '.*'), 'i');
      if (!pattern.test(metadata.filename)) {
        return false;
      }
    }
    
    if (filter.uploadedAfter && filter.uploadedAfter instanceof Date) {
      if (metadata.uploadedAt < filter.uploadedAfter) {
        return false;
      }
    }
    
    if (filter.uploadedBefore && filter.uploadedBefore instanceof Date) {
      if (metadata.uploadedAt > filter.uploadedBefore) {
        return false;
      }
    }
    
    if (typeof filter.minSize === 'number' && metadata.size < filter.minSize) {
      return false;
    }
    
    if (typeof filter.maxSize === 'number' && metadata.size > filter.maxSize) {
      return false;
    }
    
    if (filter.mimetype && metadata.mimetype !== filter.mimetype) {
      return false;
    }
    
    return true;
  }

  /**
   * 检查文件是否存在
   * @param fileId 文件ID
   */
  async fileExists(fileId: string): Promise<boolean> {
    try {
      await this.getFileMetadata(fileId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取可下载URL
   * @param fileId 文件ID
   * @param expiresIn URL过期时间（秒）
   */
  async getDownloadUrl(fileId: string, expiresIn?: number): Promise<string> {
    try {
      // 获取文件元数据
      const metadata = await this.getFileMetadata(fileId).catch(() => null);
      
      if (!metadata) {
        throw new Error(`File not found: ${fileId}`);
      }
      
      // 公开文件可以直接返回 S3 URL
      if (metadata.access === 'public' && this.config.publicUrlBase) {
        return `${this.config.publicUrlBase}/${metadata.path}`;
      }
      
      // 生成预签名 URL
      const command = new GetObjectCommand({
        Bucket: this.config.basePath,
        Key: metadata.path
      });
      
      const url = await getSignedUrl(
        this.s3Client,
        command,
        { expiresIn: expiresIn || this.config.defaultUrlExpiration }
      );
      
      return url;
    } catch (error: any) {
      console.error('Failed to generate download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * 复制文件
   * @param sourceId 源文件ID
   * @param options 目标文件选项
   */
  async copyFile(sourceId: string, options: UploadOptions): Promise<FileMetadata> {
    try {
      // 获取源文件元数据
      const sourceMetadata = await this.getFileMetadata(sourceId);
      
      // 生成新文件ID
      const fileId = this.generateFileId();
      
      // 安全的文件名
      const safeFilename = options.filename?.replace(/[^a-zA-Z0-9_.-]/g, '_') || sourceMetadata.filename;
      
      // 生成目标对象键
      const objectKey = this.generateObjectKey(fileId, safeFilename);
      
      // 创建文件元数据
      const metadata = await this.generateFileMetadata(
        fileId,
        objectKey,
        {
          ...options,
          filename: safeFilename,
          contentType: options.contentType || sourceMetadata.mimetype,
          metadata: {
            ...options.metadata,
            sourceFileId: sourceId
          }
        },
        sourceMetadata.size
      );
      
      // 复制对象
      await this.s3Client.send(
        new CopyObjectCommand({
          Bucket: this.config.basePath,
          CopySource: `${this.config.basePath}/${sourceMetadata.path}`,
          Key: objectKey,
          Metadata: this.convertMetadataToS3UserMetadata(metadata),
          MetadataDirective: 'REPLACE',
          ACL: metadata.access === 'public' ? 'public-read' : 'private',
          ContentType: metadata.mimetype
        })
      );
      
      return metadata;
    } catch (error: any) {
      console.error('Failed to copy file in S3:', error);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }
} 