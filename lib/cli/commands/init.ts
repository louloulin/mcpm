import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import inquirer from 'inquirer';
import { getConfig } from '../utils/config';

// 服务器模板类型
enum ServerTemplateType {
  BASIC = 'basic',
  TOOL = 'tool',
  AGENT = 'agent',
  FUNCTION = 'function',
  CUSTOM = 'custom',
}

// 服务器模板
interface ServerTemplate {
  name: string;
  description: string;
  type: ServerTemplateType;
  files: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// 基本模板
const basicTemplate: ServerTemplate = {
  name: 'Basic MCP Server',
  description: '基础MCP服务器模板',
  type: ServerTemplateType.BASIC,
  files: {
    'index.js': `const { createServer } = require('@mcp/server');

// 创建MCP服务器
const server = createServer({
  name: '{{name}}',
  version: '{{version}}',
  description: '{{description}}'
});

// 启动服务器
server.start();

console.log('MCP服务器已启动');`,

    'package.json': `{
  "name": "{{package_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`,

    'README.md': `# {{name}}

{{description}}

## 安装

\`\`\`
npm install
\`\`\`

## 使用

\`\`\`
npm start
\`\`\`
`
  },
  dependencies: {
    '@mcp/server': '^1.0.0'
  }
};

// 工具服务器模板
const toolTemplate: ServerTemplate = {
  name: 'Tool MCP Server',
  description: 'MCP工具服务器模板',
  type: ServerTemplateType.TOOL,
  files: {
    'index.js': `const { createServer } = require('@mcp/server');

// 创建MCP服务器
const server = createServer({
  name: '{{name}}',
  version: '{{version}}',
  description: '{{description}}'
});

// 定义工具
server.tools.create({
  name: 'hello',
  description: '一个简单的问候工具',
  parameters: {
    name: {
      type: 'string',
      description: '要问候的人名',
      required: true
    }
  },
  handler: async ({ name }) => {
    return \`Hello, \${name}!\`;
  }
});

// 启动服务器
server.start();

console.log('MCP工具服务器已启动');`,

    'package.json': `{
  "name": "{{package_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server",
    "tool"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`,

    'README.md': `# {{name}}

{{description}}

## 安装

\`\`\`
npm install
\`\`\`

## 使用

\`\`\`
npm start
\`\`\`

## 工具

### hello

一个简单的问候工具。

参数:
- \`name\`: 要问候的人名 (字符串, 必填)

示例:
\`\`\`
hello("World")
\`\`\`

返回:
\`\`\`
"Hello, World!"
\`\`\`
`
  },
  dependencies: {
    '@mcp/server': '^1.0.0'
  }
};

// 代理服务器模板
const agentTemplate: ServerTemplate = {
  name: 'Agent MCP Server',
  description: 'MCP代理服务器模板',
  type: ServerTemplateType.AGENT,
  files: {
    'index.js': `const { createServer } = require('@mcp/server');

// 创建MCP服务器
const server = createServer({
  name: '{{name}}',
  version: '{{version}}',
  description: '{{description}}'
});

// 定义代理
server.agent.create({
  name: 'assistant',
  description: '一个简单的助手代理',
  handler: async ({ input, context }) => {
    // 简单的回声代理
    return \`您说: "\${input}"\`;
  }
});

// 启动服务器
server.start();

console.log('MCP代理服务器已启动');`,

    'package.json': `{
  "name": "{{package_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server",
    "agent"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`,

    'README.md': `# {{name}}

{{description}}

## 安装

\`\`\`
npm install
\`\`\`

## 使用

\`\`\`
npm start
\`\`\`

## 代理

### assistant

一个简单的助手代理。

输入:
- 任何文本

输出:
- 代理的回复
`
  },
  dependencies: {
    '@mcp/server': '^1.0.0'
  }
};

// 函数服务器模板
const functionTemplate: ServerTemplate = {
  name: 'Function MCP Server',
  description: 'MCP函数服务器模板',
  type: ServerTemplateType.FUNCTION,
  files: {
    'index.js': `const { createServer } = require('@mcp/server');

// 创建MCP服务器
const server = createServer({
  name: '{{name}}',
  version: '{{version}}',
  description: '{{description}}'
});

// 定义函数
server.functions.create({
  name: 'calculate',
  description: '一个简单的计算器函数',
  parameters: {
    operation: {
      type: 'string',
      description: '要执行的操作 (add, subtract, multiply, divide)',
      required: true
    },
    a: {
      type: 'number',
      description: '第一个数字',
      required: true
    },
    b: {
      type: 'number',
      description: '第二个数字',
      required: true
    }
  },
  handler: async ({ operation, a, b }) => {
    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        if (b === 0) {
          throw new Error('除数不能为零');
        }
        return a / b;
      default:
        throw new Error('不支持的操作: ' + operation);
    }
  }
});

// 启动服务器
server.start();

console.log('MCP函数服务器已启动');`,

    'package.json': `{
  "name": "{{package_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server",
    "function"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`,

    'README.md': `# {{name}}

{{description}}

## 安装

\`\`\`
npm install
\`\`\`

## 使用

\`\`\`
npm start
\`\`\`

## 函数

### calculate

一个简单的计算器函数。

参数:
- \`operation\`: 要执行的操作 (add, subtract, multiply, divide) (字符串, 必填)
- \`a\`: 第一个数字 (数字, 必填)
- \`b\`: 第二个数字 (数字, 必填)

示例:
\`\`\`
calculate("add", 1, 2)
\`\`\`

返回:
\`\`\`
3
\`\`\`
`
  },
  dependencies: {
    '@mcp/server': '^1.0.0'
  }
};

// TypeScript模板 (扩展基本模板)
const typescriptTemplate: ServerTemplate = {
  name: 'TypeScript MCP Server',
  description: 'TypeScript MCP服务器模板',
  type: ServerTemplateType.CUSTOM,
  files: {
    'src/index.ts': `import { createServer } from '@mcp/server';

// 创建MCP服务器
const server = createServer({
  name: '{{name}}',
  version: '{{version}}',
  description: '{{description}}'
});

// 启动服务器
server.start();

console.log('MCP服务器已启动');`,

    'package.json': `{
  "name": "{{package_name}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "keywords": [
    "mcp",
    "server",
    "typescript"
  ],
  "author": "{{author}}",
  "license": "MIT"
}`,

    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2018",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}`,

    'README.md': `# {{name}}

{{description}}

## 安装

\`\`\`
npm install
\`\`\`

## 开发

\`\`\`
npm run dev
\`\`\`

## 构建

\`\`\`
npm run build
\`\`\`

## 使用

\`\`\`
npm start
\`\`\`
`
  },
  dependencies: {
    '@mcp/server': '^1.0.0'
  },
  devDependencies: {
    'typescript': '^4.9.5',
    'ts-node': '^10.9.1',
    '@types/node': '^16.18.12'
  }
};

// 所有模板
const templates: Record<ServerTemplateType, ServerTemplate> = {
  [ServerTemplateType.BASIC]: basicTemplate,
  [ServerTemplateType.TOOL]: toolTemplate,
  [ServerTemplateType.AGENT]: agentTemplate,
  [ServerTemplateType.FUNCTION]: functionTemplate,
  [ServerTemplateType.CUSTOM]: typescriptTemplate
};

/**
 * 替换模板中的占位符
 * @param content 模板内容
 * @param replacements 替换值
 */
function replaceTemplatePlaceholders(content: string, replacements: Record<string, string>): string {
  return content.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    return replacements[key] || match;
  });
}

