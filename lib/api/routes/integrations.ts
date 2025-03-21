/**
 * 集成API路由
 * 提供第三方集成的CRUD操作
 */

import express from 'express';
import { authenticateUser } from '../middlewares/auth';
import { IntegrationService, IntegrationType } from '../services/IntegrationService';

const router = express.Router();
const integrationService = IntegrationService.getInstance();

/**
 * GET /api/v1/integrations
 * 获取用户的所有集成
 */
router.get('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrations = await integrationService.getUserIntegrations(userId);
    
    // 处理返回数据，移除API密钥
    const safeIntegrations = integrations.map(({ apiKey, ...rest }) => rest);
    
    res.json({ success: true, data: safeIntegrations });
  } catch (error) {
    console.error('获取集成列表失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取集成列表失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * GET /api/v1/integrations/:id
 * 获取单个集成详情
 */
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrations = await integrationService.getUserIntegrations(userId);
    
    const integration = integrations.find(i => i.id === req.params.id);
    
    if (!integration) {
      return res.status(404).json({ success: false, error: '集成不存在' });
    }
    
    // 处理返回数据，移除API密钥
    const { apiKey, ...safeIntegration } = integration;
    
    res.json({ success: true, data: safeIntegration });
  } catch (error) {
    console.error('获取集成详情失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '获取集成详情失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/v1/integrations
 * 创建新的集成
 */
router.post('/', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { name, type, webhookUrl, settings, enabled } = req.body;
    
    // 验证请求数据
    if (!name || !type) {
      return res.status(400).json({ success: false, error: '名称和类型为必填项' });
    }
    
    // 验证集成类型
    if (!Object.values(IntegrationType).includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的集成类型',
        validTypes: Object.values(IntegrationType)
      });
    }
    
    // 创建集成
    const integration = await integrationService.createIntegration({
      name,
      type,
      webhookUrl,
      settings: settings || {},
      userId,
      enabled: enabled !== undefined ? enabled : true
    });
    
    // 返回新创建的集成信息（不含API密钥）
    const { apiKey, ...safeIntegration } = integration;
    
    res.status(201).json({ success: true, data: safeIntegration });
  } catch (error) {
    console.error('创建集成失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '创建集成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * PUT /api/v1/integrations/:id
 * 更新集成配置
 */
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = req.params.id;
    const { name, type, webhookUrl, settings, enabled } = req.body;
    
    // 验证请求数据
    if (!name && !type && webhookUrl === undefined && !settings && enabled === undefined) {
      return res.status(400).json({ success: false, error: '未提供任何要更新的字段' });
    }
    
    // 验证集成类型
    if (type && !Object.values(IntegrationType).includes(type)) {
      return res.status(400).json({ 
        success: false, 
        error: '无效的集成类型',
        validTypes: Object.values(IntegrationType)
      });
    }
    
    // 查找集成并验证所有权
    const integrations = await integrationService.getUserIntegrations(userId);
    const existingIntegration = integrations.find(i => i.id === integrationId);
    
    if (!existingIntegration) {
      return res.status(404).json({ success: false, error: '集成不存在或无权限' });
    }
    
    // 更新集成
    const updateData: any = {};
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
    if (settings) updateData.settings = settings;
    if (enabled !== undefined) updateData.enabled = enabled;
    
    const updatedIntegration = await integrationService.updateIntegration(integrationId, updateData);
    
    // 返回更新后的集成信息（不含API密钥）
    const { apiKey, ...safeIntegration } = updatedIntegration;
    
    res.json({ success: true, data: safeIntegration });
  } catch (error) {
    console.error('更新集成失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '更新集成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * DELETE /api/v1/integrations/:id
 * 删除集成
 */
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = req.params.id;
    
    // 查找集成并验证所有权
    const integrations = await integrationService.getUserIntegrations(userId);
    const existingIntegration = integrations.find(i => i.id === integrationId);
    
    if (!existingIntegration) {
      return res.status(404).json({ success: false, error: '集成不存在或无权限' });
    }
    
    // 删除集成
    await integrationService.deleteIntegration(integrationId);
    
    res.json({ success: true, message: '集成已删除' });
  } catch (error) {
    console.error('删除集成失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '删除集成失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

/**
 * POST /api/v1/integrations/:id/regenerate-key
 * 重新生成API密钥
 */
router.post('/:id/regenerate-key', authenticateUser, async (req, res) => {
  try {
    const userId = req.user!.id;
    const integrationId = req.params.id;
    
    // 查找集成并验证所有权
    const integrations = await integrationService.getUserIntegrations(userId);
    const existingIntegration = integrations.find(i => i.id === integrationId);
    
    if (!existingIntegration) {
      return res.status(404).json({ success: false, error: '集成不存在或无权限' });
    }
    
    // 重新生成API密钥
    const newApiKey = await integrationService.regenerateApiKey(integrationId);
    
    res.json({ success: true, data: { apiKey: newApiKey } });
  } catch (error) {
    console.error('重新生成API密钥失败:', error);
    res.status(500).json({ 
      success: false, 
      error: '重新生成API密钥失败',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 