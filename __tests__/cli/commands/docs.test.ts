import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { docsCommand } from '../../../lib/cli/commands/docs';
import { generateApiDocs } from '../../../lib/api-docs/generator';

// 模拟依赖项
jest.mock('fs');
jest.mock('path');
jest.mock('glob');
jest.mock('../../../lib/api-docs/generator');
jest.mock('ora', () => {
  return function () {
    return {
      start: jest.fn().mockReturnThis(),
      stop: jest.fn().mockReturnThis(),
      succeed: jest.fn().mockReturnThis(),
      fail: jest.fn().mockReturnThis(),
      text: '',
    };
  };
});

describe('文档命令测试', () => {
  let program: Command;
  let mockCommand: any;
  let subCommands: Record<string, any>;
  
  beforeEach(() => {
    // 重置所有 mocks
    jest.clearAllMocks();
    
    // 设置 commander 模拟
    program = new Command();
    subCommands = {};
    
    mockCommand = {
      description: jest.fn().mockReturnThis(),
      command: jest.fn().mockImplementation((name) => {
        const cmd = {
          description: jest.fn().mockReturnThis(),
          option: jest.fn().mockReturnThis(),
          action: jest.fn(),
        };
        subCommands[name] = cmd;
        return cmd;
      }),
    };
    
    // 模拟 program.command
    jest.spyOn(program, 'command').mockReturnValue(mockCommand as any);
    
    // 模拟 path
    (path.resolve as jest.Mock).mockImplementation((...args) => args.join('/'));
    (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
    
    // 模拟 fs
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockReturnValue(undefined);
    (fs.readFileSync as jest.Mock).mockReturnValue('{"version": "1.0.0"}');
    (fs.rmSync as jest.Mock).mockReturnValue(undefined);
    
    // 模拟 glob
    const glob = require('glob');
    (glob.sync as jest.Mock).mockReturnValue(['src/file1.ts', 'src/file2.ts']);
    
    // 模拟 generateApiDocs
    (generateApiDocs as jest.Mock).mockResolvedValue(undefined);
  });
  
  test('应该注册文档主命令和子命令', () => {
    // 执行命令注册
    docsCommand(program);
    
    // 验证主命令注册
    expect(program.command).toHaveBeenCalledWith('docs');
    
    // 验证子命令注册
    expect(mockCommand.command).toHaveBeenCalledWith('generate');
    expect(mockCommand.command).toHaveBeenCalledWith('serve');
    expect(mockCommand.command).toHaveBeenCalledWith('clean');
    expect(mockCommand.description).toHaveBeenCalled();
  });
  
  test('generate 子命令应该生成文档', async () => {
    // 执行命令注册
    docsCommand(program);
    
    // 获取 generate 命令的 action 函数
    const generateAction = subCommands.generate.action;
    
    // 执行 action 函数
    await generateAction({
      input: '**/*.ts',
      output: 'docs/api',
      title: 'Test API',
      version: '1.0.0',
      description: 'Test Description',
      basePath: '/api',
      typescript: false
    });
    
    // 验证文档生成
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.mkdirSync).toHaveBeenCalled();
    expect(generateApiDocs).toHaveBeenCalledWith({
      inputFiles: expect.any(Array),
      outputDir: expect.any(String),
      title: 'Test API',
      version: '1.0.0',
      description: 'Test Description',
      basePath: '/api',
      typescript: false
    });
  });
  
  test('generate 子命令应该处理未找到文件的情况', async () => {
    // 模拟未找到文件
    const glob = require('glob');
    (glob.sync as jest.Mock).mockReturnValue([]);
    
    // 执行命令注册
    docsCommand(program);
    
    // 获取 generate 命令的 action 函数
    const generateAction = subCommands.generate.action;
    
    // 模拟 console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行 action 函数
    await generateAction({
      input: 'non-existent/*.ts',
      output: 'docs/api',
      title: 'Test API',
      version: '1.0.0'
    });
    
    // 验证未找到文件的处理
    expect(generateApiDocs).not.toHaveBeenCalled();
    
    // 恢复 console.log
    mockConsoleLog.mockRestore();
  });
  
  test('serve 子命令应该处理不存在的文档目录', async () => {
    // 模拟文档目录不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // 执行命令注册
    docsCommand(program);
    
    // 获取 serve 命令的 action 函数
    const serveAction = subCommands.serve.action;
    
    // 模拟 console.error 和 console.log
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行 action 函数
    await serveAction({
      dir: 'non-existent/docs',
      port: '8080'
    });
    
    // 验证错误处理
    expect(mockConsoleError).toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 恢复 console 方法
    mockConsoleError.mockRestore();
    mockConsoleLog.mockRestore();
  });
  
  test('clean 子命令应该处理不存在的文档目录', () => {
    // 模拟文档目录不存在
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // 执行命令注册
    docsCommand(program);
    
    // 获取 clean 命令的 action 函数
    const cleanAction = subCommands.clean.action;
    
    // 模拟 console.log
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    
    // 执行 action 函数
    cleanAction({
      dir: 'non-existent/docs',
      force: false
    });
    
    // 验证文档不存在的处理
    expect(fs.rmSync).not.toHaveBeenCalled();
    expect(mockConsoleLog).toHaveBeenCalled();
    
    // 恢复 console.log
    mockConsoleLog.mockRestore();
  });
  
  test('clean 子命令应该接受force选项', async () => {
    // 模拟文档目录存在
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    
    // 执行命令注册
    docsCommand(program);
    
    // 获取 clean 命令的 action 函数
    const cleanAction = subCommands.clean.action;
    
    // 执行 action 函数，带上 force 选项
    await cleanAction({
      dir: 'docs/api',
      force: true
    });
    
    // 验证强制清理
    expect(fs.rmSync).toHaveBeenCalledWith(expect.any(String), { recursive: true, force: true });
  });
}); 