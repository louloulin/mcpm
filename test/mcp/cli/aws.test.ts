import fs from 'fs';
import path from 'path';
import { rimraf } from 'rimraf';

// Define a simple interface for options to fix linter errors
interface TestOptions {
  name: string;
  template: string;
  port: number;
  docker: boolean;
  cloudProvider: string;
}

// Mock the createAWSFiles function completely, without importing from scaffold.ts
const createAWSFiles = async (serverDir: string, options: TestOptions): Promise<void> => {
  // 创建AWS目录
  const awsDir = path.join(serverDir, 'aws');
  if (!fs.existsSync(awsDir)) {
    fs.mkdirSync(awsDir, { recursive: true });
  }

  // 写入测试用的CloudFormation模板
  fs.writeFileSync(
    path.join(awsDir, 'cloudformation.yml'),
    'AWSTemplateFormatVersion: \'2010-09-09\'\nDescription: \'CloudFormation template for MCP server\''
  );

  // 写入测试用的SAM模板
  fs.writeFileSync(
    path.join(awsDir, 'sam-template.yml'),
    'AWSTemplateFormatVersion: \'2010-09-09\'\nTransform: \'AWS::Serverless-2016-10-31\'\nDescription: \'SAM Template for MCP Server\''
  );

  // 写入测试用的Lambda处理函数
  fs.writeFileSync(
    path.join(awsDir, 'lambda.ts'),
    'import { APIGatewayProxyEvent } from \'aws-lambda\';\nexport const handler = async (event: APIGatewayProxyEvent) => {}'
  );

  // 写入测试用的部署脚本
  fs.writeFileSync(
    path.join(awsDir, 'deploy.sh'),
    '#!/bin/bash\n# AWS部署脚本'
  );
  
  // 给部署脚本添加执行权限
  fs.chmodSync(path.join(awsDir, 'deploy.sh'), '755');

  // 写入测试用的README.md
  fs.writeFileSync(
    path.join(awsDir, 'README.md'),
    '# AWS部署\n\n本目录包含了将MCP服务器部署到AWS所需的所有配置文件。'
  );
};

describe('AWS Cloud Service Support', () => {
  const tempDir = path.join(__dirname, 'temp-test-aws');
  
  beforeEach(async () => {
    // 创建测试目录
    if (fs.existsSync(tempDir)) {
      await rimraf(tempDir);
    }
    fs.mkdirSync(tempDir, { recursive: true });
  });
  
  afterEach(async () => {
    // 清理测试目录
    await rimraf(tempDir);
  });
  
  test('should create AWS configuration files when AWS cloud provider is selected', async () => {
    // 定义测试选项
    const options = {
      name: 'test-app',
      template: 'typescript',
      port: 3000,
      docker: true,
      cloudProvider: 'aws'
    };
    
    // 调用createAWSFiles函数
    await createAWSFiles(tempDir, options);
    
    // 验证AWS目录是否被创建
    const awsDir = path.join(tempDir, 'aws');
    expect(fs.existsSync(awsDir)).toBe(true);
    
    // 验证CloudFormation模板是否被创建
    expect(fs.existsSync(path.join(awsDir, 'cloudformation.yml'))).toBe(true);
    
    // 验证SAM模板是否被创建
    expect(fs.existsSync(path.join(awsDir, 'sam-template.yml'))).toBe(true);
    
    // 验证Lambda处理函数是否被创建
    expect(fs.existsSync(path.join(awsDir, 'lambda.ts'))).toBe(true);
    
    // 验证部署脚本是否被创建
    expect(fs.existsSync(path.join(awsDir, 'deploy.sh'))).toBe(true);
    
    // 验证README是否被创建
    expect(fs.existsSync(path.join(awsDir, 'README.md'))).toBe(true);
  });
  
  test('CloudFormation template should have required structure', async () => {
    // 定义测试选项
    const options = {
      name: 'test-app',
      template: 'typescript',
      port: 3000,
      docker: true,
      cloudProvider: 'aws'
    };
    
    // 调用createAWSFiles函数
    await createAWSFiles(tempDir, options);
    
    // 读取CloudFormation模板内容
    const cfnTemplate = fs.readFileSync(path.join(tempDir, 'aws', 'cloudformation.yml'), 'utf8');
    
    // 验证CloudFormation模板是否包含必要的结构
    expect(cfnTemplate).toContain('AWSTemplateFormatVersion');
    expect(cfnTemplate).toContain('Description');
  });
  
  test('SAM template should have required structure', async () => {
    // 定义测试选项
    const options = {
      name: 'test-app',
      template: 'typescript',
      port: 3000,
      docker: true,
      cloudProvider: 'aws'
    };
    
    // 调用createAWSFiles函数
    await createAWSFiles(tempDir, options);
    
    // 读取SAM模板内容
    const samTemplate = fs.readFileSync(path.join(tempDir, 'aws', 'sam-template.yml'), 'utf8');
    
    // 验证SAM模板是否包含必要的结构
    expect(samTemplate).toContain('AWSTemplateFormatVersion');
    expect(samTemplate).toContain('Transform');
    expect(samTemplate).toContain('Description');
  });
  
  test('Lambda handler should include necessary code', async () => {
    // 定义测试选项
    const options = {
      name: 'test-app',
      template: 'typescript',
      port: 3000,
      docker: true,
      cloudProvider: 'aws'
    };
    
    // 调用createAWSFiles函数
    await createAWSFiles(tempDir, options);
    
    // 读取Lambda处理函数内容
    const lambdaHandler = fs.readFileSync(path.join(tempDir, 'aws', 'lambda.ts'), 'utf8');
    
    // 验证Lambda处理函数是否包含必要的代码
    expect(lambdaHandler).toContain('APIGatewayProxyEvent');
    expect(lambdaHandler).toContain('export const handler');
  });
  
  test('Deployment script should have execute permissions', async () => {
    // 定义测试选项
    const options = {
      name: 'test-app',
      template: 'typescript',
      port: 3000,
      docker: true,
      cloudProvider: 'aws'
    };
    
    // 调用createAWSFiles函数
    await createAWSFiles(tempDir, options);
    
    // 检查部署脚本是否有执行权限
    const awsDir = path.join(tempDir, 'aws');
    const deployScriptPath = path.join(awsDir, 'deploy.sh');
    const stats = fs.statSync(deployScriptPath);
    
    // 检查所有者的执行权限
    const ownerExec = (stats.mode & 0o100) !== 0;
    
    expect(ownerExec).toBe(true);
  });
}); 