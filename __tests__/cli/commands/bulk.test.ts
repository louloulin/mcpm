import { Command } from 'commander';
import fs from 'fs';
import inquirer from 'inquirer';
import axios from 'axios';
import { bulkCommand } from '../../../lib/cli/commands/bulk';
import { getConfig } from '../../../lib/cli/utils/config';
import { getInstalledServers, installServer, uninstallServer } from '../../../lib/cli/utils/server';

// 模拟依赖项
jest.mock('fs');
jest.mock('inquirer');
jest.mock('axios');
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

describe('批量操作命令测试', () => {
  let program: Command;
  let mockActionBulk: jest.Mock;
  let mockActionTemplate: jest.Mock;
  let mockCommandReturn: any;
  
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置 commander 模拟
    program = new Command();
    mockActionBulk = jest.fn();
    mockActionTemplate = jest.fn();
    
    // 模拟 program 方法链
    mockCommandReturn = {
      description: jest.fn().mockReturnThis(),
      argument: jest.fn().mockReturnThis(),
      option: jest.fn().mockReturnThis(),
      action: jest.fn().mockImplementation((fn) => {
        mockActionBulk(fn);
        return mockCommandReturn;
      }),
    };
    
    jest.spyOn(program, 'command').mockImplementation((cmd) => {
      if (cmd === 'bulk-template') {
        return {
          description: jest.fn().mockReturnThis(),
          option: jest.fn().mockReturnThis(),
          action: mockActionTemplate,
        } as any;
      }
      return mockCommandReturn as any;
    });
    
    // 模拟配置
    (getConfig as jest.Mock).mockReturnValue({
      registry: {
        url: 'https://registry.mcpr.io',
      },
      servers: {
        installPath: '/home/user/.mcpr/servers',
      },
    });
    
    // 模拟 fs 方法
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
      servers: ['server1', 'server2'],
      operation: 'install',
      installPath: './servers',
      version: {
        server1: '1.0.0',
      },
    }));
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    
    // 模拟 inquirer
    const mockPrompt = jest.fn().mockResolvedValue({ confirm: true, action: 'yes' });
    (inquirer.prompt as unknown) = mockPrompt;
    
    // 模拟服务器操作
    (getInstalledServers as jest.Mock).mockReturnValue([
      { key: 'installed-server', version: '1.0.0' },
    ]);
    (installServer as jest.Mock).mockResolvedValue(undefined);
    (uninstallServer as jest.Mock).mockReturnValue(undefined);
    
    // 模拟 axios
    (axios.get as jest.Mock).mockResolvedValue({
      data: {
        id: 'test-id',
        key: 'server1',
        name: 'Test Server',
        version: '1.0.0',
      },
    });
    (axios.post as jest.Mock).mockResolvedValue({});
  });
  
  test('应该注册批量命令和模板命令', () => {
    // 执行命令注册
    bulkCommand(program);
    
    // 验证命令注册
    expect(program.command).toHaveBeenCalledWith('bulk');
    expect(program.command).toHaveBeenCalledWith('bulk-template');
    expect(mockActionBulk).toHaveBeenCalled();
    expect(mockActionTemplate).toHaveBeenCalled();
  });
  
  test('应该解析批量规范文件并执行操作', async () => {
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const actionFn = mockActionBulk.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn('spec.json', { interactive: false });
    
    // 验证流程
    expect(fs.readFileSync).toHaveBeenCalledWith('spec.json', 'utf8');
    expect(inquirer.prompt).toHaveBeenCalled();
    expect(axios.get).toHaveBeenCalled();
    expect(installServer).toHaveBeenCalled();
  });
  
  test('应该处理交互式确认', async () => {
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const actionFn = mockActionBulk.mock.calls[0][0];
    
    // 执行 action 函数，启用交互模式
    await actionFn('spec.json', { interactive: true });
    
    // 验证询问每个服务器
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'action',
        }),
      ])
    );
  });
  
  test('应该处理用户拒绝确认', async () => {
    // 模拟用户拒绝确认
    const mockPromptOnce = jest.fn().mockResolvedValueOnce({ confirm: false });
    (inquirer.prompt as unknown) = mockPromptOnce;
    
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const actionFn = mockActionBulk.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn('spec.json', { interactive: false });
    
    // 验证没有执行安装
    expect(installServer).not.toHaveBeenCalled();
  });
  
  test('应该处理无效的规范文件', async () => {
    // 模拟无效的规范文件
    (fs.readFileSync as jest.Mock).mockReturnValue('invalid json');
    
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const actionFn = mockActionBulk.mock.calls[0][0];
    
    // 模拟 console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // 执行 action 函数
    await actionFn('invalid-spec.json', { interactive: false });
    
    // 验证错误处理
    expect(mockConsoleError).toHaveBeenCalled();
    
    // 恢复 console.error
    mockConsoleError.mockRestore();
  });
  
  test('应该生成规范模板', () => {
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const templateFn = mockActionTemplate.mock.calls[0][0];
    
    // 执行 action 函数
    templateFn({ output: 'template.json', type: 'install' });
    
    // 验证生成模板
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      'template.json',
      expect.any(String)
    );
  });
  
  test('应该处理不支持的操作类型', () => {
    // 注册命令并获取 action 函数
    bulkCommand(program);
    const templateFn = mockActionTemplate.mock.calls[0][0];
    
    // 模拟 console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // 执行 action 函数，使用不支持的操作类型
    templateFn({ output: 'template.json', type: 'invalid-operation' });
    
    // 验证错误处理
    expect(mockConsoleError).toHaveBeenCalled();
    
    // 恢复 console.error
    mockConsoleError.mockRestore();
  });
}); 