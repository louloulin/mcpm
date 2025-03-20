// 解析器定义
// 在实际应用中，这些解析器应该与数据库交互
// 这里使用模拟数据进行演示

// 模拟数据
const mockServers = [
  {
    id: 'server-1',
    key: 'production-server',
    name: 'Production Server',
    description: 'Main production environment',
    version: '1.0.0',
    homepage: 'https://example.com',
    repository: 'https://github.com/example/server',
    license: 'MIT',
    tags: ['production', 'stable'],
    tools: ['text-generation', 'embedding'],
    startCommand: 'npm start',
    downloads: 1245,
    rating: 4.7,
    compatibleClients: ['web', 'mobile'],
    createdAt: '2023-01-15T08:30:00Z',
    updatedAt: '2023-03-20T14:22:15Z'
  },
  {
    id: 'server-2',
    key: 'development-server',
    name: 'Development Server',
    description: 'Development and testing environment',
    version: '0.9.5',
    homepage: 'https://dev.example.com',
    repository: 'https://github.com/example/dev-server',
    license: 'MIT',
    tags: ['development', 'testing'],
    tools: ['text-generation', 'code-generation'],
    startCommand: 'npm run dev',
    downloads: 856,
    rating: 4.2,
    compatibleClients: ['desktop'],
    createdAt: '2023-02-05T10:15:00Z',
    updatedAt: '2023-03-18T09:45:30Z'
  }
];

const mockUsers = [
  {
    id: 'user-1',
    username: 'admin',
    email: 'admin@example.com',
    fullName: 'Admin User',
    bio: 'System administrator',
    avatarUrl: 'https://api.example.com/avatars/admin.jpg',
    role: 'admin',
    createdAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'user-2',
    username: 'developer',
    email: 'dev@example.com',
    fullName: 'Developer User',
    bio: 'Software developer',
    avatarUrl: 'https://api.example.com/avatars/dev.jpg',
    role: 'user',
    createdAt: '2023-01-15T08:30:00Z'
  }
];

// 获取用户的服务器
const getUserServers = (userId: string) => {
  // 这里应该查询数据库获取用户的服务器
  // 这里简单模拟
  if (userId === 'user-1') {
    return [mockServers[0]];
  } else if (userId === 'user-2') {
    return [mockServers[1]];
  }
  return [];
};

// 获取服务器的作者
const getServerAuthor = (serverId: string) => {
  // 这里应该查询数据库获取服务器的作者
  // 这里简单模拟
  if (serverId === 'server-1') {
    return mockUsers[0];
  } else if (serverId === 'server-2') {
    return mockUsers[1];
  }
  return null;
};

