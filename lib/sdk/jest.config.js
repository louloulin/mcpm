/**
 * MCP集成SDK的Jest配置
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/__tests__/**/*.test.ts'
  ],
  
  // 覆盖率收集目录
  collectCoverageFrom: [
    'core/**/*.ts',
    'integrations/**/*.ts',
    'utils/**/*.ts',
    '*.ts',
    '!**/__tests__/**',
    '!**/*.d.ts'
  ],
  
  // 覆盖率报告目录
  coverageDirectory: 'coverage',
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80
    }
  },
  
  // 覆盖率报告类型
  coverageReporters: ['text', 'lcov'],
  
  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // TypeScript处理
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // 自动清除mock
  clearMocks: true,
  
  // 是否使用详细输出
  verbose: true,
  
  // 设置测试超时时间（毫秒）
  testTimeout: 30000
}; 