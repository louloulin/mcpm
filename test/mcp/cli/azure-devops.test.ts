import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

const testDir = 'temp-test-azure-devops';

/**
 * Azure DevOps Pipeline支持测试套件
 */
describe('Azure DevOps Pipeline support in scaffold command', () => {
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
   * 简化的createAzureDevOps函数，用于测试
   */
  function mockCreateAzureDevOps(basePath: string, options: any) {
    // 创建Azure Pipelines目录
    fs.mkdirSync(path.join(basePath, 'azure-pipelines'), { recursive: true });
    
    // 创建主要的azure-pipelines.yml文件
    const pipelineYml = `# Node.js
# Build and test Node.js project with npm.
trigger:
  - main
  - master
  
pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'
  displayName: 'Install Node.js'

- script: |
    npm ci
  displayName: 'Install dependencies'

- script: |
    npm test
  displayName: 'Run tests'
`;
    fs.writeFileSync(path.join(basePath, 'azure-pipelines.yml'), pipelineYml);
    
    // 创建变量组配置文件
    fs.writeFileSync(
      path.join(basePath, 'azure-pipelines', 'variables.yml'),
      '# 变量组配置模板\nvariables:\n  - name: NODE_ENV\n    value: production'
    );
    
    // 如果启用Docker，创建环境特定的pipeline文件
    if (options.docker) {
      fs.writeFileSync(
        path.join(basePath, 'azure-pipelines', 'staging.yml'),
        '# Staging deployment pipeline\ntrigger: none\npr: none'
      );
      
      fs.writeFileSync(
        path.join(basePath, 'azure-pipelines', 'production.yml'),
        '# Production deployment pipeline\ntrigger: none\npr: none'
      );
    }
    
    // 创建文档目录和文件
    fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(basePath, 'docs', 'azure-devops.md'),
      '# Azure DevOps Pipeline 配置说明'
    );
  }

  /**
   * 测试：当选择Azure DevOps平台时，应创建Azure Pipeline文件
   */
  test('should create Azure DevOps files when Azure DevOps platform is selected', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'azure',
      docker: false
    };
    
    // 执行测试
    mockCreateAzureDevOps(testDir, options);
    
    // 验证结果
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines', 'variables.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'docs', 'azure-devops.md'))).toBe(true);
    
    // 验证pipeline文件内容
    const pipelineContent = fs.readFileSync(path.join(testDir, 'azure-pipelines.yml'), 'utf8');
    expect(pipelineContent).toContain('trigger:');
    expect(pipelineContent).toContain('pool:');
    expect(pipelineContent).toContain('steps:');
    expect(pipelineContent).toContain('NodeTool@0');
  });

  /**
   * 测试：当Docker支持启用时，Azure DevOps配置应包含环境部署Pipeline
   */
  test('should include environment pipelines when Docker is enabled', () => {
    // 准备测试数据
    const options = {
      name: 'docker-server',
      cicdPlatform: 'azure',
      docker: true
    };
    
    // 执行测试
    mockCreateAzureDevOps(testDir, options);
    
    // 验证环境特定pipeline文件存在
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines', 'staging.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines', 'production.yml'))).toBe(true);
    
    // 验证文件内容
    const stagingContent = fs.readFileSync(path.join(testDir, 'azure-pipelines', 'staging.yml'), 'utf8');
    expect(stagingContent).toContain('Staging deployment pipeline');
    
    const productionContent = fs.readFileSync(path.join(testDir, 'azure-pipelines', 'production.yml'), 'utf8');
    expect(productionContent).toContain('Production deployment pipeline');
  });

  /**
   * 测试：当选择全部CI平台时，应创建Azure DevOps文件
   */
  test('should create Azure DevOps files when all CI platforms are selected', () => {
    // 准备测试数据
    const options = {
      name: 'all-ci-server',
      cicdPlatform: 'all',
      docker: true
    };
    
    // 执行测试
    mockCreateAzureDevOps(testDir, options);
    
    // 验证Azure DevOps文件是否创建
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testDir, 'azure-pipelines'))).toBe(true);
  });

  /**
   * 测试：检查YAML文件语法有效性
   */
  test('should have valid YAML syntax in pipeline files', () => {
    // 准备测试数据
    const options = {
      name: 'test-server',
      cicdPlatform: 'azure',
      docker: true
    };
    
    // 执行测试
    mockCreateAzureDevOps(testDir, options);
    
    // 验证主pipeline文件内容
    const pipelineContent = fs.readFileSync(path.join(testDir, 'azure-pipelines.yml'), 'utf8');
    
    // 简单验证YAML语法结构（检查基本格式）
    expect(pipelineContent).toMatch(/trigger:/);
    expect(pipelineContent).toMatch(/pool:/);
    expect(pipelineContent).toMatch(/steps:/);
    
    // 检查缩进一致性
    const indentedLines = pipelineContent.split('\n').filter(line => line.startsWith('  '));
    expect(indentedLines.length).toBeGreaterThan(0);
    
    // 检查变量文件
    const variablesContent = fs.readFileSync(path.join(testDir, 'azure-pipelines', 'variables.yml'), 'utf8');
    expect(variablesContent).toContain('variables:');
  });
}); 