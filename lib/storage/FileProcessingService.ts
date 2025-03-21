import sharp from 'sharp';
import { FileStorageService, FileMetadata, UploadOptions } from './FileStorageService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 图像调整大小选项
 */
export interface ImageResizeOptions {
  /** 目标宽度 */
  width?: number;
  /** 目标高度 */
  height?: number;
  /** 调整方式: contain(保持比例), cover(填充裁剪), fill(拉伸填充) */
  fit?: 'contain' | 'cover' | 'fill' | 'inside' | 'outside';
  /** 位置: 当fit为cover时有效 */
  position?: 'top' | 'right top' | 'right' | 'right bottom' | 'bottom' | 'left bottom' | 'left' | 'left top' | 'center';
  /** 背景颜色: 当fit不是cover时, 用于填充留白区域 */
  background?: string;
  /** 是否不允许放大 */
  withoutEnlargement?: boolean;
}

/**
 * 图像裁剪选项
 */
export interface ImageCropOptions {
  /** 左上角X坐标 */
  left?: number;
  /** 左上角Y坐标 */
  top?: number;
  /** 裁剪宽度 */
  width: number;
  /** 裁剪高度 */
  height: number;
}

/**
 * 图像旋转选项
 */
export interface ImageRotateOptions {
  /** 旋转角度(度) */
  angle: number;
  /** 背景颜色 */
  background?: string;
}

/**
 * 图像锐化选项
 */
export interface ImageSharpenOptions {
  /** 锐化强度 (0-10) */
  sigma?: number;
  /** 平坦区域强度 (0-1) */
  flat?: number;
  /** 锐化边缘强度 (0-1) */
  jagged?: number;
}

/**
 * 图像格式转换选项
 */
export interface ImageFormatOptions {
  /** 目标格式 */
  format: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif';
  /** 质量 (1-100) */
  quality?: number;
  /** 是否保留透明度 (PNG/WebP) */
  alpha?: boolean;
  /** 是否使用无损压缩 (WebP) */
  lossless?: boolean;
  /** 是否使用渐进式 (JPEG) */
  progressive?: boolean;
}

/**
 * 图像水印选项
 */
export interface ImageWatermarkOptions {
  /** 水印图片路径或Buffer */
  watermark: string | Buffer;
  /** 透明度 (0-1) */
  opacity?: number;
  /** 位置 */
  position?: 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';
  /** 填充方式 */
  tile?: boolean;
  /** 边距 */
  margin?: number;
}

/**
 * 图像处理选项
 */
export interface ImageProcessingOptions {
  /** 调整大小选项 */
  resize?: ImageResizeOptions;
  /** 裁剪选项 */
  crop?: ImageCropOptions;
  /** 旋转选项 */
  rotate?: ImageRotateOptions;
  /** 锐化选项 */
  sharpen?: ImageSharpenOptions;
  /** 格式转换选项 */
  format?: ImageFormatOptions;
  /** 亮度调整 (-1到1, 0为原始亮度) */
  brightness?: number;
  /** 对比度调整 (-1到1, 0为原始对比度) */
  contrast?: number;
  /** 水印选项 */
  watermark?: ImageWatermarkOptions;
  /** 是否自动优化 */
  autoOptimize?: boolean;
  /** 自定义操作函数 */
  customProcess?: (image: sharp.Sharp) => sharp.Sharp;
  /** 元数据传递选项 */
  withMetadata?: boolean;
}

/**
 * 文件处理服务
 */
export class FileProcessingService {
  private storageService: FileStorageService;

  /**
   * 构造函数
   * @param storageService 文件存储服务
   */
  constructor(storageService: FileStorageService) {
    this.storageService = storageService;
  }

