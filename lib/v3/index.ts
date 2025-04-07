/**
 * MCPM 3.0 API
 * 主要入口文件 - 提供兼容层与新API的入口点
 */

// 导入模块
import * as client from './client';
import * as registry from './registry';

// 导出组织良好的命名空间
export const v3 = {
  client,
  registry
};

// 导出常用组件，方便直接使用
export { MCPClient } from './client';
export { FederatedRegistry, RemoteRegistry } from './registry'; 