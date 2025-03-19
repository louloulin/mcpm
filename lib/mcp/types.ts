/**
 * MCP (Model Context Protocol) 类型定义
 * 参考自Model Context Protocol规范
 */

// MCP工具参数schema类型
export interface ToolParameterSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  enum?: string[];
  default?: any;
  required?: boolean;
  properties?: Record<string, ToolParameterSchema>;
  items?: ToolParameterSchema;
  minItems?: number;
  maxItems?: number;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

// MCP工具定义
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, ToolParameterSchema>;
    required?: string[];
  };
}

/**
 * MCP服务器的类型定义
 */

// MCP服务器定义
export interface MCPServerDefinition {
  // 基础信息
  name: string;
  version: string;
  description?: string;
  
  // 服务器可访问URL
  url: string;
  
  // 服务类型和状态
  type: MCPServerType;
  status: MCPServerStatus;
  
  // 元数据
  tags?: string[];
  author?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  
  // 服务器依赖
  dependencies?: Record<string, string>;
  
  // 服务器配置
  config?: MCPServerConfig;
  
  // 服务器安全设置
  security?: MCPServerSecurity;
  
  // 服务器路由配置
  routes?: MCPServerRoute[];
  
  // 创建和更新时间
  createdAt?: string; // ISO 格式的日期时间
  updatedAt?: string; // ISO 格式的日期时间
}

// MCP服务器类型
export enum MCPServerType {
  // 应用服务器
  APP = 'app',
  // 库服务器
  LIB = 'lib',
  // 工具服务器
  TOOL = 'tool',
  // 框架服务器
  FRAMEWORK = 'framework',
  // 模板服务器
  TEMPLATE = 'template',
  // 插件服务器
  PLUGIN = 'plugin',
  // 其他类型
  OTHER = 'other'
}

// MCP服务器状态
export enum MCPServerStatus {
  // 活跃状态，正常运行
  ACTIVE = 'active',
  // 已弃用
  DEPRECATED = 'deprecated',
  // 实验性
  EXPERIMENTAL = 'experimental',
  // 维护中
  MAINTENANCE = 'maintenance',
  // 已下架
  INACTIVE = 'inactive'
}

// MCP服务器配置
export interface MCPServerConfig {
  // 允许的连接数
  maxConnections?: number;
  // 超时设置 (毫秒)
  timeout?: number;
  // 服务器环境变量
  env?: Record<string, string>;
  // 其他自定义配置
  [key: string]: any;
}

// MCP服务器安全设置
export interface MCPServerSecurity {
  // 支持的认证类型
  authenticationTypes?: string[];
  // 需要认证的路由
  protectedRoutes?: string[];
  // 访问控制规则
  accessRules?: MCPAccessRule[];
  // 速率限制设置
  rateLimit?: MCPRateLimit;
  // 签名信息
  signature?: MCPSignature;
  // 可信发布者列表
  trustedPublishers?: string[];
}

// MCP访问控制规则
export interface MCPAccessRule {
  // 规则适用的路由
  route: string;
  // 规则适用的方法
  methods?: string[];
  // 规则适用的角色
  roles?: string[];
  // 规则适用的环境
  environments?: string[];
}

// MCP速率限制
export interface MCPRateLimit {
  // 限制周期内允许的请求次数
  limit: number;
  // 限制周期 (秒)
  period: number;
  // 是否按IP限制
  byIp?: boolean;
  // 是否按用户限制
  byUser?: boolean;
}

// MCP服务器路由
export interface MCPServerRoute {
  // 路由路径
  path: string;
  // 支持的HTTP方法
  methods: string[];
  // 路由描述
  description?: string;
  // 请求参数定义
  parameters?: MCPRouteParameter[];
  // 响应定义
  responses?: Record<string, MCPRouteResponse>;
}

// MCP路由参数
export interface MCPRouteParameter {
  // 参数名称
  name: string;
  // 参数位置: query, path, body, header
  location: 'query' | 'path' | 'body' | 'header';
  // 参数描述
  description?: string;
  // 参数类型
  type: string;
  // 是否必需
  required: boolean;
  // 默认值
  default?: any;
  // 参数示例
  example?: any;
}

// MCP路由响应
export interface MCPRouteResponse {
  // 响应描述
  description?: string;
  // 响应内容类型
  contentType: string;
  // 响应示例
  example?: any;
  // 响应模式
  schema?: any;
}

// MCP验证结果
export interface MCPValidationResult {
  // 验证是否通过
  valid: boolean;
  // 验证失败的错误信息
  errors?: string[];
}

// MCP服务器健康状态
export interface MCPServerHealth {
  // 健康状态
  status: MCPServerHealthStatus;
  // 额外状态信息
  message?: string;
  // 检查时间戳
  timestamp: string;
  // 健康检查详细信息
  details?: Record<string, any>;
}

// MCP服务器健康状态枚举
export enum MCPServerHealthStatus {
  // 健康
  HEALTHY = 'healthy',
  // 不健康
  UNHEALTHY = 'unhealthy',
  // 部分健康
  DEGRADED = 'degraded',
  // 未知状态
  UNKNOWN = 'unknown'
}

// MCP传输类型
export enum MCPTransportType {
  STDIO = 'stdio',
  HTTP_SSE = 'http-sse'
}

// MCP消息类型
export enum MCPMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error'
}

// MCP基础消息
export interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
}

// MCP请求消息
export interface MCPRequest extends MCPMessage {
  method: string;
  params?: any;
}

// MCP响应消息
export interface MCPResponse extends MCPMessage {
  result: any;
}

// MCP错误消息
export interface MCPError extends MCPMessage {
  error: {
    code: number;
    message: string;
    data?: any;
  };
}

// MCP签名信息
export interface MCPSignature {
  // 签名方法
  algorithm: MCPSignatureAlgorithm;
  // 签名值
  value: string;
  // 签名者信息
  signer?: string;
  // 签名时间戳
  timestamp?: string;
  // 公钥或证书URL
  publicKeyUrl?: string;
  // 签名过期时间
  expiresAt?: string;
}

// MCP签名算法
export enum MCPSignatureAlgorithm {
  // RSA签名
  RSA_SHA256 = 'rsa-sha256',
  // ECDSA签名
  ECDSA_SHA256 = 'ecdsa-sha256',
  // ED25519签名
  ED25519 = 'ed25519'
}

// MCP密钥对
export interface MCPKeyPair {
  // 公钥
  publicKey: string;
  // 私钥
  privateKey: string;
  // 算法
  algorithm: MCPSignatureAlgorithm;
  // 创建时间
  createdAt: string;
  // 过期时间
  expiresAt?: string;
}

// MCP签名验证结果
export interface MCPSignatureVerificationResult {
  // 验证是否通过
  valid: boolean;
  // 错误信息
  error?: string;
  // 签名相关信息
  metadata?: {
    signer?: string;
    timestamp?: string;
    algorithm?: string;
  };
} 