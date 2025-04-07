#!/usr/bin/env node

/**
 * MCPM 3.0 CLI运行脚本
 * 用于启动MCPM CLI
 */

// 注册TypeScript支持
require('esbuild-register');

// 导入CLI初始化函数
const { initCLI } = require('../lib/v3/cli');

// 初始化CLI
initCLI(); 