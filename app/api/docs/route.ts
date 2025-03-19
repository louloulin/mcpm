import { NextResponse } from 'next/server';

export function GET() {
  // API文档结构
  const documentation = {
    title: "MCPR API 文档",
    version: "1.0.0",
    description: "MCP服务器存储库API接口文档",
    baseUrl: "/api/v1",
    endpoints: [
      {
        path: "/servers",
        methods: ["GET", "POST"],
        description: "服务器列表管理",
        parameters: {
          GET: [
            { name: "limit", type: "number", description: "每页结果数量" },
            { name: "offset", type: "number", description: "结果偏移量" },
            { name: "author_id", type: "string", description: "按作者ID筛选" },
            { name: "tags", type: "string[]", description: "按标签筛选" }
          ]
        }
      },
      {
        path: "/servers/{id}",
        methods: ["GET", "PUT", "DELETE"],
        description: "单个服务器管理",
        parameters: {
          PUT: [
            { name: "name", type: "string", description: "服务器名称" },
            { name: "description", type: "string", description: "服务器描述" },
            { name: "version", type: "string", description: "版本号" }
          ]
        }
      },
      {
        path: "/servers/search",
        methods: ["GET"],
        description: "搜索服务器",
        parameters: {
          GET: [
            { name: "q", type: "string", description: "搜索查询", required: true },
            { name: "limit", type: "number", description: "每页结果数量" },
            { name: "offset", type: "number", description: "结果偏移量" }
          ]
        }
      },
      {
        path: "/users",
        methods: ["GET", "POST"],
        description: "用户管理",
        parameters: {
          GET: [
            { name: "limit", type: "number", description: "每页结果数量" },
            { name: "offset", type: "number", description: "结果偏移量" }
          ]
        }
      },
      {
        path: "/sync",
        methods: ["GET", "POST"],
        description: "同步管理",
        parameters: {
          GET: [
            { name: "limit", type: "number", description: "每页结果数量" },
            { name: "offset", type: "number", description: "结果偏移量" }
          ]
        }
      },
      {
        path: "/stats",
        methods: ["GET"],
        description: "系统统计信息",
        parameters: {}
      },
      {
        path: "/auth/login",
        methods: ["POST"],
        description: "用户登录",
        parameters: {
          POST: [
            { name: "username", type: "string", description: "用户名", required: true },
            { name: "password", type: "string", description: "密码", required: true }
          ]
        }
      },
      {
        path: "/auth/logout",
        methods: ["POST"],
        description: "用户登出",
        parameters: {}
      },
      {
        path: "/auth/me",
        methods: ["GET"],
        description: "获取当前用户信息",
        parameters: {}
      }
    ],
    authentication: {
      type: "JWT",
      description: "使用Bearer令牌进行身份验证",
      cookieName: "token"
    }
  };

  return NextResponse.json(documentation);
} 