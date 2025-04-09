/**
 * MCPM 3.0 托管服务选项
 * 
 * 提供托管服务管理功能，允许用户创建、部署和管理MCPM服务
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { logger } = require('../../common/logger');
const { validateString, validateUrl, validateObject } = require('../../common/validators');

/**
 * 托管服务管理类
 */
class HostingService {
  /**
   * 创建托管服务管理实例
   * @param {Object} options 配置选项
   * @param {string} options.storageDir 本地存储目录
   * @param {string} options.apiBaseUrl API基础URL
   * @param {string} options.token 认证令牌
   * @param {boolean} [options.autoRefresh=true] 是否自动刷新数据
   * @param {number} [options.refreshInterval=60000] 数据刷新间隔（毫秒）
   */
  constructor(options) {
    this.options = {
      autoRefresh: true,
      refreshInterval: 60000,
      ...options
    };

    // 验证必填选项
    validateString(this.options.storageDir, '存储目录');
    validateString(this.options.apiBaseUrl, 'API基础URL');
    validateString(this.options.token, '认证令牌');
    validateUrl(this.options.apiBaseUrl, 'API基础URL');

    this.isInitialized = false;
    this.refreshTimer = null;
    this.services = new Map(); // 服务数据存储
    this.deployments = new Map(); // 部署数据存储
    this.usageData = new Map(); // 使用数据存储
    this.domains = new Map(); // 域名数据存储
    this.pricingTiers = null; // 价格套餐

    // 配置HTTP客户端
    this.client = axios.create({
      baseURL: this.options.apiBaseUrl,
      headers: {
        'Authorization': `Bearer ${this.options.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    // 配置本地存储路径
    this.storageDir = path.resolve(this.options.storageDir);
    this.servicesFile = path.join(this.storageDir, 'services.json');
    this.deploymentsFile = path.join(this.storageDir, 'deployments.json');
    this.usageFile = path.join(this.storageDir, 'usage.json');
  }

  /**
   * 初始化托管服务管理
   * @returns {Promise<boolean>} 初始化是否成功
   */
  async init() {
    try {
      // 确保存储目录存在
      await fs.mkdir(this.storageDir, { recursive: true });

      // 加载缓存的数据（如果存在）
      await this.loadCachedData();

      // 刷新数据
      await this.refreshData();

      // 设置自动刷新定时器
      if (this.options.autoRefresh) {
        this.startAutoRefresh();
      }

      this.isInitialized = true;
      logger.info('托管服务管理已初始化');
      return true;
    } catch (error) {
      logger.error('托管服务管理初始化失败', error);
      return false;
    }
  }

  /**
   * 开始自动刷新数据
   */
  startAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    
    this.refreshTimer = setInterval(() => {
      this.refreshData().catch(err => {
        logger.error('自动刷新托管服务数据失败', err);
      });
    }, this.options.refreshInterval);
    
    logger.debug(`已设置托管服务数据自动刷新，间隔: ${this.options.refreshInterval}ms`);
  }

  /**
   * 停止自动刷新数据
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
      logger.debug('已停止托管服务数据自动刷新');
    }
  }

  /**
   * 从API刷新所有数据
   * @returns {Promise<boolean>} 刷新是否成功
   */
  async refreshData() {
    try {
      // 并行加载数据
      const [servicesResponse, deploymentsResponse, usageResponse] = await Promise.all([
        this.client.get('/services'),
        this.client.get('/deployments'),
        this.client.get('/usage')
      ]);

      // 处理服务列表
      if (servicesResponse.data && Array.isArray(servicesResponse.data)) {
        this.services.clear();
        for (const service of servicesResponse.data) {
          if (service.id) {
            this.services.set(service.id, service);
          }
        }
        await this.saveCachedData('services', Array.from(this.services.values()));
      }

      // 处理部署列表
      if (deploymentsResponse.data && Array.isArray(deploymentsResponse.data)) {
        this.deployments.clear();
        for (const deployment of deploymentsResponse.data) {
          if (deployment.id) {
            this.deployments.set(deployment.id, deployment);
          }
        }
        await this.saveCachedData('deployments', Array.from(this.deployments.values()));
      }

      // 处理使用数据
      if (usageResponse.data && typeof usageResponse.data === 'object') {
        this.usageData.clear();
        for (const [serviceId, usage] of Object.entries(usageResponse.data)) {
          if (serviceId) {
            this.usageData.set(serviceId, usage);
          }
        }
        await this.saveCachedData('usage', Object.fromEntries(this.usageData.entries()));
      }

      logger.debug('成功刷新托管服务数据');
      return true;
    } catch (error) {
      logger.error('刷新托管服务数据失败', error);
      return false;
    }
  }

  /**
   * 加载缓存的数据
   * @returns {Promise<void>}
   */
  async loadCachedData() {
    try {
      // 加载服务数据
      try {
        const servicesData = await fs.readFile(this.servicesFile, 'utf8');
        const services = JSON.parse(servicesData);
        if (Array.isArray(services)) {
          this.services.clear();
          for (const service of services) {
            if (service.id) {
              this.services.set(service.id, service);
            }
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.warn('加载缓存的服务数据失败', err);
        }
      }

      // 加载部署数据
      try {
        const deploymentsData = await fs.readFile(this.deploymentsFile, 'utf8');
        const deployments = JSON.parse(deploymentsData);
        if (Array.isArray(deployments)) {
          this.deployments.clear();
          for (const deployment of deployments) {
            if (deployment.id) {
              this.deployments.set(deployment.id, deployment);
            }
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.warn('加载缓存的部署数据失败', err);
        }
      }

      // 加载使用数据
      try {
        const usageData = await fs.readFile(this.usageFile, 'utf8');
        const usage = JSON.parse(usageData);
        if (usage && typeof usage === 'object') {
          this.usageData.clear();
          for (const [serviceId, data] of Object.entries(usage)) {
            if (serviceId) {
              this.usageData.set(serviceId, data);
            }
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          logger.warn('加载缓存的使用数据失败', err);
        }
      }

      logger.debug('已加载缓存的托管服务数据');
    } catch (error) {
      logger.warn('加载缓存的托管服务数据失败', error);
    }
  }

  /**
   * 保存数据到缓存
   * @param {string} dataType 数据类型
   * @param {any} data 要缓存的数据
   * @returns {Promise<void>}
   */
  async saveCachedData(dataType, data) {
    try {
      let filePath;
      switch (dataType) {
        case 'services':
          filePath = this.servicesFile;
          break;
        case 'deployments':
          filePath = this.deploymentsFile;
          break;
        case 'usage':
          filePath = this.usageFile;
          break;
        default:
          throw new Error(`未知的数据类型: ${dataType}`);
      }

      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      logger.debug(`已缓存${dataType}数据`);
    } catch (error) {
      logger.warn(`缓存${dataType}数据失败`, error);
    }
  }

  /**
   * 获取服务列表
   * @param {Object} [filters] 过滤条件
   * @param {string[]} [filters.status] 服务状态过滤
   * @param {string} [filters.tier] 套餐类型过滤
   * @param {string} [filters.search] 搜索关键词
   * @returns {Array} 服务列表
   */
  getServices(filters = {}) {
    let services = Array.from(this.services.values());

    // 按状态过滤
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
      services = services.filter(service => filters.status.includes(service.status));
    }

    // 按套餐过滤
    if (filters.tier) {
      services = services.filter(service => service.tier === filters.tier);
    }

    // 按关键词搜索
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      services = services.filter(service => 
        service.name.toLowerCase().includes(searchTerm) ||
        service.id.toLowerCase().includes(searchTerm) ||
        (service.description && service.description.toLowerCase().includes(searchTerm))
      );
    }

    return services;
  }

  /**
   * 获取单个服务详情
   * @param {string} serviceId 服务ID
   * @returns {Object|null} 服务详情
   */
  getService(serviceId) {
    return this.services.get(serviceId) || null;
  }

  /**
   * 获取服务的部署记录
   * @param {string} serviceId 服务ID
   * @returns {Array} 部署记录列表
   */
  getServiceDeployments(serviceId) {
    const deployments = Array.from(this.deployments.values());
    return deployments.filter(deployment => deployment.serviceId === serviceId);
  }

  /**
   * 获取服务的使用数据
   * @param {string} serviceId 服务ID
   * @returns {Object|null} 使用数据
   */
  getServiceUsage(serviceId) {
    return this.usageData.get(serviceId) || null;
  }

  /**
   * 验证服务数据是否合法
   * @param {Object} serviceData 服务数据
   * @throws {Error} 验证失败时抛出错误
   */
  validateServiceData(serviceData) {
    // 验证对象
    validateObject(serviceData, '服务数据');

    // 验证必填字段
    const requiredFields = ['name', 'repositoryUrl', 'branch'];
    for (const field of requiredFields) {
      if (!serviceData[field]) {
        throw new Error(`缺少必需字段: ${field}`);
      }
    }

    // 验证名称格式 (仅允许字母、数字、连字符和下划线)
    if (!/^[a-zA-Z0-9_-]+$/.test(serviceData.name)) {
      throw new Error('无效的名称格式: 仅允许字母、数字、连字符和下划线');
    }

    // 验证仓库URL
    try {
      validateUrl(serviceData.repositoryUrl, '仓库URL');
    } catch (error) {
      throw new Error(`无效的仓库URL: ${error.message}`);
    }

    // 验证分支名
    validateString(serviceData.branch, '分支名');

    // 验证描述（如果有）
    if (serviceData.description !== undefined && typeof serviceData.description !== 'string') {
      throw new Error('描述必须是字符串');
    }
  }

  /**
   * 创建新服务
   * @param {Object} serviceData 服务数据
   * @returns {Promise<Object>} 创建结果
   */
  async createService(serviceData) {
    try {
      // 验证数据
      this.validateServiceData(serviceData);

      // 发送创建请求
      const response = await this.client.post('/services', serviceData);

      // 处理响应
      if (response.status === 201 && response.data) {
        // 添加到内存中的服务列表
        const newService = response.data;
        this.services.set(newService.id, newService);

        // 更新缓存
        await this.saveCachedData('services', Array.from(this.services.values()));

        return {
          success: true,
          service: newService
        };
      }

      return {
        success: false,
        error: '服务创建失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error('创建服务失败', error);
      return {
        success: false,
        error: `服务创建失败: ${error.message}`
      };
    }
  }

  /**
   * 更新服务信息
   * @param {string} serviceId 服务ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateService(serviceId, updateData) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 验证更新数据
      validateObject(updateData, '更新数据');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送更新请求
      const response = await this.client.patch(`/services/${serviceId}`, updateData);

      // 处理响应
      if (response.status === 200 && response.data) {
        // 更新内存中的服务数据
        const updatedService = response.data;
        this.services.set(serviceId, updatedService);

        // 更新缓存
        await this.saveCachedData('services', Array.from(this.services.values()));

        return {
          success: true,
          service: updatedService
        };
      }

      return {
        success: false,
        error: '服务更新失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`更新服务失败: ${serviceId}`, error);
      return {
        success: false,
        error: `服务更新失败: ${error.message}`
      };
    }
  }

  /**
   * 删除服务
   * @param {string} serviceId 服务ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteService(serviceId) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送删除请求
      const response = await this.client.delete(`/services/${serviceId}`);

      // 处理响应
      if (response.status === 204) {
        // 从内存中移除服务
        this.services.delete(serviceId);
        
        // 同时移除相关数据
        this.usageData.delete(serviceId);
        
        // 移除相关的部署
        const serviceDeployments = this.getServiceDeployments(serviceId);
        for (const deployment of serviceDeployments) {
          this.deployments.delete(deployment.id);
        }
        
        // 更新缓存
        await Promise.all([
          this.saveCachedData('services', Array.from(this.services.values())),
          this.saveCachedData('deployments', Array.from(this.deployments.values())),
          this.saveCachedData('usage', Object.fromEntries(this.usageData.entries()))
        ]);

        return {
          success: true
        };
      }

      return {
        success: false,
        error: `服务删除失败: 服务器返回状态码 ${response.status}`
      };
    } catch (error) {
      logger.error(`删除服务失败: ${serviceId}`, error);
      return {
        success: false,
        error: `服务删除失败: ${error.message}`
      };
    }
  }

  /**
   * 部署服务
   * @param {string} serviceId 服务ID
   * @param {Object} deployData 部署数据
   * @returns {Promise<Object>} 部署结果
   */
  async deployService(serviceId, deployData = {}) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 准备部署数据
      const payload = {
        serviceId,
        ...deployData
      };

      // 发送部署请求
      const response = await this.client.post('/deployments', payload);

      // 处理响应
      if (response.status === 201 && response.data) {
        // 添加到内存中的部署列表
        const newDeployment = response.data;
        this.deployments.set(newDeployment.id, newDeployment);

        // 更新缓存
        await this.saveCachedData('deployments', Array.from(this.deployments.values()));

        return {
          success: true,
          deployment: newDeployment
        };
      }

      return {
        success: false,
        error: '服务部署失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`部署服务失败: ${serviceId}`, error);
      return {
        success: false,
        error: `服务部署失败: ${error.message}`
      };
    }
  }

  /**
   * 获取价格套餐
   * @returns {Promise<Object>} 价格套餐数据
   */
  async getPricingTiers() {
    try {
      // 检查缓存
      if (this.pricingTiers) {
        return {
          success: true,
          pricing: this.pricingTiers
        };
      }

      // 发送请求
      const response = await this.client.get('/pricing');

      // 处理响应
      if (response.status === 200 && response.data) {
        // 缓存价格套餐
        this.pricingTiers = response.data;

        return {
          success: true,
          pricing: this.pricingTiers
        };
      }

      return {
        success: false,
        error: '获取价格套餐失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error('获取价格套餐失败', error);
      return {
        success: false,
        error: `获取价格套餐失败: ${error.message}`
      };
    }
  }

  /**
   * 获取服务域名列表
   * @param {string} serviceId 服务ID
   * @returns {Promise<Object>} 域名列表
   */
  async getServiceDomains(serviceId) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 尝试从缓存中获取
      if (this.domains.has(serviceId)) {
        return {
          success: true,
          domains: this.domains.get(serviceId)
        };
      }

      // 发送请求
      const response = await this.client.get(`/services/${serviceId}/domains`);

      // 处理响应
      if (response.status === 200 && Array.isArray(response.data)) {
        // 缓存域名数据
        this.domains.set(serviceId, response.data);

        return {
          success: true,
          domains: response.data
        };
      }

      return {
        success: false,
        error: '获取服务域名失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`获取服务域名失败: ${serviceId}`, error);
      return {
        success: false,
        error: `获取服务域名失败: ${error.message}`
      };
    }
  }

  /**
   * 添加自定义域名
   * @param {string} serviceId 服务ID
   * @param {string} domain 域名
   * @returns {Promise<Object>} 添加结果
   */
  async addCustomDomain(serviceId, domain) {
    try {
      // 验证服务ID和域名
      validateString(serviceId, '服务ID');
      validateString(domain, '域名');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送请求
      const response = await this.client.post(`/services/${serviceId}/domains`, { domain });

      // 处理响应
      if (response.status === 201 && response.data) {
        // 更新缓存的域名列表
        if (this.domains.has(serviceId)) {
          const domains = this.domains.get(serviceId);
          domains.push(response.data);
          this.domains.set(serviceId, domains);
        }

        return {
          success: true,
          ...response.data
        };
      }

      return {
        success: false,
        error: '添加自定义域名失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`添加自定义域名失败: ${serviceId}, ${domain}`, error);
      return {
        success: false,
        error: `添加自定义域名失败: ${error.message}`
      };
    }
  }

  /**
   * 删除自定义域名
   * @param {string} serviceId 服务ID
   * @param {string} domain 域名
   * @returns {Promise<Object>} 删除结果
   */
  async deleteCustomDomain(serviceId, domain) {
    try {
      // 验证服务ID和域名
      validateString(serviceId, '服务ID');
      validateString(domain, '域名');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送请求
      const response = await this.client.delete(`/services/${serviceId}/domains/${domain}`);

      // 处理响应
      if (response.status === 204) {
        // 更新缓存的域名列表
        if (this.domains.has(serviceId)) {
          const domains = this.domains.get(serviceId);
          const updatedDomains = domains.filter(d => d.domain !== domain);
          this.domains.set(serviceId, updatedDomains);
        }

        return {
          success: true
        };
      }

      return {
        success: false,
        error: `删除自定义域名失败: 服务器返回状态码 ${response.status}`
      };
    } catch (error) {
      logger.error(`删除自定义域名失败: ${serviceId}, ${domain}`, error);
      return {
        success: false,
        error: `删除自定义域名失败: ${error.message}`
      };
    }
  }

  /**
   * 获取服务日志
   * @param {string} serviceId 服务ID
   * @param {Object} options 日志查询选项
   * @param {number} [options.limit] 日志条数限制
   * @param {string} [options.level] 日志级别过滤
   * @param {number} [options.startTime] 开始时间戳
   * @param {number} [options.endTime] 结束时间戳
   * @returns {Promise<Object>} 日志数据
   */
  async getServiceLogs(serviceId, options = {}) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 准备查询参数
      const params = {};
      if (options.limit) params.limit = options.limit;
      if (options.level) params.level = options.level;
      if (options.startTime) params.startTime = options.startTime;
      if (options.endTime) params.endTime = options.endTime;

      // 发送请求
      const response = await this.client.get(`/services/${serviceId}/logs`, { params });

      // 处理响应
      if (response.status === 200 && Array.isArray(response.data)) {
        return {
          success: true,
          logs: response.data
        };
      }

      return {
        success: false,
        error: '获取服务日志失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`获取服务日志失败: ${serviceId}`, error);
      return {
        success: false,
        error: `获取服务日志失败: ${error.message}`
      };
    }
  }

  /**
   * 获取服务环境变量
   * @param {string} serviceId 服务ID
   * @returns {Promise<Object>} 环境变量数据
   */
  async getServiceEnvironment(serviceId) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送请求
      const response = await this.client.get(`/services/${serviceId}/environment`);

      // 处理响应
      if (response.status === 200 && response.data) {
        return {
          success: true,
          environment: response.data
        };
      }

      return {
        success: false,
        error: '获取服务环境变量失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`获取服务环境变量失败: ${serviceId}`, error);
      return {
        success: false,
        error: `获取服务环境变量失败: ${error.message}`
      };
    }
  }

  /**
   * 设置服务环境变量
   * @param {string} serviceId 服务ID
   * @param {Object} variables 环境变量
   * @returns {Promise<Object>} 设置结果
   */
  async setServiceEnvironment(serviceId, variables) {
    try {
      // 验证服务ID和环境变量
      validateString(serviceId, '服务ID');
      validateObject(variables, '环境变量');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送请求
      const response = await this.client.put(`/services/${serviceId}/environment`, variables);

      // 处理响应
      if (response.status === 200 && response.data) {
        return {
          success: true,
          ...response.data
        };
      }

      return {
        success: false,
        error: '设置服务环境变量失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`设置服务环境变量失败: ${serviceId}`, error);
      return {
        success: false,
        error: `设置服务环境变量失败: ${error.message}`
      };
    }
  }

  /**
   * 重启服务
   * @param {string} serviceId 服务ID
   * @returns {Promise<Object>} 重启结果
   */
  async restartService(serviceId) {
    try {
      // 验证服务ID
      validateString(serviceId, '服务ID');

      // 检查服务是否存在
      if (!this.services.has(serviceId)) {
        return {
          success: false,
          error: `服务不存在: ${serviceId}`
        };
      }

      // 发送请求
      const response = await this.client.post(`/services/${serviceId}/restart`);

      // 处理响应
      if (response.status === 200 && response.data) {
        return {
          success: true,
          ...response.data
        };
      }

      return {
        success: false,
        error: '重启服务失败: 服务器未返回有效数据'
      };
    } catch (error) {
      logger.error(`重启服务失败: ${serviceId}`, error);
      return {
        success: false,
        error: `重启服务失败: ${error.message}`
      };
    }
  }

  /**
   * 关闭托管服务管理
   */
  close() {
    this.stopAutoRefresh();
    this.isInitialized = false;
    logger.info('托管服务管理已关闭');
  }
}

module.exports = HostingService; 