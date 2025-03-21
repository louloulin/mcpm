/**
 * MCP集成SDK
 * 提供第三方系统与MCP服务器集成的工具库
 */

// 导出核心模块
export * from './core/MCPIntegrationClient';
export * from './core/types';

// 导出特定集成类型
export * from './integrations/ide';
export * from './integrations/ai';

// 导出实用工具
export * from './utils/auth';
export * from './utils/api'; 