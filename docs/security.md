# MCP服务器安全机制文档

本文档描述了MCP服务器仓库中实现的安全机制，包括服务器签名验证、权限控制系统和漏洞扫描功能。

## 1. 服务器签名验证

服务器签名验证机制确保MCP服务器的来源可信，防止未经授权的修改。

### 主要功能

- **密钥生成**：生成RSA密钥对用于签名和验证
- **服务器签名**：对服务器定义进行数字签名
- **签名验证**：验证服务器定义的签名是否有效
- **签名过期检查**：检查签名是否已过期

### 使用示例

```typescript
import { signature } from '../lib/mcp/security';

// 生成密钥对
const keyPair = await signature.generateRSAKeyPair();

// 对服务器定义进行签名
const signedServer = signature.signServer(
  serverDefinition,
  keyPair.privateKey,
  MCPSignatureAlgorithm.RSA_SHA256,
  'publisher-name'
);

// 验证服务器签名
const result = signature.verifyServerSignature(signedServer, keyPair.publicKey);
if (result.valid) {
  console.log('服务器签名有效');
} else {
  console.log('服务器签名无效:', result.error);
}

// 检查签名是否过期
if (signature.isSignatureExpired(signedServer.security.signature)) {
  console.log('服务器签名已过期');
}
```

## 2. 权限控制系统

权限控制系统实现了对MCP服务器访问的细粒度控制，确保不同角色的用户只能执行授权的操作。

### 用户角色

- **游客(GUEST)**：未登录用户，仅有查看权限
- **用户(USER)**：已登录用户，可以查看和下载服务器
- **发布者(PUBLISHER)**：可以发布和更新服务器
- **管理员(ADMIN)**：拥有所有权限，包括删除服务器

### 操作类型

- **查看(VIEW)**：查看服务器信息
- **下载(DOWNLOAD)**：下载服务器
- **发布(PUBLISH)**：发布新服务器
- **更新(UPDATE)**：更新现有服务器
- **删除(DELETE)**：删除服务器
- **管理(ADMIN)**：执行管理操作

### 使用示例

```typescript
import { permissions } from '../lib/mcp/security';
import { UserRole, AccessAction } from '../lib/mcp/security/permissions';

// 创建访问请求
const accessRequest = {
  userId: 'user-123',
  role: UserRole.PUBLISHER,
  action: AccessAction.UPDATE,
  targetServer: 'server-456',
  environment: 'production'
};

// 检查访问权限
const result = permissions.checkServerAccess(serverDefinition, accessRequest);
if (result.allowed) {
  console.log('操作允许执行');
} else {
  console.log('操作被拒绝:', result.reason);
}

// 创建默认访问规则
const defaultRules = permissions.createDefaultAccessRules();
```

## 3. 漏洞扫描功能

漏洞扫描功能自动检测MCP服务器定义中的潜在安全漏洞，并提供修复建议。

### 扫描类型

- **缺少认证**：检测未配置认证方式的服务器
- **缺少签名**：检测未签名的服务器
- **不安全配置**：检测配置不当的服务器
- **依赖项漏洞**：检测使用宽松版本范围的依赖项

### 漏洞级别

- **信息(INFO)**：提供信息，不需要立即处理
- **低风险(LOW)**：低风险漏洞，建议处理
- **中风险(MEDIUM)**：中等风险漏洞，推荐处理
- **高风险(HIGH)**：高风险漏洞，需要处理
- **严重(CRITICAL)**：严重漏洞，必须立即处理

### 使用示例

```typescript
import { vulnerability } from '../lib/mcp/security';

// 扫描服务器漏洞
const scanResult = vulnerability.scanServerVulnerabilities(serverDefinition);

// 处理扫描结果
console.log(`服务器 ${scanResult.serverName} 扫描完成`);
console.log(`发现 ${scanResult.summary.total} 个漏洞`);

// 查看高风险漏洞
const highRiskVulns = scanResult.vulnerabilities.filter(
  v => v.level === vulnerability.VulnerabilityLevel.HIGH
);

// 显示漏洞信息
highRiskVulns.forEach(vuln => {
  console.log(`漏洞类型: ${vuln.type}`);
  console.log(`描述: ${vuln.description}`);
  console.log(`建议: ${vuln.recommendation}`);
});
```

## 安全最佳实践

1. **始终对服务器进行签名**：确保每个发布的服务器都经过签名验证。
2. **实施适当的权限控制**：根据用户角色限制访问权限。
3. **定期进行漏洞扫描**：及时发现并修复潜在的安全问题。
4. **固定依赖版本**：避免使用宽松的版本范围，减少引入未知漏洞的风险。
5. **启用身份验证**：要求用户进行身份验证后才能执行敏感操作。

## 安全模块集成

安全模块可以轻松集成到MCP服务器仓库中：

```typescript
import { security } from '../lib/mcp/security';

// 使用签名功能
const { signature } = security;

// 使用权限控制功能
const { permissions } = security;

// 使用漏洞扫描功能
const { vulnerability } = security;
```
