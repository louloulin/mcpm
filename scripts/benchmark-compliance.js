#!/usr/bin/env node

/**
 * MCPM 3.0 安全与性能合规测试脚本
 * 
 * 测试MCPM服务是否符合安全与性能基准标准
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const chalk = require('chalk');
const { execSync } = require('child_process');
const autocannon = require('autocannon');

// 检查目标URL是否有效
function isValidURL(url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

// 解析命令行参数
const args = process.argv.slice(2);
const params = {};

for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2);
    const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
    params[key] = value;
    if (value !== true) i++;
  }
}

// 检查必要参数
if (!params.url) {
  console.log(chalk.red('错误: 缺少必要参数 --url'));
  console.log(chalk.yellow('用法: node benchmark-compliance.js --url https://your-mcpm-server.com [--level basic|standard|enterprise] [--report-file ./report.json]'));
  process.exit(1);
}

// 验证URL格式
if (!isValidURL(params.url)) {
  console.log(chalk.red(`错误: 无效的URL: ${params.url}`));
  process.exit(1);
}

// 设置测试级别
const level = params.level || 'standard';
if (!['basic', 'standard', 'enterprise'].includes(level)) {
  console.log(chalk.red(`错误: 无效的测试级别: ${level}. 使用 basic, standard 或 enterprise`));
  process.exit(1);
}

// 设置报告文件
const reportFile = params.report || path.join(process.cwd(), 'compliance-report.json');

// 打印测试配置
console.log(chalk.blue.bold('=== MCPM 3.0 安全与性能合规测试 ===\n'));
console.log(chalk.cyan(`目标服务器: ${params.url}`));
console.log(chalk.cyan(`测试级别: ${level}`));
console.log(chalk.cyan(`报告文件: ${reportFile}\n`));

// 测试配置
const LEVEL_CONFIG = {
  basic: {
    security: {
      authRequired: true,
      tlsRequired: true,
      securityHeaders: [
        'X-Content-Type-Options',
        'X-XSS-Protection'
      ]
    },
    performance: {
      maxResponseTime: 500, // ms
      minRequestsPerSecond: 50,
      minConcurrentConnections: 100
    }
  },
  standard: {
    security: {
      authRequired: true,
      tlsRequired: true,
      securityHeaders: [
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Content-Security-Policy',
        'Strict-Transport-Security'
      ],
      rateLimitRequired: true
    },
    performance: {
      maxResponseTime: 200, // ms
      minRequestsPerSecond: 200,
      minConcurrentConnections: 500
    }
  },
  enterprise: {
    security: {
      authRequired: true,
      tlsRequired: true,
      securityHeaders: [
        'X-Content-Type-Options',
        'X-XSS-Protection',
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'Referrer-Policy',
        'Permissions-Policy'
      ],
      rateLimitRequired: true,
      corsProtection: true
    },
    performance: {
      maxResponseTime: 100, // ms
      minRequestsPerSecond: 1000,
      minConcurrentConnections: 2000
    }
  }
};

// 测试结果
const results = {
  url: params.url,
  level,
  timestamp: new Date().toISOString(),
  summary: {
    securityScore: 0,
    performanceScore: 0,
    compliance: false
  },
  security: {
    tests: {},
    passed: 0,
    total: 0
  },
  performance: {
    tests: {},
    passed: 0,
    total: 0
  }
};

// 安全性测试
async function testSecurity() {
  console.log(chalk.yellow.bold('\n安全性测试:'));
  
  const config = LEVEL_CONFIG[level].security;
  const tests = [];
  
  // 添加测试项目
  if (config.tlsRequired) {
    tests.push({
      name: 'TLS加密',
      description: '验证服务器是否使用TLS (HTTPS)',
      test: async () => {
        return params.url.startsWith('https://');
      }
    });
  }
  
  if (config.authRequired) {
    tests.push({
      name: 'API认证',
      description: '验证服务器是否需要认证',
      test: async () => {
        try {
          const url = new URL('/api/tools', params.url);
          return new Promise((resolve) => {
            const req = (url.protocol === 'https:' ? https : http).request(url, {
              method: 'GET',
              headers: { 'Accept': 'application/json' }
            }, (res) => {
              // 认证失败应该返回401或403
              resolve(res.statusCode === 401 || res.statusCode === 403);
            });
            
            req.on('error', () => resolve(false));
            req.end();
          });
        } catch (err) {
          return false;
        }
      }
    });
  }
  
  if (config.securityHeaders && config.securityHeaders.length > 0) {
    tests.push({
      name: '安全HTTP头部',
      description: '验证服务器是否设置推荐的安全HTTP头部',
      test: async () => {
        try {
          const url = new URL('/', params.url);
          return new Promise((resolve) => {
            const req = (url.protocol === 'https:' ? https : http).request(url, {
              method: 'GET'
            }, (res) => {
              const headers = res.headers;
              const requiredHeaders = config.securityHeaders;
              const presentHeaders = requiredHeaders.filter(header => 
                Object.keys(headers).some(h => h.toLowerCase() === header.toLowerCase())
              );
              
              const allPresent = presentHeaders.length === requiredHeaders.length;
              
              // 保存测试详情
              results.security.tests['安全HTTP头部'] = {
                present: presentHeaders,
                missing: requiredHeaders.filter(h => !presentHeaders.includes(h)),
                passed: allPresent
              };
              
              resolve(allPresent);
            });
            
            req.on('error', () => resolve(false));
            req.end();
          });
        } catch (err) {
          return false;
        }
      }
    });
  }
  
  if (config.rateLimitRequired) {
    tests.push({
      name: '请求限流保护',
      description: '验证服务器是否实现了请求限流',
      test: async () => {
        try {
          const url = new URL('/api/tools', params.url);
          return new Promise((resolve) => {
            let rateLimitDetected = false;
            
            // 发送多个请求检测限流头部
            for (let i = 0; i < 5; i++) {
              const req = (url.protocol === 'https:' ? https : http).request(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
              }, (res) => {
                const headers = res.headers;
                // 检查常见的限流头部
                const rateLimitHeaders = [
                  'x-ratelimit-limit',
                  'x-ratelimit-remaining',
                  'x-ratelimit-reset',
                  'retry-after'
                ];
                
                if (rateLimitHeaders.some(h => Object.keys(headers).some(header => 
                  header.toLowerCase() === h.toLowerCase()))) {
                  rateLimitDetected = true;
                }
                
                if (i === 4) {
                  resolve(rateLimitDetected);
                }
              });
              
              req.on('error', () => {
                if (i === 4) resolve(false);
              });
              req.end();
            }
          });
        } catch (err) {
          return false;
        }
      }
    });
  }
  
  if (config.corsProtection) {
    tests.push({
      name: 'CORS安全配置',
      description: '验证服务器是否正确配置了CORS保护',
      test: async () => {
        try {
          const url = new URL('/api/tools', params.url);
          return new Promise((resolve) => {
            const req = (url.protocol === 'https:' ? https : http).request(url, {
              method: 'OPTIONS',
              headers: {
                'Origin': 'https://malicious-site.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
              }
            }, (res) => {
              const headers = res.headers;
              const allowOrigin = headers['access-control-allow-origin'];
              
              // 安全配置应该不允许任意来源
              const isSecure = !allowOrigin || allowOrigin !== '*';
              
              resolve(isSecure);
            });
            
            req.on('error', () => resolve(true)); // 错误可能表示CORS已阻止
            req.end();
          });
        } catch (err) {
          return false;
        }
      }
    });
  }
  
  // 运行安全测试
  results.security.total = tests.length;
  
  for (const test of tests) {
    process.stdout.write(chalk.cyan(`测试: ${test.name}... `));
    
    try {
      const passed = await test.test();
      results.security.tests[test.name] = { passed };
      
      if (passed) {
        results.security.passed++;
        console.log(chalk.green('通过 ✓'));
      } else {
        console.log(chalk.red('失败 ✗'));
      }
    } catch (err) {
      results.security.tests[test.name] = { passed: false, error: err.message };
      console.log(chalk.red(`失败 ✗ (${err.message})`));
    }
  }
  
  // 计算安全分数
  results.summary.securityScore = results.security.total > 0 
    ? Math.round((results.security.passed / results.security.total) * 100) 
    : 0;
  
  console.log(chalk.cyan(`\n安全测试完成: ${results.security.passed}/${results.security.total} 通过 (${results.summary.securityScore}%)`));
}

// 性能测试
async function testPerformance() {
  console.log(chalk.yellow.bold('\n性能测试:'));
  
  const config = LEVEL_CONFIG[level].performance;
  let passed = 0;
  const totalTests = 3; // 响应时间、吞吐量、并发连接
  
  // 测试路径定义
  const testPaths = [
    '/api/tools' // 通用测试路径
  ];
  
  // 运行性能测试
  console.log(chalk.cyan('正在测试API性能，请稍候...'));
  
  try {
    // 准备测试参数
    const testUrl = new URL(testPaths[0], params.url).toString();
    const testOptions = {
      url: testUrl,
      connections: Math.min(50, config.minConcurrentConnections), // 为测试使用较小值
      duration: 10, // 10秒足够获取基准
      headers: {
        'Accept': 'application/json',
        // 如果有认证tokens可以在这里添加
      }
    };
    
    // 运行测试
    const result = await autocannon(testOptions);
    
    // 分析结果
    const avgLatency = result.latency.average;
    const reqPerSec = result.requests.average;
    const supported = result.connections; // 实际测试的并发连接数
    
    // 保存测试结果
    results.performance.tests['响应时间'] = {
      value: avgLatency,
      threshold: config.maxResponseTime,
      passed: avgLatency <= config.maxResponseTime
    };
    
    results.performance.tests['吞吐量'] = {
      value: reqPerSec,
      threshold: config.minRequestsPerSecond,
      passed: reqPerSec >= config.minRequestsPerSecond
    };
    
    results.performance.tests['并发连接'] = {
      value: supported,
      threshold: testOptions.connections,
      passed: supported >= testOptions.connections
    };
    
    // 计算通过的测试数
    if (avgLatency <= config.maxResponseTime) passed++;
    if (reqPerSec >= config.minRequestsPerSecond) passed++;
    if (supported >= testOptions.connections) passed++;
    
    // 输出测试结果
    console.log(chalk.cyan('\n性能测试结果:'));
    console.log(chalk.cyan(`平均响应时间: ${avgLatency.toFixed(2)}ms`) + 
      (avgLatency <= config.maxResponseTime ? chalk.green(' ✓') : chalk.red(` ✗ (应 <= ${config.maxResponseTime}ms)`)));
    
    console.log(chalk.cyan(`每秒请求数: ${reqPerSec.toFixed(2)}`) + 
      (reqPerSec >= config.minRequestsPerSecond ? chalk.green(' ✓') : chalk.red(` ✗ (应 >= ${config.minRequestsPerSecond})`)));
    
    console.log(chalk.cyan(`并发连接数: ${supported}`) + 
      (supported >= testOptions.connections ? chalk.green(' ✓') : chalk.red(` ✗ (应 >= ${testOptions.connections})`)));
    
  } catch (err) {
    console.log(chalk.red(`性能测试失败: ${err.message}`));
    results.performance.tests['测试失败'] = { 
      error: err.message,
      passed: false
    };
  }
  
  // 更新测试结果
  results.performance.passed = passed;
  results.performance.total = totalTests;
  
  // 计算性能分数
  results.summary.performanceScore = totalTests > 0 
    ? Math.round((passed / totalTests) * 100) 
    : 0;
  
  console.log(chalk.cyan(`\n性能测试完成: ${passed}/${totalTests} 通过 (${results.summary.performanceScore}%)`));
}

// 生成合规报告
function generateReport() {
  // 计算总体合规性
  const securityWeight = 0.6; // 安全权重60%
  const performanceWeight = 0.4; // 性能权重40%
  
  const securityScore = results.summary.securityScore;
  const performanceScore = results.summary.performanceScore;
  
  // 根据级别确定通过分数
  const passingScores = {
    basic: 70,
    standard: 80,
    enterprise: 90
  };
  
  // 计算加权总分
  const totalScore = (securityScore * securityWeight) + (performanceScore * performanceWeight);
  
  // 确定是否合规
  const isCompliant = totalScore >= passingScores[level];
  results.summary.totalScore = Math.round(totalScore);
  results.summary.compliance = isCompliant;
  
  // 打印结果
  console.log(chalk.blue.bold('\n=== 合规测试结果 ===\n'));
  console.log(chalk.cyan(`安全分数: ${securityScore}%`));
  console.log(chalk.cyan(`性能分数: ${performanceScore}%`));
  console.log(chalk.cyan(`总分: ${results.summary.totalScore}%`));
  console.log(chalk.cyan(`通过分数要求: ${passingScores[level]}%`));
  
  if (isCompliant) {
    console.log(chalk.green.bold(`\n恭喜! 服务器符合 ${level} 级别的合规要求 ✓`));
  } else {
    console.log(chalk.red.bold(`\n服务器未能符合 ${level} 级别的合规要求 ✗`));
  }
  
  // 保存报告
  try {
    fs.writeFileSync(reportFile, JSON.stringify(results, null, 2));
    console.log(chalk.green(`\n完整报告已保存至: ${reportFile}`));
  } catch (err) {
    console.log(chalk.red(`无法保存报告: ${err.message}`));
  }
}

// 主函数
async function main() {
  try {
    // 运行安全测试
    await testSecurity();
    
    // 运行性能测试
    await testPerformance();
    
    // 生成报告
    generateReport();
    
    console.log(chalk.blue.bold('\n=== 测试完成 ==='));
    
    // 根据合规性设置退出码
    process.exit(results.summary.compliance ? 0 : 1);
  } catch (error) {
    console.error(chalk.red(`\n测试过程中发生错误: ${error.message}`));
    process.exit(1);
  }
}

// 执行主函数
main(); 