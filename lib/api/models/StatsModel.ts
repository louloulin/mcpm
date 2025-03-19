import db from '../../database/db';

export interface Stat {
  id: number;
  name: string;
  value: string;
  updated_at: string;
}

export interface AccessLog {
  id: number;
  endpoint: string;
  method: string;
  user_id?: string;
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
}

export interface DownloadRecord {
  id: number;
  server_id: string;
  user_id?: string;
  ip_address?: string;
  timestamp: string;
}

export interface WebhookEvent {
  id: number;
  source: string;
  event_type: string;
  payload: string;
  processed: boolean;
  created_at: string;
  processed_at?: string;
  details?: string;
}

class StatsModel {
  /**
   * 获取所有统计数据
   */
  getAllStats() {
    return db.prepare('SELECT * FROM stats').all() as Stat[];
  }
  
  /**
   * 按名称获取统计数据
   */
  getStatByName(name: string) {
    return db.prepare('SELECT * FROM stats WHERE name = ?').get(name) as Stat | undefined;
  }
  
  /**
   * 更新或创建统计数据
   */
  setStat(name: string, value: string | number | boolean) {
    const stringValue = String(value);
    const now = new Date().toISOString();
    
    // 检查是否存在
    const exists = this.getStatByName(name);
    
    if (exists) {
      db.prepare('UPDATE stats SET value = ?, updated_at = ? WHERE name = ?')
        .run(stringValue, now, name);
    } else {
      db.prepare('INSERT INTO stats (name, value, updated_at) VALUES (?, ?, ?)')
        .run(name, stringValue, now);
    }
    
    return this.getStatByName(name);
  }
  
  /**
   * 记录API访问
   */
  logAccess(data: {
    endpoint: string;
    method: string;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
  }): number {
    const result = db.prepare(`
      INSERT INTO access_logs (endpoint, method, user_id, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      data.endpoint,
      data.method,
      data.user_id || null,
      data.ip_address || null,
      data.user_agent || null
    );
    
    return result.lastInsertRowid as number;
  }
  
  /**
   * 记录服务器下载
   */
  logDownload(data: {
    server_id: string;
    user_id?: string;
    ip_address?: string;
  }): number {
    const result = db.prepare(`
      INSERT INTO download_history (server_id, user_id, ip_address)
      VALUES (?, ?, ?)
    `).run(
      data.server_id,
      data.user_id || null,
      data.ip_address || null
    );
    
    // 增加服务器下载计数
    db.prepare('UPDATE servers SET downloads = downloads + 1 WHERE id = ?')
      .run(data.server_id);
    
    return result.lastInsertRowid as number;
  }
  
  /**
   * 获取访问日志
   */
  getAccessLogs(options: { 
    limit?: number; 
    offset?: number;
    endpoint?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    let query = 'SELECT * FROM access_logs WHERE 1=1';
    const params: any[] = [];
    
    if (options.endpoint) {
      query += ' AND endpoint = ?';
      params.push(options.endpoint);
    }
    
    if (options.startDate) {
      query += ' AND timestamp >= ?';
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      query += ' AND timestamp <= ?';
      params.push(options.endDate);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (options.limit !== undefined) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    return db.prepare(query).all(...params) as AccessLog[];
  }
  
  /**
   * 获取下载记录
   */
  getDownloadHistory(options: { 
    limit?: number; 
    offset?: number;
    server_id?: string;
    startDate?: string;
    endDate?: string;
  } = {}) {
    let query = 'SELECT * FROM download_history WHERE 1=1';
    const params: any[] = [];
    
    if (options.server_id) {
      query += ' AND server_id = ?';
      params.push(options.server_id);
    }
    
    if (options.startDate) {
      query += ' AND timestamp >= ?';
      params.push(options.startDate);
    }
    
    if (options.endDate) {
      query += ' AND timestamp <= ?';
      params.push(options.endDate);
    }
    
    query += ' ORDER BY timestamp DESC';
    
    if (options.limit !== undefined) {
      query += ' LIMIT ?';
      params.push(options.limit);
      
      if (options.offset !== undefined) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }
    
    return db.prepare(query).all(...params) as DownloadRecord[];
  }
  
  /**
   * 获取活跃用户数量(过去30天)
   */
  getActiveUsers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM access_logs 
      WHERE user_id IS NOT NULL AND timestamp >= ?
    `).get(thirtyDaysAgo.toISOString()) as { count: number };
  }
  
  /**
   * 获取热门服务器
   */
  getPopularServers(limit = 10) {
    return db.prepare(`
      SELECT s.id, s.name, s.key, s.version, s.downloads, COUNT(d.id) as recent_downloads
      FROM servers s
      LEFT JOIN download_history d ON s.id = d.server_id AND d.timestamp >= datetime('now', '-30 day')
      GROUP BY s.id
      ORDER BY recent_downloads DESC, s.downloads DESC
      LIMIT ?
    `).all(limit);
  }
  
  /**
   * 记录Webhook事件
   */
  recordWebhookEvent(data: {
    source: string;
    event_type: string;
    payload: object | string;
  }): number {
    const payload = typeof data.payload === 'string' 
      ? data.payload 
      : JSON.stringify(data.payload);
    
    const result = db.prepare(`
      INSERT INTO webhook_events (
        source, 
        event_type, 
        payload, 
        processed, 
        created_at
      )
      VALUES (?, ?, ?, ?, ?)
    `).run(
      data.source,
      data.event_type,
      payload,
      false,
      new Date().toISOString()
    );
    
    return result.lastInsertRowid as number;
  }
  
  /**
   * 获取未处理的Webhook事件
   */
  getUnprocessedWebhookEvents(source?: string) {
    let query = 'SELECT * FROM webhook_events WHERE processed = ?';
    const params: any[] = [false];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    query += ' ORDER BY created_at';
    
    return db.prepare(query).all(...params) as WebhookEvent[];
  }
  
  /**
   * 标记Webhook事件为已处理
   */
  markWebhookEventProcessed(id: number, details?: string) {
    db.prepare(`
      UPDATE webhook_events
      SET 
        processed = ?,
        processed_at = ?,
        details = ?
      WHERE id = ?
    `).run(
      true,
      new Date().toISOString(),
      details || null,
      id
    );
  }
}

export default new StatsModel(); 