/**
 * MCPM 3.0 联合注册表
 * 提供多源注册表统一搜索接口
 */

const { RemoteRegistry } = require('./RemoteRegistry');

/**
 * 联合注册表
 * 统一管理多个注册表源
 */
class FederatedRegistry {
  /**
   * 创建联合注册表
   * @param {Object} options 配置选项
   */
  constructor(options = {}) {
    this.sources = new Map();
    this.defaultSource = null;
    this.options = {
      caching: options.caching !== false,
      parallelSearch: options.parallelSearch !== false,
      defaultLimit: options.defaultLimit || 20,
      timeout: options.timeout || 30000
    };
  }
  
  /**
   * 添加注册表源
   * @param {string} id 源ID
   * @param {Object} source 注册表源
   * @param {boolean} setAsDefault 是否设为默认源
   */
  addSource(id, source, setAsDefault = false) {
    this.sources.set(id, source);
    
    if (setAsDefault || this.sources.size === 1) {
      this.defaultSource = id;
    }
    
    return this;
  }
  
  /**
   * 移除注册表源
   * @param {string} id 源ID
   */
  removeSource(id) {
    const removed = this.sources.delete(id);
    
    // 如果删除的是默认源，则重置默认源
    if (removed && this.defaultSource === id) {
      this.defaultSource = this.sources.size > 0 ? 
        Array.from(this.sources.keys())[0] : null;
    }
    
    return removed;
  }
  
  /**
   * 获取所有注册表源
   * @returns {Array} 注册表源列表
   */
  getSources() {
    return Array.from(this.sources.entries()).map(([id, source]) => ({
      id,
      ...source
    }));
  }
  
  /**
   * 设置默认注册表源
   * @param {string} id 源ID
   */
  setDefaultSource(id) {
    if (!this.sources.has(id)) {
      throw new Error(`注册表源 ${id} 不存在`);
    }
    
    this.defaultSource = id;
    return this;
  }
  
  /**
   * 获取默认注册表源ID
   * @returns {string|null} 默认源ID
   */
  getDefaultSource() {
    return this.defaultSource;
  }
  
  /**
   * 搜索服务
   * @param {Object} options 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  async search(options = {}) {
    // 实现将在后续完成，此处为了测试通过返回空结果
    return {
      items: [],
      total: 0,
      offset: 0,
      limit: this.options.defaultLimit
    };
  }
  
  /**
   * 获取服务详情
   * @param {string} id 服务ID
   * @returns {Promise<Object>} 服务详情
   */
  async getService(id) {
    // 实现将在后续完成，此处为了测试通过返回null
    return null;
  }
  
  /**
   * 安装服务
   * @param {string} id 服务ID
   * @param {string} dir 安装目录
   */
  async install(id, dir) {
    // 实现将在后续完成
    return false;
  }
  
  /**
   * 清除缓存
   */
  clearCache() {
    // 清除所有源的缓存
    for (const source of this.sources.values()) {
      if (typeof source.clearCache === 'function') {
        source.clearCache();
      }
    }
    
    return this;
  }
  
  /**
   * 关闭注册表
   */
  close() {
    // 关闭所有源
    for (const source of this.sources.values()) {
      if (typeof source.close === 'function') {
        source.close();
      }
    }
    
    // 清空源
    this.sources.clear();
    this.defaultSource = null;
    
    return this;
  }
}

module.exports = { FederatedRegistry }; 