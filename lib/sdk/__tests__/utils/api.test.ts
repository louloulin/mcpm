/**
 * API工具函数单元测试
 */

import { makeRequest, buildUrl, get, post, put, del, patch } from '../../api';
import { ApiError } from '../../errors';

// 模拟fetch
global.fetch = jest.fn();

describe('API工具函数', () => {
  beforeEach(() => {
    // 重置mock
    (global.fetch as jest.Mock).mockReset();
  });
  
  describe('buildUrl', () => {
    it('应正确连接基础URL和路径', () => {
      expect(buildUrl('https://api.example.com', '/users')).toBe('https://api.example.com/users');
    });
    
    it('应处理基础URL结尾的斜杠', () => {
      expect(buildUrl('https://api.example.com/', '/users')).toBe('https://api.example.com/users');
    });
    
    it('应处理路径开头缺少斜杠的情况', () => {
      expect(buildUrl('https://api.example.com', 'users')).toBe('https://api.example.com/users');
    });
  });
  
  describe('makeRequest', () => {
    it('成功请求应返回JSON响应', async () => {
      const mockResponse = { data: 'test' };
      
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValueOnce(mockResponse)
      });
      
      const result = await makeRequest('https://api.example.com/test', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
    
    it('成功请求应返回文本响应', async () => {
      const mockResponse = 'text response';
      
      // 模拟返回文本响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('text/plain')
        },
        text: jest.fn().mockResolvedValueOnce(mockResponse)
      });
      
      const result = await makeRequest('https://api.example.com/test', { method: 'GET' });
      expect(result).toEqual(mockResponse);
    });
    
    it('请求失败应抛出ApiError', async () => {
      // 模拟失败响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValueOnce({
          message: 'Resource not found'
        })
      });
      
      await expect(makeRequest('https://api.example.com/test', { method: 'GET' }))
        .rejects.toThrow(ApiError);
    });
    
    it('应在请求失败后重试', async () => {
      // 第一次失败，第二次成功
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          headers: {
            get: jest.fn().mockReturnValue('application/json')
          },
          json: jest.fn().mockResolvedValueOnce({ success: true })
        });
      
      const result = await makeRequest('https://api.example.com/test', { 
        method: 'GET',
        retries: 3
      });
      
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
    
    it('应正确添加Content-Type头', async () => {
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValueOnce({})
      });
      
      await makeRequest('https://api.example.com/test', {
        method: 'POST',
        body: { test: true }
      });
      
      const options = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.body).toBe(JSON.stringify({ test: true }));
    });
    
    it('应保留自定义Content-Type头', async () => {
      // 模拟成功响应
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        headers: {
          get: jest.fn().mockReturnValue('application/json')
        },
        json: jest.fn().mockResolvedValueOnce({})
      });
      
      await makeRequest('https://api.example.com/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/xml'
        },
        body: '<test>true</test>'
      });
      
      const options = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/xml');
    });
  });
  
  describe('HTTP方法快捷函数', () => {
    beforeEach(() => {
      // 模拟makeRequest函数
      jest.spyOn(global, 'makeRequest' as any).mockImplementation(() => Promise.resolve());
    });
    
    afterEach(() => {
      jest.restoreAllMocks();
    });
    
    it('get应使用正确的HTTP方法', async () => {
      const spy = jest.spyOn(global, 'makeRequest' as any).mockResolvedValue({});
      
      await get('https://api.example.com/test');
      
      expect(spy).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'GET',
        headers: undefined
      });
    });
    
    it('post应使用正确的HTTP方法和请求体', async () => {
      const spy = jest.spyOn(global, 'makeRequest' as any).mockResolvedValue({});
      const body = { test: true };
      
      await post('https://api.example.com/test', body);
      
      expect(spy).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'POST',
        body,
        headers: undefined
      });
    });
    
    it('put应使用正确的HTTP方法和请求体', async () => {
      const spy = jest.spyOn(global, 'makeRequest' as any).mockResolvedValue({});
      const body = { test: true };
      
      await put('https://api.example.com/test', body);
      
      expect(spy).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'PUT',
        body,
        headers: undefined
      });
    });
    
    it('del应使用正确的HTTP方法', async () => {
      const spy = jest.spyOn(global, 'makeRequest' as any).mockResolvedValue({});
      
      await del('https://api.example.com/test');
      
      expect(spy).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'DELETE',
        headers: undefined
      });
    });
    
    it('patch应使用正确的HTTP方法和请求体', async () => {
      const spy = jest.spyOn(global, 'makeRequest' as any).mockResolvedValue({});
      const body = { test: true };
      
      await patch('https://api.example.com/test', body);
      
      expect(spy).toHaveBeenCalledWith('https://api.example.com/test', {
        method: 'PATCH',
        body,
        headers: undefined
      });
    });
  });
}); 