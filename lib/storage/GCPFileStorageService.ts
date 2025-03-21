import { Storage, Bucket, File } from '@google-cloud/storage';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import mime from 'mime-types';
import axios from 'axios';

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
 * Google Cloud Storage 配置
 */
export interface GCPStorageConfig extends StorageConfig {
  type: StorageProviderType.GCP;
  /** 临时URL有效期（秒），默认3600 */
  defaultUrlExpiration?: number;
  /** Google Cloud Storage 配置 */
  providerOptions: {
    /** 项目ID */
    projectId?: string;
    /** 凭证配置路径 (JSON文件路径) */
    keyFilename?: string;
    /** 凭证配置内容 (JSON对象) */
    credentials?: Record<string, any>;
    /** 自定义端点 (可选) */
    apiEndpoint?: string;
    /** 是否自动重试 (可选) */
    autoRetry?: boolean;
    /** 最大重试次数 (可选) */
    maxRetries?: number;
    /** 缓存控制 (可选) */
    cacheControl?: string;
    /** 自定义域名 (可选) */
    customDomain?: string;
  };
}

/**
 * Google Cloud Storage 文件存储服务
 */
export class GCPFileStorageService implements FileStorageService {
  private storage: Storage;
  private bucket: Bucket;
  private bucketName: string;
  private defaultUrlExpiration: number;
  private customDomain?: string;
  private cacheControl?: string;
  private metadataCache: Map<string, FileMetadata> = new Map();

  /**
   * 构造函数
   * @param config Google Cloud Storage 配置
   */
  constructor(config: GCPStorageConfig) {
    this.bucketName = config.basePath;
    this.defaultUrlExpiration = config.defaultUrlExpiration || 3600;
    this.customDomain = config.providerOptions.customDomain;
    this.cacheControl = config.providerOptions.cacheControl;

    // 创建 Storage 客户端
    const storageOptions: any = {};

    if (config.providerOptions.projectId) {
      storageOptions.projectId = config.providerOptions.projectId;
    }

    if (config.providerOptions.keyFilename) {
      storageOptions.keyFilename = config.providerOptions.keyFilename;
    } else if (config.providerOptions.credentials) {
      storageOptions.credentials = config.providerOptions.credentials;
    }

    if (config.providerOptions.apiEndpoint) {
      storageOptions.apiEndpoint = config.providerOptions.apiEndpoint;
    }

    if (config.providerOptions.autoRetry !== undefined) {
      storageOptions.autoRetry = config.providerOptions.autoRetry;
    }

    if (config.providerOptions.maxRetries !== undefined) {
      storageOptions.maxRetries = config.providerOptions.maxRetries;
    }

    this.storage = new Storage(storageOptions);
    this.bucket = this.storage.bucket(this.bucketName);
  }

