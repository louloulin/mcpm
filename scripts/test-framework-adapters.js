#!/usr/bin/env node

/**
 * MCPM 3.0 框架适配器测试脚本
 * 
 * 这个脚本运行框架适配器测试套件，验证所有适配器的功能
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件路径（ESM模块中不能使用__dirname）
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 彩色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 测试配置
const config = {
  testFile: path.resolve(__dirname, '../tests/v3/framework-adapters.test.js'),
  timeout: 15000, // 15秒超时
  reporter: 'spec' // 详细报告格式
};

console.log(`${colors.bright}${colors.blue}=== MCPM 3.0 框架适配器测试 ===${colors.reset}\n`);

// 检查测试文件是否存在
if (!fs.existsSync(config.testFile)) {
  console.error(`${colors.red}测试文件不存在: ${config.testFile}${colors.reset}`);
  process.exit(1);
}

// 打印测试信息
console.log(`${colors.cyan}运行测试文件: ${colors.reset}${path.relative(process.cwd(), config.testFile)}`);
console.log(`${colors.cyan}超时设置: ${colors.reset}${config.timeout}ms`);
console.log(`${colors.cyan}报告格式: ${colors.reset}${config.reporter}\n`);

try {
  // 运行测试
  console.log(`${colors.yellow}开始测试...${colors.reset}\n`);
  
  const cmd = `NODE_ENV=test pnpm exec mocha "${config.testFile}" --timeout ${config.timeout} --reporter ${config.reporter} --experimental-modules`;
  execSync(cmd, { stdio: 'inherit' });
  
  console.log(`\n${colors.green}${colors.bright}✓ 所有框架适配器测试通过！${colors.reset}`);
  
  // 输出覆盖率信息
  console.log(`\n${colors.cyan}生成覆盖率报告...${colors.reset}`);
  
  try {
    const coverageCmd = `NODE_ENV=test pnpm exec c8 --reporter=lcov --reporter=text-summary pnpm exec mocha "${config.testFile}" --experimental-modules`;
    execSync(coverageCmd, { stdio: 'inherit' });
    
    console.log(`\n${colors.green}覆盖率报告已生成${colors.reset}`);
  } catch (coverageError) {
    console.warn(`${colors.yellow}警告: 无法生成覆盖率报告${colors.reset}`);
    console.warn(`${colors.yellow}确保已安装 c8: pnpm add -D c8${colors.reset}`);
  }
  
} catch (error) {
  console.error(`\n${colors.red}${colors.bright}✗ 测试失败！${colors.reset}`);
  if (error.message) {
    console.error(`${colors.red}错误信息: ${error.message}${colors.reset}`);
  }
  process.exit(1);
}

// 更新 README 中的测试信息
try {
  console.log(`\n${colors.cyan}更新测试状态...${colors.reset}`);
  
  const readmePath = path.resolve(__dirname, '../README.md');
  if (fs.existsSync(readmePath)) {
    let readmeContent = fs.readFileSync(readmePath, 'utf8');
    
    // 更新测试状态
    const testBadgeRegex = /!\[Tests\]\(https:\/\/img\.shields\.io\/badge\/tests-[^)]+\)/;
    const testBadge = '![Tests](https://img.shields.io/badge/tests-passing-brightgreen)';
    
    if (testBadgeRegex.test(readmeContent)) {
      readmeContent = readmeContent.replace(testBadgeRegex, testBadge);
    } else {
      // 在第一个标题后添加徽章
      readmeContent = readmeContent.replace(
        /(#[^\n]+\n)/,
        `$1\n${testBadge} `
      );
    }
    
    fs.writeFileSync(readmePath, readmeContent);
    console.log(`${colors.green}README 已更新${colors.reset}`);
  }
} catch (updateError) {
  console.warn(`${colors.yellow}警告: 无法更新 README${colors.reset}`);
}

console.log(`\n${colors.bright}${colors.blue}=== 测试完成 ===${colors.reset}`); 