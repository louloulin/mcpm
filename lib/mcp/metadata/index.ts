/**
 * MCP服务器元数据管理模块
 * 提供元数据验证、处理和增强功能
 */

import { 
  MCPServerDefinition, 
  MCPServerMetadata,
  MCPCompatibilityInfo,
  MCPResourceRequirements,
  MCPExample,
  MCPScreenshot,
  MCPValidationResult,
  MCPReview,
  MCPServerRatings
} from '../types';

/**
 * 验证服务器元数据
 * @param metadata 服务器元数据
 * @returns 验证结果
 */
export function validateMetadata(metadata: MCPServerMetadata): MCPValidationResult {
  const errors: string[] = [];

  // 验证基本信息完整性
  if (metadata.category && typeof metadata.category !== 'string') {
    errors.push('元数据分类必须是字符串');
  }

  if (metadata.keywords && !Array.isArray(metadata.keywords)) {
    errors.push('关键词必须是字符串数组');
  }

  // 验证维护者信息
  if (metadata.maintainers) {
    if (!Array.isArray(metadata.maintainers)) {
      errors.push('维护者必须是数组');
    } else {
      metadata.maintainers.forEach((maintainer, index) => {
        if (!maintainer.name) {
          errors.push(`维护者 #${index + 1} 缺少名称`);
        }
        if (maintainer.email && !isValidEmail(maintainer.email)) {
          errors.push(`维护者 #${index + 1} 邮箱格式无效`);
        }
        if (maintainer.url && !isValidUrl(maintainer.url)) {
          errors.push(`维护者 #${index + 1} URL格式无效`);
        }
      });
    }
  }

  // 验证支持信息
  if (metadata.support) {
    if (metadata.support.email && !isValidEmail(metadata.support.email)) {
      errors.push('支持邮箱格式无效');
    }
    
    ['url', 'documentation', 'issues', 'chat'].forEach(field => {
      const url = metadata.support?.[field as keyof typeof metadata.support] as string | undefined;
      if (url && !isValidUrl(url)) {
        errors.push(`支持${field}链接格式无效`);
      }
    });
  }

  // 验证兼容性信息
  if (metadata.compatibility) {
    if (metadata.compatibility.clients && !Array.isArray(metadata.compatibility.clients)) {
      errors.push('兼容客户端必须是数组');
    }
    if (metadata.compatibility.mcpVersion && !Array.isArray(metadata.compatibility.mcpVersion)) {
      errors.push('兼容MCP版本必须是数组');
    }
    if (metadata.compatibility.os && !Array.isArray(metadata.compatibility.os)) {
      errors.push('兼容操作系统必须是数组');
    }
    if (metadata.compatibility.languages && !Array.isArray(metadata.compatibility.languages)) {
      errors.push('兼容语言必须是数组');
    }
    if (metadata.compatibility.browsers && !Array.isArray(metadata.compatibility.browsers)) {
      errors.push('兼容浏览器必须是数组');
    }
  }

  // 验证屏幕截图
  if (metadata.screenshots) {
    if (!Array.isArray(metadata.screenshots)) {
      errors.push('屏幕截图必须是数组');
    } else {
      metadata.screenshots.forEach((screenshot, index) => {
        if (!screenshot.url) {
          errors.push(`屏幕截图 #${index + 1} 缺少URL`);
        } else if (!isValidUrl(screenshot.url)) {
          errors.push(`屏幕截图 #${index + 1} URL格式无效`);
        }
        
        if (screenshot.thumbnailUrl && !isValidUrl(screenshot.thumbnailUrl)) {
          errors.push(`屏幕截图 #${index + 1} 缩略图URL格式无效`);
        }
      });
    }
  }

  // 验证示例
  if (metadata.examples) {
    if (!Array.isArray(metadata.examples)) {
      errors.push('使用示例必须是数组');
    } else {
      metadata.examples.forEach((example, index) => {
        if (!example.title) {
          errors.push(`示例 #${index + 1} 缺少标题`);
        }
        if (!example.content) {
          errors.push(`示例 #${index + 1} 缺少内容`);
        }
        if (example.url && !isValidUrl(example.url)) {
          errors.push(`示例 #${index + 1} URL格式无效`);
        }
      });
    }
  }

  // 验证评分信息
  if (metadata.ratings) {
    if (metadata.ratings.average !== undefined && (metadata.ratings.average < 1 || metadata.ratings.average > 5)) {
      errors.push('平均评分必须在1-5之间');
    }
    
    if (metadata.ratings.reviews) {
      if (!Array.isArray(metadata.ratings.reviews)) {
        errors.push('评论必须是数组');
      } else {
        metadata.ratings.reviews.forEach((review, index) => {
          if (!review.userId) {
            errors.push(`评论 #${index + 1} 缺少用户ID`);
          }
          if (review.rating < 1 || review.rating > 5) {
            errors.push(`评论 #${index + 1} 评分必须在1-5之间`);
          }
          if (!review.createdAt) {
            errors.push(`评论 #${index + 1} 缺少创建时间`);
          }
        });
      }
    }
  }

  // 验证价格信息
  if (metadata.pricing) {
    if (!['free', 'paid', 'freemium', 'subscription'].includes(metadata.pricing.type)) {
      errors.push('价格类型无效');
    }
    
    if (metadata.pricing.billingCycle && 
        !['monthly', 'yearly', 'one-time'].includes(metadata.pricing.billingCycle)) {
      errors.push('计费周期无效');
    }
    
    if (metadata.pricing.trialPeriod !== undefined && metadata.pricing.trialPeriod < 0) {
      errors.push('试用期不能为负数');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * 从服务器定义中提取元数据
 * @param serverDefinition 服务器定义
 * @returns 服务器元数据
 */
export function extractMetadata(serverDefinition: MCPServerDefinition): MCPServerMetadata {
  // 如果已有元数据，直接返回
  if (serverDefinition.metadata) {
    return serverDefinition.metadata;
  }

  // 创建基础元数据
  const metadata: MCPServerMetadata = {
    keywords: serverDefinition.tags || [],
    category: serverDefinition.type,
    maintainers: []
  };

  // 添加维护者信息
  if (serverDefinition.author) {
    metadata.maintainers = [{
      name: serverDefinition.author
    }];
  }

  // 添加支持信息
  metadata.support = {
    documentation: serverDefinition.homepage
  };

  // 添加兼容性信息
  metadata.compatibility = {
    mcpVersion: ['1.0.0']
  };

  // 添加统计信息
  metadata.stats = {
    firstPublished: serverDefinition.createdAt,
    lastUpdated: serverDefinition.updatedAt
  };

  return metadata;
}

/**
 * 增强服务器元数据
 * @param serverDefinition 服务器定义
 * @returns 增强后的服务器定义
 */
export function enhanceMetadata(serverDefinition: MCPServerDefinition): MCPServerDefinition {
  // 创建新的服务器定义对象
  const enhancedServer = { ...serverDefinition };
  
  // 提取元数据
  if (!enhancedServer.metadata) {
    enhancedServer.metadata = extractMetadata(serverDefinition);
  }
  
  // 确保基本字段存在
  enhancedServer.tags = enhancedServer.tags || [];
  enhancedServer.createdAt = enhancedServer.createdAt || new Date().toISOString();
  enhancedServer.updatedAt = new Date().toISOString();
  
  return enhancedServer;
}

/**
 * 添加服务器兼容性信息
 * @param serverDefinition 服务器定义
 * @param compatibility 兼容性信息
 * @returns 更新后的服务器定义
 */
export function addCompatibilityInfo(
  serverDefinition: MCPServerDefinition, 
  compatibility: MCPCompatibilityInfo
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 确保metadata存在
  if (!updatedServer.metadata) {
    updatedServer.metadata = extractMetadata(updatedServer);
  }
  
  // 更新兼容性信息
  updatedServer.metadata.compatibility = {
    ...updatedServer.metadata.compatibility,
    ...compatibility
  };
  
  return updatedServer;
}

/**
 * 添加服务器资源要求
 * @param serverDefinition 服务器定义
 * @param resources 资源要求
 * @returns 更新后的服务器定义
 */
export function addResourceRequirements(
  serverDefinition: MCPServerDefinition,
  resources: MCPResourceRequirements
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 确保metadata存在
  if (!updatedServer.metadata) {
    updatedServer.metadata = extractMetadata(updatedServer);
  }
  
  // 更新资源要求
  updatedServer.metadata.resources = {
    ...updatedServer.metadata.resources,
    ...resources
  };
  
  return updatedServer;
}

/**
 * 添加服务器屏幕截图
 * @param serverDefinition 服务器定义
 * @param screenshots 屏幕截图
 * @returns 更新后的服务器定义
 */
export function addScreenshots(
  serverDefinition: MCPServerDefinition,
  screenshots: MCPScreenshot[]
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 确保metadata存在
  if (!updatedServer.metadata) {
    updatedServer.metadata = extractMetadata(updatedServer);
  }
  
  // 确保screenshots字段存在
  updatedServer.metadata.screenshots = updatedServer.metadata.screenshots || [];
  
  // 添加新的屏幕截图
  updatedServer.metadata.screenshots.push(...screenshots);
  
  return updatedServer;
}

/**
 * 添加服务器使用示例
 * @param serverDefinition 服务器定义
 * @param examples 使用示例
 * @returns 更新后的服务器定义
 */
export function addExamples(
  serverDefinition: MCPServerDefinition,
  examples: MCPExample[]
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 确保metadata存在
  if (!updatedServer.metadata) {
    updatedServer.metadata = extractMetadata(updatedServer);
  }
  
  // 确保examples字段存在
  updatedServer.metadata.examples = updatedServer.metadata.examples || [];
  
  // 添加新的使用示例
  updatedServer.metadata.examples.push(...examples);
  
  return updatedServer;
}

/**
 * 添加服务器评分
 * @param serverDefinition 服务器定义
 * @param review 用户评分和评论
 * @returns 更新后的服务器定义
 */
export function addReview(
  serverDefinition: MCPServerDefinition,
  review: MCPReview
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 确保metadata存在
  if (!updatedServer.metadata) {
    updatedServer.metadata = extractMetadata(updatedServer);
  }
  
  // 确保ratings字段存在
  if (!updatedServer.metadata.ratings) {
    updatedServer.metadata.ratings = {
      average: 0,
      count: 0,
      distribution: {},
      reviews: []
    };
  }
  
  // 确保reviews字段存在
  updatedServer.metadata.ratings.reviews = updatedServer.metadata.ratings.reviews || [];
  
  // 检查用户是否已经评价过
  const existingReviewIndex = updatedServer.metadata.ratings.reviews.findIndex(
    r => r.userId === review.userId
  );
  
  if (existingReviewIndex >= 0) {
    // 更新现有评论
    updatedServer.metadata.ratings.reviews[existingReviewIndex] = review;
  } else {
    // 添加新评论
    updatedServer.metadata.ratings.reviews.push(review);
  }
  
  // 更新评分统计
  updateRatingStatistics(updatedServer.metadata.ratings);
  
  return updatedServer;
}

/**
 * 更新评分统计信息
 * @param ratings 评分信息
 */
function updateRatingStatistics(ratings: MCPServerRatings): void {
  if (!ratings.reviews || ratings.reviews.length === 0) {
    ratings.average = 0;
    ratings.count = 0;
    ratings.distribution = {};
    return;
  }
  
  // 计算总数
  ratings.count = ratings.reviews.length;
  
  // 计算平均分
  const sum = ratings.reviews.reduce((total, review) => total + review.rating, 0);
  ratings.average = sum / ratings.count;
  
  // 计算评分分布
  ratings.distribution = {};
  for (let i = 1; i <= 5; i++) {
    ratings.distribution[i.toString()] = ratings.reviews.filter(review => review.rating === i).length;
  }
}

/**
 * 删除服务器评论
 * @param serverDefinition 服务器定义
 * @param userId 用户ID
 * @returns 更新后的服务器定义
 */
export function removeReview(
  serverDefinition: MCPServerDefinition,
  userId: string
): MCPServerDefinition {
  const updatedServer = { ...serverDefinition };
  
  // 如果没有评分信息，直接返回
  if (!updatedServer.metadata?.ratings?.reviews) {
    return updatedServer;
  }
  
  // 过滤掉指定用户的评论
  const reviews = updatedServer.metadata.ratings.reviews.filter(review => review.userId !== userId);
  updatedServer.metadata.ratings.reviews = reviews;
  
  // 更新评分统计
  updateRatingStatistics(updatedServer.metadata.ratings);
  
  return updatedServer;
}

/**
 * 获取服务器评分摘要
 * @param serverDefinition 服务器定义
 * @returns 评分摘要
 */
export function getRatingSummary(serverDefinition: MCPServerDefinition): {
  average: number;
  count: number;
  distribution: Record<string, number>;
} {
  const ratings = serverDefinition.metadata?.ratings;
  
  if (!ratings) {
    return {
      average: 0,
      count: 0,
      distribution: {}
    };
  }
  
  return {
    average: ratings.average || 0,
    count: ratings.count || 0,
    distribution: ratings.distribution || {}
  };
}

/**
 * 验证Email格式
 * @param email 电子邮件
 * @returns 是否有效
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证URL格式
 * @param url URL
 * @returns 是否有效
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_) {
    return false;
  }
}

export default {
  validateMetadata,
  extractMetadata,
  enhanceMetadata,
  addCompatibilityInfo,
  addResourceRequirements,
  addScreenshots,
  addExamples,
  addReview,
  removeReview,
  getRatingSummary
}; 