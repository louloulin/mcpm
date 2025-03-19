/**
 * 权限控制模块单元测试
 */

import { expect, describe, it } from 'vitest';
import {
  checkServerAccess,
  createDefaultAccessRules,
  UserRole,
  AccessAction,
  AccessRequest
} from '../../../lib/mcp/security/permissions';
import { MCPServerDefinition, MCPServerType, MCPServerStatus } from '../../../lib/mcp/types';

// 创建测试用服务器
function createTestServer(withSecurity: boolean = true): MCPServerDefinition {
  const server: MCPServerDefinition = {
    name: 'test-server',
    version: '1.0.0',
    description: '测试用MCP服务器',
    url: 'http://localhost:3000',
    type: MCPServerType.APP,
    status: MCPServerStatus.ACTIVE
  };
  
  if (withSecurity) {
    server.security = {
      authenticationTypes: ['jwt'],
      accessRules: createDefaultAccessRules()
    };
  }
  
  return server;
}

// 创建测试用访问请求
function createAccessRequest(
  role: UserRole = UserRole.USER,
  action: AccessAction = AccessAction.VIEW,
  userId?: string
): AccessRequest {
  return {
    userId,
    role,
    action,
    targetServer: 'test-server',
    environment: 'production'
  };
}

describe('权限控制模块', () => {
  it('应该创建默认访问规则', () => {
    const rules = createDefaultAccessRules();
    
    expect(rules).toBeDefined();
    expect(rules.length).toBeGreaterThan(0);
    
    // 验证包含必要的规则类型
    const routes = rules.map(r => r.route);
    expect(routes).toContain('/servers/*');
    expect(routes).toContain('/servers/*/download');
  });
  
  it('应该允许所有用户查看服务器', () => {
    const server = createTestServer();
    
    // 测试各种角色的查看权限
    [UserRole.GUEST, UserRole.USER, UserRole.PUBLISHER, UserRole.ADMIN].forEach(role => {
      const request = createAccessRequest(role, AccessAction.VIEW, role !== UserRole.GUEST ? 'user-1' : undefined);
      const result = checkServerAccess(server, request);
      
      expect(result.allowed).toBe(true);
    });
  });
  
  it('应该仅允许注册用户下载服务器', () => {
    const server = createTestServer();
    
    // 游客不能下载
    const guestRequest = createAccessRequest(UserRole.GUEST, AccessAction.DOWNLOAD);
    const guestResult = checkServerAccess(server, guestRequest);
    expect(guestResult.allowed).toBe(false);
    
    // 注册用户可以下载
    const userRequest = createAccessRequest(UserRole.USER, AccessAction.DOWNLOAD, 'user-1');
    const userResult = checkServerAccess(server, userRequest);
    expect(userResult.allowed).toBe(true);
  });
  
  it('应该仅允许发布者和管理员发布服务器', () => {
    const server = createTestServer();
    
    // 普通用户不能发布
    const userRequest = createAccessRequest(UserRole.USER, AccessAction.PUBLISH, 'user-1');
    const userResult = checkServerAccess(server, userRequest);
    expect(userResult.allowed).toBe(false);
    
    // 发布者可以发布
    const publisherRequest = createAccessRequest(UserRole.PUBLISHER, AccessAction.PUBLISH, 'publisher-1');
    const publisherResult = checkServerAccess(server, publisherRequest);
    expect(publisherResult.allowed).toBe(true);
    
    // 管理员可以发布
    const adminRequest = createAccessRequest(UserRole.ADMIN, AccessAction.PUBLISH, 'admin-1');
    const adminResult = checkServerAccess(server, adminRequest);
    expect(adminResult.allowed).toBe(true);
  });
  
  it('应该仅允许发布者和管理员更新服务器', () => {
    const server = createTestServer();
    
    // 普通用户不能更新
    const userRequest = createAccessRequest(UserRole.USER, AccessAction.UPDATE, 'user-1');
    const userResult = checkServerAccess(server, userRequest);
    expect(userResult.allowed).toBe(false);
    
    // 发布者可以更新
    const publisherRequest = createAccessRequest(UserRole.PUBLISHER, AccessAction.UPDATE, 'publisher-1');
    const publisherResult = checkServerAccess(server, publisherRequest);
    expect(publisherResult.allowed).toBe(true);
  });
  
  it('应该仅允许管理员删除服务器', () => {
    const server = createTestServer();
    
    // 发布者不能删除
    const publisherRequest = createAccessRequest(UserRole.PUBLISHER, AccessAction.DELETE, 'publisher-1');
    const publisherResult = checkServerAccess(server, publisherRequest);
    expect(publisherResult.allowed).toBe(false);
    
    // 管理员可以删除
    const adminRequest = createAccessRequest(UserRole.ADMIN, AccessAction.DELETE, 'admin-1');
    const adminResult = checkServerAccess(server, adminRequest);
    expect(adminResult.allowed).toBe(true);
  });
  
  it('应该仅允许管理员执行管理操作', () => {
    const server = createTestServer();
    
    // 发布者不能执行管理操作
    const publisherRequest = createAccessRequest(UserRole.PUBLISHER, AccessAction.ADMIN, 'publisher-1');
    const publisherResult = checkServerAccess(server, publisherRequest);
    expect(publisherResult.allowed).toBe(false);
    
    // 管理员可以执行管理操作
    const adminRequest = createAccessRequest(UserRole.ADMIN, AccessAction.ADMIN, 'admin-1');
    const adminResult = checkServerAccess(server, adminRequest);
    expect(adminResult.allowed).toBe(true);
  });
  
  it('应该处理没有安全设置的服务器', () => {
    const server = createTestServer(false);
    
    const request = createAccessRequest(UserRole.USER, AccessAction.VIEW, 'user-1');
    const result = checkServerAccess(server, request);
    
    expect(result.allowed).toBe(true);
  });
  
  it('应该要求认证才能访问需要认证的服务器', () => {
    const server = createTestServer();
    
    // 未认证用户，请求非查看操作
    const unauthRequest = createAccessRequest(UserRole.USER, AccessAction.DOWNLOAD);
    const unauthResult = checkServerAccess(server, unauthRequest);
    
    expect(unauthResult.allowed).toBe(false);
    expect(unauthResult.reason).toContain('需要认证');
    
    // 已认证用户
    const authRequest = createAccessRequest(UserRole.USER, AccessAction.DOWNLOAD, 'user-1');
    const authResult = checkServerAccess(server, authRequest);
    
    expect(authResult.allowed).toBe(true);
  });
}); 