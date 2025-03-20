# Next.js Pages to App Router Migration

## Overview
我们已成功将项目从 Next.js Pages Router 迁移到 App Router。这次迁移使我们能够利用最新的 Next.js 功能，并改进了应用程序的结构。

## 已迁移的页面

| 旧路径 | 新路径 |
|----------|----------|
| `/pages/index.tsx` | `/app/page.tsx` |
| `/pages/dashboard/index.tsx` | `/app/dashboard/page.tsx` |
| `/pages/profile/index.tsx` | `/app/profile/page.tsx` |
| `/pages/upload.tsx` | `/app/upload/page.tsx` |
| `/pages/documentation/index.tsx` | `/app/docs/page.tsx` |
| `/pages/servers/index.tsx` | `/app/servers/page.tsx` |
| `/pages/servers/[id]/index.tsx` | `/app/servers/[id]/page.tsx` |

## 已迁移的 API 路由

| 旧路径 | 新路径 |
|----------|----------|
| `/pages/api/auth/[...nextauth].ts` | `/app/api/auth/[...nextauth]/route.ts` |
| `/pages/api/docs/[...path].ts` | `/app/api/docs/[...path]/route.ts` |
| `/pages/api/user/downloads.ts` | `/app/api/user/downloads/route.ts` |
| `/pages/api/user/favorites.ts` | `/app/api/user/favorites/route.ts` |
| `/pages/api/user/preferences.ts` | `/app/api/user/preferences/route.ts` |
| `/pages/api/user/recently-viewed.ts` | `/app/api/user/recently-viewed/route.ts` |

## 主要变更

1. 为所有使用客户端功能的组件添加了 `"use client"` 指令 
2. 更新了导入以使用正确的 Next.js 组件（例如 Link）
3. 修改了布局结构以适应 App Router
4. 修复了页脚组件中的服务器渲染问题
5. 更新了动态路由的页面参数处理
6. 删除了 `_app.tsx` 文件，使用 App Router 的 RootLayout 代替
7. 将 API 路由迁移到了 App Router 的 Route Handlers 格式
8. 增强了 API 路由的功能，添加了缺失的方法（如 POST 端点）

## API 路由变更详情

1. **Next.js Route Handlers**：使用新的 Route Handlers 格式替换了旧的 API 路由
2. **HTTP 方法**：明确定义了每个 API 的 GET/POST/PUT/DELETE 方法处理函数
3. **错误处理**：统一了错误响应格式
4. **响应格式**：使用 `NextResponse` 替代直接发送 JSON 响应
5. **参数处理**：更新了动态路由参数的获取方式

## 未来改进

1. 继续优化 API 路由结构，考虑按功能模块重组
2. 为不同的部分实现更细粒度的布局
3. 在适当的地方利用服务器组件等 App Router 功能
4. 实现更完善的元数据以提高 SEO
5. 添加 API 路由的完整测试用例

## 迁移完成时间
迁移完成日期：2024年3月20日 