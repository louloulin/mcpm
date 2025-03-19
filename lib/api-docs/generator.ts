import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';

/**
 * API文档选项接口
 */
export interface ApiDocOptions {
  inputFiles: string[];
  outputDir: string;
  title: string;
  version: string;
  description?: string;
  basePath?: string;
  typescript?: boolean;
  theme?: 'light' | 'dark' | 'auto';
  templates?: {
    index?: string;
    api?: string;
    method?: string;
  };
}

/**
 * API方法参数
 */
export interface ApiMethodParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: string;
  enum?: string[];
}

/**
 * API方法返回值
 */
export interface ApiMethodResponse {
  status: number;
  description: string;
  type: string;
  example?: any;
}

/**
 * API方法
 */
export interface ApiMethod {
  name: string;
  description: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params: ApiMethodParam[];
  responses: ApiMethodResponse[];
  example?: string;
  deprecated?: boolean;
  since?: string;
  group?: string;
  tags?: string[];
}

/**
 * API接口
 */
export interface ApiInterface {
  name: string;
  description: string;
  methods: ApiMethod[];
  baseUrl?: string;
  version?: string;
  deprecated?: boolean;
  since?: string;
  group?: string;
}

/**
 * API模块
 */
export interface ApiModule {
  name: string;
  description: string;
  interfaces: ApiInterface[];
  submodules?: ApiModule[];
}

/**
 * API文档
 */
export interface ApiDoc {
  title: string;
  version: string;
  description?: string;
  basePath?: string;
  modules: ApiModule[];
}

/**
 * 从JSDoc注释中解析参数信息
 * @param comment JSDoc注释
 */
