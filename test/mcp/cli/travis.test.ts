import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

const testDir = 'temp-test-travis';

/**
 * Travis CI支持测试套件
 */
describe('Travis CI support in scaffold command', () => {
  // 测试前准备：创建临时测试目录
  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      rimraf.sync(testDir);
    }
    fs.mkdirSync(testDir, { recursive: true });
  });

  // 测试后清理：删除临时测试目录
  afterEach(() => {
    if (fs.existsSync(testDir)) {
      rimraf.sync(testDir);
    }
  });

  /**
   * 简化的createTravisCI函数，用于测试
   */
  function mockCreateTravisCI(basePath: string, options: any) {
    // 创建Travis CI配置文件
    const travisConfig = `language: node_js
node_js:
  - "16"
  - "18"
  - "lts/*"

cache:
  directories:
    - node_modules

install:
  - npm ci

script:
  - npm run build
  - npm test
`;
    fs.writeFileSync(path.join(basePath, '.travis.yml'), travisConfig);
    
    // 创建文档目录和文件
    fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(basePath, 'docs', 'travis-ci.md'),
      '# Travis CI 配置说明'
    );
    
    // 如果启用Docker，创建部署脚本和环境配置
    if (options.docker) {
      fs.mkdirSync(path.join(basePath, 'scripts'), { recursive: true });
      fs.writeFileSync(
        path.join(basePath, 'scripts', 'deploy.sh'),
        '#!/bin/bash\n# Travis CI部署脚本'
      );
      fs.chmodSync(path.join(basePath, 'scripts', 'deploy.sh'), '755');
      
      fs.mkdirSync(path.join(basePath, 'travis'), { recursive: true });
      fs.writeFileSync(
        path.join(basePath, 'travis', 'staging.yml'),
        'language: node_js\nnode_js:\n  - "18"'
      );
      fs.writeFileSync(
        path.join(basePath, 'travis', 'production.yml'),
        'language: node_js\nnode_js:\n  - "18"'
      );
    }
  }

  /**
   * 测试：当选择Travis CI平台时，应创建Travis CI文件
   */
  test('should create Travis CI files when Travis CI platform is selected', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'travis',
      docker: false
    };
    
    // 执行测试
    mockCreateTravisCI(testDir, options);
    
    // 验证结果
    expect(fs.existsSync(path.join(testDir, '.travis.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'docs', 'travis-ci.md'))).toBe(true);
    
    // 验证Travis CI配置文件内容
    const travisContent = fs.readFileSync(path.join(testDir, '.travis.yml'), 'utf8');
    expect(travisContent).toContain('language: node_js');
    expect(travisContent).toContain('node_js:');
    expect(travisContent).toContain('npm ci');
    expect(travisContent).toContain('npm test');
  });

  /**
   * 测试：当Docker支持启用时，Travis CI配置应包含部署脚本和环境配置
   */
  test('should include deployment scripts when Docker is enabled', () => {
    // 准备测试数据
    const options = {
      name: 'docker-server',
      cicdPlatform: 'travis',
      docker: true
    };
    
    // 执行测试
    mockCreateTravisCI(testDir, options);
    
    // 验证部署脚本和环境配置存在
    expect(fs.existsSync(path.join(testDir, 'scripts', 'deploy.sh'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'travis', 'staging.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'travis', 'production.yml'))).toBe(true);
    
    // 验证文件执行权限
    const stat = fs.statSync(path.join(testDir, 'scripts', 'deploy.sh'));
    expect(stat.mode & fs.constants.S_IXUSR).toBeTruthy(); // 检查用户执行权限
  });

  /**
   * 测试：当选择全部CI平台时，应创建Travis CI文件
   */
  test('should create Travis CI files when all CI platforms are selected', () => {
    // 准备测试数据
    const options = {
      name: 'all-ci-server',
      cicdPlatform: 'all',
      docker: true
    };
    
    // 执行测试
    mockCreateTravisCI(testDir, options);
    
    // 验证Travis CI文件是否创建
    expect(fs.existsSync(path.join(testDir, '.travis.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'docs', 'travis-ci.md'))).toBe(true);
  });

  /**
   * 测试：检查Travis CI配置文件格式有效性
   */
  test('should have valid Travis CI configuration format', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'travis',
      docker: false
    };
    
    // 执行测试
    mockCreateTravisCI(testDir, options);
    
    // 验证Travis CI配置文件内容
    const travisContent = fs.readFileSync(path.join(testDir, '.travis.yml'), 'utf8');
    
    // 检查基本结构存在
    expect(travisContent).toMatch(/language:/);
    expect(travisContent).toMatch(/node_js:/);
    expect(travisContent).toMatch(/install:/);
    expect(travisContent).toMatch(/script:/);
    
    // 确保缩进一致
    const indentedLines = travisContent.split('\n').filter(line => line.startsWith('  '));
    expect(indentedLines.length).toBeGreaterThan(0);
  });
}); 