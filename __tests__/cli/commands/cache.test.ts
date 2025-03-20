import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import os from 'os';
import inquirer from 'inquirer';
import { cacheCommand } from '../../../lib/cli/commands/cache';
import { getConfig, updateConfig } from '../../../lib/cli/utils/config';

// 模拟依赖项
jest.mock('fs');
jest.mock('path');
jest.mock('os');
jest.mock('inquirer');
jest.mock('../../../lib/cli/utils/config');
jest.mock('ora', () => {
  return function () {
    return {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
    };
  };
});
jest.mock('pretty-bytes', () => {
  return jest.fn().mockImplementation((bytes) => `${bytes} bytes`);
});

describe('缓存管理命令测试', () => {
  let program: Command;
  let mockCommand: any;
  let subCommands: any;
  
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置 commander 模拟
    program = new Command();
    
    // 缓存子命令和动作
    subCommands = {};
    mockCommand = {
      command: jest.fn().mockImplementation((name) => {
        const cmd = {
          description: jest.fn().mockReturnThis(),
          option: jest.fn().mockReturnThis(),
          action: jest.fn(),
        };
        subCommands[name] = cmd;
        return cmd;
      }),
      description: jest.fn().mockReturnThis(),
    };
    
    // 模拟 program.command
    jest.spyOn(program, 'command').mockReturnValue(mockCommand as any);
    
    // 模拟配置
    (getConfig as jest.Mock).mockReturnValue({
      cache: {
        dir: '/home/user/.mcpm/cache',
        sizeLimit: 500,
      },
    });
    (updateConfig as jest.Mock).mockReturnValue({});
    
    // 模拟 fs 方法
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockImplementation((dir) => {
      if (dir.includes('servers')) {
        return ['server1', 'server2'];
      } else if (dir.includes('assets')) {
        return ['asset1.zip', 'asset2.jpg'];
      }
      return [];
    });
    (fs.statSync as jest.Mock).mockImplementation((path) => {
      return {
        isDirectory: () => path.includes('server'),
        size: 1024,
        ctime: new Date(),
        mtime: new Date(),
      };
    });
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.unlinkSync as jest.Mock).mockReturnValue(undefined);
    (fs.rmdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.copyFileSync as jest.Mock).mockReturnValue(undefined);
    (fs.rmSync as jest.Mock).mockReturnValue(undefined);
    
    // 模拟 path 方法
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.resolve as jest.Mock).mockImplementation((p) => `/resolved/${p}`);
    (path.dirname as jest.Mock).mockReturnValue('/dir');
    
    // 模拟 os 方法
    (os.homedir as jest.Mock).mockReturnValue('/home/user');
    
    // 模拟 inquirer
    const mockPrompt = jest.fn().mockImplementation((questions) => {
      const firstQuestion = questions[0];
      if (firstQuestion.name === 'confirm') {
        return Promise.resolve({ confirm: true });
      } else if (firstQuestion.name === 'migrate') {
        return Promise.resolve({ migrate: true });
      } else if (firstQuestion.name === 'deleteOld') {
        return Promise.resolve({ deleteOld: true });
      }
      return Promise.resolve({});
    });
    (inquirer.prompt as unknown) = mockPrompt;
  });
  
  test('应该注册缓存主命令和子命令', () => {
    // 执行命令注册
    cacheCommand(program);
    
    // 验证主命令注册
    expect(program.command).toHaveBeenCalledWith('cache');
    
    // 验证子命令注册
    expect(subCommands).toHaveProperty('info');
    expect(subCommands).toHaveProperty('list');
    expect(subCommands).toHaveProperty('clean');
    expect(subCommands).toHaveProperty('config');
  });
  
  test('info 子命令应该显示缓存信息', () => {
    // 模拟 console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 info 命令的 action 函数并执行
    const infoAction = subCommands.info.action;
    infoAction();
    
    // 验证缓存信息显示
    expect(fs.existsSync).toHaveBeenCalledWith('/home/user/.mcpm/cache');
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 恢复 console.log
    mockConsoleLog.mockRestore();
  });
  
  test('list 子命令应该列出缓存内容', () => {
    // 模拟 console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 list 命令的 action 函数并执行
    const listAction = subCommands.list.action;
    listAction({
      type: 'servers',
      pattern: null,
      limit: '10',
    });
    
    // 验证缓存列表显示
    expect(fs.readdirSync).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 恢复 console.log
    mockConsoleLog.mockRestore();
  });
  
  test('list 子命令应该处理不支持的缓存类型', () => {
    // 模拟 console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 list 命令的 action 函数并执行，使用不支持的类型
    const listAction = subCommands.list.action;
    listAction({
      type: 'unsupported-type',
      pattern: null,
      limit: '10',
    });
    
    // 验证错误处理
    expect(mockConsoleError).toHaveBeenCalled();
    
    // 恢复 console.error
    mockConsoleError.mockRestore();
  });
  
  test('clean 子命令应该清理缓存', async () => {
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 clean 命令的 action 函数并执行
    const cleanAction = subCommands.clean.action;
    await cleanAction({
      type: 'temp',
      pattern: null,
      days: null,
      force: true,
    });
    
    // 验证缓存清理
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
  
  test('clean 子命令应该处理用户取消', async () => {
    // 模拟用户取消
    const mockPromptOnce = jest.fn().mockResolvedValueOnce({ confirm: false });
    (inquirer.prompt as unknown) = mockPromptOnce;
    
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 clean 命令的 action 函数并执行
    const cleanAction = subCommands.clean.action;
    await cleanAction({
      type: 'temp',
      pattern: null,
      days: null,
      force: false,
    });
    
    // 验证没有清理缓存
    expect(fs.unlinkSync).not.toHaveBeenCalled();
  });
  
  test('config 子命令应该显示当前配置', () => {
    // 模拟 console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 config 命令的 action 函数并执行
    const configAction = subCommands.config.action;
    configAction({
      show: true,
      dir: null,
      reset: false,
    });
    
    // 验证配置显示
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 恢复 console.log
    mockConsoleLog.mockRestore();
  });
  
  test('config 子命令应该重置缓存目录', () => {
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 config 命令的 action 函数并执行
    const configAction = subCommands.config.action;
    configAction({
      show: false,
      dir: null,
      reset: true,
    });
    
    // 验证配置重置
    expect(updateConfig).toHaveBeenCalled();
  });
  
  test('config 子命令应该设置新的缓存目录并迁移', async () => {
    // 执行命令注册
    cacheCommand(program);
    
    // 获取 config 命令的 action 函数并执行
    const configAction = subCommands.config.action;
    await configAction({
      show: false,
      dir: '/new/cache/dir',
      reset: false,
    });
    
    // 验证配置更新和迁移
    expect(updateConfig).toHaveBeenCalled();
    expect(path.resolve).toHaveBeenCalledWith('/new/cache/dir');
    expect(inquirer.prompt).toHaveBeenCalled();
    expect(fs.copyFileSync).toHaveBeenCalled();
  });
}); 