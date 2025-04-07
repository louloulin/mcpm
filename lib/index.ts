/**
 * MCPM 主入口
 * 导出所有API功能
 */

// 导出现有MCP核心API
export * from './mcp';

// 导出v3新API
export * as v3 from './v3';

// 默认导出
export default {
  // v3 API
  v3: require('./v3')
}; 