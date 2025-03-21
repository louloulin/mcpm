import { FileStorageService, StorageConfig, StorageProviderType } from './FileStorageService';
import { LocalFileStorageService, LocalStorageConfig } from './LocalFileStorageService';
import { S3FileStorageService, S3StorageConfig } from './S3FileStorageService';
import { AzureFileStorageService, AzureStorageConfig } from './AzureFileStorageService';
import { GCPFileStorageService, GCPStorageConfig } from './GCPFileStorageService';

/**
 * 文件存储服务工厂
 * 
 * 根据配置创建相应的文件存储服务实例
 */
export class FileStorageFactory {
  private static instance: FileStorageFactory;
  private storageServices: Map<string, FileStorageService>;

  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    this.storageServices = new Map<string, FileStorageService>();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): FileStorageFactory {
    if (!FileStorageFactory.instance) {
      FileStorageFactory.instance = new FileStorageFactory();
    }
    return FileStorageFactory.instance;
  }

  /**
   * 创建文件存储服务
   * @param config 存储配置
   * @param serviceName 服务名称（可选，用于缓存服务实例）
   */
  public createStorageService(config: StorageConfig, serviceName?: string): FileStorageService {
    // 如果提供了服务名称且已缓存该服务，则返回缓存的实例
    if (serviceName && this.storageServices.has(serviceName)) {
      return this.storageServices.get(serviceName)!;
    }

    let service: FileStorageService;

    // 根据配置的类型创建相应的存储服务
    switch (config.type) {
      case StorageProviderType.LOCAL:
        service = new LocalFileStorageService(config as LocalStorageConfig);
        break;
      case StorageProviderType.S3:
        service = new S3FileStorageService(config as S3StorageConfig);
        break;
      case StorageProviderType.AZURE:
        service = new AzureFileStorageService(config as AzureStorageConfig);
        break;
      case StorageProviderType.GCP:
        service = new GCPFileStorageService(config as GCPStorageConfig);
        break;
      default:
        throw new Error(`Unsupported storage provider type: ${config.type}`);
    }

    // 如果提供了服务名称，则缓存该服务实例
    if (serviceName) {
      this.storageServices.set(serviceName, service);
    }

    return service;
  }

  /**
   * 获取存储服务实例
   * @param serviceName 服务名称
   */
  public getStorageService(serviceName: string): FileStorageService | undefined {
    return this.storageServices.get(serviceName);
  }

  /**
   * 注册存储服务实例
   * @param serviceName 服务名称
   * @param service 存储服务实例
   */
  public registerStorageService(serviceName: string, service: FileStorageService): void {
    this.storageServices.set(serviceName, service);
  }

  /**
   * 移除存储服务实例
   * @param serviceName 服务名称
   */
  public removeStorageService(serviceName: string): boolean {
    return this.storageServices.delete(serviceName);
  }

  /**
   * 创建默认的存储服务实例
   * 
   * 使用环境变量中的配置创建默认存储服务
   */
  public createDefaultStorageService(): FileStorageService {
    const storageType = (process.env.FILE_STORAGE_TYPE || 'local').toLowerCase() as StorageProviderType;
    const basePath = process.env.FILE_STORAGE_PATH || './storage';
    const publicUrlBase = process.env.FILE_STORAGE_PUBLIC_URL || '';
    
    let config: StorageConfig;
    
    switch (storageType) {
      case StorageProviderType.LOCAL:
        config = {
          type: StorageProviderType.LOCAL,
          basePath,
          publicUrlBase,
          defaultUrlExpiration: parseInt(process.env.FILE_STORAGE_URL_EXPIRATION || '3600', 10)
        } as LocalStorageConfig;
        break;
      case StorageProviderType.S3:
        config = {
          type: StorageProviderType.S3,
          basePath: process.env.S3_BUCKET_NAME || 'mcp-files',
          publicUrlBase,
          defaultUrlExpiration: parseInt(process.env.FILE_STORAGE_URL_EXPIRATION || '3600', 10),
          providerOptions: {
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            sessionToken: process.env.AWS_SESSION_TOKEN,
            endpoint: process.env.AWS_ENDPOINT,
            forcePathStyle: process.env.AWS_FORCE_PATH_STYLE === 'true'
          }
        } as S3StorageConfig;
        break;
      case StorageProviderType.AZURE:
        // 实现Azure Blob Storage配置
        const azureAccountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
        const azureAccountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
        const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        const azureUseDefaultCredential = process.env.AZURE_USE_DEFAULT_CREDENTIAL === 'true';
        const azureCustomDomain = process.env.AZURE_STORAGE_CUSTOM_DOMAIN;
        const azureCacheControl = process.env.AZURE_STORAGE_CACHE_CONTROL;
        
        if (!azureConnectionString && !azureAccountName) {
          throw new Error('缺少Azure Blob Storage配置: 需要提供AZURE_STORAGE_ACCOUNT_NAME或AZURE_STORAGE_CONNECTION_STRING');
        }
        
        config = {
          type: StorageProviderType.AZURE,
          basePath: process.env.AZURE_STORAGE_CONTAINER || 'files',
          defaultUrlExpiration: Number(process.env.AZURE_STORAGE_URL_EXPIRATION || 3600),
          providerOptions: {
            accountName: azureAccountName || '',
            accountKey: azureAccountKey,
            connectionString: azureConnectionString,
            useDefaultAzureCredential: azureUseDefaultCredential,
            customDomain: azureCustomDomain,
            cacheControl: azureCacheControl
          }
        } as AzureStorageConfig;
        break;
      case StorageProviderType.GCP:
        // Google Cloud Storage配置
        const gcpProjectId = process.env.GCP_PROJECT_ID;
        const gcpKeyFilename = process.env.GCP_KEY_FILENAME;
        const gcpCustomDomain = process.env.GCP_STORAGE_CUSTOM_DOMAIN;
        const gcpCacheControl = process.env.GCP_STORAGE_CACHE_CONTROL;
        
        config = {
          type: StorageProviderType.GCP,
          basePath: process.env.GCP_BUCKET_NAME || 'mcp-files',
          defaultUrlExpiration: Number(process.env.GCP_STORAGE_URL_EXPIRATION || 3600),
          providerOptions: {
            projectId: gcpProjectId,
            keyFilename: gcpKeyFilename,
            customDomain: gcpCustomDomain,
            cacheControl: gcpCacheControl,
            autoRetry: process.env.GCP_AUTO_RETRY === 'true',
            maxRetries: process.env.GCP_MAX_RETRIES ? Number(process.env.GCP_MAX_RETRIES) : undefined,
            apiEndpoint: process.env.GCP_API_ENDPOINT
          }
        } as GCPStorageConfig;
        break;
      default:
        throw new Error(`Unsupported storage provider type: ${storageType}`);
    }
    
    return this.createStorageService(config, 'default');
  }
} 