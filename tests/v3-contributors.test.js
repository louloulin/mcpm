/**
 * MCPM 3.0 贡献者计划测试
 * 
 * 测试贡献者计划功能，包括贡献者管理、贡献统计和徽章系统
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const ContributorProgram = require('../lib/v3/community/contributors');

describe('贡献者计划测试', () => {
  let contributorProgram;
  let tempDir;

  // 测试前设置
  before(async () => {
    // 创建临时目录
    tempDir = path.join(os.tmpdir(), `mcpm-contrib-test-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });

    // 创建带模拟API的贡献者计划实例
    contributorProgram = new ContributorProgram({
      storageDir: tempDir,
      apiBaseUrl: 'mock://api.mcpm.io/contributors', // 模拟API，避免实际网络请求
      autoSync: false // 禁用自动同步以便于测试
    });

    // 初始化贡献者计划
    await contributorProgram.init();
  });

  // 测试后清理
  after(async () => {
    // 清理临时目录
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      console.error('清理临时目录失败:', error);
    }
  });

  // 测试ContributorProgram类导出
  it('应正确导出ContributorProgram类', () => {
    assert.strictEqual(typeof ContributorProgram, 'function', 'ContributorProgram应该是一个类');
    assert.strictEqual(typeof contributorProgram.init, 'function', '应该有init方法');
    assert.strictEqual(typeof contributorProgram.getContributors, 'function', '应该有getContributors方法');
    assert.strictEqual(typeof contributorProgram.registerContributor, 'function', '应该有registerContributor方法');
    assert.strictEqual(typeof contributorProgram.recordContribution, 'function', '应该有recordContribution方法');
  });

  // 测试贡献者注册
  it('应正确注册新贡献者', async () => {
    const contributorData = {
      username: 'testuser',
      email: 'test@example.com',
      displayName: '测试用户',
      bio: '这是一个测试用户',
      avatar: 'https://example.com/avatar.png'
    };

    const result = await contributorProgram.registerContributor(contributorData);

    assert.strictEqual(result.success, true, '注册应成功');
    assert.ok(result.contributor, '应返回贡献者数据');
    assert.strictEqual(result.contributor.username, 'testuser', '用户名应匹配');
    assert.strictEqual(result.contributor.email, 'test@example.com', '邮箱应匹配');
    
    // 验证ID生成
    assert.ok(result.contributor.id, '应生成ID');
    
    // 验证统计数据初始化
    assert.deepStrictEqual(
      result.contributor.stats, 
      { contributions: 0, plugins: 0, templates: 0, points: 0 },
      '应初始化统计数据'
    );
  });

  // 测试贡献者注册验证
  it('应验证贡献者数据', async () => {
    // 缺少必要字段
    const invalidData1 = {
      username: 'testuser2'
      // 缺少email
    };

    const result1 = await contributorProgram.registerContributor(invalidData1);
    assert.strictEqual(result1.success, false, '缺少必要字段应失败');
    assert.ok(result1.error.includes('缺少必需字段'), '应提示缺少必要字段');

    // 无效的电子邮件
    const invalidData2 = {
      username: 'testuser2',
      email: 'invalid-email'
    };

    const result2 = await contributorProgram.registerContributor(invalidData2);
    assert.strictEqual(result2.success, false, '无效邮箱应失败');
    assert.ok(result2.error.includes('无效的电子邮件格式'), '应提示无效邮箱');

    // 无效的用户名
    const invalidData3 = {
      username: 'test user', // 包含空格
      email: 'test2@example.com'
    };

    const result3 = await contributorProgram.registerContributor(invalidData3);
    assert.strictEqual(result3.success, false, '无效用户名应失败');
    assert.ok(result3.error.includes('无效的用户名格式'), '应提示无效用户名');
  });

  // 测试重复贡献者
  it('应检测重复的贡献者', async () => {
    // 获取之前注册的贡献者ID
    const contributors = await contributorProgram.getContributors();
    const existingId = contributors[0].id;

    // 尝试注册相同ID的贡献者
    const duplicateData = {
      id: existingId,
      username: 'another',
      email: 'another@example.com'
    };

    const result = await contributorProgram.registerContributor(duplicateData);
    assert.strictEqual(result.success, false, '重复ID应失败');
    assert.ok(result.error.includes('贡献者ID已存在'), '应提示ID已存在');
  });

  // 测试记录贡献
  it('应正确记录贡献', async () => {
    // 获取贡献者ID
    const contributors = await contributorProgram.getContributors();
    const contributorId = contributors[0].id;

    // 记录插件贡献
    const contributionData = {
      contributorId,
      projectId: 'test-project',
      type: 'plugin',
      details: {
        projectName: '测试项目',
        projectDescription: '这是一个测试项目',
        complexity: 'medium',
        quality: 'good',
        testCoverage: 80,
        documentation: true
      }
    };

    const result = await contributorProgram.recordContribution(contributionData);

    assert.strictEqual(result.success, true, '记录贡献应成功');
    assert.ok(result.contribution, '应返回贡献数据');
    assert.strictEqual(result.contribution.contributorId, contributorId, '贡献者ID应匹配');
    assert.strictEqual(result.contribution.type, 'plugin', '贡献类型应匹配');
    
    // 验证点数计算
    assert.ok(result.contribution.points > 0, '应计算点数');
    
    // 验证贡献者统计更新
    assert.strictEqual(result.contributorStats.contributions, 1, '贡献计数应更新');
    assert.strictEqual(result.contributorStats.plugins, 1, '插件计数应更新');
    assert.strictEqual(result.contributorStats.points, result.contribution.points, '点数应更新');
  });

  // 测试贡献验证
  it('应验证贡献数据', async () => {
    // 获取贡献者ID
    const contributors = await contributorProgram.getContributors();
    const contributorId = contributors[0].id;

    // 缺少必要字段
    const invalidData1 = {
      contributorId,
      projectId: 'test-project'
      // 缺少type和details
    };

    const result1 = await contributorProgram.recordContribution(invalidData1);
    assert.strictEqual(result1.success, false, '缺少必要字段应失败');
    assert.ok(result1.error.includes('缺少必需字段'), '应提示缺少必要字段');

    // 无效的贡献类型
    const invalidData2 = {
      contributorId,
      projectId: 'test-project',
      type: 'invalid-type',
      details: {}
    };

    const result2 = await contributorProgram.recordContribution(invalidData2);
    assert.strictEqual(result2.success, false, '无效贡献类型应失败');
    assert.ok(result2.error.includes('无效的贡献类型'), '应提示无效贡献类型');

    // 无效的贡献者ID
    const invalidData3 = {
      contributorId: 'non-existent-id',
      projectId: 'test-project',
      type: 'plugin',
      details: {}
    };

    const result3 = await contributorProgram.recordContribution(invalidData3);
    assert.strictEqual(result3.success, false, '无效贡献者ID应失败');
    assert.ok(result3.error.includes('贡献者不存在'), '应提示贡献者不存在');
  });

  // 测试徽章解锁
  it('应正确解锁第一次贡献徽章', async () => {
    // 因为之前的测试已经记录了一次贡献，所以应该已经解锁了第一次贡献徽章
    const contributors = await contributorProgram.getContributors();
    const contributorId = contributors[0].id;
    
    // 获取贡献者详情，包括徽章
    const contributor = await contributorProgram.getContributor(contributorId);
    
    // 验证是否有第一次贡献徽章
    const firstContributionBadge = contributor.badges.find(b => b.id === 'first-contribution');
    assert.ok(firstContributionBadge, '应解锁第一次贡献徽章');
    assert.strictEqual(firstContributionBadge.name, '第一次贡献', '徽章名称应正确');
  });

  // 测试插件贡献徽章
  it('应正确解锁插件贡献徽章', async () => {
    // 因为之前的测试已经记录了一次插件贡献，所以应该已经解锁了插件徽章
    const contributors = await contributorProgram.getContributors();
    const contributorId = contributors[0].id;
    
    // 获取贡献者详情，包括徽章
    const contributor = await contributorProgram.getContributor(contributorId);
    
    // 验证是否有插件徽章
    const pluginBadge = contributor.badges.find(b => b.id === 'first-plugin');
    assert.ok(pluginBadge, '应解锁第一个插件徽章');
    assert.strictEqual(pluginBadge.name, '第一个插件', '徽章名称应正确');
  });

  // 测试获取贡献者列表
  it('应正确获取所有贡献者', async () => {
    const contributors = await contributorProgram.getContributors();
    assert.ok(Array.isArray(contributors), '应返回数组');
    assert.strictEqual(contributors.length, 1, '应有一个贡献者');
    assert.strictEqual(contributors[0].username, 'testuser', '用户名应匹配');
  });

  // 测试获取贡献者详情
  it('应正确获取贡献者详情', async () => {
    const contributors = await contributorProgram.getContributors();
    const contributorId = contributors[0].id;
    
    const contributor = await contributorProgram.getContributor(contributorId);
    assert.strictEqual(contributor.username, 'testuser', '用户名应匹配');
    assert.ok(Array.isArray(contributor.badges), '应包含徽章列表');
    assert.ok(Array.isArray(contributor.projects), '应包含项目列表');
    assert.strictEqual(contributor.projects.length, 1, '应有一个项目');
    assert.strictEqual(contributor.projects[0].id, 'test-project', '项目ID应匹配');
  });

  // 测试获取项目列表
  it('应正确获取所有项目', async () => {
    const projects = await contributorProgram.getProjects();
    assert.ok(Array.isArray(projects), '应返回数组');
    assert.strictEqual(projects.length, 1, '应有一个项目');
    assert.strictEqual(projects[0].id, 'test-project', '项目ID应匹配');
    assert.strictEqual(projects[0].name, '测试项目', '项目名称应匹配');
    assert.ok(Array.isArray(projects[0].contributions), '应包含贡献列表');
    assert.strictEqual(projects[0].contributions.length, 1, '应有一个贡献');
  });

  // 测试获取项目详情
  it('应正确获取项目详情', async () => {
    const project = await contributorProgram.getProject('test-project');
    assert.strictEqual(project.id, 'test-project', '项目ID应匹配');
    assert.strictEqual(project.name, '测试项目', '项目名称应匹配');
    assert.strictEqual(project.description, '这是一个测试项目', '项目描述应匹配');
  });

  // 测试获取徽章列表
  it('应正确获取所有徽章', async () => {
    const badges = await contributorProgram.getBadges();
    assert.ok(Array.isArray(badges), '应返回数组');
    assert.ok(badges.length >= 2, '应至少有两个徽章'); // 第一次贡献和第一个插件徽章
  });

  // 测试点数计算
  it('应正确计算贡献点数', () => {
    // 基本的插件贡献
    const basicPoints = contributorProgram.calculatePoints('plugin', {});
    assert.strictEqual(basicPoints, 10, '插件基础点数应为10');
    
    // 高复杂度插件
    const complexPoints = contributorProgram.calculatePoints('plugin', { complexity: 'high' });
    assert.strictEqual(complexPoints, 20, '高复杂度应双倍点数');
    
    // 优质贡献
    const qualityPoints = contributorProgram.calculatePoints('plugin', { quality: 'excellent' });
    assert.strictEqual(qualityPoints, 15, '优质贡献应增加50%点数');
    
    // 带测试覆盖率
    const testPoints = contributorProgram.calculatePoints('plugin', { testCoverage: 80 });
    assert.strictEqual(testPoints, 18, '测试覆盖率应增加8点');
    
    // 带文档
    const docPoints = contributorProgram.calculatePoints('plugin', { documentation: true });
    assert.strictEqual(docPoints, 12, '文档应增加2点');
    
    // 组合多个因素
    const combinedPoints = contributorProgram.calculatePoints('plugin', {
      complexity: 'high',
      quality: 'excellent',
      testCoverage: 90,
      documentation: true
    });
    // 计算: (10基础 * 2高复杂度 * 1.5优质) + 9测试覆盖 + 2文档 = 30 + 9 + 2 = 41
    assert.strictEqual(combinedPoints, 41, '组合因素应正确计算');
  });

  // 测试过滤功能
  it('应正确过滤贡献者', async () => {
    // 添加另一个贡献者
    await contributorProgram.registerContributor({
      username: 'anotheruser',
      email: 'another@example.com',
      displayName: '另一个用户'
    });
    
    // 按用户名搜索
    const searchResults = await contributorProgram.getContributors({ search: 'test' });
    assert.strictEqual(searchResults.length, 1, '搜索应匹配一个结果');
    assert.strictEqual(searchResults[0].username, 'testuser', '搜索结果应匹配');
    
    // 获取所有贡献者
    const allResults = await contributorProgram.getContributors();
    assert.strictEqual(allResults.length, 2, '应有两个贡献者');
  });

  // 测试统计数据
  it('应正确返回统计数据', () => {
    const stats = contributorProgram.getStats();
    assert.ok(stats, '应返回统计数据');
    assert.strictEqual(typeof stats.totalContributors, 'number', '应包含贡献者总数');
    assert.strictEqual(typeof stats.totalContributions, 'number', '应包含贡献总数');
    assert.strictEqual(typeof stats.lastUpdated, 'number', '应包含最后更新时间');
  });
}); 