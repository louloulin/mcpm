import { describe, it, expect } from 'vitest';
import { 
  resolveDependencies,
  sortDependencies,
  buildDependencyTree,
  DependencyConflictType
} from '../../../lib/mcp/version/dependency';
import { MCPServerDefinition, MCPServerType, MCPServerStatus } from '../../../lib/mcp/types';

// 测试用的服务器定义
const createServer = (
  name: string, 
  version: string, 
  dependencies?: Record<string, string>
): MCPServerDefinition => ({
  name,
  version,
  description: `${name} server`,
  url: `http://example.com/${name}`,
  type: MCPServerType.APP,
  status: MCPServerStatus.ACTIVE,
  dependencies
});

describe('依赖管理工具', () => {
  describe('resolveDependencies', () => {
    it('应该正确处理没有依赖的服务器', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0')
      };
      
      const conflicts = resolveDependencies('server-a', servers);
      expect(conflicts).toEqual([]);
    });
    
    it('应该检测缺失的依赖', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '1.0.0'
        })
      };
      
      const conflicts = resolveDependencies('server-a', servers);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe(DependencyConflictType.MISSING);
      expect(conflicts[0].path).toContain('server-a');
      expect(conflicts[0].path).toContain('server-b');
    });
    
    it('应该检测版本不匹配的依赖', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^2.0.0'
        }),
        'server-b': createServer('server-b', '1.5.0')
      };
      
      const conflicts = resolveDependencies('server-a', servers);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe(DependencyConflictType.VERSION_MISMATCH);
      expect(conflicts[0].path).toContain('server-a');
      expect(conflicts[0].path).toContain('server-b');
      expect(conflicts[0].expected).toBe('^2.0.0');
      expect(conflicts[0].actual).toBe('1.5.0');
    });
    
    it('应该检测循环依赖', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^1.0.0'
        }),
        'server-b': createServer('server-b', '1.0.0', {
          'server-a': '^1.0.0'
        })
      };
      
      const conflicts = resolveDependencies('server-a', servers);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe(DependencyConflictType.CIRCULAR);
      expect(conflicts[0].path).toEqual(expect.arrayContaining(['server-a', 'server-b', 'server-a']));
    });
    
    it('应该递归检测依赖冲突', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^1.0.0'
        }),
        'server-b': createServer('server-b', '1.0.0', {
          'server-c': '^2.0.0'
        }),
        'server-c': createServer('server-c', '1.0.0')
      };
      
      const conflicts = resolveDependencies('server-a', servers);
      expect(conflicts.length).toBe(1);
      expect(conflicts[0].type).toBe(DependencyConflictType.VERSION_MISMATCH);
      expect(conflicts[0].path).toEqual(expect.arrayContaining(['server-a', 'server-b', 'server-c']));
    });
  });
  
  describe('sortDependencies', () => {
    it('应该按依赖关系对服务器排序', () => {
      const servers = [
        createServer('server-a', '1.0.0', { 'server-b': '^1.0.0', 'server-c': '^1.0.0' }),
        createServer('server-c', '1.0.0', { 'server-d': '^1.0.0' }),
        createServer('server-b', '1.0.0'),
        createServer('server-d', '1.0.0')
      ];
      
      const sorted = sortDependencies(servers);
      
      // 确保依赖在前面
      const serverBIndex = sorted.findIndex(s => s.name === 'server-b');
      const serverCIndex = sorted.findIndex(s => s.name === 'server-c');
      const serverDIndex = sorted.findIndex(s => s.name === 'server-d');
      const serverAIndex = sorted.findIndex(s => s.name === 'server-a');
      
      expect(serverDIndex).toBeLessThan(serverCIndex);
      expect(serverBIndex).toBeLessThan(serverAIndex);
      expect(serverCIndex).toBeLessThan(serverAIndex);
    });
    
    it('应该正确处理没有依赖的服务器', () => {
      const servers = [
        createServer('server-a', '1.0.0'),
        createServer('server-b', '1.0.0')
      ];
      
      const sorted = sortDependencies(servers);
      expect(sorted.length).toBe(2);
    });
  });
  
  describe('buildDependencyTree', () => {
    it('应该构建正确的依赖树', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^1.0.0',
          'server-c': '^1.0.0'
        }),
        'server-b': createServer('server-b', '1.0.0'),
        'server-c': createServer('server-c', '1.0.0', {
          'server-d': '^1.0.0'
        }),
        'server-d': createServer('server-d', '1.0.0')
      };
      
      const tree = buildDependencyTree('server-a', servers);
      
      expect(tree).toBeDefined();
      expect(tree?.name).toBe('server-a');
      expect(tree?.version).toBe('1.0.0');
      expect(tree?.children.length).toBe(2);
      
      const serverB = tree?.children.find(c => c.name === 'server-b');
      expect(serverB).toBeDefined();
      expect(serverB?.children.length).toBe(0);
      
      const serverC = tree?.children.find(c => c.name === 'server-c');
      expect(serverC).toBeDefined();
      expect(serverC?.children.length).toBe(1);
      expect(serverC?.children[0].name).toBe('server-d');
    });
    
    it('应该在树中标记缺失的依赖', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^1.0.0',
          'missing-server': '^1.0.0'
        }),
        'server-b': createServer('server-b', '1.0.0')
      };
      
      const tree = buildDependencyTree('server-a', servers);
      
      const missingServer = tree?.children.find(c => c.name === 'missing-server');
      expect(missingServer).toBeDefined();
      expect(missingServer?.version).toBe('missing');
      expect(missingServer?.versionRange).toBe('^1.0.0');
    });
    
    it('应该处理循环依赖', () => {
      const servers = {
        'server-a': createServer('server-a', '1.0.0', {
          'server-b': '^1.0.0'
        }),
        'server-b': createServer('server-b', '1.0.0', {
          'server-a': '^1.0.0'
        })
      };
      
      const tree = buildDependencyTree('server-a', servers);
      
      const serverB = tree?.children.find(c => c.name === 'server-b');
      expect(serverB).toBeDefined();
      // 循环依赖被截断，不会有子节点
      expect(serverB?.children.length).toBe(0);
    });
  });
}); 