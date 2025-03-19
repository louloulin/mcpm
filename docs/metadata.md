# MCP服务器元数据管理

MCP服务器元数据管理模块提供了丰富的元数据处理功能，用于增强服务器定义，提供更多的描述信息，以及管理用户评分和评论等内容。

## 元数据结构

MCP服务器元数据包含以下主要部分：

- **基础分类** - 服务器的分类和关键词标签
- **维护者信息** - 服务器的开发和维护人员信息
- **支持信息** - 文档、问题报告和支持渠道
- **兼容性信息** - 支持的客户端、操作系统和语言
- **资源要求** - CPU、内存和存储等资源需求
- **使用统计** - 下载次数、使用次数等统计数据
- **评分系统** - 用户评分和评论
- **媒体资源** - 屏幕截图和演示图片
- **使用示例** - 代码片段和使用示范
- **价格信息** - 许可和价格相关信息

## 主要功能

### 元数据验证

验证元数据是否符合规范，检查必填字段、格式和类型：

```typescript
import { metadata } from '../lib/mcp';

const result = metadata.validateMetadata(serverMetadata);
if (result.valid) {
  console.log('元数据验证通过');
} else {
  console.error('元数据验证失败:', result.errors);
}
```

### 元数据提取

从服务器定义中提取基本元数据：

```typescript
const extractedMetadata = metadata.extractMetadata(serverDefinition);
console.log('服务器分类:', extractedMetadata.category);
console.log('维护者:', extractedMetadata.maintainers);
```

### 元数据增强

增强服务器定义，添加丰富的元数据信息：

```typescript
const enhancedServer = metadata.enhanceMetadata(serverDefinition);
// 服务器现在包含了更丰富的元数据
```

### 添加兼容性和资源信息

```typescript
// 添加兼容性信息
const serverWithCompat = metadata.addCompatibilityInfo(serverDefinition, {
  clients: ['web', 'mobile'],
  os: ['windows', 'macos', 'linux'],
  languages: ['en', 'zh']
});

// 添加资源要求
const serverWithResources = metadata.addResourceRequirements(serverDefinition, {
  cpu: '2',
  memory: '1024',
  storage: '10000'
});
```

### 管理屏幕截图和示例

```typescript
// 添加屏幕截图
const screenshots = [
  {
    title: '主页',
    url: 'https://example.com/screenshot1.png',
    thumbnailUrl: 'https://example.com/screenshot1-thumb.png'
  }
];
const serverWithScreenshots = metadata.addScreenshots(serverDefinition, screenshots);

// 添加使用示例
const examples = [
  {
    title: '基本使用',
    content: 'console.log("Hello World")',
    language: 'javascript'
  }
];
const serverWithExamples = metadata.addExamples(serverDefinition, examples);
```

### 评分和评论系统

```typescript
// 添加用户评分
const review = {
  userId: 'user123',
  userName: '张三',
  rating: 5,
  comment: '非常好用的服务',
  createdAt: new Date().toISOString()
};
const serverWithReview = metadata.addReview(serverDefinition, review);

// 删除用户评分
const serverWithoutReview = metadata.removeReview(serverDefinition, 'user123');

// 获取评分摘要
const ratingSummary = metadata.getRatingSummary(serverDefinition);
console.log(`平均评分: ${ratingSummary.average}`);
console.log(`评分总数: ${ratingSummary.count}`);
console.log('评分分布:', ratingSummary.distribution);
```

## 最佳实践

1. **保持元数据完整**：提供尽可能多的元数据信息，帮助用户理解和使用服务器
2. **定期更新统计信息**：确保下载次数、使用统计等信息保持最新
3. **维护示例代码**：提供清晰、简洁且可执行的代码示例
4. **妥善处理评论**：及时响应用户评论，处理不当内容
5. **验证元数据完整性**：在更新服务器定义前验证元数据的有效性

## 元数据集成

元数据管理模块与MCP服务器框架紧密集成，可以通过以下方式引入：

```typescript
// 导入整个MCP模块
import { metadata } from '../lib/mcp';

// 或者直接导入元数据模块
import metadata from '../lib/mcp/metadata';
``` 