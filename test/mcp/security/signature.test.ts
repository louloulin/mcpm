/**
 * 签名验证模块单元测试
 */

import { expect, describe, it } from 'vitest';
import { 
  generateRSAKeyPair, 
  signServer, 
  verifyServerSignature,
  isSignatureExpired
} from '../../../lib/mcp/security/signature';
import { MCPServerDefinition, MCPServerType, MCPServerStatus, MCPSignature, MCPSignatureAlgorithm } from '../../../lib/mcp/types';

// 创建测试用服务器
function createTestServer(name: string = 'test-server'): MCPServerDefinition {
  return {
    name,
    version: '1.0.0',
    description: '测试用MCP服务器',
    url: 'http://localhost:3000',
    type: MCPServerType.APP,
    status: MCPServerStatus.ACTIVE
  };
}

describe('签名验证模块', () => {
  // 确保先于其他测试执行，成功生成密钥对
  let keyPair: { publicKey: string; privateKey: string };
  
  it('应该生成有效的RSA密钥对', async () => {
    const result = await generateRSAKeyPair(1024); // 使用较短的密钥加快测试速度
    
    expect(result).toBeDefined();
    expect(result.publicKey).toContain('-----BEGIN PUBLIC KEY-----');
    expect(result.privateKey).toContain('-----BEGIN RSA PRIVATE KEY-----');
    expect(result.algorithm).toBe(MCPSignatureAlgorithm.RSA_SHA256);
    expect(result.createdAt).toBeDefined();
    expect(result.expiresAt).toBeDefined();
    
    // 保存密钥对供后续测试使用
    keyPair = {
      publicKey: result.publicKey,
      privateKey: result.privateKey
    };
  });
  
  it('应该对服务器定义进行签名', async () => {
    const server = createTestServer();
    const { privateKey } = keyPair;
    
    const signedServer = signServer(
      server,
      privateKey,
      MCPSignatureAlgorithm.RSA_SHA256,
      'test-signer'
    );
    
    expect(signedServer).toBeDefined();
    expect(signedServer.security).toBeDefined();
    expect(signedServer.security?.signature).toBeDefined();
    expect(signedServer.security?.signature?.algorithm).toBe(MCPSignatureAlgorithm.RSA_SHA256);
    expect(signedServer.security?.signature?.value).toBeDefined();
    expect(signedServer.security?.signature?.signer).toBe('test-signer');
    expect(signedServer.security?.signature?.timestamp).toBeDefined();
  });
  
  it('应该验证有效的签名', async () => {
    const server = createTestServer();
    const { publicKey, privateKey } = keyPair;
    
    const signedServer = signServer(server, privateKey);
    const result = verifyServerSignature(signedServer, publicKey);
    
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.metadata?.algorithm).toBe(MCPSignatureAlgorithm.RSA_SHA256);
  });
  
  it('应该检测到服务器定义被篡改', async () => {
    const server = createTestServer('tampered-server');
    const { publicKey, privateKey } = keyPair;
    
    const signedServer = signServer(server, privateKey);
    
    // 篡改服务器版本
    signedServer.version = '1.0.1';
    
    const result = verifyServerSignature(signedServer, publicKey);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it('应该检测到无效的签名', async () => {
    const server = createTestServer('invalid-signature-server');
    const { publicKey } = keyPair;
    
    // 创建一个带有无效签名的服务器
    const invalidServer: MCPServerDefinition = {
      ...server,
      security: {
        signature: {
          algorithm: MCPSignatureAlgorithm.RSA_SHA256,
          value: 'invalid-signature-value',
          timestamp: new Date().toISOString()
        }
      }
    };
    
    const result = verifyServerSignature(invalidServer, publicKey);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
  
  it('应该处理缺少签名的情况', async () => {
    const server = createTestServer();
    const { publicKey } = keyPair;
    
    const result = verifyServerSignature(server, publicKey);
    
    expect(result.valid).toBe(false);
    expect(result.error).toContain('没有签名');
  });
  
  it('应该检测到签名已过期', () => {
    const expiredDate = new Date();
    expiredDate.setFullYear(expiredDate.getFullYear() - 1); // 设置为1年前
    
    const expiredSignature: MCPSignature = {
      algorithm: MCPSignatureAlgorithm.RSA_SHA256,
      value: 'test-signature',
      timestamp: new Date().toISOString(),
      expiresAt: expiredDate.toISOString()
    };
    
    const result = isSignatureExpired(expiredSignature);
    
    expect(result).toBe(true);
  });
  
  it('应该识别有效期内的签名', () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1); // 设置为1年后
    
    const validSignature: MCPSignature = {
      algorithm: MCPSignatureAlgorithm.RSA_SHA256,
      value: 'test-signature',
      timestamp: new Date().toISOString(),
      expiresAt: futureDate.toISOString()
    };
    
    const result = isSignatureExpired(validSignature);
    
    expect(result).toBe(false);
  });
  
  it('应该处理没有过期时间的签名', () => {
    const noExpirySignature: MCPSignature = {
      algorithm: MCPSignatureAlgorithm.RSA_SHA256,
      value: 'test-signature',
      timestamp: new Date().toISOString()
    };
    
    const result = isSignatureExpired(noExpirySignature);
    
    expect(result).toBe(false); // 没有过期时间视为永不过期
  });
}); 