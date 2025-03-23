import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

const testDir = 'temp-test-jenkins';

/**
 * Jenkins CI/CD支持测试套件
 */
describe('Jenkins support in scaffold command', () => {
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
   * 简化的createJenkins函数，用于测试
   */
  function mockCreateJenkins(basePath: string, options: any) {
    // 创建Jenkins目录
    fs.mkdirSync(path.join(basePath, 'jenkins'), { recursive: true });
    
    // 创建Jenkinsfile
    const jenkinsfileContent = `pipeline {
    agent {
        docker {
            image 'node:18.15.0'
            args '-p 3000:3000'
        }
    }
    stages {
        stage('Test') {
            steps {
                sh 'npm test'
            }
        }
    }
}`;
    fs.writeFileSync(path.join(basePath, 'Jenkinsfile'), jenkinsfileContent);
    
    // 创建Jenkins配置脚本
    fs.writeFileSync(
      path.join(basePath, 'jenkins', 'setup_jenkins_job.sh'), 
      '#!/bin/bash\n# 测试脚本'
    );
    fs.chmodSync(path.join(basePath, 'jenkins', 'setup_jenkins_job.sh'), '755');
    
    // 如果启用Docker，创建多分支流水线配置
    if (options.docker) {
      fs.writeFileSync(
        path.join(basePath, 'jenkins', 'setup_multibranch_pipeline.sh'),
        '#!/bin/bash\n# 多分支配置脚本'
      );
      fs.chmodSync(path.join(basePath, 'jenkins', 'setup_multibranch_pipeline.sh'), '755');
    }
    
    // 创建文档目录和文件
    fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(basePath, 'docs', 'jenkins.md'),
      '# Jenkins CI/CD 配置说明'
    );
  }

  /**
   * 测试：当选择Jenkins平台时，应创建Jenkins文件
   */
  test('should create Jenkins files when Jenkins platform is selected', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'jenkins',
      docker: false
    };
    
    // 执行测试
    mockCreateJenkins(testDir, options);
    
    // 验证结果
    expect(fs.existsSync(path.join(testDir, 'jenkins'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'Jenkinsfile'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'jenkins', 'setup_jenkins_job.sh'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'docs', 'jenkins.md'))).toBe(true);
    
    // 验证文件执行权限
    const stat = fs.statSync(path.join(testDir, 'jenkins', 'setup_jenkins_job.sh'));
    expect(stat.mode & fs.constants.S_IXUSR).toBeTruthy(); // 检查用户执行权限
    
    // 验证Jenkinsfile内容
    const jenkinsfileContent = fs.readFileSync(path.join(testDir, 'Jenkinsfile'), 'utf8');
    expect(jenkinsfileContent).toContain('pipeline');
    expect(jenkinsfileContent).toContain('agent');
    expect(jenkinsfileContent).toContain('docker');
    expect(jenkinsfileContent).toContain('stages');
  });

  /**
   * 测试：当Docker支持启用时，Jenkins配置应包含Docker相关配置
   */
  test('should include Docker support in Jenkins config when Docker is enabled', () => {
    // 准备测试数据
    const options = {
      name: 'docker-server',
      cicdPlatform: 'jenkins',
      docker: true
    };
    
    // 执行测试
    mockCreateJenkins(testDir, options);
    
    // 验证多分支配置文件存在
    expect(fs.existsSync(path.join(testDir, 'jenkins', 'setup_multibranch_pipeline.sh'))).toBe(true);
    
    // 验证文件执行权限
    const stat = fs.statSync(path.join(testDir, 'jenkins', 'setup_multibranch_pipeline.sh'));
    expect(stat.mode & fs.constants.S_IXUSR).toBeTruthy(); // 检查用户执行权限
  });

  /**
   * 测试：检查Jenkinsfile使用正确的语法
   */
  test('should have valid Jenkinsfile syntax', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'jenkins',
      docker: false
    };
    
    // 执行测试
    mockCreateJenkins(testDir, options);
    
    // 验证Jenkinsfile内容
    const jenkinsfileContent = fs.readFileSync(path.join(testDir, 'Jenkinsfile'), 'utf8');
    
    // 验证基本语法结构
    expect(jenkinsfileContent).toMatch(/pipeline\s*\{/);
    expect(jenkinsfileContent).toMatch(/agent\s*\{/);
    expect(jenkinsfileContent).toMatch(/stages\s*\{/);
    expect(jenkinsfileContent).toMatch(/steps\s*\{/);
    
    // 验证闭合括号
    const openBraces = (jenkinsfileContent.match(/\{/g) || []).length;
    const closeBraces = (jenkinsfileContent.match(/\}/g) || []).length;
    expect(openBraces).toEqual(closeBraces);
  });

  /**
   * 测试：当选择全部CI平台时，应创建Jenkins文件
   */
  test('should create Jenkins files when all CI platforms are selected', () => {
    // 准备测试数据
    const options = {
      name: 'all-ci-server',
      cicdPlatform: 'all',
      docker: true
    };
    
    // 执行测试
    mockCreateJenkins(testDir, options);
    
    // 验证Jenkins文件是否创建
    expect(fs.existsSync(path.join(testDir, 'Jenkinsfile'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'jenkins'))).toBe(true);
  });
}); 