  /**
   * 处理图像
   * @param fileId 文件ID
   * @param options 处理选项
   * @param uploadOptions 上传选项
   * @returns 处理后的文件元数据
   */
  async processImage(
    fileId: string,
    options: ImageProcessingOptions,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    try {
      // 获取原文件
      const sourceFile = await this.storageService.downloadFile(fileId);
      
      if (typeof sourceFile === 'string') {
        throw new Error('无法获取文件内容，返回的是URL');
      }

      // 获取原文件元数据用于保留原始信息
      const sourceMetadata = await this.storageService.getFileMetadata(fileId);
      
      // 准备处理选项
      let image = sharp(sourceFile);
      
      // 获取原始图像信息
      const imageMetadata = await image.metadata();
      
      // 应用裁剪
      if (options.crop) {
        image = image.extract({
          left: options.crop.left || 0,
          top: options.crop.top || 0,
          width: options.crop.width,
          height: options.crop.height
        });
      }
      
      // 应用调整大小
      if (options.resize) {
        image = image.resize({
          width: options.resize.width,
          height: options.resize.height,
          fit: options.resize.fit,
          position: options.resize.position,
          background: options.resize.background ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined,
          withoutEnlargement: options.resize.withoutEnlargement
        });
      }
      
      // 应用旋转
      if (options.rotate) {
        image = image.rotate(
          options.rotate.angle,
          {
            background: options.rotate.background ? { r: 255, g: 255, b: 255, alpha: 1 } : undefined
          }
        );
      }
      
      // 应用锐化
      if (options.sharpen) {
        image = image.sharpen(
          options.sharpen.sigma || 1,
          options.sharpen.flat || 1,
          options.sharpen.jagged || 1
        );
      }
      
      // 应用亮度
      if (options.brightness !== undefined) {
        image = image.modulate({
          brightness: 1 + options.brightness
        });
      }
      
      // 应用对比度
      if (options.contrast !== undefined) {
        image = image.modulate({
          brightness: 1,
          saturation: 1,
          ...(imageMetadata.hasAlpha ? {} : { hue: 0 })
        });
        
        // Sharp不直接支持对比度调整，使用gamma曲线模拟
        if (options.contrast > 0) {
          image = image.gamma(1 - options.contrast * 0.5);
        } else if (options.contrast < 0) {
          image = image.gamma(1 + Math.abs(options.contrast) * 0.5);
        }
      }
      
      // 应用水印
      if (options.watermark) {
        let watermarkBuffer: Buffer;
        
        if (typeof options.watermark.watermark === 'string') {
          watermarkBuffer = fs.readFileSync(options.watermark.watermark);
        } else {
          watermarkBuffer = options.watermark.watermark;
        }
        
        // 创建水印图像
        const watermark = sharp(watermarkBuffer)
          .resize(imageMetadata.width, imageMetadata.height, { fit: 'inside' });
          
        if (options.watermark.opacity !== undefined && options.watermark.opacity < 1) {
          // 调整水印透明度
          watermark.composite([{
            input: Buffer.from([255, 255, 255, Math.round(options.watermark.opacity * 255)]),
            raw: {
              width: 1,
              height: 1,
              channels: 4
            },
            tile: true,
            blend: 'dest-in'
          }]);
        }
          
        // 合成水印和原图
        const watermarkImage = await watermark.toBuffer();
          
        const gravity = options.watermark.position || 'center';
        const composite: Array<{
          input: Buffer;
          gravity?: string;
          tile?: boolean;
        }> = [{
          input: watermarkImage,
          gravity: gravity,
          tile: options.watermark.tile || false
        }];
          
        image = image.composite(composite);
      }
      
      // 应用自定义处理
      if (options.customProcess) {
        image = options.customProcess(image);
      }
      
      // 保留原始元数据
      if (options.withMetadata) {
        image = image.withMetadata();
      }
      
      // 应用格式转换
      if (options.format) {
        switch (options.format.format) {
          case 'jpeg':
            image = image.jpeg({
              quality: options.format.quality || 80,
              progressive: options.format.progressive
            });
            break;
          case 'png':
            image = image.png({
              quality: options.format.quality || 80,
              progressive: options.format.progressive
            });
            break;
          case 'webp':
            image = image.webp({
              quality: options.format.quality || 80,
              lossless: options.format.lossless,
              alphaQuality: options.format.alpha ? (options.format.quality || 100) : undefined
            });
            break;
          case 'avif':
            image = image.avif({
              quality: options.format.quality || 80
            });
            break;
          case 'gif':
            image = image.gif();
            break;
        }
      }
      
      // 自动优化
      if (options.autoOptimize) {
        // 自动选择最佳格式和压缩设置
        image = image.webp({
          quality: 80,
          effort: 4
        });
      }
      
      // 处理图片
      const processedBuffer = await image.toBuffer();
      
      // 确定新的文件名和内容类型
      const extension = options.format ? `.${options.format.format}` : path.extname(sourceMetadata.filename);
      const filename = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename)) + '_processed' + extension;
      
