/**
 * MCPM 3.0 社区生态系统
 * 
 * 提供插件市场、模板和贡献者管理功能
 */

const path = require('path');
const fs = require('fs').promises;
const os = require('os');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream/promises');
const crypto = require('crypto');
const semver = require('semver');
const fetch = require('node-fetch');
const tar = require('tar');
const ContributorProgram = require('./contributors');
const HostingService = require('./hosting');

/**
 * 社区生态系统管理类
 */
class CommunityEcosystem {
  /**
   * 创建社区生态系统实例
   * @param {Object} options - 配置选项 
   */
  constructor(options = {}) {
    this.options = {
      // 存储目录
      storageDir: options.storageDir || path.join(process.cwd(), '.mcpm', 'community'),
      // 插件目录
      pluginsDir: options.pluginsDir || path.join(process.cwd(), '.mcpm', 'community', 'plugins'),
      // 模板目录
      templatesDir: options.templatesDir || path.join(process.cwd(), '.mcpm', 'community', 'templates'),
      // 远程存储库URL
      remoteUrl: options.remoteUrl || 'https://registry.mcpm.io/community',
      // 缓存时间 (毫秒)
      cacheTime: options.cacheTime || 3600000, // 1小时
      // 是否启用本地插件
      enableLocalPlugins: options.enableLocalPlugins !== false,
      // 是否自动同步
      autoSync: options.autoSync !== false,
      // 同步间隔 (毫秒)
      syncInterval: options.syncInterval || 86400000, // 24小时
      ...options
    };

    // 初始化存储目录
    this.pluginsDir = this.options.pluginsDir;
    this.templatesDir = this.options.templatesDir;
    this.contributorsDir = path.join(this.options.storageDir, 'contributors');
    this.hostingDir = path.join(this.options.storageDir, 'hosting');
    
    // 缓存
    this.cache = {
      plugins: new Map(),
      templates: new Map(),
      contributors: new Map(),
      lastSync: 0
    };

    // 创建贡献者计划实例
    this.contributors = new ContributorProgram({
      storageDir: this.contributorsDir,
      apiBaseUrl: options.contributorsApiUrl || 'https://api.mcpm.io/contributors',
      autoSync: this.options.autoSync,
      syncInterval: this.options.syncInterval
    });
    
    // 创建托管服务实例
    this.hosting = new HostingService({
      storageDir: this.hostingDir,
      apiBaseUrl: options.hostingApiUrl || 'https://hosting.mcpm.io/api/v1',
      token: options.hostingToken || process.env.MCPM_HOSTING_TOKEN,
      autoRefresh: this.options.autoSync,
      refreshInterval: this.options.syncInterval / 24 // 更频繁地刷新托管服务
    });
  }

  /**
   * 初始化生态系统
   */
  async init() {
    // 确保目录存在
    await this.ensureDirectories();
    
    // 加载本地数据
    await this.loadLocalData();
    
    // 初始化贡献者计划
    await this.contributors.init();
    
    // 初始化托管服务
    await this.hosting.init();
    
    // 如果启用自动同步，则设置定时同步
    if (this.options.autoSync) {
      this.startAutoSync();
    }
    
    return this;
  }
  
