#!/usr/bin/env node

/**
 * MCPM 3.0 性能测试脚本
 * 
 * 用于测试MCPM服务器性能并生成性能报告
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');
const { table } = require('table');
const chalk = require('chalk');

// 定义测试配置
const DEFAULT_CONFIG = {
  url: process.env.MCPM_SERVER_URL || 'http://localhost:3000',
  connections: 100,  // 并发连接数
  pipelining: 10,    // HTTP管道化请求数
  duration: 30,      // 测试持续时间(秒)
  timeout: 5,        // 请求超时时间(秒)
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// 测试用例
const TEST_CASES = [
  {
    name: '获取工具列表',
    method: 'GET',
    path: '/api/tools',
    headers: {}
  },
  {
    name: '调用文本分析工具',
    method: 'POST',
    path: '/api/tools/textAnalyzer',
    body: JSON.stringify({
      text: 'This is a sample text to analyze the performance of the MCPM server.'
    }),
    headers: {}
  },
  {
    name: '批量工具调用',
    method: 'POST',
    path: '/api/tools/batch',
    body: JSON.stringify({
      calls: [
        {
          toolName: 'textAnalyzer',
          params: { text: 'First text to analyze' }
        },
        {
          toolName: 'imageGenerator',
          params: { prompt: 'A beautiful landscape' }
        }
      ]
    }),
    headers: {}
  }
];

// 如果提供了API令牌，则添加到请求头
if (process.env.MCPM_API_TOKEN) {
  DEFAULT_CONFIG.headers['Authorization'] = `Bearer ${process.env.MCPM_API_TOKEN}`;
}

// 打印测试配置信息
console.log(chalk.blue('=== MCPM 3.0 性能测试 ==='));
console.log(chalk.cyan('\n测试配置:'));
console.log(chalk.cyan(`目标服务器: ${DEFAULT_CONFIG.url}`));
console.log(chalk.cyan(`并发连接数: ${DEFAULT_CONFIG.connections}`));
console.log(chalk.cyan(`测试持续时间: ${DEFAULT_CONFIG.duration} 秒`));

// 运行测试
async function runTests() {
  console.log(chalk.blue('\n开始执行测试...'));
  
  const results = [];
  
  for (const testCase of TEST_CASES) {
    console.log(chalk.yellow(`\n正在测试: ${testCase.name}...`));
    
    try {
      const config = {
        ...DEFAULT_CONFIG,
        title: testCase.name,
        method: testCase.method,
        url: `${DEFAULT_CONFIG.url}${testCase.path}`,
        headers: { ...DEFAULT_CONFIG.headers, ...testCase.headers }
      };
      
      if (testCase.body) {
        config.body = testCase.body;
      }
      
      const result = await autocannon(config);
      results.push({ name: testCase.name, result });
      
      // 输出摘要
      console.log(chalk.green(`  请求数: ${result.requests.total}`));
      console.log(chalk.green(`  传输数据: ${(result.throughput.total / 1024 / 1024).toFixed(2)} MB`));
      console.log(chalk.green(`  平均延迟: ${result.latency.average.toFixed(2)} ms`));
      console.log(chalk.green(`  错误数: ${result.errors}`));
    } catch (error) {
      console.error(chalk.red(`  测试失败: ${error.message}`));
    }
  }
  
  // 生成报告
  generateReport(results);
}

// 生成性能报告
function generateReport(results) {
  console.log(chalk.blue('\n=== 性能测试报告 ==='));
  
  // 表格数据
  const tableData = [
    [
      chalk.bold('测试用例'),
      chalk.bold('请求/秒'),
      chalk.bold('平均延迟(ms)'),
      chalk.bold('最大延迟(ms)'),
      chalk.bold('错误率')
    ]
  ];
  
  // 总体统计
  let totalRequests = 0;
  let totalLatency = 0;
  let totalErrors = 0;
  
  results.forEach(({ name, result }) => {
    const rps = result.requests.average;
    const avgLatency = result.latency.average;
    const maxLatency = result.latency.max;
    const errorRate = (result.errors / result.requests.total * 100).toFixed(2);
    
    tableData.push([
      name,
      rps.toFixed(2),
      avgLatency.toFixed(2),
      maxLatency.toFixed(2),
      `${errorRate}%`
    ]);
    
    totalRequests += rps;
    totalLatency += avgLatency;
    totalErrors += result.errors;
  });
  
  // 添加总体行
  const avgLatency = totalLatency / results.length;
  tableData.push([
    chalk.bold('总体'),
    chalk.bold(totalRequests.toFixed(2)),
    chalk.bold(avgLatency.toFixed(2)),
    '-',
    chalk.bold(`${(totalErrors / results.length).toFixed(2)}`)
  ]);
  
  // 输出表格
  console.log(table(tableData));
  
  // 保存报告
  const reportDir = path.join(__dirname, '../reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportDir, `performance-report-${timestamp}.json`);
  
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    config: DEFAULT_CONFIG,
    results: results.map(r => ({
      name: r.name,
      requests: {
        total: r.result.requests.total,
        average: r.result.requests.average
      },
      latency: {
        average: r.result.latency.average,
        min: r.result.latency.min,
        max: r.result.latency.max,
        p50: r.result.latency.p50,
        p90: r.result.latency.p90,
        p99: r.result.latency.p99
      },
      throughput: {
        total: r.result.throughput.total,
        average: r.result.throughput.average
      },
      errors: r.result.errors,
      timeouts: r.result.timeouts,
      non2xx: r.result.non2xx,
      sent: r.result.sent
    })),
    summary: {
      totalRequests,
      averageLatency: avgLatency,
      totalErrors
    }
  }, null, 2));
  
  console.log(chalk.green(`\n性能报告已保存至: ${reportPath}`));
  console.log(chalk.blue('\n=== 测试完成 ==='));
}

// 执行测试
runTests().catch(error => {
  console.error(chalk.red(`测试失败: ${error.message}`));
  process.exit(1);
}); 