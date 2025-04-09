# MCPM 3.0 开发者门户

MCPM 开发者门户是一个Web应用，提供直观的界面来管理MCP服务、测试工具，并查看分析数据。

## 功能特点

- **服务管理**：创建、配置和监控MCP服务
- **工具测试**：在浏览器中直接测试MCP工具
- **分析统计**：查看服务使用情况和性能指标
- **用户管理**：角色管理和权限控制

## 安装和使用

### 作为独立应用运行

```javascript
const { DevPortal } = require('mcpm').v3;

// 创建并配置门户
const portal = new DevPortal({
  port: 8080,
  mcpClient: {
    server: 'http://localhost:3100'
  }
});

// 初始化并启动
await portal.init();
await portal.start();

console.log('开发者门户已启动：http://localhost:8080');
```

### 与现有Express应用集成

```javascript
const express = require('express');
const { DevPortal } = require('mcpm').v3;

const app = express();
const portal = new DevPortal({
  // 不启动独立服务器
  noServer: true,
  apiBasePath: '/dev-portal/api'
});

// 初始化门户
await portal.init();

// 将门户挂载到现有应用
app.use('/dev-portal', portal.app);

// 启动应用
app.listen(3000, () => {
  console.log('应用已启动：http://localhost:3000/dev-portal');
});
```

## 配置选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| port | number | 8080 | 服务器端口 |
| staticDir | string | 内置静态目录 | 静态文件目录路径 |
| enableAuth | boolean | true | 是否启用身份验证 |
| apiBasePath | string | '/api/portal' | API基础路径 |
| mcpClient | Object\|MCPClient | null | MCP客户端实例或配置对象 |
| database | Object | null | 数据库配置 |
| noServer | boolean | false | 不启动独立服务器，用于集成到现有应用 |

## API参考

### 服务器管理

- **init()**: 初始化门户
- **start(port?)**: 启动服务器
- **stop()**: 停止服务器

### 数据管理

- **getService(id)**: 获取服务详情
- **createService(data)**: 创建新服务
- **updateService(id, data)**: 更新服务
- **deleteService(id)**: 删除服务
- **getUser(id)**: 获取用户详情
- **createUser(data)**: 创建新用户

## 自定义和扩展

开发者门户设计为可扩展的平台，您可以自定义以下方面：

### 1. 添加自定义路由

```javascript
const portal = new DevPortal();
await portal.init();

// 添加自定义路由
portal.app.get('/custom-route', (req, res) => {
  res.json({ message: '自定义路由' });
});
```

### 2. 自定义前端主题

创建自定义主题CSS并替换默认静态目录：

```javascript
const portal = new DevPortal({
  staticDir: path.join(__dirname, 'custom-theme')
});
```

### 3. 添加自定义工具视图

修改工具页面以添加特定于工具的UI组件。

## 前端开发

如果您希望修改或扩展前端界面，可以编辑以下文件：

- `public/css/styles.css`: 主样式表
- `public/js/core/*.js`: 核心功能模块
- `public/js/components/*.js`: UI组件
- `public/js/pages/*.js`: 页面定义

## 安全注意事项

默认情况下，开发者门户使用简单的会话认证。对于生产环境，建议：

1. 配置HTTPS
2. 实现更强大的认证机制
3. 添加CSRF防护

示例配置：

```javascript
const portal = new DevPortal({
  security: {
    https: {
      key: fs.readFileSync('key.pem'),
      cert: fs.readFileSync('cert.pem')
    },
    authProvider: customAuthProvider,
    csrfProtection: true
  }
});
```

## 贡献

欢迎对MCPM开发者门户做出贡献！请参阅项目根目录的`CONTRIBUTING.md`文件了解更多信息。 