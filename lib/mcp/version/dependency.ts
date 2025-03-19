/**
 * MCP服务器依赖管理模块
 * 用于解析和验证MCP服务器间的依赖关系
 */

import { MCPServerDefinition } from '../types';
import { satisfiesRange } from './semver';

/**
 * 依赖冲突类型
 */
export enum DependencyConflictType {
  // 缺少依赖
  MISSING = 'missing',
  // 版本不匹配
  VERSION_MISMATCH = 'version_mismatch',
  // 循环依赖
  CIRCULAR = 'circular'
}

/**
 * 依赖冲突
 */
export interface DependencyConflict {
  // 依赖关系路径，如 A -> B -> C
  path: string[];
  // 冲突类型
  type: DependencyConflictType;
  // 期望的版本范围
  expected?: string;
  // 实际版本
  actual?: string;
  // 错误消息
  message: string;
}

/**
 * 解析依赖关系
 * @param serverName 服务器名称
 * @param servers 所有可用的服务器定义
 * @param visitedPath 已访问的路径，用于检测循环依赖
 * @returns 依赖冲突数组，如果没有冲突则返回空数组
 */
export function resolveDependencies(
  serverName: string,
  servers: Record<string, MCPServerDefinition>,
  visitedPath: string[] = []
): DependencyConflict[] {
  const conflicts: DependencyConflict[] = [];
  const server = servers[serverName];
  
  // 服务器不存在
  if (!server) {
    if (visitedPath.length > 0) {
      conflicts.push({
        path: [...visitedPath, serverName],
        type: DependencyConflictType.MISSING,
        message: `依赖的服务器不存在: ${serverName}`
      });
    }
    return conflicts;
  }
  
  // 检测循环依赖
  if (visitedPath.includes(serverName)) {
    conflicts.push({
      path: [...visitedPath, serverName],
      type: DependencyConflictType.CIRCULAR,
      message: `检测到循环依赖: ${[...visitedPath, serverName].join(' -> ')}`
    });
    return conflicts;
  }
  
  // 没有依赖关系，直接返回
  if (!server.dependencies || Object.keys(server.dependencies).length === 0) {
    return conflicts;
  }
  
  // 检查每个依赖
  for (const [depName, versionRange] of Object.entries(server.dependencies)) {
    const depServer = servers[depName];
    
    // 依赖的服务器不存在
    if (!depServer) {
      conflicts.push({
        path: [...visitedPath, serverName, depName],
        type: DependencyConflictType.MISSING,
        expected: versionRange,
        message: `依赖的服务器不存在: ${depName}`
      });
      continue;
    }
    
    // 验证版本是否满足要求
    try {
      if (!satisfiesRange(depServer.version, versionRange)) {
        conflicts.push({
          path: [...visitedPath, serverName, depName],
          type: DependencyConflictType.VERSION_MISMATCH,
          expected: versionRange,
          actual: depServer.version,
          message: `依赖版本不匹配: ${depName}@${depServer.version} 不满足 ${versionRange}`
        });
      }
    } catch (err) {
      conflicts.push({
        path: [...visitedPath, serverName, depName],
        type: DependencyConflictType.VERSION_MISMATCH,
        expected: versionRange,
        actual: depServer.version,
        message: `版本范围解析错误: ${err instanceof Error ? err.message : String(err)}`
      });
    }
    
    // 递归检查依赖的依赖
    const subConflicts = resolveDependencies(
      depName,
      servers,
      [...visitedPath, serverName]
    );
    
    conflicts.push(...subConflicts);
  }
  
  return conflicts;
}

/**
 * 排序依赖关系，使被依赖的包排在前面
 * @param servers 服务器定义数组
 * @returns 排序后的服务器数组
 */
export function sortDependencies(servers: MCPServerDefinition[]): MCPServerDefinition[] {
  const result: MCPServerDefinition[] = [];
  const visited = new Set<string>();
  
  function visit(server: MCPServerDefinition) {
    if (visited.has(server.name)) {
      return;
    }
    
    visited.add(server.name);
    
    if (server.dependencies) {
      for (const depName of Object.keys(server.dependencies)) {
        const depServer = servers.find(s => s.name === depName);
        if (depServer) {
          visit(depServer);
        }
      }
    }
    
    result.push(server);
  }
  
  // 确保所有服务器都被访问
  for (const server of servers) {
    visit(server);
  }
  
  return result;
}

/**
 * 构建依赖树
 * @param serverName 根服务器名称
 * @param servers 所有可用的服务器定义
 * @returns 依赖树
 */
export interface DependencyNode {
  name: string;
  version: string;
  versionRange?: string;
  children: DependencyNode[];
}

export function buildDependencyTree(
  serverName: string,
  servers: Record<string, MCPServerDefinition>,
  visitedPath: string[] = []
): DependencyNode | null {
  const server = servers[serverName];
  
  if (!server) {
    return null;
  }
  
  // 避免循环依赖
  if (visitedPath.includes(serverName)) {
    return {
      name: serverName,
      version: server.version,
      children: [],
    };
  }
  
  const children: DependencyNode[] = [];
  
  if (server.dependencies) {
    for (const [depName, versionRange] of Object.entries(server.dependencies)) {
      // 如果依赖形成循环，则跳过添加子节点
      if (visitedPath.includes(depName) || depName === serverName) {
        continue;
      }
      
      const depNode = buildDependencyTree(depName, servers, [...visitedPath, serverName]);
      
      if (depNode) {
        depNode.versionRange = versionRange;
        children.push(depNode);
      } else {
        // 依赖不存在但仍然显示在树中
        children.push({
          name: depName,
          version: 'missing',
          versionRange,
          children: []
        });
      }
    }
  }
  
  return {
    name: serverName,
    version: server.version,
    children
  };
}

export default {
  resolveDependencies,
  sortDependencies,
  buildDependencyTree
}; 