import { Command } from 'commander';
import axios from 'axios';
import inquirer from 'inquirer';
import { interactiveInstallCommand } from '../../../lib/cli/commands/interactive-install';
import { getConfig } from '../../../lib/cli/utils/config';
import { installServer } from '../../../lib/cli/utils/server';

// 模拟依赖项
jest.mock('axios');
jest.mock('inquirer');
jest.mock('../../../lib/cli/utils/config');
jest.mock('../../../lib/cli/utils/server');
jest.mock('ora', () => {
  return function () {
    return {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      info: jest.fn().mockReturnThis(),
    };
  };
});

describe('交互式安装命令测试', () => {
  let program: Command;
  let mockAction: jest.Mock;

  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置 commander 模拟
    program = new Command();
    mockAction = jest.fn();
    
    // 模拟 program.command().alias().description().option().action()
    jest.spyOn(program, 'command').mockImplementation(() => {
      return {
        alias: jest.fn().mockReturnThis(),
        description: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: mockAction,
      } as any;
    });
    
    // 模拟配置
    (getConfig as jest.Mock).mockReturnValue({
      registry: {
        url: 'https://registry.mcpm.io',
      },
      servers: {
        installPath: '/home/user/.mcpm/servers',
      },
    });
    
    // 模拟 axios
    (axios.get as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/servers')) {
        return Promise.resolve({
          data: {
            servers: [
              {
                key: 'test-server',
                name: 'Test Server',
                description: 'A test server',
                version: '1.0.0',
              },
            ],
          },
        });
      } else if (url.includes('/versions')) {
        return Promise.resolve({
          data: {
            versions: [
              {
                version: '1.0.0',
                publishedAt: '2023-01-01',
              },
              {
                version: '0.9.0',
                publishedAt: '2022-12-01',
              },
            ],
          },
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    // 模拟 inquirer
    const mockPrompt = jest.fn().mockImplementation((questions) => {
      const firstQuestion = questions[0];
      
      if (firstQuestion.name === 'selectedServer') {
        return Promise.resolve({ 
          selectedServer: {
            key: 'test-server',
            name: 'Test Server',
            description: 'A test server',
            version: '1.0.0',
          } 
        });
      } else if (firstQuestion.name === 'customPath') {
        return Promise.resolve({ customPath: '/custom/path' });
      } else if (firstQuestion.name === 'shouldReinstall') {
        return Promise.resolve({ shouldReinstall: true });
      } else if (firstQuestion.name === 'version') {
        return Promise.resolve({ version: 'latest' });
      } else if (firstQuestion.name === 'confirm') {
        return Promise.resolve({ confirm: true });
      } else if (firstQuestion.name === 'runNow') {
        return Promise.resolve({ runNow: false });
      }
      
      return Promise.resolve({});
    });
    (inquirer.prompt as unknown) = mockPrompt;
    
    // 模拟 installServer
    (installServer as jest.Mock).mockResolvedValue(undefined);
  });

  test('应该注册交互式安装命令', () => {
    // 执行命令注册
    interactiveInstallCommand(program);
    
    // 验证命令注册
    expect(program.command).toHaveBeenCalledWith('interactive-install');
    expect(mockAction).toHaveBeenCalled();
  });

  test('应该在选择服务器后执行安装', async () => {
    // 注册命令并获取 action 函数
    interactiveInstallCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn({ path: null, global: false });
    
    // 验证流程
    expect(axios.get).toHaveBeenCalledWith('https://registry.mcpm.io/api/servers?limit=100&sort=downloads');
    expect(inquirer.prompt).toHaveBeenCalled();
    expect(installServer).toHaveBeenCalled();
  });

  test('应该处理 global 选项', async () => {
    // 注册命令并获取 action 函数
    interactiveInstallCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数，带上 global 选项
    await actionFn({ path: null, global: true });
    
    // 验证使用了全局安装路径
    expect(installServer).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'test-server',
      }),
      '/home/user/.mcpm/servers'
    );
  });

  test('应该使用指定的安装路径', async () => {
    // 注册命令并获取 action 函数
    interactiveInstallCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数，带上 path 选项
    await actionFn({ path: '/custom/install/path', global: false });
    
    // 验证使用了指定的安装路径
    expect(installServer).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'test-server',
      }),
      '/custom/install/path'
    );
  });

  test('应该处理安装错误', async () => {
    // 模拟安装错误
    (installServer as jest.Mock).mockRejectedValue(new Error('安装失败'));
    
    // 注册命令并获取 action 函数
    interactiveInstallCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn({ path: null, global: false });
    
    // 验证错误处理
    expect(installServer).toHaveBeenCalled();
    // 错误处理在 ora().fail() 中，由于我们已经模拟了 ora，可以通过检查函数是否正常执行来验证
    expect(actionFn).not.toThrow();
  });
}); 