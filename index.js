const { createServer } = require('@mcp/server');

// 创建MCP服务器
const server = createServer({
  name: 'cccx',
  version: '1.0.0',
  description: '一个MCP服务器'
});

// 启动服务器
server.start();

console.log('MCP服务器已启动');