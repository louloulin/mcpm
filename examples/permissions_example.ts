import { permissions } from '../lib/mcp/security';
import { UserRole, AccessAction } from '../lib/mcp/security/permissions';
import { MCPServerDefinition, MCPServerType, MCPServerStatus } from '../lib/mcp/types';

// 示例：权限控制流程
function permissionsExample() {
  try {
    // 1. 创建测试服务器定义，包含安全规则
    const serverDefinition: MCPServerDefinition = {
      name: 'example-server',
      version: '1.0.0',
      description: '示例MCP服务器',
      url: 'http://localhost:3000',
      type: MCPServerType.APP,
      status: MCPServerStatus.ACTIVE,
      security: {
        authenticationTypes: ['jwt'],
        accessRules: permissions.createDefaultAccessRules()
      }
    };
    
    console.log('创建服务器定义，包含默认访问规则');
    
    // 2. 测试不同角色的访问权限
    
    // 2.1 未登录游客 - 查看权限
    const guestViewRequest = {
      role: UserRole.GUEST,
      action: AccessAction.VIEW,
      targetServer: 'example-server'
    };
    
    const guestViewResult = permissions.checkServerAccess(serverDefinition, guestViewRequest);
    console.log(`游客查看权限: ${guestViewResult.allowed ? '允许' : '拒绝'}`);
    
    // 2.2 未登录游客 - 下载权限
    const guestDownloadRequest = {
      role: UserRole.GUEST,
      action: AccessAction.DOWNLOAD,
      targetServer: 'example-server'
    };
    
    const guestDownloadResult = permissions.checkServerAccess(serverDefinition, guestDownloadRequest);
    console.log(`游客下载权限: ${guestDownloadResult.allowed ? '允许' : '拒绝'}`);
    if (!guestDownloadResult.allowed) {
      console.log(`原因: ${guestDownloadResult.reason}`);
    }
    
    // 2.3 已登录用户 - 下载权限
    const userDownloadRequest = {
      userId: 'user-123',
      role: UserRole.USER,
      action: AccessAction.DOWNLOAD,
      targetServer: 'example-server'
    };
    
    const userDownloadResult = permissions.checkServerAccess(serverDefinition, userDownloadRequest);
    console.log(`已登录用户下载权限: ${userDownloadResult.allowed ? '允许' : '拒绝'}`);
    
    // 2.4 发布者 - 更新权限
    const publisherUpdateRequest = {
      userId: 'publisher-456',
      role: UserRole.PUBLISHER,
      action: AccessAction.UPDATE,
      targetServer: 'example-server'
    };
    
    const publisherUpdateResult = permissions.checkServerAccess(serverDefinition, publisherUpdateRequest);
    console.log(`发布者更新权限: ${publisherUpdateResult.allowed ? '允许' : '拒绝'}`);
    
    // 2.5 管理员 - 删除权限
    const adminDeleteRequest = {
      userId: 'admin-789',
      role: UserRole.ADMIN,
      action: AccessAction.DELETE,
      targetServer: 'example-server'
    };
    
    const adminDeleteResult = permissions.checkServerAccess(serverDefinition, adminDeleteRequest);
    console.log(`管理员删除权限: ${adminDeleteResult.allowed ? '允许' : '拒绝'}`);
    
    return {
      guestViewResult,
      guestDownloadResult,
      userDownloadResult,
      publisherUpdateResult,
      adminDeleteResult
    };
  } catch (error) {
    console.error('权限示例出错:', error);
    throw error;
  }
}

// 运行示例
permissionsExample();