      // 确定MIME类型
      let contentType = sourceMetadata.mimetype;
      if (options.format) {
        switch (options.format.format) {
          case 'jpeg': contentType = 'image/jpeg'; break;
          case 'png': contentType = 'image/png'; break;
          case 'webp': contentType = 'image/webp'; break;
          case 'avif': contentType = 'image/avif'; break;
          case 'gif': contentType = 'image/gif'; break;
        }
      }
      
      // 构建上传选项
      const finalUploadOptions: UploadOptions = {
        filename,
        contentType,
        access: sourceMetadata.access,
        userId: sourceMetadata.userId,
        entityId: sourceMetadata.entityId,
        entityType: sourceMetadata.entityType,
        metadata: {
          ...sourceMetadata.metadata,
          originalFileId: sourceMetadata.id,
          processed: true,
          processingOptions: JSON.stringify(this.sanitizeOptions(options)),
          ...uploadOptions?.metadata
        },
        ...uploadOptions
      };
      
      // 上传处理后的文件
      return this.storageService.uploadFile(processedBuffer, finalUploadOptions);
    } catch (error) {
      console.error('图像处理失败:', error);
      throw new Error(`图像处理失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 批量处理图像
   * @param fileIds 文件ID数组
   * @param options 处理选项
   * @param uploadOptions 上传选项
   * @returns 处理后的文件元数据数组
   */
  async batchProcessImages(
    fileIds: string[],
    options: ImageProcessingOptions,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    
    await Promise.all(
      fileIds.map(async (fileId) => {
        try {
          const result = await this.processImage(fileId, options, uploadOptions);
          results.push(result);
        } catch (error) {
          console.warn(`处理文件 ${fileId} 失败:`, error);
        }
      })
    );
    
    return results;
  }
  
  /**
   * 生成图像缩略图
   * @param fileId 文件ID
   * @param width 缩略图宽度
   * @param height 缩略图高度
   * @param uploadOptions 上传选项
   * @returns 缩略图文件元数据
   */
  async generateThumbnail(
    fileId: string,
    width: number = 200,
    height: number = 200,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    const options: ImageProcessingOptions = {
      resize: {
        width,
        height,
        fit: 'cover',
        position: 'center',
        withoutEnlargement: false
      },
      format: {
        format: 'webp',
        quality: 80
      }
    };
    
    // 获取原文件元数据用于修改文件名
    const sourceMetadata = await this.storageService.getFileMetadata(fileId);
    const baseName = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename));
    
    const thumbnailOptions: UploadOptions = {
      filename: `${baseName}_thumb_${width}x${height}.webp`,
      ...uploadOptions
    };
    
    return this.processImage(fileId, options, thumbnailOptions);
  }
  
  /**
   * 生成多尺寸图像
   * @param fileId 文件ID
   * @param sizes 尺寸数组 [{width, height, suffix}]
   * @param format 格式选项
   * @param uploadOptions 上传选项
   * @returns 处理后的文件元数据数组
   */
  async generateMultipleSizes(
    fileId: string,
    sizes: Array<{width: number, height?: number, suffix: string}>,
    format?: 'jpeg' | 'png' | 'webp' | 'avif',
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata[]> {
    const results: FileMetadata[] = [];
    
    // 获取原文件元数据用于修改文件名
    const sourceMetadata = await this.storageService.getFileMetadata(fileId);
    const baseName = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename));
    
    await Promise.all(
      sizes.map(async (size) => {
        try {
          const options: ImageProcessingOptions = {
            resize: {
              width: size.width,
              height: size.height,
              fit: 'cover',
              position: 'center',
              withoutEnlargement: false
            }
          };
          
          if (format) {
            options.format = {
              format,
              quality: 80
            };
          }
          
          const extension = format ? `.${format}` : path.extname(sourceMetadata.filename);
          const sizeOptions: UploadOptions = {
            filename: `${baseName}_${size.suffix}${extension}`,
            ...uploadOptions
          };
          
          const result = await this.processImage(fileId, options, sizeOptions);
          results.push(result);
        } catch (error) {
          console.warn(`生成尺寸 ${size.width}x${size.height} 失败:`, error);
        }
      })
    );
    
    return results;
  }
  
  /**
   * 优化图像
   * @param fileId 文件ID
   * @param quality 质量 (1-100)
   * @param uploadOptions 上传选项
   * @returns 优化后的文件元数据
   */
  async optimizeImage(
    fileId: string,
    quality: number = 80,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    const options: ImageProcessingOptions = {
      format: {
        format: 'webp',
        quality
      }
    };
    
    // 获取原文件元数据用于修改文件名
    const sourceMetadata = await this.storageService.getFileMetadata(fileId);
    const baseName = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename));
    
    const optimizedOptions: UploadOptions = {
      filename: `${baseName}_optimized.webp`,
      ...uploadOptions
    };
    
    return this.processImage(fileId, options, optimizedOptions);
  }
  
  /**
   * 添加水印
   * @param fileId 文件ID
   * @param watermarkImagePath 水印图片路径
   * @param position 水印位置
   * @param opacity 透明度 (0-1)
   * @param uploadOptions 上传选项
   * @returns 添加水印后的文件元数据
   */
  async addWatermark(
    fileId: string,
    watermarkImagePath: string,
    position: 'top-left' | 'top' | 'top-right' | 'left' | 'center' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right' = 'bottom-right',
    opacity: number = 0.5,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    const options: ImageProcessingOptions = {
      watermark: {
        watermark: watermarkImagePath,
        position,
        opacity
      }
    };
    
    // 获取原文件元数据用于修改文件名
    const sourceMetadata = await this.storageService.getFileMetadata(fileId);
    const baseName = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename));
    const extension = path.extname(sourceMetadata.filename);
    
    const watermarkOptions: UploadOptions = {
      filename: `${baseName}_watermarked${extension}`,
      ...uploadOptions
    };
    
    return this.processImage(fileId, options, watermarkOptions);
  }
  
  /**
   * 创建图像拼接
   * @param fileIds 文件ID数组
   * @param columns 列数
   * @param margin 间距
   * @param background 背景颜色
   * @param uploadOptions 上传选项
   * @returns 拼接后的文件元数据
   */
  async createImageCollage(
    fileIds: string[],
    columns: number = 2,
    margin: number = 10,
    background: string = '#ffffff',
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    try {
      if (!fileIds.length) {
        throw new Error('至少需要一个文件ID');
      }

      // 下载所有图像
      const imagesData = await Promise.all(
        fileIds.map(async (fileId) => {
          const file = await this.storageService.downloadFile(fileId);
          if (typeof file === 'string') {
            throw new Error(`无法获取文件内容，返回的是URL: ${fileId}`);
          }
          const metadata = await this.storageService.getFileMetadata(fileId);
          return { buffer: file, metadata };
        })
      );

      // 加载所有图像并获取元数据
      const images = await Promise.all(
        imagesData.map(async (data) => {
          const image = sharp(data.buffer);
          const metadata = await image.metadata();
          return {
            image,
            metadata,
            originalMetadata: data.metadata
          };
        })
      );

      // 计算行数
      const rows = Math.ceil(images.length / columns);

      // 确定每个图像的大小
      const thumbnailWidth = 300;
      const thumbnailHeight = 300;

      // 计算布局
      const canvasWidth = columns * thumbnailWidth + (columns + 1) * margin;
      const canvasHeight = rows * thumbnailHeight + (rows + 1) * margin;

      // 创建拼贴背景
      const canvas = sharp({
        create: {
          width: canvasWidth,
          height: canvasHeight,
          channels: 4,
          background: this.parseColor(background)
        }
      });

      // 准备合成操作
      const composites: Array<{
        input: Buffer;
        left?: number;
        top?: number;
      }> = [];

      // 处理每个图像并添加到拼贴画
      for (let i = 0; i < images.length; i++) {
        const row = Math.floor(i / columns);
        const col = i % columns;

        // 调整图像大小以适合拼贴
        const resizedBuffer = await images[i].image
          .resize(thumbnailWidth, thumbnailHeight, {
            fit: 'cover',
            position: 'center'
          })
          .toBuffer();

        // 计算位置
        const left = margin + col * (thumbnailWidth + margin);
        const top = margin + row * (thumbnailHeight + margin);

        // 添加到合成列表
        composites.push({
          input: resizedBuffer,
          left,
          top
        });
      }

      // 合成所有图像
      const collageBuffer = await canvas.composite(composites).toBuffer();

      // 生成文件名
      const timestamp = new Date().getTime();
      const filename = `collage_${timestamp}.png`;

      // 上传拼贴画
      const finalUploadOptions: UploadOptions = {
        filename,
        contentType: 'image/png',
        metadata: {
          collage: true,
          sourceFiles: fileIds.join(','),
          ...uploadOptions?.metadata
        },
        ...uploadOptions
      };

      return this.storageService.uploadFile(collageBuffer, finalUploadOptions);
    } catch (error) {
      console.error('创建图像拼贴失败:', error);
      throw new Error(`创建图像拼贴失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 转换图像格式
   * @param fileId 文件ID
   * @param format 目标格式
   * @param quality 质量 (1-100)
   * @param uploadOptions 上传选项
   * @returns 转换后的文件元数据
   */
  async convertImageFormat(
    fileId: string,
    format: 'jpeg' | 'png' | 'webp' | 'avif' | 'gif',
    quality: number = 80,
    uploadOptions?: UploadOptions
  ): Promise<FileMetadata> {
    const options: ImageProcessingOptions = {
      format: {
        format,
        quality
      }
    };
    
    // 获取原文件元数据用于修改文件名
    const sourceMetadata = await this.storageService.getFileMetadata(fileId);
    const baseName = path.basename(sourceMetadata.filename, path.extname(sourceMetadata.filename));
    
    const convertOptions: UploadOptions = {
      filename: `${baseName}.${format}`,
      ...uploadOptions
    };
    
    return this.processImage(fileId, options, convertOptions);
  }
  
  /**
   * 清理处理选项，移除Buffer等不可序列化的内容
   */
  private sanitizeOptions(options: ImageProcessingOptions): any {
    const result = { ...options };
    
    if (result.watermark && typeof result.watermark.watermark !== 'string') {
      result.watermark = {
        ...result.watermark,
        watermark: '[Buffer]'
      };
    }
    
    if (result.customProcess) {
      result.customProcess = '[Function]' as unknown as (image: sharp.Sharp) => sharp.Sharp;
    }
    
    return result;
  }
  
  /**
   * 解析颜色字符串为RGB对象
   */
  private parseColor(color: string): { r: number, g: number, b: number, alpha: number } {
    // 处理十六进制颜色
    if (color.startsWith('#')) {
      if (color.length === 4) {
        // 简写形式 #RGB
        const r = parseInt(color[1] + color[1], 16);
        const g = parseInt(color[2] + color[2], 16);
        const b = parseInt(color[3] + color[3], 16);
        return { r, g, b, alpha: 1 };
      } else {
        // 标准形式 #RRGGBB
        const r = parseInt(color.substr(1, 2), 16);
        const g = parseInt(color.substr(3, 2), 16);
        const b = parseInt(color.substr(5, 2), 16);
        return { r, g, b, alpha: 1 };
      }
    }
    
    // 默认白色
    return { r: 255, g: 255, b: 255, alpha: 1 };
  }
} 