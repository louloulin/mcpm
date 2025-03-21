import { StorageProviderType } from '../lib/storage/FileStorageService';
import { AzureFileStorageService, AzureStorageConfig } from '../lib/storage/AzureFileStorageService';
import { FileStorageFactory } from '../lib/storage/FileStorageFactory';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { FileStorageService } from '../lib/storage/FileStorageService';

// 加载环境变量
dotenv.config();

/**
 * 初始化Azure Storage配置
 */
function createAzureStorageConfig(): AzureStorageConfig {
  // 从环境变量获取配置
  const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
  const container = process.env.AZURE_STORAGE_CONTAINER || 'mcp-files';
  
  // 验证必要的配置
  if (!connectionString && (!accountName || !accountKey)) {
    throw new Error('缺少Azure Blob Storage配置。需要提供AZURE_STORAGE_CONNECTION_STRING或AZURE_STORAGE_ACCOUNT_NAME+AZURE_STORAGE_ACCOUNT_KEY');
  }
  
  // 返回配置对象
  return {
    type: StorageProviderType.AZURE,
    basePath: container,
    defaultUrlExpiration: 3600, // 1小时
    providerOptions: {
      accountName: accountName || '',
      accountKey: accountKey,
      connectionString: connectionString,
      useDefaultAzureCredential: process.env.AZURE_USE_DEFAULT_CREDENTIAL === 'true',
      customDomain: process.env.AZURE_STORAGE_CUSTOM_DOMAIN,
      cacheControl: 'max-age=86400' // 1天
    }
  };
}

/**
 * 使用工厂方法创建Azure存储服务
 */
async function createStorageServiceWithFactory() {
  try {
    console.log('使用FileStorageFactory创建Azure Blob Storage服务...');
    
    // 使用工厂方法创建服务
    const factory = FileStorageFactory.getInstance();
    const storageService = factory.createStorageService(createAzureStorageConfig(), 'azure');
    
    console.log('成功创建Azure存储服务');
    return storageService;
  } catch (error) {
    console.error('创建Azure存储服务失败:', error);
    throw error;
  }
}

/**
 * 直接创建Azure存储服务
 */
async function createStorageServiceDirectly() {
  try {
    console.log('直接创建Azure Blob Storage服务...');
    
    // 直接创建服务实例
    const config = createAzureStorageConfig();
    const storageService = new AzureFileStorageService(config);
    
    console.log('成功创建Azure存储服务');
    return storageService;
  } catch (error) {
    console.error('创建Azure存储服务失败:', error);
    throw error;
  }
}

/**
 * 上传示例图片
 * @param storageService 存储服务
 */
async function uploadExampleImage(storageService: FileStorageService) {
  try {
    console.log('上传示例图片...');
    
    // 读取示例图片
    const imagePath = path.join(__dirname, '../examples/assets/example.jpg');
    if (!fs.existsSync(imagePath)) {
      throw new Error(`示例图片不存在: ${imagePath}`);
    }
    
    const imageBuffer = fs.readFileSync(imagePath);
    
    // 上传图片
    const fileMetadata = await storageService.uploadFile(imageBuffer, {
      filename: 'example.jpg',
      contentType: 'image/jpeg',
      entityType: 'examples',
      entityId: 'demo',
      access: 'public'
    });
    
    console.log('图片上传成功:', fileMetadata);
    return fileMetadata;
  } catch (error) {
    console.error('上传图片失败:', error);
    throw error;
  }
}

/**
 * 下载图片
 * @param storageService 存储服务
 * @param fileId 文件ID
 */
async function downloadImage(storageService: FileStorageService, fileId: string) {
  try {
    console.log(`下载图片 ${fileId}...`);
    
    // 获取下载URL
    const downloadUrl = await storageService.getDownloadUrl(fileId);
    console.log('下载URL:', downloadUrl);
    
    // 下载图片内容
    const imageBuffer = await storageService.downloadFile(fileId);
    
    // 保存到本地
    const outputPath = path.join(__dirname, '../examples/assets/downloaded_image.jpg');
    if (Buffer.isBuffer(imageBuffer)) {
      fs.writeFileSync(outputPath, imageBuffer);
      console.log(`图片已下载到: ${outputPath}`);
    } else {
      console.log(`获取到了图片的URL: ${imageBuffer}`);
    }
  } catch (error) {
    console.error('下载图片失败:', error);
  }
}

/**
 * 更新文件元数据
 * @param storageService 存储服务
 * @param fileId 文件ID
 */
async function updateFileMetadata(storageService: FileStorageService, fileId: string) {
  try {
    console.log(`更新文件元数据 ${fileId}...`);
    
    // 获取当前元数据
    const currentMetadata = await storageService.getFileMetadata(fileId);
    console.log('当前元数据:', currentMetadata);
    
    // 更新元数据
    const updatedMetadata = await storageService.updateFileMetadata(fileId, {
      access: 'protected',
      metadata: {
        description: '示例图片',
        updateTime: new Date().toISOString()
      }
    });
    
    console.log('更新后的元数据:', updatedMetadata);
  } catch (error) {
    console.error('更新元数据失败:', error);
  }
}

/**
 * 删除文件
 * @param storageService 存储服务
 * @param fileId 文件ID
 */
async function deleteFile(storageService: FileStorageService, fileId: string) {
  try {
    console.log(`删除文件 ${fileId}...`);
    
    // 删除文件
    const result = await storageService.deleteFile(fileId);
    
    if (result) {
      console.log('文件删除成功');
    } else {
      console.log('文件删除失败或文件不存在');
    }
  } catch (error) {
    console.error('删除文件失败:', error);
  }
}

/**
 * 查找文件
 * @param storageService 存储服务
 */
async function findFiles(storageService: FileStorageService) {
  try {
    console.log('查找文件...');
    
    // 查找所有图片文件
    const files = await storageService.findFiles({
      entityType: 'examples',
      mimetype: 'image/jpeg'
    });
    
    console.log(`找到 ${files.length} 个文件:`);
    files.forEach(file => {
      console.log(`- ${file.id}: ${file.filename} (${file.mimetype}, ${file.size} bytes)`);
    });
    
    return files;
  } catch (error) {
    console.error('查找文件失败:', error);
    return [];
  }
}

/**
 * 运行示例
 */
async function main() {
  console.log('===== Azure Blob Storage 示例 =====');
  
  let fileId: string;
  try {
    // 使用工厂方法创建存储服务
    const storageService = await createStorageServiceWithFactory();
    
    // 上传示例图片
    const fileMetadata = await uploadExampleImage(storageService);
    fileId = fileMetadata.id;
    
    // 等待片刻让Azure处理
    console.log('等待5秒...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 查找文件
    await findFiles(storageService);
    
    // 更新文件元数据
    await updateFileMetadata(storageService, fileId);
    
    // 下载图片
    await downloadImage(storageService, fileId);
    
    // 删除文件 (可选，取消注释以删除文件)
    // await deleteFile(storageService, fileId);
    
    console.log('示例完成');
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 运行示例
main().catch(console.error); 