  /**
   * 确保存储桶存在
   * 如果不存在，则创建
   */
  private async ensureBucketExists(): Promise<void> {
    try {
      // 检查存储桶是否存在
      const [exists] = await this.bucket.exists();
      if (!exists) {
        console.log(`创建Google Cloud Storage存储桶: ${this.bucketName}`);
        await this.bucket.create();
      }
    } catch (error) {
      console.error('检查或创建存储桶失败:', error);
      throw new Error(`确保存储桶存在失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件对象
   * @param filePath 文件路径
   */
  private getFile(filePath: string): File {
    return this.bucket.file(filePath);
  }

  /**
   * 生成文件路径
   * @param filename 文件名
   * @param entityType 实体类型
   * @param entityId 实体ID
   */
  private generatePath(filename: string, entityType?: string, entityId?: string): string {
    const sanitizedFilename = this.sanitizeFilename(filename);
    const id = uuidv4();
    
    if (entityType && entityId) {
      return `${entityType}/${entityId}/${id}_${sanitizedFilename}`;
    } else if (entityType) {
      return `${entityType}/${id}_${sanitizedFilename}`;
    } else {
      return `uploads/${id}_${sanitizedFilename}`;
    }
  }

  /**
   * 清理文件名，移除特殊字符
   * @param filename 文件名
   */
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^\w.-]/gi, '_');
  }

  /**
   * 生成签名URL
   * @param file GCS文件对象
   * @param expiresIn 过期时间(秒)
   */
  private async generateSignedUrl(file: File, expiresIn: number): Promise<string> {
    try {
      const expires = new Date();
      expires.setSeconds(expires.getSeconds() + expiresIn);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires
      });

      // 如果设置了自定义域名，替换默认域名
      if (this.customDomain) {
        const defaultDomain = `storage.googleapis.com/${this.bucketName}`;
        const customDomain = `${this.customDomain}/${this.bucketName}`;
        return url.replace(defaultDomain, customDomain);
      }

      return url;
    } catch (error) {
      console.error('生成签名URL失败:', error);
      throw new Error(`生成签名URL失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 构建文件元数据
   * @param fileId 文件ID
   * @param filename 文件名
   * @param file GCS文件对象
   * @param options 上传选项
   * @param size 文件大小
   */
  private async buildFileMetadata(
    fileId: string,
    filename: string,
    file: File,
    options: UploadOptions,
    size: number
  ): Promise<FileMetadata> {
    const mimetype = options.contentType || mime.lookup(filename) || 'application/octet-stream';
    const url = await this.generateSignedUrl(file, this.defaultUrlExpiration);

    const metadata: FileMetadata = {
      id: fileId,
      filename,
      mimetype,
      size,
      uploadedAt: new Date(),
      userId: options.userId,
      entityId: options.entityId,
      entityType: options.entityType,
      path: file.name,
      url,
      access: options.access || 'private',
      metadata: options.metadata
    };

    // 缓存元数据
    this.metadataCache.set(fileId, metadata);

    return metadata;
  }

  /**
   * 上传文件
   * @param file 文件数据
   * @param options 上传选项
   */
  async uploadFile(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<FileMetadata> {
    await this.ensureBucketExists();

    const filename = options.filename || `file_${Date.now()}`;
    const path = this.generatePath(filename, options.entityType, options.entityId);
    const fileId = uuidv4();
    const gcsFile = this.getFile(path);

    // 设置文件元数据
    const metadata: Record<string, any> = {
      contentType: options.contentType || mime.lookup(filename) || 'application/octet-stream',
      metadata: {
        fileId,
        filename,
        userId: options.userId || '',
        entityId: options.entityId || '',
        entityType: options.entityType || '',
        access: options.access || 'private',
        ...(options.metadata || {})
      }
    };

    if (this.cacheControl) {
      metadata.cacheControl = this.cacheControl;
    }

    let size = 0;

    try {
      if (Buffer.isBuffer(file)) {
        size = file.length;
        await gcsFile.save(file, {
          contentType: metadata.contentType,
          metadata: metadata.metadata,
          resumable: file.length > 5 * 1024 * 1024, // 5MB以上使用可恢复上传
        });
      } else {
        // 流上传
        const chunks: Buffer[] = [];
        const streamAsBuffer = await new Promise<Buffer>((resolve, reject) => {
          file.on('data', (chunk) => {
            chunks.push(chunk as Buffer);
            size += (chunk as Buffer).length;
          });

          file.on('end', () => {
            resolve(Buffer.concat(chunks));
          });

          file.on('error', (err) => {
            reject(err);
          });
        });

        await gcsFile.save(streamAsBuffer, {
          contentType: metadata.contentType,
          metadata: metadata.metadata,
          resumable: streamAsBuffer.length > 5 * 1024 * 1024, // 5MB以上使用可恢复上传
        });
      }

      // 设置文件元数据（如果需要单独设置）
      await gcsFile.setMetadata({
        contentType: metadata.contentType,
        metadata: metadata.metadata,
        cacheControl: metadata.cacheControl
      });

      return this.buildFileMetadata(fileId, filename, gcsFile, options, size);
    } catch (error) {
      console.error('上传文件失败:', error);
      throw new Error(`上传文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 通过URL上传文件
   * @param url 文件URL
   * @param options 上传选项
   */
  async uploadFromUrl(url: string, options: UploadOptions): Promise<FileMetadata> {
    try {
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data);
      
      // 从URL中提取文件名
      let filename = options.filename;
      if (!filename) {
        try {
          const urlObj = new URL(url);
          const pathSegments = urlObj.pathname.split('/');
          filename = pathSegments[pathSegments.length - 1] || `file_${Date.now()}`;
        } catch {
          filename = `file_${Date.now()}`;
        }
      }
      
      // 设置内容类型
      if (!options.contentType && response.headers['content-type']) {
        options.contentType = response.headers['content-type'] as string;
      }
      
      return this.uploadFile(buffer, { ...options, filename });
    } catch (error) {
      console.error('从URL上传文件失败:', error);
      throw new Error(`从URL上传文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 下载文件
   * @param fileId 文件ID
   * @param options 下载选项
   */
  async downloadFile(fileId: string, options?: DownloadOptions): Promise<Buffer | string> {
    try {
      // 获取文件元数据
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error(`文件不存在: ${fileId}`);
      }

      const file = this.getFile(metadata.path);

      // 如果要返回URL
      if (options?.asUrl) {
        return this.generateSignedUrl(file, options.expiresIn || this.defaultUrlExpiration);
      }

      // 否则下载文件内容
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      console.error('下载文件失败:', error);
      throw new Error(`下载文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取文件元数据
   * @param fileId 文件ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    // 尝试从缓存获取
    if (this.metadataCache.has(fileId)) {
      return this.metadataCache.get(fileId)!;
    }

    try {
      await this.ensureBucketExists();
      
      // 查找所有文件，匹配fileId
      const [files] = await this.bucket.getFiles();
      
      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          
          if (metadata.metadata?.fileId === fileId) {
            // 构建元数据对象
            const fileMetadata: FileMetadata = {
              id: fileId,
              filename: metadata.metadata.filename || path.basename(file.name),
              mimetype: metadata.contentType || 'application/octet-stream',
              size: parseInt(metadata.size, 10) || 0,
              uploadedAt: new Date(metadata.timeCreated || Date.now()),
              userId: metadata.metadata.userId || undefined,
              entityId: metadata.metadata.entityId || undefined,
              entityType: metadata.metadata.entityType || undefined,
              path: file.name,
              url: await this.generateSignedUrl(file, this.defaultUrlExpiration),
              access: (metadata.metadata.access as 'public' | 'private' | 'protected') || 'private',
              metadata: Object.keys(metadata.metadata || {})
                .filter(key => !['fileId', 'filename', 'userId', 'entityId', 'entityType', 'access'].includes(key))
                .reduce((obj, key) => {
                  obj[key] = metadata.metadata[key];
                  return obj;
                }, {} as Record<string, any>)
            };
            
            // 缓存元数据
            this.metadataCache.set(fileId, fileMetadata);
            
            return fileMetadata;
          }
        } catch (err) {
          console.warn(`获取文件 ${file.name} 的元数据失败:`, err);
          // 继续检查下一个文件
        }
      }
      
      throw new Error(`文件不存在: ${fileId}`);
    } catch (error) {
      console.error('获取文件元数据失败:', error);
      throw new Error(`获取文件元数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 更新文件元数据
   * @param fileId 文件ID
   * @param metadata 更新的元数据
   */
  async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
    try {
      // 获取当前元数据
      const currentMetadata = await this.getFileMetadata(fileId);
      
      // 获取文件对象
      const file = this.getFile(currentMetadata.path);
      
      // 获取当前GCS元数据
      const [gcsMetadata] = await file.getMetadata();
      
      // 准备更新的元数据
      const updatedMetadata: Record<string, any> = {
        metadata: {
          ...(gcsMetadata.metadata || {}),
          ...(metadata.metadata || {}),
        }
      };
      
      // 更新访问权限
      if (metadata.access) {
        updatedMetadata.metadata.access = metadata.access;
      }
      
      // 更新用户ID
      if (metadata.userId) {
        updatedMetadata.metadata.userId = metadata.userId;
      }
      
      // 更新实体信息
      if (metadata.entityId) {
        updatedMetadata.metadata.entityId = metadata.entityId;
      }
      
      if (metadata.entityType) {
        updatedMetadata.metadata.entityType = metadata.entityType;
      }
      
      // 设置新的元数据
      await file.setMetadata(updatedMetadata);
      
      // 更新缓存的元数据
      const result: FileMetadata = {
        ...currentMetadata,
        ...metadata,
        metadata: {
          ...(currentMetadata.metadata || {}),
          ...(metadata.metadata || {})
        },
        url: await this.generateSignedUrl(file, this.defaultUrlExpiration)
      };
      
      this.metadataCache.set(fileId, result);
      
      return result;
    } catch (error) {
      console.error('更新文件元数据失败:', error);
      throw new Error(`更新文件元数据失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // 获取文件元数据
      const metadata = await this.getFileMetadata(fileId);
      
      // 获取文件对象
      const file = this.getFile(metadata.path);
      
      // 删除文件
      await file.delete();
      
      // 从缓存中删除
      this.metadataCache.delete(fileId);
      
      return true;
    } catch (error) {
      if ((error as Error).message.includes('文件不存在')) {
        return false;
      }
      console.error('删除文件失败:', error);
      throw new Error(`删除文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量删除文件
   * @param fileIds 文件ID数组
   */
  async deleteFiles(fileIds: string[]): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          const success = await this.deleteFile(fileId);
          results.set(fileId, success);
        } catch (error) {
          console.warn(`删除文件 ${fileId} 失败:`, error);
          results.set(fileId, false);
        }
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
      await this.ensureBucketExists();
      
      // 获取所有文件
      const [files] = await this.bucket.getFiles();
      const results: FileMetadata[] = [];
      
      let count = 0;
      let skipped = 0;
      const offsetVal = offset || 0;
      
      for (const file of files) {
        try {
          const [metadata] = await file.getMetadata();
          
          if (!metadata.metadata?.fileId) {
            continue;
          }
          
          // 检查过滤条件
          let match = true;
          
          if (filter.userId && metadata.metadata.userId !== filter.userId) {
            match = false;
          }
          
          if (filter.entityId && metadata.metadata.entityId !== filter.entityId) {
            match = false;
          }
          
          if (filter.entityType && metadata.metadata.entityType !== filter.entityType) {
            match = false;
          }
          
          if (filter.access && metadata.metadata.access !== filter.access) {
            match = false;
          }
          
          if (filter.filename) {
            const pattern = filter.filename.replace(/\*/g, '.*');
            const regex = new RegExp(`^${pattern}$`);
            if (!regex.test(metadata.metadata.filename)) {
              match = false;
            }
          }
          
          if (filter.mimetype && metadata.contentType !== filter.mimetype) {
            match = false;
          }
          
          const fileSize = parseInt(metadata.size, 10) || 0;
          if (filter.minSize !== undefined && fileSize < filter.minSize) {
            match = false;
          }
          
          if (filter.maxSize !== undefined && fileSize > filter.maxSize) {
            match = false;
          }
          
          if (filter.uploadedAfter && metadata.timeCreated) {
            const createdTime = new Date(metadata.timeCreated).getTime();
            if (createdTime < filter.uploadedAfter.getTime()) {
              match = false;
            }
          }
          
          if (filter.uploadedBefore && metadata.timeCreated) {
            const createdTime = new Date(metadata.timeCreated).getTime();
            if (createdTime > filter.uploadedBefore.getTime()) {
              match = false;
            }
          }
          
          if (match) {
            // 处理偏移
            if (skipped < offsetVal) {
              skipped++;
              continue;
            }
            
            // 构建元数据对象
            const fileId = metadata.metadata.fileId;
            const fileMetadata: FileMetadata = {
              id: fileId,
              filename: metadata.metadata.filename || path.basename(file.name),
              mimetype: metadata.contentType || 'application/octet-stream',
              size: fileSize,
              uploadedAt: new Date(metadata.timeCreated || Date.now()),
              userId: metadata.metadata.userId || undefined,
              entityId: metadata.metadata.entityId || undefined,
              entityType: metadata.metadata.entityType || undefined,
              path: file.name,
              url: await this.generateSignedUrl(file, this.defaultUrlExpiration),
              access: (metadata.metadata.access as 'public' | 'private' | 'protected') || 'private',
              metadata: Object.keys(metadata.metadata || {})
                .filter(key => !['fileId', 'filename', 'userId', 'entityId', 'entityType', 'access'].includes(key))
                .reduce((obj, key) => {
                  obj[key] = metadata.metadata[key];
                  return obj;
                }, {} as Record<string, any>)
            };
            
            // 缓存元数据
            this.metadataCache.set(fileId, fileMetadata);
            
            results.push(fileMetadata);
            count++;
            
            // 达到限制数量，提前结束
            if (limit !== undefined && count >= limit) {
              break;
            }
          }
        } catch (err) {
          console.warn(`获取文件 ${file.name} 的元数据失败:`, err);
          // 继续检查下一个文件
        }
      }
      
      return results;
    } catch (error) {
      console.error('查找文件失败:', error);
      throw new Error(`查找文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      const metadata = await this.getFileMetadata(fileId);
      const file = this.getFile(metadata.path);
      return this.generateSignedUrl(file, expiresIn || this.defaultUrlExpiration);
    } catch (error) {
      console.error('获取下载URL失败:', error);
      throw new Error(`获取下载URL失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 复制文件
   * @param sourceId 源文件ID
   * @param options 目标文件选项
   */
  async copyFile(sourceId: string, options: UploadOptions): Promise<FileMetadata> {
    try {
      const sourceMetadata = await this.getFileMetadata(sourceId);
      const sourceFile = this.getFile(sourceMetadata.path);
      
      const filename = options.filename || sourceMetadata.filename;
      const path = this.generatePath(filename, options.entityType, options.entityId);
      const fileId = uuidv4();
      const destinationFile = this.getFile(path);
      
      // 复制文件
      await sourceFile.copy(destinationFile);
      
      // 设置元数据
      const metadata: Record<string, any> = {
        metadata: {
          fileId,
          filename,
          userId: options.userId || '',
          entityId: options.entityId || '',
          entityType: options.entityType || '',
          access: options.access || sourceMetadata.access,
          ...(options.metadata || {})
        },
        contentType: options.contentType || sourceMetadata.mimetype
      };
      
      if (this.cacheControl) {
        metadata.cacheControl = this.cacheControl;
      }
      
      // 设置元数据
      await destinationFile.setMetadata(metadata);
      
      // 构建和返回新文件的元数据
      return this.buildFileMetadata(fileId, filename, destinationFile, options, sourceMetadata.size);
    } catch (error) {
      console.error('复制文件失败:', error);
      throw new Error(`复制文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 