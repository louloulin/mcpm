import {
  BlobServiceClient,
  ContainerClient,
  BlockBlobClient,
  StorageSharedKeyCredential,
  BlobSASPermissions,
  BlobSASSignatureValues,
  generateBlobSASQueryParameters,
  BlobDownloadResponseModel
} from '@azure/storage-blob';
import { DefaultAzureCredential } from '@azure/identity';
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
 * Azure Blob Storage 配置
 */
export interface AzureStorageConfig extends StorageConfig {
  type: StorageProviderType.AZURE;
  /** 临时URL有效期（秒），默认3600 */
  defaultUrlExpiration?: number;
  /** Azure Blob Storage 配置 */
  providerOptions: {
    /** 存储账户名 */
    accountName: string;
    /** 存储账户密钥 (可选，使用DefaultAzureCredential时不需要) */
    accountKey?: string;
    /** 是否使用DefaultAzureCredential */
    useDefaultAzureCredential?: boolean;
    /** 连接字符串 (可选，与accountName+accountKey二选一) */
    connectionString?: string;
    /** 自定义域名 (可选) */
    customDomain?: string;
    /** 缓存控制 (可选) */
    cacheControl?: string;
  };
}

/**
 * Azure Blob Storage 文件存储服务
 */
export class AzureFileStorageService implements FileStorageService {
  private blobServiceClient: BlobServiceClient;
  private containerClient: ContainerClient;
  private containerName: string;
  private defaultUrlExpiration: number;
  private customDomain?: string;
  private cacheControl?: string;
  private metadataCache: Map<string, FileMetadata> = new Map();

  /**
   * 构造函数
   * @param config Azure Blob Storage 配置
   */
  constructor(config: AzureStorageConfig) {
    this.containerName = config.basePath;
    this.defaultUrlExpiration = config.defaultUrlExpiration || 3600;
    this.customDomain = config.providerOptions.customDomain;
    this.cacheControl = config.providerOptions.cacheControl;

    // 创建 BlobServiceClient
    if (config.providerOptions.connectionString) {
      // 使用连接字符串
      this.blobServiceClient = BlobServiceClient.fromConnectionString(
        config.providerOptions.connectionString
      );
    } else if (config.providerOptions.accountName && config.providerOptions.accountKey) {
      // 使用账户名和账户密钥
      const sharedKeyCredential = new StorageSharedKeyCredential(
        config.providerOptions.accountName,
        config.providerOptions.accountKey
      );
      this.blobServiceClient = new BlobServiceClient(
        `https://${config.providerOptions.accountName}.blob.core.windows.net`,
        sharedKeyCredential
      );
    } else if (config.providerOptions.useDefaultAzureCredential) {
      // 使用 DefaultAzureCredential (适用于托管身份等)
      const credential = new DefaultAzureCredential();
      this.blobServiceClient = new BlobServiceClient(
        `https://${config.providerOptions.accountName}.blob.core.windows.net`,
        credential
      );
    } else {
      throw new Error('缺少 Azure Blob Storage 连接配置');
    }

    // 获取容器客户端
    this.containerClient = this.blobServiceClient.getContainerClient(this.containerName);
  }

  /**
   * 初始化容器
   * 如果容器不存在，则创建容器
   */
  private async initializeContainer(): Promise<void> {
    const exists = await this.containerClient.exists();
    if (!exists) {
      console.log(`创建Azure Blob Storage容器: ${this.containerName}`);
      await this.containerClient.create();
    }
  }

