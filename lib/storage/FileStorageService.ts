/**
 * 文件存储服务接口
 * 
 * 定义文件存储服务的基本功能，支持多种存储提供者（本地文件系统、S3等）
 */

/**
 * 文件元数据接口
 */
export interface FileMetadata {
  /** 文件ID */
  id: string;
  /** 文件名称 */
  filename: string;
  /** 文件MIME类型 */
  mimetype: string;
  /** 文件大小（字节） */
  size: number;
  /** 上传时间 */
  uploadedAt: Date;
  /** 上传用户ID */
  userId?: string;
  /** 相关实体ID（如服务器ID） */
  entityId?: string;
  /** 实体类型（如server, tool等） */
  entityType?: string;
  /** 文件路径/键 */
  path: string;
  /** 访问URL */
  url: string;
  /** 访问权限 */
  access: 'public' | 'private' | 'protected';
  /** 自定义元数据 */
  metadata?: Record<string, any>;
}

/**
 * 文件上传选项
 */
export interface UploadOptions {
  /** 文件名称（覆盖原始文件名） */
  filename?: string;
  /** 访问权限 */
  access?: 'public' | 'private' | 'protected';
  /** 上传用户ID */
  userId?: string;
  /** 相关实体ID */
  entityId?: string;
  /** 实体类型 */
  entityType?: string;
  /** 自定义元数据 */
  metadata?: Record<string, any>;
  /** 内容类型 */
  contentType?: string;
}

/**
 * 文件下载选项
 */
export interface DownloadOptions {
  /** 是否返回临时URL而不是文件内容 */
  asUrl?: boolean;
  /** 临时URL过期时间（秒） */
  expiresIn?: number;
}

/**
 * 文件查询过滤器
 */
export interface FileFilter {
  /** 用户ID */
  userId?: string;
  /** 实体ID */
  entityId?: string;
  /** 实体类型 */
  entityType?: string;
  /** 访问权限 */
  access?: 'public' | 'private' | 'protected';
  /** 文件名模式（支持通配符） */
  filename?: string;
  /** 上传日期范围-开始 */
  uploadedAfter?: Date;
  /** 上传日期范围-结束 */
  uploadedBefore?: Date;
  /** 最小文件大小（字节） */
  minSize?: number;
  /** 最大文件大小（字节） */
  maxSize?: number;
  /** MIME类型 */
  mimetype?: string;
}

/**
 * 文件存储服务接口
 */
export interface FileStorageService {
  /**
   * 上传文件
   * @param file 文件数据（Buffer或ReadableStream）
   * @param options 上传选项
   * @returns 文件元数据
   */
  uploadFile(file: Buffer | NodeJS.ReadableStream, options: UploadOptions): Promise<FileMetadata>;

  /**
   * 通过URL上传文件
   * @param url 文件URL
   * @param options 上传选项
   * @returns 文件元数据
   */
  uploadFromUrl(url: string, options: UploadOptions): Promise<FileMetadata>;

  /**
   * 下载文件
   * @param fileId 文件ID
   * @param options 下载选项
   * @returns 文件数据或签名URL
   */
  downloadFile(fileId: string, options?: DownloadOptions): Promise<Buffer | string>;

  /**
   * 获取文件详情
   * @param fileId 文件ID
   * @returns 文件元数据
   */
  getFileMetadata(fileId: string): Promise<FileMetadata>;

  /**
   * 更新文件元数据
   * @param fileId 文件ID
   * @param metadata 更新的元数据
   * @returns 更新后的文件元数据
   */
  updateFileMetadata(fileId: string, metadata: Partial<FileMetadata>): Promise<FileMetadata>;

  /**
   * 删除文件
   * @param fileId 文件ID
   * @returns 是否成功删除
   */
  deleteFile(fileId: string): Promise<boolean>;

  /**
   * 批量删除文件
   * @param fileIds 文件ID数组
   * @returns 删除结果映射
   */
  deleteFiles(fileIds: string[]): Promise<Map<string, boolean>>;

  /**
   * 查找文件
   * @param filter 过滤条件
   * @param limit 限制数量
   * @param offset 偏移量
   * @returns 文件元数据数组
   */
  findFiles(filter: FileFilter, limit?: number, offset?: number): Promise<FileMetadata[]>;

  /**
   * 检查文件是否存在
   * @param fileId 文件ID
   * @returns 文件是否存在
   */
  fileExists(fileId: string): Promise<boolean>;

  /**
   * 获取可下载URL
   * @param fileId 文件ID
   * @param expiresIn URL过期时间（秒）
   * @returns 签名URL
   */
  getDownloadUrl(fileId: string, expiresIn?: number): Promise<string>;

  /**
   * 复制文件
   * @param sourceId 源文件ID
   * @param options 目标文件选项
   * @returns 新文件元数据
   */
  copyFile(sourceId: string, options: UploadOptions): Promise<FileMetadata>;
}

/**
 * 文件存储提供者类型
 */
export enum StorageProviderType {
  LOCAL = 'local',
  S3 = 's3',
  AZURE = 'azure',
  GCP = 'gcp',
}

/**
 * 存储提供者配置
 */
export interface StorageConfig {
  /** 提供者类型 */
  type: StorageProviderType;
  /** 基础路径/桶名称 */
  basePath: string;
  /** 公共URL基础路径 */
  publicUrlBase?: string;
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 允许的MIME类型 */
  allowedMimeTypes?: string[];
  /** 提供者特定配置 */
  providerOptions?: Record<string, any>;
} 