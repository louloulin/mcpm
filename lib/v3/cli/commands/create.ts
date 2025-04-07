/**
 * MCPM 3.0 创建命令
 * 提供快速创建MCP服务器和客户端的命令
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { spawn } from 'child_process';
import chalk from 'chalk';

// 文件系统Promise API
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);

/**
 * 创建服务器命令选项
 */
export interface CreateServerOptions {
  /**
   * 服务器名称
   */
  name: string;
  
  /**
   * 输出目录
   */
  outputDir: string;
  
  /**
   * 是否使用声明式API
   */
  declarative?: boolean;
  
  /**
   * 是否使用TypeScript
   */
  typescript?: boolean;
  
  /**
   * 是否初始化Git仓库
   */
  git?: boolean;
  
  /**
   * 是否安装依赖
   */
  install?: boolean;
}

/**
 * 创建客户端命令选项
 */
export interface CreateClientOptions {
  /**
   * 客户端名称
   */
  name: string;
  
  /**
   * 输出目录
   */
  outputDir: string;
  
  /**
   * 集成的框架
   */
  framework?: 'langchain' | 'mastra' | 'chainlit' | 'none';
  
  /**
   * 是否使用TypeScript
   */
  typescript?: boolean;
  
  /**
   * 是否初始化Git仓库
   */
  git?: boolean;
  
  /**
   * 是否安装依赖
   */
  install?: boolean;
}

/**
 * 创建MCP服务器
 * @param options 创建选项
 */
