/**
 * MCPM 3.0 API
 * 主要入口文件 - 提供兼容层与新API的入口点
 */

// 导入模块
const client = require('./client');
const registry = require('./registry');
const server = require('./server');

// 导出
module.exports = {
  // 组织良好的命名空间
  client,
  registry,
  server,
  
  // 导出常用组件，方便直接使用
  MCPClient: client.MCPClient,
  FederatedRegistry: registry.FederatedRegistry,
  RemoteRegistry: registry.RemoteRegistry
}; 