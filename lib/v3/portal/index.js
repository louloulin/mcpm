/**
 * MCPM 3.0 开发者门户
 * 
 * 提供Web界面用于管理MCP服务、测试工具和监控性能
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

/**
 * 开发者门户配置选项
 * @typedef {Object} PortalOptions
 * @property {number} port - 服务器端口
 * @property {string} staticDir - 静态文件目录
 * @property {boolean} enableAuth - 是否启用身份验证
 * @property {string} apiBasePath - API基础路径
 * @property {Object} mcpClient - MCP客户端实例或配置
 * @property {Object} database - 数据库配置
 */

/**
 * 开发者门户服务器
 */
class DevPortal {
  /**
   * 创建开发者门户实例
   * @param {PortalOptions} options - 配置选项
   */
  constructor(options = {}) {
    this.options = {
      port: options.port || 8080,
      staticDir: options.staticDir || path.join(__dirname, 'public'),
      enableAuth: options.enableAuth !== false,
      apiBasePath: options.apiBasePath || '/api/portal',
      mcpClient: options.mcpClient || null,
      database: options.database || null
    };

    this.app = express();
    this.server = null;
    this.sessions = new Map();

    // 存储注册的服务和工具
    this.services = new Map();
    this.users = new Map();
    this.analytics = {
      requests: 0,
      toolCalls: {},
      errors: 0
    };
  }

  /**
   * 初始化门户
   */
  async init() {
    this._setupMiddleware();
    this._setupRoutes();

    // 如果提供了MCP客户端，初始化它
    if (this.options.mcpClient) {
      if (typeof this.options.mcpClient.connect === 'function') {
        await this.options.mcpClient.connect();
      }
      this.mcpClient = this.options.mcpClient;
    }

    // 加载持久化数据
    await this._loadData();

    return this;
  }

  /**
   * 设置中间件
   * @private
   */
  _setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // 静态文件服务
    if (fs.existsSync(this.options.staticDir)) {
      this.app.use(express.static(this.options.staticDir));
    }

