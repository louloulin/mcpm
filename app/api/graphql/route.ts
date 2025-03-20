import { NextRequest, NextResponse } from 'next/server';
import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import typeDefs from './schema';
import resolvers from './resolvers';

// 创建Apollo Server实例
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// 创建Next.js路由处理程序
const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => {
    // 提取并验证授权头
    const authorization = req.headers.get('authorization');
    
    // 在实际应用中，应该验证令牌并获取用户信息
    // 这里简单返回模拟上下文
    return {
      isAuthenticated: !!authorization,
      userId: authorization ? 'user-1' : null
    };
  },
});

// GraphQL API路由处理程序
export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

// 测试路由
export async function HEAD() {
  return NextResponse.json(
    { status: 'GraphQL API is running' },
    { status: 200 }
  );
} 