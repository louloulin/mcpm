/**
 * MCPM 3.0 注册表模块
 * 提供统一的注册表功能
 */

const { FederatedRegistry } = require('./FederatedRegistry');
const { RemoteRegistry } = require('./RemoteRegistry');

// 导出模块
module.exports = {
  FederatedRegistry,
  RemoteRegistry
}; 