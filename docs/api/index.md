# MCP API 参考文档

本文档提供了 MCP 云平台所有 API 的详细说明和使用指南。

## API 端点

所有 API 端点都以 `/api/v1` 为基础路径。

### 认证

所有 API 请求都需要在 HTTP 头中包含用户认证信息，使用 Bearer Token 方式：

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 可用 API

以下是当前可用的 API 端点分类：

## 服务器管理

- [服务器 API](./servers.md) - 创建、管理和查询服务器资源
- [服务器部署 API](./deployment.md) - 部署、更新和监控服务器实例
- [服务器监控 API](./monitoring.md) - 获取服务器运行状态和性能指标

## 用户管理

- [用户 API](./users.md) - 用户注册、认证和个人资料管理
- [角色与权限 API](./roles.md) - 管理用户角色和权限

## 集成与扩展

- [Webhooks API](../webhooks.md) - 设置和管理 Webhooks 事件通知
- [工具集成 API](./integrations.md) - 与第三方工具和服务集成

## 数据与存储

- [数据存储 API](./storage.md) - 管理文件和对象存储
- [数据库 API](./database.md) - 数据库操作和管理

## 系统管理

- [系统配置 API](./configuration.md) - 系统级别配置和设置
- [日志 API](./logs.md) - 访问和查询系统日志
- [统计 API](./statistics.md) - 获取系统使用统计信息

## 版本和更新

当前 API 版本：v1

请查看 [API 变更日志](./changelog.md) 了解最近更新和变更。

## 开发工具

- [API 工具包](./tools.md) - SDK 和开发辅助工具
- [API 测试](./testing.md) - 端点测试和调试指南 