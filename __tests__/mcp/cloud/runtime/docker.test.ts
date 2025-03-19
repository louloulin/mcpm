/**
 * Docker容器运行时测试
 */
import { DockerRuntime } from '../../../../lib/mcp/cloud/runtime/docker';
import { ContainerConfig } from '../../../../lib/mcp/cloud/runtime/container';
import { MCPServerDefinition } from '../../../../lib/mcp/types';
import { exec } from 'child_process';
import { promisify } from 'util';

// 将exec转换为Promise版本
const execAsync = promisify(exec);

// 创建测试用的服务器定义
const testServer: MCPServerDefinition = {
  name: 'TestServer',
  version: '1.0.0',
  url: 'http://example.com/test-server',
  type: 'tool' as any,
  status: 'active' as any,
  description: '测试Docker容器服务器'
};

// 创建测试用的容器配置
const testContainerConfig: ContainerConfig = {
  image: 'nginx:latest',
  name: 'mcp-test-container',
  ports: {
    '8080': '80'
  },
  env: {
    NODE_ENV: 'test'
  },
  labels: {
    'test.label': 'true'
  }
};

// 检查Docker是否已安装
const checkDockerInstalled = async (): Promise<boolean> => {
  try {
    await execAsync('docker --version');
    return true;
  } catch (error) {
    return false;
  }
};

describe('DockerRuntime', () => {
  let dockerRuntime: DockerRuntime;
  let isDockerInstalled: boolean;
  let containerId: string | undefined;
  
  // 在所有测试前检查Docker是否安装
  beforeAll(async () => {
    isDockerInstalled = await checkDockerInstalled();
  });
  
  // 在每个测试前创建新的Docker运行时实例
  beforeEach(() => {
    dockerRuntime = new DockerRuntime();
  });
  
  // 在所有测试后清理创建的容器
  afterAll(async () => {
    if (containerId && isDockerInstalled) {
      try {
        await execAsync(`docker stop ${containerId}`);
        await execAsync(`docker rm ${containerId}`);
      } catch (error) {
        // 忽略清理错误
      }
    }
  });
  
  test('应该检测Docker是否已安装', async () => {
    const result = await dockerRuntime.isDockerInstalled();
    expect(result).toBe(isDockerInstalled);
  });
  
  // 以下测试仅在Docker已安装时运行
  (isDockerInstalled ? describe : describe.skip)('Docker操作测试', () => {
    test('应该能够创建Dockerfile', async () => {
      const content = `FROM nginx:latest\nEXPOSE 80\nCMD ["nginx", "-g", "daemon off;"]`;
      const dockerfilePath = await dockerRuntime.generateDockerfile(content);
      
      expect(dockerfilePath).toBeTruthy();
      
      // 检查文件是否存在
      const { stdout } = await execAsync(`cat ${dockerfilePath}`);
      expect(stdout).toBe(content);
    });
    
    test('应该能够创建网络', async () => {
      const networkName = `mcp-test-network-${Date.now()}`;
      const result = await dockerRuntime.createNetwork(networkName);
      
      expect(result).toBe(true);
      
      // 清理网络
      await execAsync(`docker network rm ${networkName}`);
    });
    
    test('应该能够运行容器', async () => {
      const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
      
      // 保存容器ID以便清理
      containerId = containerInfo.id;
      
      expect(containerInfo.id).toBeTruthy();
      expect(containerInfo.name).toBe('mcp-test-container');
      expect(containerInfo.image).toBe('nginx:latest');
      expect(containerInfo.state).toBe('running');
      expect(containerInfo.ports).toHaveProperty('8080');
      expect(containerInfo.labels['test.label']).toBe('true');
      
      // 验证MCP服务器标签
      expect(containerInfo.labels['mcp.server.name']).toBe(testServer.name);
      expect(containerInfo.labels['mcp.server.version']).toBe(testServer.version);
    });
    
    test('应该能够获取容器日志', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      // 等待容器生成一些日志
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const logs = await dockerRuntime.getContainerLogs(containerId);
      expect(logs).toBeDefined();
    });
    
    test('应该能够获取容器信息', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      const info = await dockerRuntime.getContainerInfo(containerId);
      
      expect(info.id).toBe(containerId);
      expect(info.name).toBe('mcp-test-container');
      expect(info.state).toBe('running');
    });
    
    test('应该能够执行命令', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      const output = await dockerRuntime.execCommand(containerId, ['nginx', '-v']);
      
      expect(output).toContain('nginx version');
    });
    
    test('应该能够停止容器', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      const result = await dockerRuntime.stopContainer(containerId);
      
      expect(result).toBe(true);
      
      // 验证容器状态
      const info = await dockerRuntime.getContainerInfo(containerId);
      expect(info.state).toBe('exited');
    });
    
    test('应该能够重启容器', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      // 先停止容器
      await dockerRuntime.stopContainer(containerId);
      
      // 然后重启
      const info = await dockerRuntime.restartContainer(containerId);
      
      expect(info.state).toBe('running');
    });
    
    test('应该能够列出容器', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      const containers = await dockerRuntime.listContainers(true, {
        'name': 'mcp-test-container'
      });
      
      expect(containers.length).toBeGreaterThan(0);
      expect(containers.some(c => c.id === containerId)).toBe(true);
    });
    
    test('应该能够删除容器', async () => {
      // 确保存在容器ID
      if (!containerId) {
        const containerInfo = await dockerRuntime.runContainer(testServer, testContainerConfig);
        containerId = containerInfo.id;
      }
      
      // 先停止容器
      await dockerRuntime.stopContainer(containerId);
      
      // 然后删除
      const removed = await dockerRuntime.removeContainer(containerId);
      
      expect(removed).toBe(true);
      
      // 清理containerId，避免afterAll重复清理
      containerId = undefined;
    });
  });
}); 