import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import * as child_process from 'child_process';
import axios from 'axios';

/**
 * 服务器信息接口
 */
export interface ServerInfo {
  id: string;
  key: string;
  name: string;
  version: string;
  description?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  tools?: Array<{
    name: string;
    description?: string;
    parameters?: Array<{
      name: string;
      type: string;
      description?: string;
      required: boolean;
    }>;
  }>;
}

/**
 * 获取已安装的服务器列表
 */
export function getInstalledServers(installPath: string): any[] {
  if (!fs.existsSync(installPath)) {
    return [];
  }

  // 读取所有子目录
  const serverDirs = fs.readdirSync(installPath, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  const servers: any[] = [];

  // 遍历每个服务器目录
  for (const serverKey of serverDirs) {
    const serverPath = path.join(installPath, serverKey);
    const metadataPath = path.join(serverPath, 'metadata.json');

    // 检查服务器元数据是否存在
    if (fs.existsSync(metadataPath)) {
      try {
        // 读取元数据
        const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
        servers.push(metadata);
      } catch (error) {
        console.warn(`无法读取服务器 ${serverKey} 的元数据`);
      }
    }
  }

  return servers;
}

/**
 * 安装服务器
 */
export async function installServer(server: any, installPath: string): Promise<void> {
  // 创建服务器目录
  const serverPath = path.join(installPath, server.key);
  
  // 如果目录已存在，先删除
  if (fs.existsSync(serverPath)) {
    fs.rmSync(serverPath, { recursive: true, force: true });
  }
  
  // 创建目录
  fs.mkdirSync(serverPath, { recursive: true });
  
  // 保存元数据
  fs.writeFileSync(
    path.join(serverPath, 'metadata.json'),
    JSON.stringify(server, null, 2)
  );
  
  // 下载服务器程序（如果有URL）
  if (server.downloadUrl) {
    try {
      const response = await axios.get(server.downloadUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(path.join(serverPath, server.filename || 'server.zip'), response.data);
    } catch (error) {
      throw new Error(`下载服务器程序失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  // 生成启动脚本
  if (server.command) {
    generateStartupScript(server, serverPath);
  }
}

/**
 * 卸载服务器
 */
export function uninstallServer(serverKey: string, installPath: string): void {
  const serverPath = path.join(installPath, serverKey);
  
  // 检查服务器是否存在
  if (!fs.existsSync(serverPath)) {
    return;
  }
  
  // 删除服务器目录
  fs.rmSync(serverPath, { recursive: true, force: true });
}

/**
 * 启动服务器
 */
export async function startServer(serverKey: string, installPath: string): Promise<child_process.ChildProcess> {
  const serverPath = path.join(installPath, serverKey);
  const metadataPath = path.join(serverPath, 'metadata.json');
  
  // 检查服务器是否存在
  if (!fs.existsSync(metadataPath)) {
    throw new Error(`服务器 ${serverKey} 未安装`);
  }
  
  // 读取元数据
  const server = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  
  // 检查必要字段
  if (!server.command) {
    throw new Error(`服务器 ${serverKey} 没有指定启动命令`);
  }
  
  // 生成环境变量
  const env = { ...process.env, ...server.env };
  
  // 启动服务器
  const child = child_process.spawn(
    server.command,
    server.args || [],
    {
      cwd: serverPath,
      env,
      stdio: 'inherit',
      shell: true
    }
  );
  
  return child;
}

/**
 * 生成启动脚本
 */
function generateStartupScript(server: any, serverPath: string): void {
  const isWindows = process.platform === 'win32';
  const scriptName = isWindows ? 'start.bat' : 'start.sh';
  const scriptPath = path.join(serverPath, scriptName);
  
  let scriptContent = '';
  
  if (isWindows) {
    // Windows批处理文件
    scriptContent = '@echo off\n\n';
    
    // 环境变量
    if (server.env) {
      Object.entries(server.env).forEach(([key, value]) => {
        scriptContent += `SET ${key}=${value || ''}\n`;
      });
      scriptContent += '\n';
    }
    
    // 命令
    scriptContent += `${server.command} ${server.args ? server.args.join(' ') : ''}\n`;
    scriptContent += 'pause\n';
  } else {
    // Unix Shell脚本
    scriptContent = '#!/bin/bash\n\n';
    
    // 环境变量
    if (server.env) {
      Object.entries(server.env).forEach(([key, value]) => {
        scriptContent += `export ${key}="${value || ''}"\n`;
      });
      scriptContent += '\n';
    }
    
    // 命令
    scriptContent += `${server.command} ${server.args ? server.args.join(' ') : ''}\n`;
  }
  
  // 写入文件
  fs.writeFileSync(scriptPath, scriptContent);
  
  // 设置可执行权限（仅Unix）
  if (!isWindows) {
    fs.chmodSync(scriptPath, '755');
  }
} 