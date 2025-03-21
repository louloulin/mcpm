import { FileStorageService, StorageProviderType } from '../lib/storage/FileStorageService';
import { FileStorageFactory } from '../lib/storage/FileStorageFactory';
import { FileProcessingService, ImageProcessingOptions } from '../lib/storage/FileProcessingService';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 示例图像文件路径
const SAMPLE_IMAGE_PATH = path.join(__dirname, 'sample-image.jpg');
const WATERMARK_IMAGE_PATH = path.join(__dirname, 'watermark.png');

// 确保示例目录存在
async function ensureExampleDirectories() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  return outputDir;
}

// 初始化本地存储
async function initLocalStorage(): Promise<FileStorageService> {
  // 使用getInstance获取工厂实例
  const factory = FileStorageFactory.getInstance();
  const storageService = factory.createStorageService({
    type: StorageProviderType.LOCAL,
    basePath: path.join(__dirname, 'storage'),
    publicUrlBase: 'http://localhost:3000/storage'
  });
  
  return storageService;
}

// 上传示例图像
async function uploadSampleImage(storageService: FileStorageService): Promise<string> {
  if (!fs.existsSync(SAMPLE_IMAGE_PATH)) {
    throw new Error(`示例图像文件不存在: ${SAMPLE_IMAGE_PATH}`);
  }
  
  const imageBuffer = fs.readFileSync(SAMPLE_IMAGE_PATH);
  const result = await storageService.uploadFile(imageBuffer, {
    filename: 'sample-image.jpg',
    contentType: 'image/jpeg',
    metadata: {
      description: '示例图像',
      source: 'image-processing-example'
    }
  });
  
  console.log('上传示例图像成功:', result.id);
  console.log('存储位置:', result.url);
  
  return result.id;
}

// 创建处理服务
function createProcessingService(storageService: FileStorageService): FileProcessingService {
  return new FileProcessingService(storageService);
}

// 生成缩略图
async function generateThumbnail(
  processingService: FileProcessingService, 
  fileId: string
): Promise<void> {
  try {
    const thumbnail = await processingService.generateThumbnail(fileId, 200, 200);
    console.log('成功生成缩略图:', thumbnail.id);
    console.log('缩略图URL:', thumbnail.url);
  } catch (error) {
    console.error('生成缩略图失败:', error);
  }
}

// 调整图像大小
async function resizeImage(
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    const options: ImageProcessingOptions = {
      resize: {
        width: 800,
        height: 600,
        fit: 'cover',
        position: 'center'
      },
      format: {
        format: 'webp',
        quality: 85
      }
    };
    
    const resized = await processingService.processImage(fileId, options, {
      filename: 'resized-image.webp'
    });
    
    console.log('成功调整图像大小:', resized.id);
    console.log('调整大小后的URL:', resized.url);
  } catch (error) {
    console.error('调整图像大小失败:', error);
  }
}

// 添加水印
async function addWatermark(
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    // 确保水印图像存在
    if (!fs.existsSync(WATERMARK_IMAGE_PATH)) {
      console.error(`水印图像不存在: ${WATERMARK_IMAGE_PATH}`);
      return;
    }
    
    const watermarked = await processingService.addWatermark(
      fileId,
      WATERMARK_IMAGE_PATH,
      'bottom-right',
      0.5
    );
    
    console.log('成功添加水印:', watermarked.id);
    console.log('水印图像URL:', watermarked.url);
  } catch (error) {
    console.error('添加水印失败:', error);
  }
}

// 创建多尺寸图像
async function generateMultipleSizes(
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    const sizes = [
      { width: 1920, height: 1080, suffix: 'lg' },
      { width: 1280, height: 720, suffix: 'md' },
      { width: 640, height: 360, suffix: 'sm' },
      { width: 320, height: 180, suffix: 'xs' }
    ];
    
    const results = await processingService.generateMultipleSizes(fileId, sizes, 'webp');
    
    console.log('成功生成多尺寸图像:');
    results.forEach(result => {
      console.log(`- ${result.filename}: ${result.url}`);
    });
  } catch (error) {
    console.error('生成多尺寸图像失败:', error);
  }
}

// 图像格式转换
async function convertImageFormat(
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    const formats: Array<'jpeg' | 'png' | 'webp' | 'avif'> = ['jpeg', 'png', 'webp', 'avif'];
    
    for (const format of formats) {
      const converted = await processingService.convertImageFormat(fileId, format);
      console.log(`成功转换为${format}格式:`, converted.id);
      console.log(`${format}图像URL:`, converted.url);
    }
  } catch (error) {
    console.error('图像格式转换失败:', error);
  }
}

// 图像优化
async function optimizeImage(
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    const optimized = await processingService.optimizeImage(fileId);
    console.log('成功优化图像:', optimized.id);
    console.log('优化后的URL:', optimized.url);
  } catch (error) {
    console.error('图像优化失败:', error);
  }
}

// 创建图像拼贴
async function createImageCollage(
  storageService: FileStorageService,
  processingService: FileProcessingService,
  fileId: string
): Promise<void> {
  try {
    // 首先生成多个处理后的图像
    const processedIds = [];
    
    // 调整大小 - 不同的处理
    const options1: ImageProcessingOptions = {
      resize: { width: 600, height: 400 },
      brightness: 0.1
    };
    const result1 = await processingService.processImage(fileId, options1);
    processedIds.push(result1.id);
    
    // 应用滤镜效果
    const options2: ImageProcessingOptions = {
      resize: { width: 600, height: 400 },
      contrast: 0.2
    };
    const result2 = await processingService.processImage(fileId, options2);
    processedIds.push(result2.id);
    
    // 转换为灰度
    const options3: ImageProcessingOptions = {
      resize: { width: 600, height: 400 },
      customProcess: (image) => image.grayscale()
    };
    const result3 = await processingService.processImage(fileId, options3);
    processedIds.push(result3.id);
    
    // 旋转
    const options4: ImageProcessingOptions = {
      resize: { width: 600, height: 400 },
      rotate: { angle: 180 }
    };
    const result4 = await processingService.processImage(fileId, options4);
    processedIds.push(result4.id);
    
    // 创建拼贴
    const collage = await processingService.createImageCollage(
      processedIds, 
      2, // 2列
      20, // 20px间距
      '#f0f0f0' // 淡灰色背景
    );
    
    console.log('成功创建图像拼贴:', collage.id);
    console.log('拼贴图像URL:', collage.url);
  } catch (error) {
    console.error('创建图像拼贴失败:', error);
  }
}

// 主函数
async function main() {
  try {
    // 确保示例目录存在
    await ensureExampleDirectories();
    
    // 初始化存储服务
    const storageService = await initLocalStorage();
    console.log('存储服务初始化成功');
    
    // 上传示例图像
    const fileId = await uploadSampleImage(storageService);
    
    // 创建图像处理服务
    const processingService = createProcessingService(storageService);
    console.log('图像处理服务初始化成功');
    
    // 展示各种图像处理功能
    await generateThumbnail(processingService, fileId);
    await resizeImage(processingService, fileId);
    await addWatermark(processingService, fileId);
    await generateMultipleSizes(processingService, fileId);
    await convertImageFormat(processingService, fileId);
    await optimizeImage(processingService, fileId);
    await createImageCollage(storageService, processingService, fileId);
    
    console.log('所有示例执行完成');
  } catch (error) {
    console.error('示例运行失败:', error);
  }
}

// 运行示例
if (require.main === module) {
  main().catch(error => {
    console.error('未捕获的错误:', error);
    process.exit(1);
  });
} 