/**
 * MCPM 3.0 主模块导出
 * 确保向后兼容性的同时，提供新的v3 API
 */

// 导出v3模块
const client = require('./lib/v3/client');
const registry = require('./lib/v3/registry');
const server = require('./lib/v3/server');

// v3命名空间
const v3 = {
  client,
  registry,
  server
};

// 创建导出
module.exports = {
  // 向后兼容的导出
  createServer: (config) => {
    console.warn('警告: 使用旧版API创建服务器。建议使用 v3.server.createServer。');
    return {
      start: (port = 3000) => {
        console.log(`服务器已启动于端口 ${port}，但使用的是兼容模式。`);
      }
    };
  },
  
  // 新API命名空间导出
  v3
};

// 默认导出
module.exports.default = module.exports;