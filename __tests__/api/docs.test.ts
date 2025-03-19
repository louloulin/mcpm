import { createMocks } from 'node-mocks-http';
import fs from 'fs';
import path from 'path';
import docsHandler from '../../pages/api/docs/[...path]';

// 模拟依赖
jest.mock('fs');
jest.mock('path');

describe('API文档服务端点', () => {
  // 重置所有 mock
  beforeEach(() => {
    jest.clearAllMocks();
    
    // 模拟 path.join
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // 模拟 path.resolve
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // 模拟 path.extname
    (path.extname as jest.Mock).mockImplementation((filePath) => {
      const parts = filePath.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });
    
    // 模拟 path.basename
    (path.basename as jest.Mock).mockImplementation((filePath) => {
      const parts = filePath.split('/');
      return parts[parts.length - 1];
    });
    
    // 模拟 fs.existsSync
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 模拟 fs.readFileSync
    (fs.readFileSync as jest.Mock).mockImplementation((filePath) => {
      if (filePath.includes('info.json')) {
        return JSON.stringify({
          id: 'test-server',
          name: 'Test Server',
          version: '1.0.0',
        });
      }
      
      if (filePath.includes('index.html')) {
        return '<html><body>测试文档</body></html>';
      }
      
      if (filePath.includes('style.css')) {
        return 'body { color: red; }';
      }
      
      if (filePath.includes('script.js')) {
        return 'console.log("Hello");';
      }
      
      return 'File content';
    });
  });
  
  test('应该返回400当路径参数无效', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: [],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData())).toEqual({ error: '无效的文档路径' });
  });
  
  test('应该返回404当服务器不存在', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return !filePath.includes('info.json');
    });
    
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['non-existent-server'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: '服务器不存在' });
  });
  
  test('应该返回404当服务器没有API文档', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return !filePath.includes('/docs');
    });
    
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: '该服务器没有API文档' });
  });
  
  test('应该返回404当文档文件不存在', async () => {
    (fs.existsSync as jest.Mock).mockImplementation((filePath) => {
      return !filePath.includes('non-existent.html');
    });
    
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server', 'non-existent.html'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(404);
    expect(JSON.parse(res._getData())).toEqual({ error: '文档文件不存在' });
  });
  
  test('应该返回HTML内容并设置正确的内容类型', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server', 'index.html'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe('<html><body>测试文档</body></html>');
    expect(res._getHeaders()['content-type']).toBe('text/html; charset=utf-8');
  });
  
  test('应该返回CSS内容并设置正确的内容类型', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server', 'style.css'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe('body { color: red; }');
    expect(res._getHeaders()['content-type']).toBe('text/css; charset=utf-8');
  });
  
  test('应该返回JS内容并设置正确的内容类型', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server', 'script.js'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe('console.log("Hello");');
    expect(res._getHeaders()['content-type']).toBe('application/javascript; charset=utf-8');
  });
  
  test('应该默认返回索引页当路径只包含服务器ID', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: {
        path: ['test-server'],
      },
    });
    
    await docsHandler(req, res);
    
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toBe('<html><body>测试文档</body></html>');
    expect(res._getHeaders()['content-type']).toBe('text/html; charset=utf-8');
  });
}); 