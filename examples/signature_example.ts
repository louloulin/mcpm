import { signature } from '../lib/mcp/security';
import { MCPSignatureAlgorithm, MCPServerDefinition, MCPServerType, MCPServerStatus } from '../lib/mcp/types';

// 示例：签名验证流程
async function signatureExample() {
  try {
    // 1. 生成密钥对
    console.log('生成RSA密钥对...');
    const keyPair = await signature.generateRSAKeyPair();
    console.log('密钥对生成成功');

    // 2. 创建服务器定义
    const serverDefinition: MCPServerDefinition = {
      name: 'example-server',
      version: '1.0.0',
      description: '示例MCP服务器',
      url: 'http://localhost:3000',
      type: MCPServerType.APP,
      status: MCPServerStatus.ACTIVE
    };
    
    // 3. 对服务器定义进行签名
    console.log('对服务器进行签名...');
    const signedServer = signature.signServer(
      serverDefinition,
      keyPair.privateKey,
      MCPSignatureAlgorithm.RSA_SHA256,
      'example-publisher'
    );
    console.log('服务器签名成功');
    
    // 4. 验证服务器签名
    console.log('验证服务器签名...');
    const result = signature.verifyServerSignature(signedServer, keyPair.publicKey);
    if (result.valid) {
      console.log('服务器签名有效');
      console.log('签名者:', result.metadata?.signer);
      console.log('签名时间:', result.metadata?.timestamp);
    } else {
      console.log('服务器签名无效:', result.error);
    }
    
    // 5. 检查签名是否过期
    if (signedServer.security?.signature) {
      const expired = signature.isSignatureExpired(signedServer.security.signature);
      console.log('签名是否过期:', expired ? '已过期' : '未过期');
    }
    
    return { keyPair, signedServer, verificationResult: result };
  } catch (error) {
    console.error('签名示例出错:', error);
    throw error;
  }
}

// 运行示例
signatureExample().catch(console.error);