// 解析器
export const resolvers = {
  // 查询解析器
  Query: {
    // 服务器查询
    server: (_: any, { key }: { key: string }) => {
      return mockServers.find(server => server.key === key);
    },
    servers: (_: any, { first = 10, filter, sort }: { first: number, filter?: any, sort?: string }) => {
      // 这里应该实现过滤和排序逻辑
      // 这里简单返回所有服务器
      const edges = mockServers.slice(0, first).map(server => ({
        node: server,
        cursor: Buffer.from(`cursor:${server.id}`).toString('base64')
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage: mockServers.length > first,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: mockServers.length
      };
    },
    
    // 用户查询
    user: (_: any, { id }: { id: string }) => {
      return mockUsers.find(user => user.id === id);
    },
    users: (_: any, { first = 10, filter, sort }: { first: number, filter?: any, sort?: string }) => {
      // 这里应该实现过滤和排序逻辑
      // 这里简单返回所有用户
      const edges = mockUsers.slice(0, first).map(user => ({
        node: user,
        cursor: Buffer.from(`cursor:${user.id}`).toString('base64')
      }));
      
      return {
        edges,
        pageInfo: {
          hasNextPage: mockUsers.length > first,
          hasPreviousPage: false,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
        },
        totalCount: mockUsers.length
      };
    },
    me: (_: any, __: any, context: any) => {
      // 在实际应用中，应该从上下文中获取当前用户
      // 这里简单返回第一个用户
      return mockUsers[0];
    },
    
    // 统计查询
    statsOverview: () => {
      // 返回模拟的统计数据
      return {
        servers: {
          total: 128,
          active: 95,
          inactive: 33
        },
        users: {
          total: 3245,
          activeToday: 876,
          activeWeek: 2198,
          activeMonth: 2735
        },
        requests: {
          today: 56789,
          week: 376521,
          month: 1456789,
          avgResponseTime: 87.5
        },
        resources: {
          cpuUsage: 42.3,
          memoryUsage: 68.7,
          storageUsage: 57.1
        },
        timestamp: new Date().toISOString()
      };
    },
    popularServers: (_: any, { limit = 5 }: { period?: string, limit: number }) => {
      // 返回按下载量排序的服务器
      return mockServers
        .sort((a, b) => b.downloads - a.downloads)
        .slice(0, limit);
    },
    
    // 搜索
    searchServers: (_: any, { query, limit = 10 }: { query: string, limit?: number }) => {
      // 这里应该实现搜索逻辑
      // 这里简单模拟包含查询字符串的服务器
      return mockServers
        .filter(server => 
          server.name.toLowerCase().includes(query.toLowerCase()) || 
          server.description?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, limit);
    }
  },
  
  // 对象字段解析器
  Server: {
    author: (server: any) => {
      return getServerAuthor(server.id);
    }
  },
  
  User: {
    servers: (user: any) => {
      return getUserServers(user.id);
    }
  },
  
  // 变更解析器
  Mutation: {
    // 服务器操作
    createServer: (_: any, { input }: { input: any }) => {
      // 这里应该创建新服务器
      // 这里简单返回模拟数据
      const newServer = {
        id: `server-${mockServers.length + 1}`,
        ...input,
        downloads: 0,
        rating: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 在实际应用中，应该将新服务器保存到数据库
      
      return newServer;
    },
    
    updateServer: (_: any, { key, input }: { key: string, input: any }) => {
      // 这里应该更新服务器
      // 这里简单返回找到的服务器与更新合并后的结果
      const server = mockServers.find(s => s.key === key);
      if (!server) {
        throw new Error(`Server with key ${key} not found`);
      }
      
      // 在实际应用中，应该将更新保存到数据库
      
      return {
        ...server,
        ...input,
        updatedAt: new Date().toISOString()
      };
    },
    
    deleteServer: (_: any, { key }: { key: string }) => {
      // 这里应该删除服务器
      // 简单检查服务器是否存在
      const serverIndex = mockServers.findIndex(s => s.key === key);
      if (serverIndex === -1) {
        throw new Error(`Server with key ${key} not found`);
      }
      
      // 在实际应用中，应该从数据库中删除服务器
      
      return true;
    },
    
    // 用户操作
    login: (_: any, { username, password }: { username: string, password: string }) => {
      // 这里应该验证用户凭据
      const user = mockUsers.find(u => u.username === username);
      if (!user || password !== 'securepassword123') { // 示例中使用固定密码
        throw new Error('Invalid username or password');
      }
      
      // 在实际应用中，应该生成JWT令牌
      const token = 'example-token';
      
      return {
        token,
        user,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    },
    
    createUser: (_: any, { input }: { input: any }) => {
      // 这里应该创建新用户
      // 简单返回模拟数据
      const newUser = {
        id: `user-${mockUsers.length + 1}`,
        ...input,
        role: 'user',
        createdAt: new Date().toISOString()
      };
      
      // 在实际应用中，应该将新用户保存到数据库
      
      return newUser;
    },
    
    updateUser: (_: any, { id, input }: { id: string, input: any }) => {
      // 这里应该更新用户
      const user = mockUsers.find(u => u.id === id);
      if (!user) {
        throw new Error(`User with id ${id} not found`);
      }
      
      // 在实际应用中，应该将更新保存到数据库
      
      return {
        ...user,
        ...input
      };
    },
    
    // 令牌操作
    createToken: (_: any, { input }: { input: any }) => {
      // 这里应该创建API令牌
      const { name, expiresIn = 30 * 24 * 60 * 60, scopes } = input;
      
      // 在实际应用中，应该生成令牌并保存到数据库
      
      return {
        id: 'token-1',
        token: `mcpm_api_${Math.random().toString(36).substring(2, 15)}`,
        name,
        scopes,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };
    },
    
    revokeToken: (_: any, { id }: { id: string }) => {
      // 这里应该撤销令牌
      // 在实际应用中，应该从数据库中删除或标记为已撤销
      
      return true;
    }
  }
};

export default resolvers; 