  /**
   * 获取Blob客户端
   * @param blobPath Blob路径
   */
  private getBlobClient(blobPath: string): BlockBlobClient {
    return this.containerClient.getBlockBlobClient(blobPath);
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
   * @param blobClient Blob客户端
   * @param expiresIn 过期时间(秒)
   */
  private async generateSignedUrl(blobClient: BlockBlobClient, expiresIn: number): Promise<string> {
    const startsOn = new Date();
    const expiresOn = new Date(startsOn);
    expiresOn.setSeconds(expiresOn.getSeconds() + expiresIn);

    const permissions = new BlobSASPermissions();
    permissions.read = true;

    // 通过URL获取账户名和容器名
    const url = new URL(blobClient.url);
    const pathParts = url.pathname.split('/');
    const containerName = pathParts[1];
    const blobName = pathParts.slice(2).join('/');
    
    // 使用 generateBlobSASQueryParameters 生成 SAS 令牌
    let sasToken: string;
    
    // 检查是否可以直接从 blobClient 获取凭据
    if ('credential' in this.blobServiceClient && this.blobServiceClient['credential'] instanceof StorageSharedKeyCredential) {
      const sasOptions: BlobSASSignatureValues = {
        permissions,
        startsOn,
        expiresOn,
        containerName,
        blobName
      };
      
      sasToken = generateBlobSASQueryParameters(
        sasOptions,
        this.blobServiceClient['credential'] as StorageSharedKeyCredential
      ).toString();
    } else {
      // 如果无法获取凭据，尝试使用容器客户端生成SAS
      throw new Error('无法生成SAS令牌，缺少凭据或权限不足');
    }

    // 根据是否设置了自定义域名决定URL基础
    if (this.customDomain) {
      // 使用自定义域
      const urlObj = new URL(blobClient.url);
      const blobPath = urlObj.pathname;
      return `https://${this.customDomain}${blobPath}?${sasToken}`;
    } else {
      // 使用默认Azure URL
      return `${blobClient.url}?${sasToken}`;
    }
  }

  /**
   * 构建文件元数据
   * @param fileId 文件ID
   * @param filename 文件名
   * @param blobClient Blob客户端
   * @param options 上传选项
   * @param size 文件大小
   */
  private async buildFileMetadata(
    fileId: string,
    filename: string,
    blobClient: BlockBlobClient,
    options: UploadOptions,
    size: number
  ): Promise<FileMetadata> {
    const mimetype = options.contentType || mime.lookup(filename) || 'application/octet-stream';
    const url = await this.generateSignedUrl(blobClient, this.defaultUrlExpiration);

    const metadata: FileMetadata = {
      id: fileId,
      filename,
      mimetype,
      size,
      uploadedAt: new Date(),
      userId: options.userId,
      entityId: options.entityId,
      entityType: options.entityType,
      path: blobClient.name,
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
    await this.initializeContainer();

    const filename = options.filename || 'file_' + Date.now();
    const path = this.generatePath(filename, options.entityType, options.entityId);
    const fileId = uuidv4();
    const blobClient = this.getBlobClient(path);

    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: options.contentType || mime.lookup(filename) || 'application/octet-stream',
        blobCacheControl: this.cacheControl || 'max-age=3600'
      },
      metadata: {
        fileId,
        filename,
        userId: options.userId || '',
        entityId: options.entityId || '',
        entityType: options.entityType || '',
        access: options.access || 'private',
        ...options.metadata
      }
    };

    let size = 0;

    if (Buffer.isBuffer(file)) {
      size = file.length;
      await blobClient.upload(file, file.length, uploadOptions);
    } else {
      // 流上传
      const chunks: Buffer[] = [];
      const streamAsBuffer = await new Promise<Buffer>((resolve, reject) => {
        file.on('data', (chunk) => {
          chunks.push(chunk);
          size += chunk.length;
        });

        file.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        file.on('error', (err) => {
          reject(err);
        });
      });

      await blobClient.upload(streamAsBuffer, streamAsBuffer.length, uploadOptions);
    }

    return this.buildFileMetadata(fileId, filename, blobClient, options, size);
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
          filename = pathSegments[pathSegments.length - 1] || 'file_' + Date.now();
        } catch {
          filename = 'file_' + Date.now();
        }
      }
      
      // 设置内容类型
      if (!options.contentType && response.headers['content-type']) {
        options.contentType = response.headers['content-type'];
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
    // 获取文件元数据
    const metadata = await this.getFileMetadata(fileId);
    if (!metadata) {
      throw new Error(`文件不存在: ${fileId}`);
    }

    const blobClient = this.getBlobClient(metadata.path);

    // 如果要返回URL
    if (options?.asUrl) {
      return this.generateSignedUrl(blobClient, options.expiresIn || this.defaultUrlExpiration);
    }

    // 否则下载文件内容
    const downloadResponse = await blobClient.download(0);
    
    // 读取流到Buffer
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      // 确保downloadResponse.readableStreamBody存在
      if (!downloadResponse.readableStreamBody) {
        reject(new Error('无法获取文件内容流'));
        return;
      }
      
      downloadResponse.readableStreamBody.on('data', (chunk) => {
        chunks.push(chunk);
      });
      
      downloadResponse.readableStreamBody.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      
      downloadResponse.readableStreamBody.on('error', (err) => {
        reject(err);
      });
    });
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

    // 检查所有Blob的元数据，查找匹配的fileId
    await this.initializeContainer();
    
    // 列出所有Blob
    const blobs = this.containerClient.listBlobsFlat();
    
    for await (const blob of blobs) {
      const blobClient = this.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      
      if (properties.metadata?.fileId === fileId) {
        // 构建元数据对象
        const metadata: FileMetadata = {
          id: fileId,
          filename: properties.metadata.filename || path.basename(blob.name),
          mimetype: properties.contentType || 'application/octet-stream',
          size: properties.contentLength || 0,
          uploadedAt: properties.lastModified || new Date(),
          userId: properties.metadata.userId || undefined,
          entityId: properties.metadata.entityId || undefined,
          entityType: properties.metadata.entityType || undefined,
          path: blob.name,
          url: await this.generateSignedUrl(blobClient, this.defaultUrlExpiration),
          access: (properties.metadata.access as 'public' | 'private' | 'protected') || 'private',
          metadata: Object.keys(properties.metadata)
            .filter(key => !['fileId', 'filename', 'userId', 'entityId', 'entityType', 'access'].includes(key))
            .reduce((obj, key) => {
              obj[key] = properties.metadata[key];
              return obj;
            }, {} as Record<string, any>)
        };
        
        // 缓存元数据
        this.metadataCache.set(fileId, metadata);
        
        return metadata;
      }
    }
    
    throw new Error(`文件不存在: ${fileId}`);
  }

  /**
   * 更新文件元数据
   * @param fileId 文件ID
   * @param metadata 更新的元数据
   */
  async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
    // 获取当前元数据
    const currentMetadata = await this.getFileMetadata(fileId);
    
    // 获取Blob客户端
    const blobClient = this.getBlobClient(currentMetadata.path);
    
    // 获取当前属性
    const properties = await blobClient.getProperties();
    
    // 更新元数据
    const newMetadata = {
      ...(properties.metadata || {}),
      ...(metadata.metadata || {}),
      access: metadata.access || (properties.metadata?.access as string) || 'private',
      userId: metadata.userId || properties.metadata?.userId || '',
      entityId: metadata.entityId || properties.metadata?.entityId || '',
      entityType: metadata.entityType || properties.metadata?.entityType || '',
    };
    
    // 设置新的元数据
    await blobClient.setMetadata(newMetadata);
    
    // 更新缓存的元数据
    const updatedMetadata: FileMetadata = {
      ...currentMetadata,
      ...metadata,
      url: await this.generateSignedUrl(blobClient, this.defaultUrlExpiration)
    };
    
    this.metadataCache.set(fileId, updatedMetadata);
    
    return updatedMetadata;
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      // 获取文件元数据
      const metadata = await this.getFileMetadata(fileId);
      
      // 获取Blob客户端
      const blobClient = this.getBlobClient(metadata.path);
      
      // 删除Blob
      await blobClient.delete();
      
      // 从缓存中删除
      this.metadataCache.delete(fileId);
      
      return true;
    } catch (error) {
      if ((error as Error).message.includes('文件不存在')) {
        return false;
      }
      throw error;
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
    await this.initializeContainer();
    
    // 列出所有Blob
    const blobs = this.containerClient.listBlobsFlat();
    const results: FileMetadata[] = [];
    
    let count = 0;
    let skipped = 0;
    const offsetVal = offset || 0;
    
    for await (const blob of blobs) {
      const blobClient = this.getBlobClient(blob.name);
      const properties = await blobClient.getProperties();
      
      if (!properties.metadata?.fileId) {
        continue;
      }
      
      // 检查过滤条件
      let match = true;
      
      if (filter.userId && properties.metadata.userId !== filter.userId) {
        match = false;
      }
      
      if (filter.entityId && properties.metadata.entityId !== filter.entityId) {
        match = false;
      }
      
      if (filter.entityType && properties.metadata.entityType !== filter.entityType) {
        match = false;
      }
      
      if (filter.access && properties.metadata.access !== filter.access) {
        match = false;
      }
      
      if (filter.filename) {
        const pattern = filter.filename.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        if (!regex.test(properties.metadata.filename)) {
          match = false;
        }
      }
      
      if (filter.mimetype && properties.contentType !== filter.mimetype) {
        match = false;
      }
      
      if (filter.minSize !== undefined && (properties.contentLength || 0) < filter.minSize) {
        match = false;
      }
      
      if (filter.maxSize !== undefined && (properties.contentLength || 0) > filter.maxSize) {
        match = false;
      }
      
      if (filter.uploadedAfter && properties.lastModified && properties.lastModified < filter.uploadedAfter) {
        match = false;
      }
      
      if (filter.uploadedBefore && properties.lastModified && properties.lastModified > filter.uploadedBefore) {
        match = false;
      }
      
      if (match) {
        // 处理偏移
        if (skipped < offsetVal) {
          skipped++;
          continue;
        }
        
        // 构建元数据对象
        const fileId = properties.metadata.fileId;
        const metadata: FileMetadata = {
          id: fileId,
          filename: properties.metadata.filename || path.basename(blob.name),
          mimetype: properties.contentType || 'application/octet-stream',
          size: properties.contentLength || 0,
          uploadedAt: properties.lastModified || new Date(),
          userId: properties.metadata.userId || undefined,
          entityId: properties.metadata.entityId || undefined,
          entityType: properties.metadata.entityType || undefined,
          path: blob.name,
          url: await this.generateSignedUrl(blobClient, this.defaultUrlExpiration),
          access: (properties.metadata.access as 'public' | 'private' | 'protected') || 'private',
          metadata: Object.keys(properties.metadata)
            .filter(key => !['fileId', 'filename', 'userId', 'entityId', 'entityType', 'access'].includes(key))
            .reduce((obj, key) => {
              obj[key] = properties.metadata[key];
              return obj;
            }, {} as Record<string, any>)
        };
        
        // 缓存元数据
        this.metadataCache.set(fileId, metadata);
        
        results.push(metadata);
        count++;
        
        // 达到限制数量，提前结束
        if (limit !== undefined && count >= limit) {
          break;
        }
      }
    }
    
    return results;
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
      const blobClient = this.getBlobClient(metadata.path);
      return this.generateSignedUrl(blobClient, expiresIn || this.defaultUrlExpiration);
    } catch (error) {
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
      const sourceBlobClient = this.getBlobClient(sourceMetadata.path);
      
      const filename = options.filename || sourceMetadata.filename;
      const path = this.generatePath(filename, options.entityType, options.entityId);
      const fileId = uuidv4();
      const targetBlobClient = this.getBlobClient(path);
      
      // 复制Blob
      const copyResult = await targetBlobClient.beginCopyFromURL(sourceBlobClient.url);
      await copyResult.pollUntilDone();
      
      // 设置元数据
      const metadata = {
        fileId,
        filename,
        userId: options.userId || '',
        entityId: options.entityId || '',
        entityType: options.entityType || '',
        access: options.access || sourceMetadata.access,
        ...options.metadata
      };
      
      await targetBlobClient.setMetadata(metadata);
      
      // 设置属性
      await targetBlobClient.setHTTPHeaders({
        blobContentType: options.contentType || sourceMetadata.mimetype,
        blobCacheControl: this.cacheControl || 'max-age=3600'
      });
      
      // 构建和返回新文件的元数据
      return this.buildFileMetadata(fileId, filename, targetBlobClient, options, sourceMetadata.size);
    } catch (error) {
      throw new Error(`复制文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
} 