/**
 * MCP服务器权限控制模块
 * 用于管理和验证MCP服务器的访问权限
 */

import { 
  MCPServerDefinition, 
  MCPAccessRule 
} from '../types';

/**
 * 用户角色类型
 */
export enum UserRole {
  GUEST = 'guest',
  USER = 'user',
  PUBLISHER = 'publisher',
  ADMIN = 'admin'
}

/**
 * 访问控制动作
 */
export enum AccessAction {
  VIEW = 'view',
  DOWNLOAD = 'download',
  PUBLISH = 'publish',
  UPDATE = 'update',
  DELETE = 'delete',
  ADMIN = 'admin'
}

/**
 * 访问请求对象
 */
export interface AccessRequest {
  // 请求的用户ID
  userId?: string;
  // 用户角色
  role: UserRole;
  // 请求动作
  action: AccessAction;
  // 目标服务器
  targetServer?: string;
  // 环境
  environment?: string;
  // 其他上下文数据
  context?: Record<string, any>;
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  // 是否允许访问
  allowed: boolean;
  // 原因
  reason?: string;
}

/**
 * 检查用户是否有权限访问服务器
 * @param server MCP服务器定义
 * @param request 访问请求
 * @returns 权限检查结果
 */
export function checkServerAccess(
  server: MCPServerDefinition,
  request: AccessRequest
): PermissionCheckResult {
  // 如果服务器没有安全设置，默认允许访问
  if (!server.security) {
    return { allowed: true };
  }
  
  // VIEW操作比较特殊，允许所有用户访问，即使未认证
  if (request.action === AccessAction.VIEW) {
    return { allowed: true };
  }
  
  // 检查服务器是否需要认证
  if (server.security.authenticationTypes?.length && !request.userId) {
    return {
      allowed: false,
      reason: '需要认证才能访问此服务器'
    };
  }
  
  // 检查访问规则
  if (server.security.accessRules?.length) {
    // 找到匹配当前操作的规则
    const matchingRules = server.security.accessRules.filter(rule => {
      // 检查角色
      if (rule.roles && !rule.roles.includes(request.role)) {
        return false;
      }
      
      // 检查环境
      if (rule.environments && request.environment && 
          !rule.environments.includes(request.environment)) {
        return false;
      }
      
      return true;
    });
    
    // 如果有匹配规则但用户不满足任何一个，则拒绝访问
    if (matchingRules.length > 0) {
      const allowed = matchingRules.some(rule => isRoleAllowed(request.role, rule));
      
      if (!allowed) {
        return {
          allowed: false,
          reason: `用户角色 ${request.role} 没有执行 ${request.action} 的权限`
        };
      }
    }
  }
  
  // 处理特殊情况
  switch (request.action) {
    case AccessAction.PUBLISH:
    case AccessAction.UPDATE:
      // 只有发布者和管理员可以发布或更新
      if (![UserRole.PUBLISHER, UserRole.ADMIN].includes(request.role)) {
        return {
          allowed: false,
          reason: '只有发布者和管理员可以发布或更新服务器'
        };
      }
      break;
      
    case AccessAction.DELETE:
      // 只有管理员可以删除
      if (request.role !== UserRole.ADMIN) {
        return {
          allowed: false,
          reason: '只有管理员可以删除服务器'
        };
      }
      break;
      
    case AccessAction.ADMIN:
      // 只有管理员可以执行管理操作
      if (request.role !== UserRole.ADMIN) {
        return {
          allowed: false,
          reason: '只有管理员可以执行此操作'
        };
      }
      break;
  }
  
  // 默认允许访问
  return { allowed: true };
}

/**
 * 检查角色是否满足访问规则
 * @param role 用户角色
 * @param rule 访问规则
 * @returns 是否允许访问
 */
function isRoleAllowed(role: UserRole, rule: MCPAccessRule): boolean {
  // 如果规则没有指定角色，则允许所有角色
  if (!rule.roles || rule.roles.length === 0) {
    return true;
  }
  
  // 检查角色是否在允许列表中
  return rule.roles.includes(role);
}

/**
 * 创建默认的访问规则
 * @returns 默认访问规则数组
 */
export function createDefaultAccessRules(): MCPAccessRule[] {
  return [
    // 查看规则 - 所有人都可以查看
    {
      route: '/servers/*',
      methods: ['GET'],
      roles: [UserRole.GUEST, UserRole.USER, UserRole.PUBLISHER, UserRole.ADMIN]
    },
    // 下载规则 - 注册用户及以上可以下载
    {
      route: '/servers/*/download',
      methods: ['GET'],
      roles: [UserRole.USER, UserRole.PUBLISHER, UserRole.ADMIN]
    },
    // 发布规则 - 只有发布者和管理员可以发布
    {
      route: '/servers',
      methods: ['POST'],
      roles: [UserRole.PUBLISHER, UserRole.ADMIN]
    },
    // 更新规则 - 只有发布者和管理员可以更新
    {
      route: '/servers/*',
      methods: ['PUT', 'PATCH'],
      roles: [UserRole.PUBLISHER, UserRole.ADMIN]
    },
    // 删除规则 - 只有管理员可以删除
    {
      route: '/servers/*',
      methods: ['DELETE'],
      roles: [UserRole.ADMIN]
    }
  ];
}

export default {
  checkServerAccess,
  createDefaultAccessRules,
  UserRole,
  AccessAction
}; 