/**
 * MCPM 3.0 贡献者计划管理模块
 * 
 * 管理贡献者信息、贡献统计和奖励机制
 */

const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const fetch = require('node-fetch');

/**
 * 贡献者计划管理类
 */
class ContributorProgram {
  /**
   * 创建贡献者计划实例
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      // 存储目录
      storageDir: options.storageDir || path.join(process.cwd(), '.mcpm', 'community', 'contributors'),
      // 远程API基础URL
      apiBaseUrl: options.apiBaseUrl || 'https://api.mcpm.io/contributors',
      // 缓存时间 (毫秒)
      cacheTime: options.cacheTime || 3600000, // 1小时
      // 是否自动同步
      autoSync: options.autoSync !== false,
      // 同步间隔 (毫秒)
      syncInterval: options.syncInterval || 86400000, // 24小时
      // 徽章服务URL
      badgeServiceUrl: options.badgeServiceUrl || 'https://badges.mcpm.io',
      ...options
    };

    // 贡献者数据缓存
    this.contributors = new Map();
    this.projects = new Map();
    this.badges = new Map();
    this.stats = {
      totalContributors: 0,
      activeContributors: 0,
      totalContributions: 0,
      lastUpdated: 0
    };
  }

  /**
   * 初始化贡献者计划
   */
  async init() {
    // 确保目录存在
    await this.ensureStorageDir();
    
    // 加载本地数据
    await this.loadLocalData();
    
    // 如果启用自动同步，则设置定时同步
    if (this.options.autoSync) {
      this.startAutoSync();
    }
    
    return this;
  }
  
