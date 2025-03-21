# 图像处理服务

MCP平台的图像处理服务提供了丰富的图像处理功能，包括调整大小、裁剪、旋转、格式转换、水印添加等。本文档将介绍如何使用图像处理服务及其主要功能。

## 功能特点

- **多种处理功能**：支持调整大小、裁剪、旋转、格式转换、添加水印、图像优化等操作
- **批量处理**：支持批量处理多个图像文件
- **多尺寸生成**：一次操作生成多种尺寸的图像，适用于响应式设计
- **图像拼贴**：支持创建多图拼贴（collage）
- **格式转换**：支持JPEG、PNG、WebP、AVIF等主流格式之间的转换
- **无损/有损压缩**：支持调整压缩质量，平衡文件大小和图像质量
- **元数据保留**：可选择保留原始图像的元数据
- **存储集成**：与文件存储服务紧密集成，支持多种存储后端

## 设置与配置

图像处理服务依赖于文件存储服务和Sharp图像处理库。首先需要安装相关依赖：

```bash
pnpm install sharp @types/sharp --save
```

### 初始化图像处理服务

```typescript
import { FileStorageFactory } from './storage/FileStorageFactory';
import { FileProcessingService } from './storage/FileProcessingService';
import { StorageProviderType } from './storage/FileStorageService';

// 获取存储服务
const factory = FileStorageFactory.getInstance();
const storageService = factory.createStorageService({
  type: StorageProviderType.LOCAL,  // 或其他存储类型
  basePath: '/path/to/storage',
  publicUrlBase: 'http://example.com/storage'
});

// 创建图像处理服务
const processingService = new FileProcessingService(storageService);
```

## 基本用法

### 图像调整大小

```typescript
const resizedImage = await processingService.processImage(fileId, {
  resize: {
    width: 800,  // 目标宽度
    height: 600, // 目标高度
    fit: 'cover', // 调整方式：cover, contain, fill, inside, outside
    position: 'center', // 裁剪位置
    withoutEnlargement: true // 不允许放大
  }
});
```

### 图像裁剪

```typescript
const croppedImage = await processingService.processImage(fileId, {
  crop: {
    left: 100, // 左上角X坐标
    top: 200,  // 左上角Y坐标
    width: 500, // 裁剪宽度
    height: 300 // 裁剪高度
  }
});
```

### 图像旋转

```typescript
const rotatedImage = await processingService.processImage(fileId, {
  rotate: {
    angle: 90, // 旋转角度（度）
    background: '#ffffff' // 背景颜色
  }
});
```

### 格式转换与压缩

```typescript
const convertedImage = await processingService.processImage(fileId, {
  format: {
    format: 'webp', // 目标格式：jpeg, png, webp, avif, gif
    quality: 80,    // 质量 (1-100)
    lossless: false, // 是否无损（WebP）
    progressive: true // 是否渐进式（JPEG）
  }
});
```

### 添加水印

```typescript
const watermarkedImage = await processingService.processImage(fileId, {
  watermark: {
    watermark: '/path/to/watermark.png', // 水印图片路径或Buffer
    position: 'bottom-right', // 水印位置
    opacity: 0.5, // 透明度 (0-1)
    tile: false // 是否平铺
  }
});
```

### 亮度和对比度调整

```typescript
const adjustedImage = await processingService.processImage(fileId, {
  brightness: 0.2, // 亮度调整 (-1到1)
  contrast: 0.1,   // 对比度调整 (-1到1)
});
```

### 锐化处理

```typescript
const sharpenedImage = await processingService.processImage(fileId, {
  sharpen: {
    sigma: 1.2,  // 锐化强度 (0-10)
    flat: 0.5,   // 平坦区域强度 (0-1)
    jagged: 0.7  // 锐化边缘强度 (0-1)
  }
});
```

## 高级功能

### 生成缩略图

```typescript
const thumbnail = await processingService.generateThumbnail(
  fileId,     // 文件ID
  200,        // 缩略图宽度
  200,        // 缩略图高度
  {
    // 可选的上传选项
    access: 'public',
    metadata: { type: 'thumbnail' }
  }
);
```

### 生成多尺寸图像

```typescript
const sizes = [
  { width: 1920, height: 1080, suffix: 'lg' },
  { width: 1280, height: 720, suffix: 'md' },
  { width: 640, height: 360, suffix: 'sm' },
  { width: 320, height: 180, suffix: 'xs' }
];

const images = await processingService.generateMultipleSizes(
  fileId,  // 文件ID
  sizes,   // 尺寸数组
  'webp',  // 输出格式
  {
    // 可选的上传选项
    access: 'public'
  }
);
```

### 图像优化

```typescript
const optimized = await processingService.optimizeImage(
  fileId,  // 文件ID
  80,      // 质量 (1-100)
  {
    // 可选的上传选项
    access: 'public'
  }
);
```

### 批量处理图像

```typescript
const fileIds = ['file1', 'file2', 'file3'];
const options = {
  resize: { width: 800, height: 600 },
  format: { format: 'webp', quality: 85 }
};

const results = await processingService.batchProcessImages(
  fileIds,  // 文件ID数组
  options,  // 处理选项
  {
    // 可选的上传选项
    access: 'public'
  }
);
```

### 创建图像拼贴

```typescript
const collage = await processingService.createImageCollage(
  fileIds,  // 文件ID数组
  2,        // 列数
  10,       // 间距（像素）
  '#ffffff' // 背景颜色
);
```

## 自定义处理

如需进行复杂的自定义处理，可以使用`customProcess`选项：

```typescript
const customProcessed = await processingService.processImage(fileId, {
  // 其他选项...
  customProcess: (image) => {
    // 直接使用Sharp API进行自定义处理
    return image
      .grayscale()         // 转为灰度
      .blur(5)             // 模糊
      .negate({ alpha: false }); // 反色
  }
});
```

## 最佳实践

1. **服务端处理**：尽量在服务端处理图像，避免在客户端进行复杂图像处理。

2. **缓存策略**：处理后的图像应该设置适当的缓存策略，避免重复处理。

3. **渐进式JPEG**：对于大图像，考虑使用渐进式JPEG格式，提高用户体验。

4. **WebP优先**：优先使用WebP格式，它提供更好的压缩率和质量平衡。

5. **预生成尺寸**：对于常用尺寸，预先生成并存储，而不是即时处理。

6. **错误处理**：实现健壮的错误处理机制，处理可能的图像处理失败情况。

7. **限制资源使用**：图像处理可能消耗大量CPU和内存，设置适当的资源限制。

## 注意事项

- 图像处理操作通常是CPU和内存密集型的，特别是处理大型图像时。
- 某些格式转换（如AVIF）可能需要较长处理时间。
- 务必验证输入文件，确保它们是有效的图像文件。
- 考虑实现处理结果缓存，避免对相同输入重复处理。
- 对于生产环境，应设置处理超时和最大文件大小限制。

## 示例应用

查看 `examples/image-processing-example.ts` 了解完整的使用示例，包括：

- 基本的图像调整大小和裁剪
- 添加水印
- 多尺寸图像生成
- 图像格式转换
- 创建图像拼贴

## 待开发功能

- 面部检测与智能裁剪
- 更多的图像滤镜和效果
- 动图（GIF/APNG/WebP动画）支持
- 图像分析与识别集成
- 手动绘制/注释支持 