function parseJSDocParams(comment: string): { params: Record<string, ApiMethodParam>, returns: ApiMethodResponse | null } {
  const params: Record<string, ApiMethodParam> = {};
  let returns: ApiMethodResponse | null = null;
  
  // 提取@param标签
  const paramRegex = /@param\s+(?:{([^}]*)})?\s*(?:\[([^\]]*)\]|(\S+))\s*(.*)/g;
  let match;
  
  while ((match = paramRegex.exec(comment)) !== null) {
    const typeStr = match[1] || 'any';
    const nameWithBrackets = match[2];
    const name = nameWithBrackets || match[3];
    const description = match[4] || '';
    
    // 检查是否为可选参数
    const required = !nameWithBrackets;
    const paramName = name.replace(/[=?]/g, ''); // 移除可选标记
    
    // 检查是否有默认值
    const defaultMatch = description.match(/默认值[:：]\s*(`?)([^`\s]*)(`?)/);
    const defaultValue = defaultMatch ? defaultMatch[2] : undefined;
    
    // 检查是否有枚举值
    const enumMatch = typeStr.match(/(['"])(\w+)(['"])/g);
    const enumValues = enumMatch ? enumMatch.map(v => v.replace(/['"]/g, '')) : undefined;
    
    params[paramName] = {
      name: paramName,
      type: typeStr,
      description,
      required,
      default: defaultValue,
      enum: enumValues
    };
  }
  
  // 提取@returns标签
  const returnsRegex = /@returns?\s+(?:{([^}]*)})?\s*(.*)/;
  const returnsMatch = comment.match(returnsRegex);
  
  if (returnsMatch) {
    returns = {
      status: 200,
      description: returnsMatch[2] || '',
      type: returnsMatch[1] || 'any'
    };
  }
  
  return { params, returns };
}

/**
 * 从源代码解析API信息
 * @param sourceFile TypeScript源文件
 */
function parseApiFromSource(sourceFile: ts.SourceFile): ApiModule {
  const module: ApiModule = {
    name: path.basename(sourceFile.fileName, path.extname(sourceFile.fileName)),
    description: '',
    interfaces: []
  };
  
  // 解析模块级JSDoc注释
  const moduleComment = ts.getLeadingCommentRanges(sourceFile.getFullText(), 0)?.[0];
  if (moduleComment) {
    const comment = sourceFile.getFullText().substring(moduleComment.pos, moduleComment.end);
    
    // 提取模块描述
    const descMatch = comment.match(/@module\s+(.*)/);
    if (descMatch) {
      module.description = descMatch[1];
    } else {
      module.description = comment.replace(/\/\*\*|\*\/|\*/g, '').trim();
    }
  }
  
  // 遍历AST节点
  function visit(node: ts.Node) {
    if (ts.isClassDeclaration(node) && node.name) {
      // 处理类声明
      const interfaceName = node.name.text;
      const interfaceObj: ApiInterface = {
        name: interfaceName,
        description: '',
        methods: []
      };
      
      // 解析类级JSDoc注释
      const classComment = ts.getLeadingCommentRanges(sourceFile.getFullText(), node.pos)?.[0];
      if (classComment) {
        const comment = sourceFile.getFullText().substring(classComment.pos, classComment.end);
        
        // 提取类描述
        const descMatch = comment.match(/@interface\s+(.*)/);
        if (descMatch) {
          interfaceObj.description = descMatch[1];
        } else {
          interfaceObj.description = comment.replace(/\/\*\*|\*\/|\*/g, '').trim();
        }
        
        // 提取API基础URL
        const baseUrlMatch = comment.match(/@baseUrl\s+(.*)/);
        if (baseUrlMatch) {
          interfaceObj.baseUrl = baseUrlMatch[1];
        }
        
        // 提取版本信息
        const versionMatch = comment.match(/@version\s+(.*)/);
        if (versionMatch) {
          interfaceObj.version = versionMatch[1];
        }
        
        // 提取废弃信息
        const deprecatedMatch = comment.match(/@deprecated\s+(.*)/);
        if (deprecatedMatch) {
          interfaceObj.deprecated = true;
        }
        
        // 提取since信息
        const sinceMatch = comment.match(/@since\s+(.*)/);
        if (sinceMatch) {
          interfaceObj.since = sinceMatch[1];
        }
        
        // 提取分组信息
        const groupMatch = comment.match(/@group\s+(.*)/);
        if (groupMatch) {
          interfaceObj.group = groupMatch[1];
        }
      }
      
      // 处理类的方法
      node.members.forEach(member => {
        if (ts.isMethodDeclaration(member) && member.name) {
          const methodName = member.name.getText(sourceFile);
          
          // 检查方法是否为公共方法
          const isPublic = !member.modifiers?.some(m => m.kind === ts.SyntaxKind.PrivateKeyword || m.kind === ts.SyntaxKind.ProtectedKeyword);
          
          if (isPublic) {
            const methodObj: ApiMethod = {
              name: methodName,
              description: '',
              path: '',
              method: 'GET', // 默认值
              params: [],
              responses: []
            };
            
            // 解析方法级JSDoc注释
            const methodComment = ts.getLeadingCommentRanges(sourceFile.getFullText(), member.pos)?.[0];
            if (methodComment) {
              const comment = sourceFile.getFullText().substring(methodComment.pos, methodComment.end);
              
              // 提取方法描述
              const descLines = comment.split('\n')
                .map(line => line.replace(/^\s*\/\*\*|\*\/|\*/g, '').trim())
                .filter(line => !line.startsWith('@'))
                .join(' ')
                .trim();
              
              methodObj.description = descLines;
              
              // 提取HTTP方法和路径
              const pathMatch = comment.match(/@(get|post|put|delete|patch)\s+(.*)/i);
              if (pathMatch) {
                methodObj.method = pathMatch[1].toUpperCase() as any;
                methodObj.path = pathMatch[2];
              }
              
              // 提取参数和返回值
              const { params, returns } = parseJSDocParams(comment);
              
              // 将参数对象转换为数组
              methodObj.params = Object.values(params);
              
              // 添加返回值
              if (returns) {
                methodObj.responses.push(returns);
              }
              
              // 提取示例
              const exampleMatch = comment.match(/@example\s+([\s\S]*?)(?=\s*@|\s*\*\/)/);
              if (exampleMatch) {
                methodObj.example = exampleMatch[1].trim();
              }
              
              // 提取废弃信息
              const deprecatedMatch = comment.match(/@deprecated\s+(.*)/);
              if (deprecatedMatch) {
                methodObj.deprecated = true;
              }
              
              // 提取since信息
              const sinceMatch = comment.match(/@since\s+(.*)/);
              if (sinceMatch) {
                methodObj.since = sinceMatch[1];
              }
              
              // 提取分组信息
              const groupMatch = comment.match(/@group\s+(.*)/);
              if (groupMatch) {
                methodObj.group = groupMatch[1];
              }
              
              // 提取标签信息
              const tagMatches = Array.from(comment.matchAll(/@tag\s+(.*)/g));
              const tags: string[] = [];
              for (const tagMatch of tagMatches) {
                if (tagMatch[1]) {
                  tags.push(tagMatch[1]);
                }
              }
              
              if (tags.length > 0) {
                methodObj.tags = tags;
              }
            }
            
            interfaceObj.methods.push(methodObj);
          }
        }
      });
      
      module.interfaces.push(interfaceObj);
    }
    
    ts.forEachChild(node, visit);
  }
  
  visit(sourceFile);
  
  return module;
}

/**
 * 生成HTML索引页
 * @param doc API文档对象
 * @param outputPath 输出路径
 */
function generateIndexHtml(doc: ApiDoc, outputPath: string): void {
  const content = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${doc.title} - API文档</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>${doc.title}</h1>
        <div class="version">版本 ${doc.version}</div>
      </div>
      <div class="sidebar-content">
        <ul class="nav">
          <li><a href="index.html" class="active">概述</a></li>
          ${doc.modules.map(module => `
            <li>
              <div class="module-name">${module.name}</div>
              <ul>
                ${module.interfaces.map(iface => `
                  <li><a href="${module.name}_${iface.name}.html">${iface.name}</a></li>
                `).join('')}
              </ul>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    <div class="content">
      <div class="content-header">
        <h1>API文档概述</h1>
      </div>
      <div class="content-body">
        <p>${doc.description || '欢迎使用API文档！'}</p>
        
        <h2>基本信息</h2>
        <table class="info-table">
          <tr>
            <th>API版本</th>
            <td>${doc.version}</td>
          </tr>
          ${doc.basePath ? `
          <tr>
            <th>基础路径</th>
            <td>${doc.basePath}</td>
          </tr>
          ` : ''}
        </table>
        
        <h2>模块</h2>
        ${doc.modules.map(module => `
          <div class="module-section">
            <h3>${module.name}</h3>
            <p>${module.description}</p>
            <h4>接口</h4>
            <ul>
              ${module.interfaces.map(iface => `
                <li>
                  <a href="${module.name}_${iface.name}.html">${iface.name}</a>
                  ${iface.deprecated ? '<span class="badge deprecated">已废弃</span>' : ''}
                  <p>${iface.description}</p>
                </li>
              `).join('')}
            </ul>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, content);
}

/**
 * 生成HTML API页面
 * @param module API模块
 * @param iface API接口
 * @param doc API文档对象
 * @param outputPath 输出路径
 */
function generateApiHtml(module: ApiModule, iface: ApiInterface, doc: ApiDoc, outputPath: string): void {
  const content = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${iface.name} - ${doc.title} API文档</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <div class="sidebar">
      <div class="sidebar-header">
        <h1>${doc.title}</h1>
        <div class="version">版本 ${doc.version}</div>
      </div>
      <div class="sidebar-content">
        <ul class="nav">
          <li><a href="index.html">概述</a></li>
          ${doc.modules.map(m => `
            <li>
              <div class="module-name">${m.name}</div>
              <ul>
                ${m.interfaces.map(i => `
                  <li><a href="${m.name}_${i.name}.html" ${i.name === iface.name && m.name === module.name ? 'class="active"' : ''}>${i.name}</a></li>
                `).join('')}
              </ul>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
    <div class="content">
      <div class="content-header">
        <h1>${iface.name}</h1>
        ${iface.deprecated ? '<span class="badge deprecated">已废弃</span>' : ''}
        ${iface.since ? `<span class="badge since">自 ${iface.since}</span>` : ''}
      </div>
      <div class="content-body">
        <p>${iface.description}</p>
        
        <h2>基本信息</h2>
        <table class="info-table">
          <tr>
            <th>模块</th>
            <td>${module.name}</td>
          </tr>
          ${iface.baseUrl ? `
          <tr>
            <th>基础URL</th>
            <td>${iface.baseUrl}</td>
          </tr>
          ` : ''}
          ${iface.version ? `
          <tr>
            <th>版本</th>
            <td>${iface.version}</td>
          </tr>
          ` : ''}
          ${iface.group ? `
          <tr>
            <th>分组</th>
            <td>${iface.group}</td>
          </tr>
          ` : ''}
        </table>
        
        <h2>方法</h2>
        ${iface.methods.map(method => `
          <div class="method-section" id="${method.name}">
            <h3>${method.name}</h3>
            ${method.deprecated ? '<span class="badge deprecated">已废弃</span>' : ''}
            ${method.since ? `<span class="badge since">自 ${method.since}</span>` : ''}
            ${method.tags?.map(tag => `<span class="badge tag">${tag}</span>`).join('') || ''}
            
            <p>${method.description}</p>
            
            ${method.path ? `
            <div class="method-path">
              <span class="method-badge ${method.method.toLowerCase()}">${method.method}</span>
              <code>${method.path}</code>
            </div>
            ` : ''}
            
            ${method.params.length > 0 ? `
            <h4>参数</h4>
            <table class="params-table">
              <thead>
                <tr>
                  <th>名称</th>
                  <th>类型</th>
                  <th>描述</th>
                  <th>必填</th>
                  <th>默认值</th>
                </tr>
              </thead>
              <tbody>
                ${method.params.map(param => `
                <tr>
                  <td>${param.name}</td>
                  <td><code>${param.type}</code></td>
                  <td>${param.description}</td>
                  <td>${param.required ? '是' : '否'}</td>
                  <td>${param.default ? `<code>${param.default}</code>` : '-'}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
            
            ${method.responses.length > 0 ? `
            <h4>响应</h4>
            <table class="response-table">
              <thead>
                <tr>
                  <th>状态码</th>
                  <th>描述</th>
                  <th>类型</th>
                </tr>
              </thead>
              <tbody>
                ${method.responses.map(response => `
                <tr>
                  <td>${response.status}</td>
                  <td>${response.description}</td>
                  <td><code>${response.type}</code></td>
                </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
            
            ${method.example ? `
            <h4>示例</h4>
            <div class="example-block">
              <pre><code>${method.example}</code></pre>
            </div>
            ` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>
  `;
  
  fs.writeFileSync(outputPath, content);
}

/**
 * 生成CSS样式文件
 * @param outputPath 输出路径
 */
function generateCss(outputPath: string): void {
  const content = `
:root {
  --primary-color: #3498db;
  --secondary-color: #2c3e50;
  --background-color: #f5f5f5;
  --text-color: #333;
  --border-color: #ddd;
  --sidebar-width: 280px;
  --header-height: 60px;
  --method-get: #61affe;
  --method-post: #49cc90;
  --method-put: #fca130;
  --method-delete: #f93e3e;
  --method-patch: #50e3c2;
  --badge-deprecated: #f93e3e;
  --badge-since: #44cc11;
  --badge-tag: #9012fe;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-color);
  background-color: var(--background-color);
}

.container {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: var(--sidebar-width);
  background-color: #fff;
  border-right: 1px solid var(--border-color);
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
}

.sidebar-header h1 {
  font-size: 20px;
  color: var(--primary-color);
}

.version {
  font-size: 12px;
  color: #888;
  margin-top: 5px;
}

.sidebar-content {
  padding: 15px 0;
}

.nav {
  list-style: none;
}

.nav li {
  margin-bottom: 5px;
}

.nav a {
  display: block;
  padding: 8px 20px;
  color: var(--text-color);
  text-decoration: none;
  transition: background-color 0.2s;
}

.nav a:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.nav a.active {
  background-color: rgba(0, 0, 0, 0.1);
  color: var(--primary-color);
  font-weight: 500;
}

.module-name {
  padding: 10px 20px;
  font-weight: bold;
  color: var(--secondary-color);
  cursor: default;
}

.nav ul {
  list-style: none;
  margin-left: 10px;
}

.content {
  margin-left: var(--sidebar-width);
  flex: 1;
  padding: 20px;
  max-width: calc(100% - var(--sidebar-width));
}

.content-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid var(--border-color);
}

.content-header h1 {
  font-size: 26px;
  color: var(--secondary-color);
}

.content-body h2 {
  font-size: 20px;
  margin: 25px 0 15px;
}

.content-body h3 {
  font-size: 18px;
  margin: 20px 0 10px;
}

.content-body h4 {
  font-size: 16px;
  margin: 15px 0 10px;
}

.content-body p {
  margin-bottom: 15px;
}

.info-table, .params-table, .response-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.info-table th, .params-table th, .response-table th, 
.info-table td, .params-table td, .response-table td {
  padding: 8px 12px;
  text-align: left;
  border: 1px solid var(--border-color);
}

.info-table th, .params-table th, .response-table th {
  background-color: rgba(0, 0, 0, 0.05);
  font-weight: 500;
}

.method-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: 5px;
}

.method-path {
  margin: 15px 0;
  background-color: rgba(0, 0, 0, 0.05);
  padding: 10px;
  border-radius: 5px;
  display: flex;
  align-items: center;
}

.method-badge {
  padding: 5px 8px;
  border-radius: 3px;
  color: #fff;
  font-weight: bold;
  margin-right: 10px;
  font-size: 12px;
  text-transform: uppercase;
}

.method-badge.get {
  background-color: var(--method-get);
}

.method-badge.post {
  background-color: var(--method-post);
}

.method-badge.put {
  background-color: var(--method-put);
}

.method-badge.delete {
  background-color: var(--method-delete);
}

.method-badge.patch {
  background-color: var(--method-patch);
}

.badge {
  display: inline-block;
  padding: 3px 6px;
  border-radius: 3px;
  font-size: 12px;
  margin-left: 5px;
  color: #fff;
}

.badge.deprecated {
  background-color: var(--badge-deprecated);
}

.badge.since {
  background-color: var(--badge-since);
}

.badge.tag {
  background-color: var(--badge-tag);
}

code {
  font-family: SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace;
  padding: 2px 4px;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
  font-size: 0.9em;
}

.example-block {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  border: 1px solid var(--border-color);
  margin-top: 10px;
}

.example-block pre {
  margin: 0;
  white-space: pre-wrap;
}

.module-section {
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .container {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    position: static;
    height: auto;
  }
  
  .content {
    margin-left: 0;
    max-width: 100%;
  }
}
  `;
  
  fs.writeFileSync(outputPath, content);
}

/**
 * 生成JavaScript文件
 * @param outputPath 输出路径
 */
function generateJs(outputPath: string): void {
  const content = `
document.addEventListener('DOMContentLoaded', function() {
  // 展开/收起侧边栏模块
  const moduleNames = document.querySelectorAll('.module-name');
  
  moduleNames.forEach(module => {
    module.addEventListener('click', () => {
      const moduleContent = module.nextElementSibling;
      if (moduleContent) {
        moduleContent.style.display = moduleContent.style.display === 'none' ? 'block' : 'none';
      }
    });
  });
  
  // 代码高亮
  const codeBlocks = document.querySelectorAll('pre code');
  if (codeBlocks.length > 0) {
    codeBlocks.forEach(block => {
      highlightCode(block);
    });
  }
});

function highlightCode(element) {
  // 简单语法高亮
  let html = element.innerHTML;
  
  // 字符串
  html = html.replace(/(['"'])(?:\\\\.|[^\\\\])*?\\1/g, '<span style="color: #c41a16;">$&</span>');
  
  // 关键字
  const keywords = /\\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await)\\b/g;
  html = html.replace(keywords, '<span style="color: #00a4db;">$&</span>');
  
  // 注释
  html = html.replace(/\\/\\/.*$/gm, '<span style="color: #007400;">$&</span>');
  html = html.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '<span style="color: #007400;">$&</span>');
  
  // 数字
  html = html.replace(/\\b(\\d+(\\.\\d+)?)\\b/g, '<span style="color: #1c00cf;">$&</span>');
  
  element.innerHTML = html;
}
  `;
  
  fs.writeFileSync(outputPath, content);
}

/**
 * 生成API文档
 * @param options API文档选项
 */
export async function generateApiDocs(options: ApiDocOptions): Promise<void> {
  // 创建输出目录
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  
  const doc: ApiDoc = {
    title: options.title,
    version: options.version,
    description: options.description,
    basePath: options.basePath,
    modules: []
  };
  
  // 处理每个输入文件
  for (const file of options.inputFiles) {
    if (!fs.existsSync(file)) {
      console.warn(`警告: 文件 ${file} 不存在，已跳过`);
      continue;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    // 解析TypeScript文件
    if (options.typescript || file.endsWith('.ts')) {
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      const module = parseApiFromSource(sourceFile);
      doc.modules.push(module);
    } else {
      // TODO: 支持解析普通JavaScript文件
      console.warn(`警告: 仅支持TypeScript文件，${file} 被当作TypeScript处理`);
      
      const sourceFile = ts.createSourceFile(
        file,
        content,
        ts.ScriptTarget.Latest,
        true
      );
      
      const module = parseApiFromSource(sourceFile);
      doc.modules.push(module);
    }
  }
  
  // 生成索引页面
  generateIndexHtml(doc, path.join(options.outputDir, 'index.html'));
  
  // 生成CSS和JS文件
  generateCss(path.join(options.outputDir, 'style.css'));
  generateJs(path.join(options.outputDir, 'script.js'));
  
  // 生成每个接口的页面
  for (const module of doc.modules) {
    for (const iface of module.interfaces) {
      const fileName = `${module.name}_${iface.name}.html`;
      generateApiHtml(module, iface, doc, path.join(options.outputDir, fileName));
    }
  }
  
  console.log(`API文档已生成到: ${options.outputDir}`);
} 