  /**
   * 确保存储目录存在
   */
  async ensureStorageDir() {
    try {
      await fs.mkdir(this.options.storageDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`无法创建贡献者存储目录: ${error.message}`);
      }
    }
  }
  
  /**
   * 加载本地数据
   */
  async loadLocalData() {
    try {
      await Promise.all([
        this.loadContributors(),
        this.loadProjects(),
        this.loadBadges(),
        this.loadStats()
      ]);
    } catch (error) {
      console.error('加载贡献者数据失败:', error);
    }
  }
  
  /**
   * 加载贡献者数据
   */
  async loadContributors() {
    try {
      const contributorsFile = path.join(this.options.storageDir, 'contributors.json');
      const data = await fs.readFile(contributorsFile, 'utf8');
      const contributors = JSON.parse(data);
      
      for (const contributor of contributors) {
        this.contributors.set(contributor.id, contributor);
      }
      
      console.log(`已加载 ${this.contributors.size} 个贡献者`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载贡献者数据失败:', error);
      }
    }
  }
  
  /**
   * 加载项目数据
   */
  async loadProjects() {
    try {
      const projectsFile = path.join(this.options.storageDir, 'projects.json');
      const data = await fs.readFile(projectsFile, 'utf8');
      const projects = JSON.parse(data);
      
      for (const project of projects) {
        this.projects.set(project.id, project);
      }
      
      console.log(`已加载 ${this.projects.size} 个项目`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载项目数据失败:', error);
      }
    }
  }
  
  /**
   * 加载徽章数据
   */
  async loadBadges() {
    try {
      const badgesFile = path.join(this.options.storageDir, 'badges.json');
      const data = await fs.readFile(badgesFile, 'utf8');
      const badges = JSON.parse(data);
      
      for (const badge of badges) {
        this.badges.set(badge.id, badge);
      }
      
      console.log(`已加载 ${this.badges.size} 个徽章`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载徽章数据失败:', error);
      }
    }
  }
  
  /**
   * 加载统计数据
   */
  async loadStats() {
    try {
      const statsFile = path.join(this.options.storageDir, 'stats.json');
      const data = await fs.readFile(statsFile, 'utf8');
      this.stats = JSON.parse(data);
      
      console.log('已加载统计数据');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载统计数据失败:', error);
      }
    }
  }
  
  /**
   * 开始自动同步
   */
  startAutoSync() {
    // 同步间隔至少1分钟
    const interval = Math.max(60000, this.options.syncInterval);
    
    // 如果上次同步时间超过同步间隔，立即同步
    const timeSinceLastUpdate = Date.now() - this.stats.lastUpdated;
    if (timeSinceLastUpdate >= interval) {
      this.syncWithRemote().catch(err => {
        console.error('自动同步贡献者数据失败:', err);
      });
    }
    
    // 设置定时同步
    setInterval(() => {
      this.syncWithRemote().catch(err => {
        console.error('自动同步贡献者数据失败:', err);
      });
    }, interval);
  }
  
  /**
   * 与远程同步数据
   */
  async syncWithRemote() {
    console.log('开始同步贡献者数据...');
    
    try {
      // 获取上次同步时间
      const lastUpdated = this.stats.lastUpdated;
      
      // 同步贡献者
      await this.syncContributors(lastUpdated);
      
      // 同步项目
      await this.syncProjects(lastUpdated);
      
      // 同步徽章
      await this.syncBadges(lastUpdated);
      
      // 同步统计
      await this.syncStats();
      
      // 更新同步时间
      this.stats.lastUpdated = Date.now();
      await this.saveStats();
      
      console.log('贡献者数据同步完成');
    } catch (error) {
      console.error('同步贡献者数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 同步贡献者数据
   * @param {number} lastUpdated - 上次更新时间戳
   */
  async syncContributors(lastUpdated) {
    try {
      const url = `${this.options.apiBaseUrl}/list?since=${lastUpdated}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`同步贡献者失败: ${response.statusText}`);
      }
      
      const contributors = await response.json();
      
      if (contributors.length === 0) {
        console.log('没有新的贡献者更新');
        return;
      }
      
      // 更新贡献者数据
      for (const contributor of contributors) {
        this.contributors.set(contributor.id, contributor);
      }
      
      // 保存到文件
      await this.saveContributors();
      
      console.log(`已更新 ${contributors.length} 个贡献者`);
    } catch (error) {
      console.error('同步贡献者失败:', error);
    }
  }
  
  /**
   * 同步项目数据
   * @param {number} lastUpdated - 上次更新时间戳
   */
  async syncProjects(lastUpdated) {
    try {
      const url = `${this.options.apiBaseUrl}/projects?since=${lastUpdated}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`同步项目失败: ${response.statusText}`);
      }
      
      const projects = await response.json();
      
      if (projects.length === 0) {
        console.log('没有新的项目更新');
        return;
      }
      
      // 更新项目数据
      for (const project of projects) {
        this.projects.set(project.id, project);
      }
      
      // 保存到文件
      await this.saveProjects();
      
      console.log(`已更新 ${projects.length} 个项目`);
    } catch (error) {
      console.error('同步项目失败:', error);
    }
  }
  
  /**
   * 同步徽章数据
   * @param {number} lastUpdated - 上次更新时间戳 
   */
  async syncBadges(lastUpdated) {
    try {
      const url = `${this.options.apiBaseUrl}/badges?since=${lastUpdated}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`同步徽章失败: ${response.statusText}`);
      }
      
      const badges = await response.json();
      
      if (badges.length === 0) {
        console.log('没有新的徽章更新');
        return;
      }
      
      // 更新徽章数据
      for (const badge of badges) {
        this.badges.set(badge.id, badge);
      }
      
      // 保存到文件
      await this.saveBadges();
      
      console.log(`已更新 ${badges.length} 个徽章`);
    } catch (error) {
      console.error('同步徽章失败:', error);
    }
  }
  
  /**
   * 同步统计数据
   */
  async syncStats() {
    try {
      const url = `${this.options.apiBaseUrl}/stats`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`同步统计失败: ${response.statusText}`);
      }
      
      const stats = await response.json();
      
      // 更新统计数据
      this.stats = {
        ...this.stats,
        ...stats
      };
      
      console.log('已更新统计数据');
    } catch (error) {
      console.error('同步统计失败:', error);
    }
  }
  
  /**
   * 保存贡献者数据到文件
   */
  async saveContributors() {
    const contributorsFile = path.join(this.options.storageDir, 'contributors.json');
    const contributors = Array.from(this.contributors.values());
    
    await fs.writeFile(contributorsFile, JSON.stringify(contributors, null, 2), 'utf8');
  }
  
  /**
   * 保存项目数据到文件
   */
  async saveProjects() {
    const projectsFile = path.join(this.options.storageDir, 'projects.json');
    const projects = Array.from(this.projects.values());
    
    await fs.writeFile(projectsFile, JSON.stringify(projects, null, 2), 'utf8');
  }
  
  /**
   * 保存徽章数据到文件
   */
  async saveBadges() {
    const badgesFile = path.join(this.options.storageDir, 'badges.json');
    const badges = Array.from(this.badges.values());
    
    await fs.writeFile(badgesFile, JSON.stringify(badges, null, 2), 'utf8');
  }
  
  /**
   * 保存统计数据到文件
   */
  async saveStats() {
    const statsFile = path.join(this.options.storageDir, 'stats.json');
    
    await fs.writeFile(statsFile, JSON.stringify(this.stats, null, 2), 'utf8');
  }
  
  /**
   * 获取所有贡献者
   * @param {Object} filter - 过滤条件
   * @returns {Array} 贡献者列表
   */
  async getContributors(filter = {}) {
    const contributors = Array.from(this.contributors.values());
    
    // 应用过滤条件
    return this.filterItems(contributors, filter);
  }
  
  /**
   * 获取贡献者详情
   * @param {string} id - 贡献者ID
   * @returns {Object|null} 贡献者详情
   */
  async getContributor(id) {
    // 从缓存获取
    const contributor = this.contributors.get(id);
    
    if (!contributor) {
      return null;
    }
    
    // 获取贡献者的徽章
    const badges = await this.getContributorBadges(id);
    
    // 获取贡献者的项目
    const projects = await this.getContributorProjects(id);
    
    return {
      ...contributor,
      badges,
      projects
    };
  }
  
  /**
   * 获取贡献者的徽章
   * @param {string} contributorId - 贡献者ID
   * @returns {Array} 徽章列表
   */
  async getContributorBadges(contributorId) {
    const badges = [];
    
    for (const badge of this.badges.values()) {
      if (badge.contributorId === contributorId) {
        badges.push(badge);
      }
    }
    
    return badges;
  }
  
  /**
   * 获取贡献者的项目
   * @param {string} contributorId - 贡献者ID 
   * @returns {Array} 项目列表
   */
  async getContributorProjects(contributorId) {
    const projects = [];
    
    for (const project of this.projects.values()) {
      const contribution = project.contributions.find(c => c.contributorId === contributorId);
      
      if (contribution) {
        projects.push({
          ...project,
          contribution
        });
      }
    }
    
    return projects;
  }
  
  /**
   * 获取所有项目
   * @param {Object} filter - 过滤条件
   * @returns {Array} 项目列表
   */
  async getProjects(filter = {}) {
    const projects = Array.from(this.projects.values());
    
    // 应用过滤条件
    return this.filterItems(projects, filter);
  }
  
  /**
   * 获取项目详情
   * @param {string} id - 项目ID
   * @returns {Object|null} 项目详情
   */
  async getProject(id) {
    return this.projects.get(id) || null;
  }
  
  /**
   * 获取所有徽章
   * @param {Object} filter - 过滤条件
   * @returns {Array} 徽章列表
   */
  async getBadges(filter = {}) {
    const badges = Array.from(this.badges.values());
    
    // 应用过滤条件
    return this.filterItems(badges, filter);
  }
  
  /**
   * 获取徽章详情
   * @param {string} id - 徽章ID
   * @returns {Object|null} 徽章详情
   */
  async getBadge(id) {
    return this.badges.get(id) || null;
  }
  
  /**
   * 注册新贡献者
   * @param {Object} contributorData - 贡献者数据
   * @returns {Object} 注册结果
   */
  async registerContributor(contributorData) {
    try {
      // 验证贡献者数据
      this.validateContributorData(contributorData);
      
      // 生成贡献者ID
      if (!contributorData.id) {
        contributorData.id = this.generateId(contributorData.username);
      }
      
      // 检查是否已存在
      if (this.contributors.has(contributorData.id)) {
        throw new Error(`贡献者ID已存在: ${contributorData.id}`);
      }
      
      // 设置注册时间
      contributorData.registeredAt = Date.now();
      contributorData.updatedAt = Date.now();
      
      // 初始化统计数据
      contributorData.stats = contributorData.stats || {
        contributions: 0,
        plugins: 0,
        templates: 0,
        points: 0
      };
      
      // 保存到缓存
      this.contributors.set(contributorData.id, contributorData);
      
      // 保存到文件
      await this.saveContributors();
      
      // 更新统计数据
      this.stats.totalContributors += 1;
      this.stats.activeContributors += 1;
      await this.saveStats();
      
      // 同步到远程
      await this.syncContributorToRemote(contributorData);
      
      return {
        success: true,
        contributor: contributorData
      };
    } catch (error) {
      console.error('注册贡献者失败:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 同步贡献者到远程
   * @param {Object} contributorData - 贡献者数据
   */
  async syncContributorToRemote(contributorData) {
    try {
      const url = `${this.options.apiBaseUrl}/register`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contributorData)
      });
      
      if (!response.ok) {
        throw new Error(`同步贡献者到远程失败: ${response.statusText}`);
      }
      
      console.log(`贡献者 ${contributorData.username} 已同步到远程`);
    } catch (error) {
      console.error('同步贡献者到远程失败:', error);
      // 不中断流程，只记录错误
    }
  }
  
  /**
   * 记录贡献
   * @param {Object} contributionData - 贡献数据
   * @returns {Object} 结果
   */
  async recordContribution(contributionData) {
    try {
      // 验证贡献数据
      this.validateContributionData(contributionData);
      
      const { contributorId, projectId, type, details } = contributionData;
      
      // 检查贡献者是否存在
      const contributor = this.contributors.get(contributorId);
      if (!contributor) {
        throw new Error(`贡献者不存在: ${contributorId}`);
      }
      
      // 获取或创建项目
      let project = this.projects.get(projectId);
      if (!project) {
        project = {
          id: projectId,
          name: details.projectName || projectId,
          description: details.projectDescription || '',
          url: details.projectUrl || '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          contributions: []
        };
      }
      
      // 创建贡献记录
      const contribution = {
        id: this.generateId(`${contributorId}-${projectId}-${Date.now()}`),
        contributorId,
        type,
        details,
        timestamp: Date.now(),
        points: this.calculatePoints(type, details)
      };
      
      // 更新项目贡献
      project.contributions = project.contributions || [];
      project.contributions.push(contribution);
      project.updatedAt = Date.now();
      
      // 保存项目
      this.projects.set(projectId, project);
      await this.saveProjects();
      
      // 更新贡献者统计
      contributor.stats = contributor.stats || {
        contributions: 0,
        plugins: 0,
        templates: 0,
        points: 0
      };
      
      contributor.stats.contributions += 1;
      contributor.stats.points += contribution.points;
      
      // 更新特定类型的计数
      if (type === 'plugin') {
        contributor.stats.plugins = (contributor.stats.plugins || 0) + 1;
      } else if (type === 'template') {
        contributor.stats.templates = (contributor.stats.templates || 0) + 1;
      }
      
      contributor.updatedAt = Date.now();
      
      // 保存贡献者
      await this.saveContributors();
      
      // 更新全局统计
      this.stats.totalContributions += 1;
      await this.saveStats();
      
      // 检查徽章解锁
      await this.checkBadgeUnlock(contributor, contribution);
      
      // 同步到远程
      await this.syncContributionToRemote(contribution);
      
      return {
        success: true,
        contribution,
        contributorStats: contributor.stats
      };
    } catch (error) {
      console.error('记录贡献失败:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 同步贡献到远程
   * @param {Object} contribution - 贡献数据
   */
  async syncContributionToRemote(contribution) {
    try {
      const url = `${this.options.apiBaseUrl}/contributions`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contribution)
      });
      
      if (!response.ok) {
        throw new Error(`同步贡献到远程失败: ${response.statusText}`);
      }
      
      console.log(`贡献 ${contribution.id} 已同步到远程`);
    } catch (error) {
      console.error('同步贡献到远程失败:', error);
      // 不中断流程，只记录错误
    }
  }
  
  /**
   * 检查徽章解锁
   * @param {Object} contributor - 贡献者数据
   * @param {Object} contribution - 贡献数据
   */
  async checkBadgeUnlock(contributor, contribution) {
    // 检查贡献总数徽章
    await this.checkContributionCountBadge(contributor);
    
    // 检查贡献类型徽章
    await this.checkContributionTypeBadge(contributor, contribution.type);
    
    // 检查点数徽章
    await this.checkPointsBadge(contributor);
  }
  
  /**
   * 检查贡献总数徽章
   * @param {Object} contributor - 贡献者数据
   */
  async checkContributionCountBadge(contributor) {
    const count = contributor.stats.contributions;
    
    // 第一次贡献
    if (count === 1) {
      await this.awardBadge(contributor.id, 'first-contribution', '第一次贡献');
    }
    
    // 10次贡献
    if (count === 10) {
      await this.awardBadge(contributor.id, 'ten-contributions', '10次贡献');
    }
    
    // 50次贡献
    if (count === 50) {
      await this.awardBadge(contributor.id, 'fifty-contributions', '50次贡献');
    }
    
    // 100次贡献
    if (count === 100) {
      await this.awardBadge(contributor.id, 'hundred-contributions', '100次贡献');
    }
  }
  
  /**
   * 检查贡献类型徽章
   * @param {Object} contributor - 贡献者数据
   * @param {string} type - 贡献类型
   */
  async checkContributionTypeBadge(contributor, type) {
    if (type === 'plugin' && contributor.stats.plugins === 1) {
      await this.awardBadge(contributor.id, 'first-plugin', '第一个插件');
    }
    
    if (type === 'template' && contributor.stats.templates === 1) {
      await this.awardBadge(contributor.id, 'first-template', '第一个模板');
    }
    
    if (type === 'documentation') {
      await this.awardBadge(contributor.id, 'documentation-contributor', '文档贡献者');
    }
    
    if (type === 'bugfix') {
      await this.awardBadge(contributor.id, 'bug-hunter', 'Bug猎人');
    }
  }
  
  /**
   * 检查点数徽章
   * @param {Object} contributor - 贡献者数据 
   */
  async checkPointsBadge(contributor) {
    const points = contributor.stats.points;
    
    // 100点
    if (points >= 100) {
      await this.awardBadge(contributor.id, 'hundred-points', '100点成就');
    }
    
    // 500点
    if (points >= 500) {
      await this.awardBadge(contributor.id, 'five-hundred-points', '500点成就');
    }
    
    // 1000点
    if (points >= 1000) {
      await this.awardBadge(contributor.id, 'thousand-points', '1000点成就');
    }
  }
  
  /**
   * 授予徽章
   * @param {string} contributorId - 贡献者ID
   * @param {string} badgeId - 徽章ID
   * @param {string} name - 徽章名称
   */
  async awardBadge(contributorId, badgeId, name) {
    // 检查徽章是否已存在
    const existingBadge = Array.from(this.badges.values()).find(
      badge => badge.contributorId === contributorId && badge.id === badgeId
    );
    
    if (existingBadge) {
      return existingBadge;
    }
    
    // 创建徽章
    const badge = {
      id: badgeId,
      contributorId,
      name,
      description: `获得${name}徽章`,
      imageUrl: `${this.options.badgeServiceUrl}/${badgeId}.svg`,
      awardedAt: Date.now()
    };
    
    // 保存徽章
    this.badges.set(`${contributorId}-${badgeId}`, badge);
    await this.saveBadges();
    
    // 同步到远程
    await this.syncBadgeToRemote(badge);
    
    return badge;
  }
  
  /**
   * 同步徽章到远程
   * @param {Object} badge - 徽章数据
   */
  async syncBadgeToRemote(badge) {
    try {
      const url = `${this.options.apiBaseUrl}/badges`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(badge)
      });
      
      if (!response.ok) {
        throw new Error(`同步徽章到远程失败: ${response.statusText}`);
      }
      
      console.log(`徽章 ${badge.id} 已同步到远程`);
    } catch (error) {
      console.error('同步徽章到远程失败:', error);
      // 不中断流程，只记录错误
    }
  }
  
  /**
   * 计算贡献点数
   * @param {string} type - 贡献类型
   * @param {Object} details - 贡献详情
   * @returns {number} 点数
   */
  calculatePoints(type, details) {
    // 基础点数
    const basePoints = {
      plugin: 10,
      template: 8,
      documentation: 5,
      translation: 3,
      bugfix: 5,
      feature: 7,
      review: 2,
      other: 1
    };
    
    let points = basePoints[type] || 1;
    
    // 根据详情调整点数
    if (details) {
      // 复杂度调整
      if (details.complexity) {
        if (details.complexity === 'high') {
          points *= 2;
        } else if (details.complexity === 'medium') {
          points *= 1.5;
        }
      }
      
      // 质量调整
      if (details.quality) {
        if (details.quality === 'excellent') {
          points *= 1.5;
        } else if (details.quality === 'good') {
          points *= 1.2;
        }
      }
      
      // 测试覆盖率调整
      if (details.testCoverage && details.testCoverage > 0) {
        points += Math.floor(details.testCoverage / 10);
      }
      
      // 文档调整
      if (details.documentation) {
        points += 2;
      }
    }
    
    return Math.max(1, Math.floor(points));
  }
  
  /**
   * 验证贡献者数据
   * @param {Object} data - 贡献者数据
   */
  validateContributorData(data) {
    // 必需字段
    const requiredFields = ['username', 'email'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    // 验证电子邮件格式
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error(`无效的电子邮件格式: ${data.email}`);
    }
    
    // 验证用户名格式
    if (!/^[a-zA-Z0-9_-]+$/.test(data.username)) {
      throw new Error(`无效的用户名格式: ${data.username} (只允许字母、数字、下划线和连字符)`);
    }
  }
  
  /**
   * 验证贡献数据
   * @param {Object} data - 贡献数据
   */
  validateContributionData(data) {
    // 必需字段
    const requiredFields = ['contributorId', 'projectId', 'type', 'details'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    // 验证贡献类型
    const validTypes = ['plugin', 'template', 'documentation', 'translation', 'bugfix', 'feature', 'review', 'other'];
    if (!validTypes.includes(data.type)) {
      throw new Error(`无效的贡献类型: ${data.type}`);
    }
    
    // 验证详情
    if (typeof data.details !== 'object') {
      throw new Error('详情必须是对象');
    }
  }
  
  /**
   * 根据条件过滤项目
   * @param {Array} items - 项目列表
   * @param {Object} filter - 过滤条件
   * @returns {Array} 过滤后的项目
   */
  filterItems(items, filter) {
    return items.filter(item => {
      // 匹配所有过滤条件
      for (const [key, value] of Object.entries(filter)) {
        if (key === 'search' && typeof value === 'string') {
          // 搜索名称和描述
          const search = value.toLowerCase();
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          const username = (item.username || '').toLowerCase();
          
          if (!name.includes(search) && 
              !description.includes(search) && 
              !username.includes(search)) {
            return false;
          }
        } else if (key === 'minPoints' && typeof value === 'number') {
          // 最小点数
          const points = item.stats?.points || 0;
          if (points < value) {
            return false;
          }
        } else if (key === 'minContributions' && typeof value === 'number') {
          // 最小贡献数
          const count = item.stats?.contributions || 0;
          if (count < value) {
            return false;
          }
        } else if (key === 'type' && Array.isArray(item.contributions)) {
          // 贡献类型
          const hasType = item.contributions.some(c => c.type === value);
          if (!hasType) {
            return false;
          }
        } else if (item[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  /**
   * 生成ID
   * @param {string} seed - 种子字符串
   * @returns {string} ID
   */
  generateId(seed) {
    return crypto
      .createHash('md5')
      .update(`${seed}-${Date.now()}`)
      .digest('hex')
      .substring(0, 10);
  }
  
  /**
   * 获取统计数据
   * @returns {Object} 统计数据
   */
  getStats() {
    return { ...this.stats };
  }
}

module.exports = ContributorProgram; 