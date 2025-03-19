import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { initCommand } from '../../../lib/cli/commands/init';
import { getConfig } from '../../../lib/cli/utils/config';

// 模拟依赖项
jest.mock('fs');
jest.mock('path');
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

describe('初始化命令测试', () => {
  let program: Command;
  let mockAction: jest.Mock;
  
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置 commander 模拟
    program = new Command();
    mockAction = jest.fn();
    
    // 模拟 program.command().description().option().action()
    jest.spyOn(program, 'command').mockImplementation(() => {
      return {
        description: jest.fn().mockReturnThis(),
        option: jest.fn().mockReturnThis(),
        action: mockAction,
      } as any;
    });
    
    // 模拟配置
    (getConfig as jest.Mock).mockReturnValue({
      user: {
        name: 'Test User',
      },
    });
    
    // 模拟 fs 方法
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.writeFileSync as jest.Mock).mockReturnValue(undefined);
    
    // 模拟 path 方法
    (path.resolve as jest.Mock).mockImplementation((dir) => `/resolved/${dir}`);
    (path.basename as jest.Mock).mockReturnValue('project-name');
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.dirname as jest.Mock).mockReturnValue('/dir');
    
    // 模拟 inquirer
    const mockPrompt = jest.fn().mockImplementation((questions) => {
      const firstQuestion = questions[0];
      
      if (firstQuestion.name === 'overwrite') {
        return Promise.resolve({ overwrite: true });
      } else if (firstQuestion.name === 'template') {
        return Promise.resolve({ template: 'basic' });
      } else if (firstQuestion.name === 'name') {
        return Promise.resolve({
          name: 'Test Project',
          version: '1.0.0',
          description: 'A test project',
          author: 'Test Author',
        });
      }
      
      return Promise.resolve({});
    });
    (inquirer.prompt as unknown) = mockPrompt;
  });
  
  test('应该注册初始化命令', () => {
    // 执行命令注册
    initCommand(program);
    
    // 验证命令注册
    expect(program.command).toHaveBeenCalledWith('init');
    expect(mockAction).toHaveBeenCalled();
  });
  
  test('应该使用默认目录创建项目', async () => {
    // 注册命令并获取 action 函数
    initCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn({ dir: '.', template: 'basic' });
    
    // 验证目录创建
    expect(path.resolve).toHaveBeenCalledWith(expect.any(String), '.');
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
  
  test('应该处理非空目录', async () => {
    // 模拟目录已存在且非空
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readdirSync as jest.Mock).mockReturnValue(['some-file.txt']);
    
    // 注册命令并获取 action 函数
    initCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn({ dir: 'non-empty-dir', template: 'basic' });
    
    // 验证询问是否覆盖
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'overwrite',
        }),
      ])
    );
  });
  
  test('应该处理没有指定模板的情况', async () => {
    // 注册命令并获取 action 函数
    initCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数，不指定模板
    await actionFn({ dir: '.', template: undefined });
    
    // 验证请求模板选择
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'template',
        }),
      ])
    );
  });
  
  test('应该收集项目信息', async () => {
    // 注册命令并获取 action 函数
    initCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 执行 action 函数
    await actionFn({ dir: '.', template: 'basic' });
    
    // 验证收集项目信息
    expect(inquirer.prompt).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'name',
        }),
      ])
    );
  });
  
  test('应该处理不支持的模板类型', async () => {
    // 注册命令并获取 action 函数
    initCommand(program);
    const actionFn = mockAction.mock.calls[0][0];
    
    // 模拟 console.error
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    
    // 执行 action 函数，使用不支持的模板
    await actionFn({ dir: '.', template: 'invalid-template' });
    
    // 验证错误处理
    expect(mockConsoleError).toHaveBeenCalled();
    
    // 恢复 console.error
    mockConsoleError.mockRestore();
  });
}); 