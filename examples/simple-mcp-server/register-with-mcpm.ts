/**
 * 将MCP服务器注册到MCPM系统的示例
 */

import { MCPRegistry } from '../../lib/mcp';
import { textProcessingServer } from './server-definition';
import { signature } from '../../lib/mcp/security';
import { MCPSignatureAlgorithm } from '../../lib/mcp/types';

// 创建MCP注册表实例
const registry = new MCPRegistry();

// 注册MCP服务器的步骤
async function registerServerWithMCPM() {
  try {
    console.log('=== 开始注册MCP服务器到MCPM系统 ===\n');
    
    // 步骤1: 生成RSA密钥对（生产环境中应妥善保存）
    console.log('1. 生成RSA密钥对...');
    const keyPair = await signature.generateRSAKeyPair();
    console.log('   密钥对生成成功!\n');
    
    // 步骤2: 对服务器定义进行签名
    console.log('2. 对服务器定义进行签名...');
    const signedServer = signature.signServer(
      textProcessingServer,
      keyPair.privateKey,
      MCPSignatureAlgorithm.RSA_SHA256,
      'MCPM Team'
    );
    console.log('   服务器签名成功!\n');
    
    // 步骤3: 验证签名有效性（在实际应用中，MCPM系统会执行此步骤）
    console.log('3. 验证服务器签名...');
    const verificationResult = signature.verifyServerSignature(signedServer, keyPair.publicKey);
    
    if (!verificationResult.valid) {
      throw new Error(`签名验证失败: ${verificationResult.error}`);
    }
    
    console.log('   签名验证通过!');
    console.log(`   签名者: ${verificationResult.metadata?.signer}`);
    console.log(`   签名时间: ${verificationResult.metadata?.timestamp}\n`);
    
    // 步骤4: 向MCP注册表注册服务器
    console.log('4. 向MCPM注册表注册服务器...');
    const registrationResult = registry.registerServer(signedServer);
    
    if (!registrationResult) {
      throw new Error('服务器注册失败，可能是验证未通过或存在冲突');
    }
    
    console.log('   服务器注册成功!\n');
    
    // 步骤5: 从注册表中查询服务器信息
    console.log('5. 验证服务器在MCPM中可被发现...');
    const registeredServer = registry.getServer(signedServer.name);
    
    if (!registeredServer) {
      throw new Error('无法从注册表中检索服务器信息');
    }
    
    console.log('   成功从MCPM检索到服务器信息!');
    console.log(`   服务器名称: ${registeredServer.name}`);
    console.log(`   服务器版本: ${registeredServer.version}`);
    console.log(`   服务器URL: ${registeredServer.url}\n`);
    
    // 步骤6: 检查服务器健康状态
    console.log('6. 检查服务器健康状态...');
    const healthStatus = await registry.checkServerHealth(signedServer.name);
    
    console.log(`   健康状态: ${healthStatus.status}`);
    console.log(`   状态信息: ${healthStatus.message || '无'}`);
    console.log(`   检查时间: ${healthStatus.timestamp}\n`);
    
    console.log('=== MCP服务器注册完成 ===');
    
    // 返回注册信息
    return {
      server: registeredServer,
      keyPair,
      healthStatus
    };
  } catch (error) {
    console.error('服务器注册过程中发生错误:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行注册过程
if (require.main === module) {
  registerServerWithMCPM().catch(error => {
    console.error('注册失败:', error);
    process.exit(1);
  });
}

export { registerServerWithMCPM }; 