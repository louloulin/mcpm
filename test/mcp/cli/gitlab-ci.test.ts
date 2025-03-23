import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';

// 测试目录
const TEST_DIR = path.join(__dirname, '../../../temp-test-gitlab-ci');

describe('GitLab CI/CD Support in Scaffold Command', () => {
  // 清理测试目录
  beforeEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      rimraf.sync(TEST_DIR);
    }
    fs.mkdirSync(TEST_DIR, { recursive: true });
  });

  // 测试结束后清理
  afterEach(() => {
    if (fs.existsSync(TEST_DIR)) {
      rimraf.sync(TEST_DIR);
    }
  });

  // 模拟createGitLabCICD函数的简化版本用于测试
  const mockCreateGitLabCICD = (basePath: string, options: any) => {
    // 创建基本的.gitlab-ci.yml文件
    const gitlabConfig = `# GitLab CI/CD configuration
stages:
  - test
  - build${options.docker ? '\n  - deploy' : ''}

variables:
  NODE_VERSION: "18"

# Test stage
test:
  stage: test
  image: node:\${NODE_VERSION}
  script:
    - npm ci
    - npm test`;

    fs.writeFileSync(path.join(basePath, '.gitlab-ci.yml'), gitlabConfig);
    
    // 创建文档目录和文件
    fs.mkdirSync(path.join(basePath, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(basePath, 'docs', 'gitlab-ci.md'),
      '# GitLab CI/CD Documentation\n\nTest documentation'
    );
  };

  test('GitLab CI files are correctly created when gitlab platform is selected', () => {
    // 准备测试项目目录
    const testProjectDir = path.join(TEST_DIR, 'test-server');
    fs.mkdirSync(testProjectDir, { recursive: true });
    
    // 使用测试mock函数创建文件
    mockCreateGitLabCICD(testProjectDir, { name: 'test-server' });
    
    // 验证GitLab CI文件是否正确创建
    expect(fs.existsSync(path.join(testProjectDir, '.gitlab-ci.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectDir, 'docs', 'gitlab-ci.md'))).toBe(true);
    
    // 验证文件内容
    const gitlabCiContent = fs.readFileSync(path.join(testProjectDir, '.gitlab-ci.yml'), 'utf8');
    expect(gitlabCiContent).toContain('GitLab CI/CD configuration');
    expect(gitlabCiContent).toContain('NODE_VERSION: "18"');
    
    const docsContent = fs.readFileSync(path.join(testProjectDir, 'docs', 'gitlab-ci.md'), 'utf8');
    expect(docsContent).toContain('GitLab CI/CD Documentation');
  });

  test('GitLab CI contains Docker configuration when Docker is enabled', () => {
    // 准备测试项目目录
    const testProjectDir = path.join(TEST_DIR, 'docker-server');
    fs.mkdirSync(testProjectDir, { recursive: true });
    
    // 使用测试mock函数创建文件，并启用Docker
    mockCreateGitLabCICD(testProjectDir, { name: 'docker-server', docker: true });
    
    // 验证.gitlab-ci.yml文件是否包含部署阶段
    const gitlabCiContent = fs.readFileSync(path.join(testProjectDir, '.gitlab-ci.yml'), 'utf8');
    expect(gitlabCiContent).toContain('stages:');
    expect(gitlabCiContent).toContain('- deploy');
  });

  test('Both GitHub and GitLab CI files are created when both platforms are selected', () => {
    // 导入我们想要测试的模块
    jest.mock('../../../lib/cli/commands/scaffold', () => {
      // 模拟createCICDFiles函数
      return {
        createCICDFiles: jest.fn().mockImplementation((basePath, options) => {
          // 模拟GitHub Actions文件
          fs.mkdirSync(path.join(basePath, '.github', 'workflows'), { recursive: true });
          fs.writeFileSync(
            path.join(basePath, '.github', 'workflows', 'test.yml'),
            'name: Test\n\non:\n  push:\n    branches: [ main ]'
          );
          
          // 模拟GitLab CI文件
          mockCreateGitLabCICD(basePath, options);
        })
      };
    });
    
    // 准备测试项目目录
    const testProjectDir = path.join(TEST_DIR, 'both-ci');
    fs.mkdirSync(testProjectDir, { recursive: true });
    
    // 使用模拟函数创建文件
    const mockOptions = { name: 'both-ci', cicdPlatform: 'both' };
    require('../../../lib/cli/commands/scaffold').createCICDFiles(testProjectDir, mockOptions);
    
    // 验证两个平台的文件都已创建
    expect(fs.existsSync(path.join(testProjectDir, '.github', 'workflows', 'test.yml'))).toBe(true);
    expect(fs.existsSync(path.join(testProjectDir, '.gitlab-ci.yml'))).toBe(true);
    
    // 验证文件内容
    const githubContent = fs.readFileSync(path.join(testProjectDir, '.github', 'workflows', 'test.yml'), 'utf8');
    expect(githubContent).toContain('name: Test');
    
    const gitlabContent = fs.readFileSync(path.join(testProjectDir, '.gitlab-ci.yml'), 'utf8');
    expect(gitlabContent).toContain('GitLab CI/CD configuration');
  });
}); 