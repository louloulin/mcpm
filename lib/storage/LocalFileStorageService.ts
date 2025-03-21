import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import fetch from 'node-fetch';
// @ts-expect-error mime-types 没有类型定义
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
 * 本地文件存储服务配置
 */
export interface LocalStorageConfig extends StorageConfig {
  type: StorageProviderType.LOCAL;
  /** 临时URL有效期（秒），默认3600 */
  defaultUrlExpiration?: number;
}

/**
 * 本地文件存储服务
 * 
 * 基于本地文件系统的文件存储服务实现
 */
export class LocalFileStorageService implements FileStorageService {
  private config: LocalStorageConfig;
  private fileMetadataMap: Map<string, FileMetadata>;
  private metadataFilePath: string;

  /**
   * 创建本地文件存储服务
   * @param config 存储配置
   */
  constructor(config: LocalStorageConfig) {
    this.config = {
      ...config,
      defaultUrlExpiration: config.defaultUrlExpiration || 3600
    };
    
    this.fileMetadataMap = new Map<string, FileMetadata>();
    this.metadataFilePath = path.join(this.config.basePath, 'metadata.json');
    
    // 确保存储目录存在
    this.ensureStorageDirectory();
    
    // 加载元数据
    this.loadMetadata();
  }

  /**
   * 确保存储目录存在
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.config.basePath, { recursive: true });
      console.log(`Storage directory created: ${this.config.basePath}`);
    } catch (error) {
      console.error('Failed to create storage directory:', error);
      throw new Error('Failed to initialize storage directory');
    }
  }

  /**
   * 加载文件元数据
   */
  private async loadMetadata(): Promise<void> {
    try {
      const data = await fs.readFile(this.metadataFilePath, 'utf-8').catch(() => '{}');
      const metadata = JSON.parse(data) as Record<string, FileMetadata>;
      
      Object.entries(metadata).forEach(([id, meta]) => {
        // 转换Date字符串为Date对象
        if (meta.uploadedAt && typeof meta.uploadedAt === 'string') {
          meta.uploadedAt = new Date(meta.uploadedAt);
        }
        this.fileMetadataMap.set(id, meta);
      });
      
      console.log(`Loaded metadata for ${this.fileMetadataMap.size} files`);
    } catch (error) {
      console.error('Failed to load metadata:', error);
      // 初始化空元数据
      this.fileMetadataMap = new Map<string, FileMetadata>();
      await this.saveMetadata();
    }
  }

