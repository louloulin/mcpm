/**
 * MCPM 3.0 API
 * 主要入口文件 - 提供兼容层与新API的入口点
 */

// 导入现有功能
import * as legacy from '../mcp';

// 导入新API
import * as client from './client';
import * as server from './server';
import * as registry from './registry';
import * as adapters from './adapters';

// 导出所有现有功能以保证向后兼容
export * from '../mcp';

// 以独立命名空间导出新API
export {
  client,
  server,
  registry,
  adapters
};

// 默认导出，包含传统API和新API
export default {
  ...legacy,
  // v3新API
  client,
  server,
  registry,
  adapters
}; 