  /**
   * 确保所需目录存在
   */
  async ensureDirectories() {
    const dirs = [
      this.options.storageDir,
      this.pluginsDir,
      this.templatesDir,
      this.contributorsDir,
      this.hostingDir
    ];
    
    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          throw new Error(`无法创建目录 ${dir}: ${error.message}`);
        }
      }
    }
  }
  
  /**
   * 加载本地数据
   */
  async loadLocalData() {
    await Promise.all([
      this.loadPlugins(),
      this.loadTemplates(),
      this.loadContributors()
    ]);
  }
  
  /**
   * 加载插件数据
   */
  async loadPlugins() {
    try {
      const files = await fs.readdir(this.pluginsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const pluginData = JSON.parse(
            await fs.readFile(path.join(this.pluginsDir, file), 'utf8')
          );
          this.cache.plugins.set(pluginData.id, pluginData);
        }
      }
      
      console.log(`已加载 ${this.cache.plugins.size} 个插件`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载插件数据出错:', error);
      }
    }
  }
  
  /**
   * 加载模板数据
   */
  async loadTemplates() {
    try {
      const files = await fs.readdir(this.templatesDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const templateData = JSON.parse(
            await fs.readFile(path.join(this.templatesDir, file), 'utf8')
          );
          this.cache.templates.set(templateData.id, templateData);
        }
      }
      
      console.log(`已加载 ${this.cache.templates.size} 个模板`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载模板数据出错:', error);
      }
    }
  }
  
  /**
   * 加载贡献者数据
   */
  async loadContributors() {
    try {
      const files = await fs.readdir(this.contributorsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const contributorData = JSON.parse(
            await fs.readFile(path.join(this.contributorsDir, file), 'utf8')
          );
          this.cache.contributors.set(contributorData.id, contributorData);
        }
      }
      
      console.log(`已加载 ${this.cache.contributors.size} 个贡献者`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('加载贡献者数据出错:', error);
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
    const timeSinceLastSync = Date.now() - this.cache.lastSync;
    if (timeSinceLastSync >= interval) {
      this.syncWithRemote().catch(err => {
        console.error('自动同步失败:', err);
      });
    }
    
    // 设置定时同步
    setInterval(() => {
      this.syncWithRemote().catch(err => {
        console.error('自动同步失败:', err);
      });
    }, interval);
  }
  
  /**
   * 与远程同步数据
   */
  async syncWithRemote() {
    console.log('开始与远程同步...');
    
    try {
      // 同步插件
      await this.syncPlugins();
      
      // 同步模板
      await this.syncTemplates();
      
      // 同步贡献者
      await this.syncContributors();
      
      // 更新同步时间
      this.cache.lastSync = Date.now();
      
      console.log('同步完成');
    } catch (error) {
      console.error('同步失败:', error);
      throw error;
    }
  }
  
  /**
   * 同步插件
   */
  async syncPlugins() {
    try {
      const response = await fetch(`${this.options.remoteUrl}/plugins/index.json`);
      
      if (!response.ok) {
        throw new Error(`同步插件失败: ${response.statusText}`);
      }
      
      const remotePlugins = await response.json();
      
      // 处理每个远程插件
      for (const pluginInfo of remotePlugins) {
        const localPlugin = this.cache.plugins.get(pluginInfo.id);
        
        // 如果本地没有此插件或远程版本更新，下载插件详情
        if (!localPlugin || semver.gt(pluginInfo.version, localPlugin.version)) {
          const pluginResponse = await fetch(`${this.options.remoteUrl}/plugins/${pluginInfo.id}.json`);
          
          if (pluginResponse.ok) {
            const pluginData = await pluginResponse.json();
            
            // 保存到缓存
            this.cache.plugins.set(pluginInfo.id, pluginData);
            
            // 保存到文件
            await fs.writeFile(
              path.join(this.pluginsDir, `${pluginInfo.id}.json`),
              JSON.stringify(pluginData, null, 2),
              'utf8'
            );
            
            console.log(`已更新插件: ${pluginInfo.name} (${pluginInfo.version})`);
          }
        }
      }
    } catch (error) {
      console.error('同步插件失败:', error);
    }
  }
  
  /**
   * 同步模板
   */
  async syncTemplates() {
    try {
      const response = await fetch(`${this.options.remoteUrl}/templates/index.json`);
      
      if (!response.ok) {
        throw new Error(`同步模板失败: ${response.statusText}`);
      }
      
      const remoteTemplates = await response.json();
      
      // 处理每个远程模板
      for (const templateInfo of remoteTemplates) {
        const localTemplate = this.cache.templates.get(templateInfo.id);
        
        // 如果本地没有此模板或远程版本更新，下载模板详情
        if (!localTemplate || semver.gt(templateInfo.version, localTemplate.version)) {
          const templateResponse = await fetch(`${this.options.remoteUrl}/templates/${templateInfo.id}.json`);
          
          if (templateResponse.ok) {
            const templateData = await templateResponse.json();
            
            // 保存到缓存
            this.cache.templates.set(templateInfo.id, templateData);
            
            // 保存到文件
            await fs.writeFile(
              path.join(this.templatesDir, `${templateInfo.id}.json`),
              JSON.stringify(templateData, null, 2),
              'utf8'
            );
            
            console.log(`已更新模板: ${templateInfo.name} (${templateInfo.version})`);
          }
        }
      }
    } catch (error) {
      console.error('同步模板失败:', error);
    }
  }
  
  /**
   * 同步贡献者
   */
  async syncContributors() {
    try {
      const response = await fetch(`${this.options.remoteUrl}/contributors/index.json`);
      
      if (!response.ok) {
        throw new Error(`同步贡献者失败: ${response.statusText}`);
      }
      
      const remoteContributors = await response.json();
      
      // 处理每个远程贡献者
      for (const contributorInfo of remoteContributors) {
        const localContributor = this.cache.contributors.get(contributorInfo.id);
        
        // 如果本地没有此贡献者或远程版本更新，下载贡献者详情
        if (!localContributor || contributorInfo.updated > (localContributor.updated || 0)) {
          const contributorResponse = await fetch(`${this.options.remoteUrl}/contributors/${contributorInfo.id}.json`);
          
          if (contributorResponse.ok) {
            const contributorData = await contributorResponse.json();
            
            // 保存到缓存
            this.cache.contributors.set(contributorInfo.id, contributorData);
            
            // 保存到文件
            await fs.writeFile(
              path.join(this.contributorsDir, `${contributorInfo.id}.json`),
              JSON.stringify(contributorData, null, 2),
              'utf8'
            );
            
            console.log(`已更新贡献者: ${contributorInfo.name}`);
          }
        }
      }
    } catch (error) {
      console.error('同步贡献者失败:', error);
    }
  }

  /**
   * 获取所有插件
   * @param {Object} filter - 过滤条件
   * @returns {Array} 插件列表
   */
  async getPlugins(filter = {}) {
    const plugins = Array.from(this.cache.plugins.values());
    
    return this.filterItems(plugins, filter);
  }
  
  /**
   * 获取插件详情
   * @param {string} id - 插件ID 
   * @returns {Object|null} 插件详情
   */
  async getPlugin(id) {
    return this.cache.plugins.get(id) || null;
  }
  
  /**
   * 安装插件
   * @param {string} id - 插件ID
   * @param {string} [targetDir] - 目标目录
   * @returns {Object} 安装结果
   */
  async installPlugin(id, targetDir = process.cwd()) {
    const plugin = await this.getPlugin(id);
    
    if (!plugin) {
      throw new Error(`插件不存在: ${id}`);
    }
    
    console.log(`安装插件: ${plugin.name} (${plugin.version})`);
    
    // 下载插件文件
    const pluginTarball = await this.downloadPluginTarball(id, plugin.version);
    
    // 解压插件到目标目录
    await this.extractTarball(pluginTarball, targetDir);
    
    return {
      success: true,
      plugin,
      targetDir
    };
  }
  
  /**
   * 下载插件Tarball
   * @param {string} id - 插件ID
   * @param {string} version - 插件版本
   * @returns {Buffer} Tarball内容
   */
  async downloadPluginTarball(id, version) {
    const tarballUrl = `${this.options.remoteUrl}/plugins/tarballs/${id}-${version}.tgz`;
    
    const response = await fetch(tarballUrl);
    
    if (!response.ok) {
      throw new Error(`下载插件失败: ${response.statusText}`);
    }
    
    return await response.buffer();
  }
  
  /**
   * 解压Tarball
   * @param {Buffer} tarball - Tarball内容
   * @param {string} targetDir - 目标目录
   */
  async extractTarball(tarball, targetDir) {
    const tempFile = path.join(this.options.storageDir, `temp-${Date.now()}.tgz`);
    
    try {
      // 保存到临时文件
      await fs.writeFile(tempFile, tarball);
      
      // 解压缩
      await tar.extract({
        file: tempFile,
        cwd: targetDir
      });
      
      console.log(`已解压到: ${targetDir}`);
    } finally {
      // 清理临时文件
      try {
        await fs.unlink(tempFile);
      } catch (error) {
        console.warn('清理临时文件失败:', error);
      }
    }
  }
  
  /**
   * 获取所有模板
   * @param {Object} filter - 过滤条件
   * @returns {Array} 模板列表
   */
  async getTemplates(filter = {}) {
    const templates = Array.from(this.cache.templates.values());
    
    return this.filterItems(templates, filter);
  }
  
  /**
   * 获取模板详情
   * @param {string} id - 模板ID
   * @returns {Object|null} 模板详情
   */
  async getTemplate(id) {
    return this.cache.templates.get(id) || null;
  }
  
  /**
   * 安装模板
   * @param {string} id - 模板ID
   * @param {string} [targetDir] - 目标目录
   * @returns {Object} 安装结果
   */
  async installTemplate(id, targetDir = process.cwd()) {
    const template = await this.getTemplate(id);
    
    if (!template) {
      throw new Error(`模板不存在: ${id}`);
    }
    
    console.log(`安装模板: ${template.name} (${template.version})`);
    
    // 下载模板文件
    const templateTarball = await this.downloadTemplateTarball(id, template.version);
    
    // 解压模板到目标目录
    await this.extractTarball(templateTarball, targetDir);
    
    return {
      success: true,
      template,
      targetDir
    };
  }
  
  /**
   * 下载模板Tarball
   * @param {string} id - 模板ID
   * @param {string} version - 模板版本
   * @returns {Buffer} Tarball内容
   */
  async downloadTemplateTarball(id, version) {
    const tarballUrl = `${this.options.remoteUrl}/templates/tarballs/${id}-${version}.tgz`;
    
    const response = await fetch(tarballUrl);
    
    if (!response.ok) {
      throw new Error(`下载模板失败: ${response.statusText}`);
    }
    
    return await response.buffer();
  }
  
  /**
   * 获取所有贡献者
   * @param {Object} filter - 过滤条件
   * @returns {Array} 贡献者列表
   */
  async getContributors(filter = {}) {
    const contributors = Array.from(this.cache.contributors.values());
    
    return this.filterItems(contributors, filter);
  }
  
  /**
   * 获取贡献者详情
   * @param {string} id - 贡献者ID
   * @returns {Object|null} 贡献者详情
   */
  async getContributor(id) {
    return this.cache.contributors.get(id) || null;
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
        if (key === 'tags' && Array.isArray(value) && Array.isArray(item.tags)) {
          // 检查标签是否匹配任一条件
          if (!value.some(tag => item.tags.includes(tag))) {
            return false;
          }
        } else if (key === 'search' && typeof value === 'string') {
          // 搜索名称和描述
          const search = value.toLowerCase();
          const name = (item.name || '').toLowerCase();
          const description = (item.description || '').toLowerCase();
          
          if (!name.includes(search) && !description.includes(search)) {
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
   * 发布新插件
   * @param {Object} pluginData - 插件数据
   * @param {Buffer} tarball - 插件Tarball
   * @returns {Object} 发布结果
   */
  async publishPlugin(pluginData, tarball) {
    // 验证插件数据
    this.validatePluginData(pluginData);
    
    // 检查是否已存在相同版本
    const existingPlugin = this.cache.plugins.get(pluginData.id);
    if (existingPlugin && semver.eq(existingPlugin.version, pluginData.version)) {
      throw new Error(`插件版本已存在: ${pluginData.id}@${pluginData.version}`);
    }
    
    // 保存插件数据
    this.cache.plugins.set(pluginData.id, pluginData);
    await fs.writeFile(
      path.join(this.pluginsDir, `${pluginData.id}.json`),
      JSON.stringify(pluginData, null, 2),
      'utf8'
    );
    
    // 保存Tarball
    const tarballName = `${pluginData.id}-${pluginData.version}.tgz`;
    const tarballPath = path.join(this.pluginsDir, 'tarballs', tarballName);
    
    // 确保目录存在
    await fs.mkdir(path.dirname(tarballPath), { recursive: true });
    
    // 写入文件
    await fs.writeFile(tarballPath, tarball);
    
    console.log(`已发布插件: ${pluginData.name} (${pluginData.version})`);
    
    return {
      success: true,
      plugin: pluginData
    };
  }
  
  /**
   * 验证插件数据
   * @param {Object} data - 插件数据
   */
  validatePluginData(data) {
    // 必需字段
    const requiredFields = ['id', 'name', 'version', 'description', 'author'];
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }
    
    // 验证版本格式
    if (!semver.valid(data.version)) {
      throw new Error(`无效的版本格式: ${data.version}`);
    }
    
    // 验证ID格式
    if (!/^[a-z0-9-]+$/.test(data.id)) {
      throw new Error(`无效的ID格式: ${data.id} (只允许小写字母、数字和连字符)`);
    }
  }

  /**
   * 获取贡献者计划实例
   * @returns {ContributorProgram} 贡献者计划实例
   */
  getContributorProgram() {
    return this.contributors;
  }
  
  /**
   * 获取托管服务实例
   * @returns {HostingService} 托管服务实例
   */
  getHostingService() {
    return this.hosting;
  }
  
  /**
   * 获取生态系统统计数据
   * @returns {Object} 统计数据
   */
  async getEcosystemStats() {
    // 获取插件统计
    const pluginCount = this.cache.plugins.size;
    
    // 获取模板统计
    const templateCount = this.cache.templates.size;
    
    // 获取贡献者统计
    const contributorStats = this.contributors.getStats();
    
    // 获取托管服务统计
    const services = this.hosting.getServices();
    const serviceCount = services.length;
    const deploymentCount = Array.from(this.hosting.deployments.values()).length;
    
    return {
      plugins: {
        count: pluginCount
      },
      templates: {
        count: templateCount
      },
      contributors: contributorStats,
      hosting: {
        services: serviceCount,
        deployments: deploymentCount
      },
      totalItems: pluginCount + templateCount + serviceCount
    };
  }
  
  /**
   * 部署插件到托管服务
   * @param {string} pluginId - 插件ID
   * @param {Object} options - 部署选项
   * @returns {Promise<Object>} 部署结果
   */
  async deployPluginToHosting(pluginId, options = {}) {
    try {
      // 获取插件
      const plugin = await this.getPlugin(pluginId);
      if (!plugin) {
        throw new Error(`插件不存在: ${pluginId}`);
      }
      
      // 验证托管服务是否已初始化
      if (!this.hosting.isInitialized) {
        throw new Error('托管服务未初始化');
      }
      
      // 准备服务数据
      const serviceData = {
        name: options.name || `plugin-${plugin.id}`,
        description: plugin.description,
        repositoryUrl: options.repositoryUrl || plugin.repositoryUrl,
        branch: options.branch || 'main',
        buildCommand: options.buildCommand || 'npm install && npm run build',
        startCommand: options.startCommand || 'npm start',
        environmentVariables: options.environmentVariables || {},
        tags: ['mcpm-plugin', ...plugin.tags || []]
      };
      
      // 创建托管服务
      const result = await this.hosting.createService(serviceData);
      
      if (!result.success) {
        throw new Error(`创建托管服务失败: ${result.error}`);
      }
      
      // 部署服务
      const deployResult = await this.hosting.deployService(result.service.id, {
        commitId: options.commitId,
        deployMessage: options.deployMessage || `部署 ${plugin.name} 插件`
      });
      
      return {
        success: true,
        service: result.service,
        deployment: deployResult.deployment
      };
    } catch (error) {
      console.error(`部署插件 ${pluginId} 到托管服务失败:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 部署模板到托管服务
   * @param {string} templateId - 模板ID
   * @param {Object} options - 部署选项
   * @returns {Promise<Object>} 部署结果
   */
  async deployTemplateToHosting(templateId, options = {}) {
    try {
      // 获取模板
      const template = await this.getTemplate(templateId);
      if (!template) {
        throw new Error(`模板不存在: ${templateId}`);
      }
      
      // 验证托管服务是否已初始化
      if (!this.hosting.isInitialized) {
        throw new Error('托管服务未初始化');
      }
      
      // 准备服务数据
      const serviceData = {
        name: options.name || `template-${template.id}`,
        description: template.description,
        repositoryUrl: options.repositoryUrl || template.repositoryUrl,
        branch: options.branch || 'main',
        buildCommand: options.buildCommand || 'npm install && npm run build',
        startCommand: options.startCommand || 'npm start',
        environmentVariables: options.environmentVariables || {},
        tags: ['mcpm-template', ...template.tags || []]
      };
      
      // 创建托管服务
      const result = await this.hosting.createService(serviceData);
      
      if (!result.success) {
        throw new Error(`创建托管服务失败: ${result.error}`);
      }
      
      // 部署服务
      const deployResult = await this.hosting.deployService(result.service.id, {
        commitId: options.commitId,
        deployMessage: options.deployMessage || `部署 ${template.name} 模板`
      });
      
      return {
        success: true,
        service: result.service,
        deployment: deployResult.deployment
      };
    } catch (error) {
      console.error(`部署模板 ${templateId} 到托管服务失败:`, error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = CommunityEcosystem; 