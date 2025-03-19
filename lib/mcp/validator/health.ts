/**
 * MCP服务器健康检查模块
 * 用于检查MCP服务器的健康状态
 */

import axios from 'axios';
import { MCPServerDefinition, MCPServerHealth, MCPServerHealthStatus } from '../types';

// 默认健康检查超时时间 (毫秒)
const DEFAULT_TIMEOUT = 5000;

/**
 * 检查MCP服务器健康状态
 * @param server MCP服务器定义
 * @param timeout 超时时间 (毫秒)
 * @returns 健康检查结果
 */
export async function checkMCPServerHealth(
  server: MCPServerDefinition, 
  timeout: number = DEFAULT_TIMEOUT
): Promise<MCPServerHealth> {
  const healthUrl = buildHealthCheckUrl(server.url);
  const startTime = Date.now();
  
  try {
    // 发送健康检查请求
    const response = await axios.get(healthUrl, {
      timeout: timeout,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MCP-Registry-Health-Check'
      }
    });
    
    const latency = Date.now() - startTime;
    
    // 检查响应状态
    if (response.status !== 200) {
      return {
        status: MCPServerHealthStatus.UNHEALTHY,
        message: `服务器响应状态码异常: ${response.status}`,
        timestamp: new Date().toISOString(),
        details: {
          statusCode: response.status,
          latency
        }
      };
    }
    
    // 检查响应内容
    const data = response.data;
    
    // 检查版本是否匹配
    if (data.version && data.version !== server.version) {
      return {
        status: MCPServerHealthStatus.DEGRADED,
        message: `服务器版本不匹配: 预期 ${server.version}, 实际 ${data.version}`,
        timestamp: new Date().toISOString(),
        details: {
          expectedVersion: server.version,
          actualVersion: data.version,
          latency
        }
      };
    }
    
    // 如果服务器声明自己状态不健康
    if (data.status && data.status !== 'healthy') {
      return {
        status: MCPServerHealthStatus.DEGRADED,
        message: `服务器报告状态不健康: ${data.status}`,
        timestamp: new Date().toISOString(),
        details: {
          serverStatus: data.status,
          message: data.message,
          latency
        }
      };
    }
    
    // 检查是否有所需工具可用
    if (Array.isArray(data.tools)) {
      const availableTools = new Set(data.tools);
      
      // 分析服务器是否提供了所有声明的功能
      // 这里可以根据具体需求来判断服务器是否健康
      
      if (availableTools.size === 0) {
        return {
          status: MCPServerHealthStatus.DEGRADED,
          message: '服务器未提供任何工具',
          timestamp: new Date().toISOString(),
          details: {
            latency
          }
        };
      }
    }
    
    // 服务器健康
    return {
      status: MCPServerHealthStatus.HEALTHY,
      message: '服务器运行正常',
      timestamp: new Date().toISOString(),
      details: {
        latency,
        version: data.version,
        tools: data.tools
      }
    };
    
  } catch (err) {
    // 处理请求异常
    let message = '健康检查失败';
    const status = MCPServerHealthStatus.UNHEALTHY;
    
    if (err && typeof err === 'object') {
      // 直接检查err对象上的属性，无需类型转换
      const errObj = err as any;
      
      // 处理常见的Axios错误码
      if (errObj.code === 'ECONNABORTED') {
        message = `健康检查超时 (${timeout}ms)`;
      } else if (errObj.code === 'ENOTFOUND') {
        message = '找不到服务器主机';
      } else if (axios.isAxiosError(err) && err.response) {
        message = `服务器响应错误: ${err.response.status} ${err.response.statusText}`;
      } else if (axios.isAxiosError(err) && err.request) {
        message = `请求未收到响应: ${errObj.message}`;
      } else if (errObj.message) {
        message = `请求错误: ${errObj.message}`;
      } else {
        message = `未知错误: ${JSON.stringify(errObj)}`;
      }
    } else if (err instanceof Error) {
      message = `错误: ${err.message}`;
    } else {
      message = `未知错误: ${String(err)}`;
    }
    
    return {
      status,
      message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 构建健康检查URL
 * @param baseUrl 服务器基础URL
 * @returns 健康检查URL
 */
export function buildHealthCheckUrl(baseUrl: string): string {
  try {
    const url = new URL(baseUrl);
    
    // 规范化路径，确保没有尾部斜杠
    let path = url.pathname;
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    
    // 添加健康检查路径
    url.pathname = path === '' ? '/health' : `${path}/health`;
    
    return url.toString();
  } catch {
    // 如果URL解析失败，直接拼接
    let base = baseUrl;
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }
    return `${base}/health`;
  }
}

/**
 * 分析健康检查结果
 * @param health 健康检查结果
 * @returns 分析结果
 */
export function analyzeHealthCheck(health: MCPServerHealth): string {
  switch (health.status) {
    case MCPServerHealthStatus.HEALTHY:
      return `服务器状态良好。${health.message || ''}`;
    
    case MCPServerHealthStatus.DEGRADED:
      return `服务器状态降级。${health.message || ''}`;
    
    case MCPServerHealthStatus.UNHEALTHY:
      return `服务器不健康。${health.message || ''}`;
    
    case MCPServerHealthStatus.UNKNOWN:
    default:
      return `服务器状态未知。${health.message || ''}`;
  }
}

export default {
  checkMCPServerHealth,
  buildHealthCheckUrl,
  analyzeHealthCheck
}; 