/**
 * 写入文件
 * @param filePath 文件路径
 * @param content 文件内容
 */
function writeFile(filePath: string, content: string): void {
  // 确保目录存在
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  
  // 写入文件
  fs.writeFileSync(filePath, content, 'utf8');
}

/**
 * 创建package.json
 * @param template 模板
 * @param targetDir 目标目录
 * @param replacements 替换值
 */
function createPackageJson(template: ServerTemplate, targetDir: string, replacements: Record<string, string>): void {
  // 读取模板package.json内容
  const packageJsonContent = template.files['package.json'];
  
  // 替换占位符
  const packageJson = JSON.parse(replaceTemplatePlaceholders(packageJsonContent, replacements));
  
  // 添加依赖
  if (template.dependencies) {
    packageJson.dependencies = {
      ...(packageJson.dependencies || {}),
      ...template.dependencies
    };
  }
  
  // 添加开发依赖
  if (template.devDependencies) {
    packageJson.devDependencies = {
      ...(packageJson.devDependencies || {}),
      ...template.devDependencies
    };
  }
  
  // 写入文件
  writeFile(path.join(targetDir, 'package.json'), JSON.stringify(packageJson, null, 2));
}

/**
 * 注册初始化命令
 */
export function initCommand(program: Command): void {
  program
    .command('init')
    .description('初始化一个新的MCP服务器项目')
    .option('-d, --dir <directory>', '项目目录', '.')
    .option('-t, --template <template>', '模板类型')
    .action(async (options) => {
      try {
        const config = getConfig();
        
        // 确定项目目录
        const targetDir = path.resolve(process.cwd(), options.dir);
        
        // 检查目标目录是否存在且不为空
        const isDirEmpty = !fs.existsSync(targetDir) || fs.readdirSync(targetDir).length === 0;
        
        if (!isDirEmpty) {
          const { overwrite } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'overwrite',
              message: `目录 ${options.dir} 不为空，是否继续？`,
              default: false
            }
          ]);
          
          if (!overwrite) {
            console.log(chalk.yellow('初始化已取消'));
            return;
          }
        }
        
        // 创建目录
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // 项目信息收集
        let templateType = options.template;
        let customTemplate = false;
        
        // 如果没有指定模板，提供交互式选择
        if (!templateType) {
          const { template } = await inquirer.prompt([
            {
              type: 'list',
              name: 'template',
              message: '选择模板:',
              choices: [
                { name: '基础服务器 (JavaScript)', value: ServerTemplateType.BASIC },
                { name: '工具服务器 (JavaScript)', value: ServerTemplateType.TOOL },
                { name: '代理服务器 (JavaScript)', value: ServerTemplateType.AGENT },
                { name: '函数服务器 (JavaScript)', value: ServerTemplateType.FUNCTION },
                { name: 'TypeScript服务器', value: ServerTemplateType.CUSTOM }
              ]
            }
          ]);
          
          templateType = template;
        }
        
        if (!(templateType in templates)) {
          console.error(chalk.red(`不支持的模板类型: ${templateType}`));
          return;
        }
        
        // 选择模板
        const template = templates[templateType as ServerTemplateType];
        
        // 收集项目信息
        const { name, version, description, author } = await inquirer.prompt([
          {
            type: 'input',
            name: 'name',
            message: '项目名称:',
            default: path.basename(targetDir),
            validate: (input) => {
              if (!input) {
                return '项目名称不能为空';
              }
              return true;
            }
          },
          {
            type: 'input',
            name: 'version',
            message: '版本:',
            default: '1.0.0'
          },
          {
            type: 'input',
            name: 'description',
            message: '描述:',
            default: `一个MCP${
              templateType === ServerTemplateType.TOOL ? '工具' :
              templateType === ServerTemplateType.AGENT ? '代理' :
              templateType === ServerTemplateType.FUNCTION ? '函数' :
              ''
            }服务器`
          },
          {
            type: 'input',
            name: 'author',
            message: '作者:',
            default: ''
          }
        ]);
        
        // 替换占位符变量
        const replacements = {
          name,
          version,
          description,
          author,
          package_name: name.toLowerCase().replace(/\s+/g, '-')
        };
        
        // 创建文件
        const spinner = ora('正在创建项目...').start();
        
        try {
          // 遍历模板文件
          Object.entries(template.files).forEach(([fileName, content]) => {
            // 跳过package.json(手动创建)
            if (fileName === 'package.json') return;
            
            // 替换占位符并写入文件
            const filePath = path.join(targetDir, fileName);
            const fileContent = replaceTemplatePlaceholders(content, replacements);
            writeFile(filePath, fileContent);
          });
          
          // 创建package.json
          createPackageJson(template, targetDir, replacements);
          
          // 创建.gitignore
          const gitignoreContent = 'node_modules\ndist\n.env\n*.log';
          writeFile(path.join(targetDir, '.gitignore'), gitignoreContent);
          
          spinner.succeed(`项目 ${name} 创建成功`);
          
          // 显示下一步操作
          console.log(chalk.bold('\n下一步:'));
          console.log(`  ${chalk.cyan('cd')} ${options.dir}`);
          console.log(`  ${chalk.cyan('npm')} install`);
          
          if (templateType === ServerTemplateType.CUSTOM) {
            console.log(`  ${chalk.cyan('npm')} run dev`);
          } else {
            console.log(`  ${chalk.cyan('npm')} start`);
          }
          
          console.log(chalk.bold('\n文档:'));
          console.log(`  https://registry.mcpr.io/docs/getting-started`);
        } catch (error: any) {
          spinner.fail('项目创建失败');
          console.error(chalk.red(error.message));
        }
      } catch (error: any) {
        console.error(chalk.red(`初始化失败: ${error.message}`));
      }
    });
} 