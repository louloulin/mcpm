import { Request, Response } from 'express';
import StatsModel from '../models/StatsModel';
import syncScheduler from '../../sync/syncScheduler';

class WebhookController {
  /**
   * 接收Glama的Webhook事件
   */
  async receiveGlamaEvent(req: Request, res: Response) {
    try {
      // 验证请求签名
      if (!this.verifyWebhookSignature(req)) {
        return res.status(401).json({ error: 'Invalid webhook signature' });
      }
      
      const { event_type, data } = req.body;
      
      if (!event_type || !data) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // 记录Webhook事件
      const eventId = StatsModel.recordWebhookEvent({
        source: 'glama',
        event_type,
        payload: data
      });
      
      // 根据事件类型决定是否立即处理
      switch (event_type) {
        case 'server.created':
        case 'server.updated':
        case 'server.deleted':
          // 触发服务器增量同步
          this.triggerIncrementalSync(data.server_id, event_type)
            .catch(error => console.error('增量同步失败:', error));
          break;
          
        case 'servers.bulk_update':
          // 触发全量同步
          syncScheduler.triggerSync()
            .catch(error => console.error('全量同步失败:', error));
          break;
          
        default:
          // 其他事件类型暂不处理
          console.log(`收到未处理的事件类型: ${event_type}`);
      }
      
      // 立即响应成功，后台异步处理
      return res.status(202).json({ 
        message: 'Webhook received',
        event_id: eventId
      });
    } catch (error: any) {
      console.error('处理Webhook请求时出错:', error);
      return res.status(500).json({ error: error.message || '处理Webhook失败' });
    }
  }
  
  /**
   * 验证Webhook签名
   */
  private verifyWebhookSignature(req: Request): boolean {
    // TODO: 实现签名验证逻辑
    // 1. 从请求头获取签名
    // 2. 使用共享密钥验证请求体
    const signature = req.headers['x-glama-signature'];
    console.log('待验证的签名:', signature);
    
    // 暂时返回true，后续实现真正的验证逻辑
    return true;
  }
  
  /**
   * 触发增量同步
   */
  private async triggerIncrementalSync(serverId: string, eventType: string): Promise<void> {
    try {
      console.log(`触发服务器 ${serverId} 的增量同步，事件类型: ${eventType}`);
      
      // TODO: 实现增量同步逻辑
      // 1. 对于新增/更新，从Glama API获取单个服务器数据
      // 2. 更新本地数据库
      
      // 当前简单实现：记录事件已处理
      const events = StatsModel.getUnprocessedWebhookEvents('glama')
        .filter(e => {
          try {
            const payload = JSON.parse(e.payload);
            return payload.server_id === serverId;
          } catch {
            return false;
          }
        });
      
      events.forEach(event => {
        StatsModel.markWebhookEventProcessed(event.id, `增量同步处理: ${eventType}`);
      });
    } catch (error) {
      console.error(`增量同步服务器 ${serverId} 失败:`, error);
      throw error;
    }
  }
}

export default new WebhookController(); 