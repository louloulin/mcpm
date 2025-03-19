/**
 * MCP云托管模块入口
 */

// 导出类型定义
export * from './types';
export * from './runtime/container';

// 导出云托管管理器
export { MCPCloudHostingManager, cloudHostingManager } from './manager';

// 导出云提供者实现
export * from './providers/aws-lambda';
export * from './providers/docker';
export * from './providers/docker-container';

// 导出容器运行时
export * from './runtime/docker';

// 创建并导出单例云托管管理器
import { cloudHostingManager } from './manager';
export default cloudHostingManager; 