  /**
   * 保存文件元数据
   */
  private async saveMetadata(): Promise<void> {
    try {
      const metadata: Record<string, FileMetadata> = {};
      
      this.fileMetadataMap.forEach((meta, id) => {
        metadata[id] = meta;
      });
      
      await fs.writeFile(this.metadataFilePath, JSON.stringify(metadata, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save metadata:', error);
      throw new Error('Failed to save file metadata');
    }
  }

  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return uuidv4();
  }

  /**
   * 生成文件路径
   * @param fileId 文件ID
   * @param filename 文件名
   */
  private generateFilePath(fileId: string, filename: string): string {
    // 创建基于ID的目录结构以避免单一目录下文件过多
    const subDirPrefix = fileId.substring(0, 2);
    const storageDir = path.join(this.config.basePath, subDirPrefix);
    
    // 确保子目录存在
    fs.mkdir(storageDir, { recursive: true }).catch(console.error);
    
    // 生成存储路径
    return path.join(subDirPrefix, `${fileId}_${filename}`);
  }

  /**
   * 获取文件的绝对路径
   * @param filePath 相对文件路径
   */
  private getAbsoluteFilePath(filePath: string): string {
    return path.join(this.config.basePath, filePath);
  }

  /**
   * 创建签名URL
   * @param fileId 文件ID
   * @param expiresIn 过期时间（秒）
   */
  private createSignedUrl(fileId: string, expiresIn?: number): string {
    const metadata = this.fileMetadataMap.get(fileId);
    if (!metadata) {
      throw new Error(`File not found: ${fileId}`);
    }

    const expiration = Math.floor(Date.now() / 1000) + (expiresIn || this.config.defaultUrlExpiration || 3600);
    const baseUrl = this.config.publicUrlBase || '';
    
    // 创建包含过期信息的签名
    const signature = crypto
      .createHmac('sha256', process.env.FILE_STORAGE_SECRET || 'file-storage-secret')
      .update(`${fileId}:${expiration}`)
      .digest('hex');

    return `${baseUrl}/api/storage/download/${fileId}?expires=${expiration}&signature=${signature}`;
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
    
    // 生成存储路径
    const filePath = this.generateFilePath(fileId, safeFilename);
    const absolutePath = this.getAbsoluteFilePath(filePath);
    
    try {
      let fileSize = 0;
      
      // 写入文件
      if (Buffer.isBuffer(file)) {
        await fs.writeFile(absolutePath, file);
        fileSize = file.length;
      } else {
        // 创建写入流
        const writeStream = fsSync.createWriteStream(absolutePath);
        
        // 使用pipeline处理流
        await pipeline(file, writeStream);
        
        // 获取文件大小
        const stat = await fs.stat(absolutePath);
        fileSize = stat.size;
      }
      
      // 检测MIME类型
      const mimeType = options.contentType || mime.lookup(safeFilename) || 'application/octet-stream';
      
      // 创建元数据
      const metadata: FileMetadata = {
        id: fileId,
        filename: safeFilename,
        mimetype: mimeType,
        size: fileSize,
        uploadedAt: new Date(),
        userId: options.userId,
        entityId: options.entityId,
        entityType: options.entityType,
        path: filePath,
        url: this.createSignedUrl(fileId),
        access: options.access || 'private',
        metadata: options.metadata
      };
      
      // 保存元数据
      this.fileMetadataMap.set(fileId, metadata);
      await this.saveMetadata();
      
      return metadata;
    } catch (error) {
      // 发生错误时清理文件
      fs.unlink(absolutePath).catch(console.error);
      console.error('Failed to upload file:', error);
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
      
      // 上传文件流
      return this.uploadFile(Readable.fromWeb(response.body as any), fileOptions);
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
    const metadata = this.fileMetadataMap.get(fileId);
    
    if (!metadata) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    // 如果请求URL而不是内容
    if (options?.asUrl) {
      return this.getDownloadUrl(fileId, options.expiresIn);
    }
    
    try {
      const absolutePath = this.getAbsoluteFilePath(metadata.path);
      return await fs.readFile(absolutePath);
    } catch (error: any) {
      console.error('Failed to download file:', error);
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * 获取文件详情
   * @param fileId 文件ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const metadata = this.fileMetadataMap.get(fileId);
    
    if (!metadata) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    return metadata;
  }

  /**
   * 更新文件元数据
   * @param fileId 文件ID
   * @param metadata 更新的元数据
   */
  async updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata> {
    const existingMetadata = this.fileMetadataMap.get(fileId);
    
    if (!existingMetadata) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    // 保护不可修改的字段
    const { ...updatableFields } = metadata;
    
    // 更新元数据
    const updatedMetadata: FileMetadata = {
      ...existingMetadata,
      ...updatableFields
    };
    
    // 更新映射和保存
    this.fileMetadataMap.set(fileId, updatedMetadata);
    await this.saveMetadata();
    
    return updatedMetadata;
  }

  /**
   * 删除文件
   * @param fileId 文件ID
   */
  async deleteFile(fileId: string): Promise<boolean> {
    const metadata = this.fileMetadataMap.get(fileId);
    
    if (!metadata) {
      return false;
    }
    
    try {
      const absolutePath = this.getAbsoluteFilePath(metadata.path);
      await fs.unlink(absolutePath);
      
      // 删除元数据
      this.fileMetadataMap.delete(fileId);
      await this.saveMetadata();
      
      return true;
    } catch (error) {
      console.error('Failed to delete file:', error);
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
    let results = Array.from(this.fileMetadataMap.values());
    
    // 应用过滤器
    if (filter.userId) {
      results = results.filter(meta => meta.userId === filter.userId);
    }
    
    if (filter.entityId) {
      results = results.filter(meta => meta.entityId === filter.entityId);
    }
    
    if (filter.entityType) {
      results = results.filter(meta => meta.entityType === filter.entityType);
    }
    
    if (filter.access) {
      results = results.filter(meta => meta.access === filter.access);
    }
    
    if (filter.filename) {
      const pattern = new RegExp(filter.filename.replace(/\*/g, '.*'), 'i');
      results = results.filter(meta => pattern.test(meta.filename));
    }
    
    if (filter.uploadedAfter && filter.uploadedAfter instanceof Date) {
      results = results.filter(meta => meta.uploadedAt >= filter.uploadedAfter!);
    }
    
    if (filter.uploadedBefore && filter.uploadedBefore instanceof Date) {
      results = results.filter(meta => meta.uploadedAt <= filter.uploadedBefore!);
    }
    
    if (typeof filter.minSize === 'number') {
      results = results.filter(meta => meta.size >= filter.minSize!);
    }
    
    if (typeof filter.maxSize === 'number') {
      results = results.filter(meta => meta.size <= filter.maxSize!);
    }
    
    if (filter.mimetype) {
      results = results.filter(meta => meta.mimetype === filter.mimetype);
    }
    
    // 应用分页
    const startIndex = offset || 0;
    const endIndex = limit ? startIndex + limit : results.length;
    
    return results.slice(startIndex, endIndex);
  }

  /**
   * 检查文件是否存在
   * @param fileId 文件ID
   */
  async fileExists(fileId: string): Promise<boolean> {
    const metadata = this.fileMetadataMap.get(fileId);
    
    if (!metadata) {
      return false;
    }
    
    try {
      const absolutePath = this.getAbsoluteFilePath(metadata.path);
      await fs.access(absolutePath, fs.constants.F_OK);
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
    if (!this.fileMetadataMap.has(fileId)) {
      throw new Error(`File not found: ${fileId}`);
    }
    
    return this.createSignedUrl(fileId, expiresIn);
  }

  /**
   * 复制文件
   * @param sourceId 源文件ID
   * @param options 目标文件选项
   */
  async copyFile(sourceId: string, options: UploadOptions): Promise<FileMetadata> {
    const sourceMetadata = this.fileMetadataMap.get(sourceId);
    
    if (!sourceMetadata) {
      throw new Error(`Source file not found: ${sourceId}`);
    }
    
    try {
      // 读取源文件
      const sourceFilePath = this.getAbsoluteFilePath(sourceMetadata.path);
      const fileContent = await fs.readFile(sourceFilePath);
      
      // 创建复制文件的选项
      const copyOptions: UploadOptions = {
        ...options,
        filename: options.filename || sourceMetadata.filename,
        contentType: options.contentType || sourceMetadata.mimetype,
        metadata: {
          ...options.metadata,
          sourceFileId: sourceId
        }
      };
      
      // 上传复制的文件
      return this.uploadFile(fileContent, copyOptions);
    } catch (error: any) {
      console.error('Failed to copy file:', error);
      throw new Error(`Failed to copy file: ${error.message}`);
    }
  }
} 