export async function createServer(options: CreateServerOptions): Promise<void> {
  const {
    name,
    outputDir,
    declarative = true,
    typescript = true,
    git = false,
    install = true
  } = options;
  
  // 确保输出目录存在
  const serverDir = path.join(outputDir, name);
  await mkdir(serverDir, { recursive: true });
  
  // 创建package.json
  const packageJson = {
    name,
    version: '0.1.0',
    description: `${name} - MCP服务器`,
    main: typescript ? 'dist/index.js' : 'index.js',
    scripts: {
      start: typescript ? 'node dist/index.js' : 'node index.js',
      dev: typescript ? 'ts-node src/index.ts' : 'node index.js',
      build: typescript ? 'tsc' : 'echo "No build step required"',
      test: 'echo "Error: no test specified" && exit 1'
    },
    keywords: ['mcp', 'mcpm', 'server'],
    author: '',
    license: 'MIT',
    dependencies: {
      'express': '^4.18.2',
      'cors': '^2.8.5',
      'body-parser': '^1.20.1',
      'zod': '^3.20.6'
    },
    devDependencies: typescript
      ? {
          '@types/express': '^4.17.17',
          '@types/cors': '^2.8.13',
          '@types/node': '^18.15.0',
          'ts-node': '^10.9.1',
          'typescript': '^4.9.5'
        }
      : {}
  };
  
  await writeFile(
    path.join(serverDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // 创建TypeScript配置（如需要）
  if (typescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'CommonJS',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    await writeFile(
      path.join(serverDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    // 创建src目录
    await mkdir(path.join(serverDir, 'src'), { recursive: true });
  }
  
  // 创建主文件
  const sourceDir = typescript ? path.join(serverDir, 'src') : serverDir;
  const sourceExt = typescript ? '.ts' : '.js';
  
  // 创建声明式API或传统API的代码
  if (declarative) {
    // 创建声明式服务器代码
    const serverCode = `
import { z } from 'zod';
import { defineTool, createServer } from 'mcpm/v3/server';

// 使用Zod定义参数架构
const greetingTool = defineTool({
  name: 'greeting',
  description: '生成个性化的问候消息',
  // 使用Zod定义输入架构
  input: z.object({
    name: z.string().min(1).describe('被问候的人的名字'),
    formal: z.boolean().optional().describe('是否使用正式语气')
  }),
  // 异步处理函数
  handler: async ({ name, formal = false }) => {
    const greeting = formal ? '尊敬的' : '亲爱的';
    return { 
      message: \`\${greeting} \${name}，欢迎使用MCP服务!\` 
    };
  }
});

// 创建服务器
const server = createServer({
  name: '${name}',
  version: '0.1.0',
  description: '示例MCP服务器',
  tools: [greetingTool],
  security: {
    authenticationTypes: ['none'], // 示例服务器不需要认证
    rateLimit: { limit: 100, period: 60 } // 每分钟100次请求
  }
});

// 启动服务器
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
server.start(PORT).then(() => {
  console.log(\`MCP服务器已启动，访问 http://localhost:\${PORT}/api/metadata 查看API文档\`);
});
`;

    await writeFile(path.join(sourceDir, `index${sourceExt}`), serverCode.trim());
  } else {
    // 创建传统API服务器代码
    const serverCode = `
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// 创建Express应用
const app = express();

// 配置中间件
app.use(cors());
app.use(bodyParser.json());

// 定义工具
const tools = [
  {
    name: 'greeting',
    description: '生成个性化的问候消息',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: '被问候的人的名字'
        },
        formal: {
          type: 'boolean',
          description: '是否使用正式语气'
        }
      },
      required: ['name']
    }
  }
];

// 元数据路由
app.get('/api/metadata', (req, res) => {
  res.json({
    name: '${name}',
    version: '0.1.0',
    description: '示例MCP服务器',
    tools,
    endpoint: \`http://\${req.headers.host}/api/tools\`
  });
});

// 工具列表路由
app.get('/api/tools', (req, res) => {
  res.json({ tools });
});

// 工具调用路由
app.post('/api/tools/greeting', (req, res) => {
  const { name, formal = false } = req.body;
  
  if (!name) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameter: name'
    });
  }
  
  const greeting = formal ? '尊敬的' : '亲爱的';
  
  res.json({
    success: true,
    data: {
      message: \`\${greeting} \${name}，欢迎使用MCP服务!\`
    }
  });
});

// 启动服务器
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(\`MCP服务器已启动，访问 http://localhost:\${PORT}/api/metadata 查看API文档\`);
});
`;

    await writeFile(path.join(sourceDir, `index${sourceExt}`), serverCode.trim());
  }
  
  // 创建README.md
  const readmeContent = `
# ${name}

基于MCP协议的服务器，使用MCPM 3.0${declarative ? '声明式' : '传统'}API创建。

## 功能

此服务器提供以下工具:

- **greeting**: 生成个性化的问候消息

## 安装

\`\`\`bash
npm install
${typescript ? 'npm run build' : ''}
\`\`\`

## 启动服务器

\`\`\`bash
npm start
\`\`\`

服务器将在 http://localhost:3000 上运行。

## API

### 元数据

\`\`\`
GET /api/metadata
\`\`\`

### 工具列表

\`\`\`
GET /api/tools
\`\`\`

### 调用greeting工具

\`\`\`
POST /api/tools/greeting
Content-Type: application/json

{
  "name": "张三",
  "formal": false
}
\`\`\`

响应:

\`\`\`json
{
  "success": true,
  "data": {
    "message": "亲爱的 张三，欢迎使用MCP服务!"
  }
}
\`\`\`
`;

  await writeFile(path.join(serverDir, 'README.md'), readmeContent.trim());
  
  // 初始化Git仓库
  if (git) {
    try {
      await runCommand('git', ['init'], { cwd: serverDir });
      await writeFile(path.join(serverDir, '.gitignore'), 'node_modules\ndist\n.env\n');
    } catch (error) {
      console.warn(chalk.yellow('警告：无法初始化Git仓库'), error);
    }
  }
  
  // 安装依赖
  if (install) {
    try {
      console.log(chalk.blue('正在安装依赖...'));
      await runCommand('npm', ['install'], { cwd: serverDir });
    } catch (error) {
      console.warn(chalk.yellow('警告：无法安装依赖'), error);
      console.log(chalk.blue('请手动运行: cd ' + serverDir + ' && npm install'));
    }
  }
  
  console.log(chalk.green(`✅ MCP服务器"${name}"创建成功!`));
  console.log(chalk.blue(`目录: ${serverDir}`));
  console.log(chalk.blue('启动命令: cd ' + serverDir + ' && ' + (install ? 'npm start' : 'npm install && npm start')));
}

/**
 * 创建MCP客户端
 * @param options 创建选项
 */
export async function createClient(options: CreateClientOptions): Promise<void> {
  const {
    name,
    outputDir,
    framework = 'none',
    typescript = true,
    git = false,
    install = true
  } = options;
  
  // 确保输出目录存在
  const clientDir = path.join(outputDir, name);
  await mkdir(clientDir, { recursive: true });
  
  // 创建package.json
  const packageJson: any = {
    name,
    version: '0.1.0',
    description: `${name} - MCP客户端`,
    main: typescript ? 'dist/index.js' : 'index.js',
    scripts: {
      start: typescript ? 'node dist/index.js' : 'node index.js',
      dev: typescript ? 'ts-node src/index.ts' : 'node index.js',
      build: typescript ? 'tsc' : 'echo "No build step required"',
      test: 'echo "Error: no test specified" && exit 1'
    },
    keywords: ['mcp', 'mcpm', 'client'],
    author: '',
    license: 'MIT',
    dependencies: {
      'mcpm': '^3.0.0'
    },
    devDependencies: typescript
      ? {
          '@types/node': '^18.15.0',
          'ts-node': '^10.9.1',
          'typescript': '^4.9.5'
        }
      : {}
  };
  
  // 添加框架特定依赖
  if (framework === 'langchain') {
    packageJson.dependencies.langchain = '^0.0.150';
  } else if (framework === 'mastra') {
    packageJson.dependencies['@mastra/core'] = '^0.27.0';
  } else if (framework === 'chainlit') {
    packageJson.dependencies.chainlit = '^0.7.0';
  }
  
  await writeFile(
    path.join(clientDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  
  // 创建TypeScript配置（如需要）
  if (typescript) {
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'CommonJS',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };
    
    await writeFile(
      path.join(clientDir, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );
    
    // 创建src目录
    await mkdir(path.join(clientDir, 'src'), { recursive: true });
  }
  
  // 创建主文件
  const sourceDir = typescript ? path.join(clientDir, 'src') : clientDir;
  const sourceExt = typescript ? '.ts' : '.js';
  
  // 根据不同框架创建不同的代码
  let clientCode = '';
  
  if (framework === 'none') {
    // 基本客户端代码
    clientCode = `
import { MCPClient } from 'mcpm/v3/client';

// 创建MCP客户端
const client = new MCPClient({
  registry: 'http://localhost:3000', // 假设服务器在本地3000端口运行
  autoDiscovery: true
});

async function main() {
  try {
    // 调用greeting工具
    const result = await client.tools.example.greeting({
      name: '张三',
      formal: true
    });
    
    console.log('问候消息:', result.message);
  } catch (error) {
    console.error('调用失败:', error);
  }
}

main();
`;
  } else if (framework === 'langchain') {
    // LangChain集成代码
    clientCode = `
import { MCPClient } from 'mcpm/v3/client';
import { Tool } from 'langchain/tools';

// 创建MCP客户端
const mcpClient = new MCPClient({
  registry: 'http://localhost:3000', // 假设服务器在本地3000端口运行
  autoDiscovery: true
});

// 创建LangChain工具包装器
class MCPGreetingTool extends Tool {
  name = 'greeting';
  description = '生成个性化的问候消息';
  
  async _call(input: string): Promise<string> {
    try {
      // 解析输入
      const inputObj = JSON.parse(input);
      
      // 调用MCP工具
      const result = await mcpClient.tools.example.greeting(inputObj);
      
      return result.message;
    } catch (error) {
      return \`工具调用错误: \${error}\`;
    }
  }
}

// 示例用法
async function main() {
  const greetingTool = new MCPGreetingTool();
  
  const result = await greetingTool.call(JSON.stringify({
    name: '张三',
    formal: true
  }));
  
  console.log('问候消息:', result);
}

main();
`;
  } else if (framework === 'mastra') {
    // Mastra集成代码
    clientCode = `
import { MCPClient } from 'mcpm/v3/client';
import { ClientOptions, UserMessage, Tool } from '@mastra/core';

// 创建MCP客户端
const mcpClient = new MCPClient({
  registry: 'http://localhost:3000', // 假设服务器在本地3000端口运行
  autoDiscovery: true
});

// 创建Mastra工具
const greetingTool: Tool = {
  name: 'greeting',
  description: '生成个性化的问候消息',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: '被问候的人的名字'
      },
      formal: {
        type: 'boolean',
        description: '是否使用正式语气'
      }
    },
    required: ['name']
  },
  execute: async (params) => {
    const result = await mcpClient.tools.example.greeting(params);
    return result.message;
  }
};

// 示例用法
async function main() {
  const result = await greetingTool.execute({
    name: '张三',
    formal: true
  });
  
  console.log('问候消息:', result);
}

main();
`;
  } else if (framework === 'chainlit') {
    // Chainlit集成代码
    clientCode = `
import chainlit as cl
from mcpm.v3.client import MCPClient

# 创建MCP客户端
client = MCPClient(
    registry="http://localhost:3000",  # 假设服务器在本地3000端口运行
    auto_discovery=True
)

@cl.on_message
async def main(message: cl.Message):
    # 从消息中提取名称
    name = message.content.strip()
    
    try:
        # 调用greeting工具
        result = await client.tools.example.greeting({
            "name": name,
            "formal": True
        })
        
        # 回复问候消息
        await cl.Message(
            content=result["message"],
        ).send()
    except Exception as e:
        await cl.Message(
            content=f"发生错误: {str(e)}",
        ).send()

@cl.on_chat_start
async def start():
    await cl.Message(content="欢迎使用MCP问候服务! 请输入您的名字获取个性化问候。").send()
`;
    
    // 为Chainlit创建特定的配置文件
    await writeFile(
      path.join(clientDir, 'chainlit.md'),
      `# MCP Greeting Client\n\n使用Chainlit和MCP集成的问候服务客户端。`
    );
  }
  
  await writeFile(path.join(sourceDir, `index${sourceExt}`), clientCode.trim());
  
  // 创建README.md
  const readmeContent = `
# ${name}

基于MCP协议的客户端，使用MCPM 3.0 API创建。${framework !== 'none' ? `集成了${framework}框架。` : ''}

## 安装

\`\`\`bash
npm install
${typescript ? 'npm run build' : ''}
\`\`\`

## 运行

\`\`\`bash
npm start
\`\`\`

## 功能

此客户端演示了如何连接到MCP服务器并调用greeting工具。

${framework === 'chainlit' ? '使用Chainlit运行: `chainlit run src/index.ts`' : ''}
`;

  await writeFile(path.join(clientDir, 'README.md'), readmeContent.trim());
  
  // 初始化Git仓库
  if (git) {
    try {
      await runCommand('git', ['init'], { cwd: clientDir });
      await writeFile(path.join(clientDir, '.gitignore'), 'node_modules\ndist\n.env\n');
    } catch (error) {
      console.warn(chalk.yellow('警告：无法初始化Git仓库'), error);
    }
  }
  
  // 安装依赖
  if (install) {
    try {
      console.log(chalk.blue('正在安装依赖...'));
      await runCommand('npm', ['install'], { cwd: clientDir });
    } catch (error) {
      console.warn(chalk.yellow('警告：无法安装依赖'), error);
      console.log(chalk.blue('请手动运行: cd ' + clientDir + ' && npm install'));
    }
  }
  
  console.log(chalk.green(`✅ MCP客户端"${name}"创建成功!`));
  console.log(chalk.blue(`目录: ${clientDir}`));
  console.log(chalk.blue('运行命令: cd ' + clientDir + ' && ' + (install ? 'npm start' : 'npm install && npm start')));
}

/**
 * 运行命令
 * @param command 命令
 * @param args 参数
 * @param options 选项
 * @returns Promise
 */
function runCommand(command: string, args: string[], options: any): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      stdio: 'inherit'
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`命令 ${command} ${args.join(' ')} 失败，退出码 ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
} 