    // 身份验证中间件
    if (this.options.enableAuth) {
      this.app.use((req, res, next) => {
        // 公共路由白名单
        const publicPaths = [
          '/login', 
          '/register', 
          '/api/portal/auth',
          '/assets'
        ];
        
        // 检查是否为公共路径
        if (publicPaths.some(path => req.path.startsWith(path))) {
          return next();
        }
        
        // 检查会话
        const token = req.headers.authorization?.split(' ')[1];
        if (!token || !this.sessions.has(token)) {
          return res.status(401).json({ error: 'Unauthorized' });
        }
        
        // 通过验证
        req.user = this.sessions.get(token);
        next();
      });
    }
  }

  /**
   * 设置路由
   * @private
   */
  _setupRoutes() {
    const apiBase = this.options.apiBasePath;

    // 身份验证API
    this.app.post(`${apiBase}/auth/login`, this._handleLogin.bind(this));
    this.app.post(`${apiBase}/auth/register`, this._handleRegister.bind(this));
    this.app.post(`${apiBase}/auth/logout`, this._handleLogout.bind(this));

    // 服务管理API
    this.app.get(`${apiBase}/services`, this._getServices.bind(this));
    this.app.post(`${apiBase}/services`, this._createService.bind(this));
    this.app.get(`${apiBase}/services/:id`, this._getService.bind(this));
    this.app.put(`${apiBase}/services/:id`, this._updateService.bind(this));
    this.app.delete(`${apiBase}/services/:id`, this._deleteService.bind(this));

    // 工具测试API
    this.app.get(`${apiBase}/tools`, this._getTools.bind(this));
    this.app.post(`${apiBase}/tools/:name/test`, this._testTool.bind(this));

    // 监控与分析API
    this.app.get(`${apiBase}/analytics`, this._getAnalytics.bind(this));
    this.app.get(`${apiBase}/analytics/services/:id`, this._getServiceAnalytics.bind(this));

    // 为单页应用提供支持
    this.app.get('*', (req, res) => {
      // 如果是API请求，继续
      if (req.path.startsWith(apiBase)) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      
      // 否则返回单页应用的入口HTML
      const indexFile = path.join(this.options.staticDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        return res.sendFile(indexFile);
      }
      
      res.status(404).send('Not found');
    });
  }

  /**
   * 启动服务器
   * @param {number} [port] - 覆盖默认端口
   * @returns {Promise<void>}
   */
  start(port) {
    return new Promise((resolve) => {
      const usePort = port || this.options.port;
      this.server = this.app.listen(usePort, () => {
        console.log(`[DevPortal] 开发者门户已启动，访问: http://localhost:${usePort}`);
        resolve();
      });
    });
  }

  /**
   * 停止服务器
   * @returns {Promise<void>}
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[DevPortal] 开发者门户已关闭');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * 登录处理
   * @private
   */
  _handleLogin(req, res) {
    const { username, password } = req.body;
    
    // 简单的身份验证
    const user = Array.from(this.users.values()).find(u => 
      u.username === username && u.password === password
    );
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码不正确' });
    }
    
    // 创建会话
    const token = uuidv4();
    this.sessions.set(token, {
      id: user.id,
      username: user.username,
      role: user.role
    });
    
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  }

  /**
   * 注册处理
   * @private
   */
  _handleRegister(req, res) {
    const { username, password, email } = req.body;
    
    // 检查用户名是否存在
    if (Array.from(this.users.values()).some(u => u.username === username)) {
      return res.status(400).json({ error: '用户名已存在' });
    }
    
    // 创建新用户
    const user = {
      id: uuidv4(),
      username,
      password,
      email,
      role: 'user',
      createdAt: new Date().toISOString()
    };
    
    this.users.set(user.id, user);
    
    // 保存数据
    this._saveData();
    
    res.status(201).json({
      id: user.id,
      username: user.username,
      role: user.role
    });
  }

  /**
   * 登出处理
   * @private
   */
  _handleLogout(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      this.sessions.delete(token);
    }
    
    res.json({ success: true });
  }

  /**
   * 获取所有服务
   * @private
   */
  _getServices(req, res) {
    const services = Array.from(this.services.values()).map(service => ({
      id: service.id,
      name: service.name,
      status: service.status,
      url: service.url,
      createdAt: service.createdAt,
      toolCount: service.tools?.length || 0
    }));
    
    res.json(services);
  }

  /**
   * 创建服务
   * @private
   */
  _createService(req, res) {
    const { name, url, description } = req.body;
    
    const service = {
      id: uuidv4(),
      name,
      url,
      description,
      status: 'created',
      createdAt: new Date().toISOString(),
      createdBy: req.user.id,
      tools: []
    };
    
    this.services.set(service.id, service);
    
    // 保存数据
    this._saveData();
    
    res.status(201).json(service);
  }

  /**
   * 获取服务详情
   * @private
   */
  _getService(req, res) {
    const { id } = req.params;
    const service = this.services.get(id);
    
    if (!service) {
      return res.status(404).json({ error: '服务未找到' });
    }
    
    res.json(service);
  }

  /**
   * 更新服务
   * @private
   */
  _updateService(req, res) {
    const { id } = req.params;
    const service = this.services.get(id);
    
    if (!service) {
      return res.status(404).json({ error: '服务未找到' });
    }
    
    const { name, url, description, status } = req.body;
    
    Object.assign(service, {
      name: name || service.name,
      url: url || service.url,
      description: description || service.description,
      status: status || service.status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    });
    
    // 保存数据
    this._saveData();
    
    res.json(service);
  }

  /**
   * 删除服务
   * @private
   */
  _deleteService(req, res) {
    const { id } = req.params;
    
    if (!this.services.has(id)) {
      return res.status(404).json({ error: '服务未找到' });
    }
    
    this.services.delete(id);
    
    // 保存数据
    this._saveData();
    
    res.status(204).end();
  }

  /**
   * 获取工具列表
   * @private
   */
  _getTools(req, res) {
    // 如果有MCP客户端，使用它获取工具
    if (this.mcpClient && this.mcpClient.tools) {
      const tools = Object.entries(this.mcpClient.tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        parameters: tool.parameters,
        returns: tool.returns
      }));
      
      return res.json(tools);
    }
    
    // 否则返回空数组
    res.json([]);
  }

  /**
   * 测试工具
   * @private
   */
  async _testTool(req, res) {
    const { name } = req.params;
    const { parameters } = req.body;
    
    // 检查MCP客户端
    if (!this.mcpClient) {
      return res.status(400).json({ error: 'MCP客户端未配置' });
    }
    
    // 检查工具是否存在
    if (!this.mcpClient.tools || !this.mcpClient.tools[name]) {
      return res.status(404).json({ error: '工具未找到' });
    }
    
    try {
      // 记录分析数据
      this.analytics.requests++;
      this.analytics.toolCalls[name] = (this.analytics.toolCalls[name] || 0) + 1;
      
      // 调用工具
      const result = await this.mcpClient.callTool(name, parameters);
      
      res.json({
        success: true,
        result: result.data,
        execution: {
          duration: result.duration,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      // 记录错误
      this.analytics.errors++;
      
      res.status(500).json({
        success: false,
        error: error.message,
        details: error.details || null
      });
    }
  }

  /**
   * 获取分析数据
   * @private
   */
  _getAnalytics(req, res) {
    // 计算工具调用排名
    const toolRanking = Object.entries(this.analytics.toolCalls)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      totalRequests: this.analytics.requests,
      toolCalls: toolRanking,
      errorRate: this.analytics.requests ? (this.analytics.errors / this.analytics.requests) : 0,
      serviceCount: this.services.size
    });
  }

  /**
   * 获取服务分析数据
   * @private
   */
  _getServiceAnalytics(req, res) {
    const { id } = req.params;
    const service = this.services.get(id);
    
    if (!service) {
      return res.status(404).json({ error: '服务未找到' });
    }
    
    // 这里将来会实现更详细的服务级分析
    // 目前返回一些基本信息
    res.json({
      id: service.id,
      name: service.name,
      status: service.status,
      uptime: '99.9%',  // 示例数据
      requestCount: 1250,  // 示例数据
      averageResponseTime: 120,  // 示例数据，毫秒
      errorRate: 0.02  // 示例数据
    });
  }

  /**
   * 加载持久化数据
   * @private
   */
  async _loadData() {
    // 在实际实现中，这里会从数据库加载数据
    // 在此示例中，使用内存存储
    
    // 添加默认用户
    if (this.users.size === 0) {
      const adminUser = {
        id: 'admin',
        username: 'admin',
        password: 'admin123',  // 在实际实现中，密码应该被哈希存储
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      this.users.set(adminUser.id, adminUser);
    }
  }

  /**
   * 保存数据
   * @private
   */
  _saveData() {
    // 在实际实现中，这里会将数据保存到数据库
    // 此示例仅记录操作
    console.log('[DevPortal] 数据已更新');
  }
}

module.exports = DevPortal; 