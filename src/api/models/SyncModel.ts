import db from '../../database/db';

export interface SyncRecord {
  id: number;
  source: string;
  started_at: string;
  completed_at?: string;
  status: 'pending' | 'completed' | 'failed';
  details?: string;
}

class SyncModel {
  /**
   * 获取所有同步记录
   */
  getAll(options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options;
    const records = db.prepare(`
      SELECT * FROM sync_history
      ORDER BY started_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset) as SyncRecord[];
    
    return records;
  }
  
  /**
   * 通过ID获取同步记录
   */
  getById(id: number) {
    const record = db.prepare('SELECT * FROM sync_history WHERE id = ?').get(id) as SyncRecord | undefined;
    return record || null;
  }
  
  /**
   * 获取最新的同步记录
   */
  getLatest(source?: string) {
    let query = `
      SELECT * FROM sync_history
      WHERE status = 'completed'
    `;
    const params: any[] = [];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    query += ' ORDER BY completed_at DESC LIMIT 1';
    
    const record = db.prepare(query).get(...params) as SyncRecord | undefined;
    return record || null;
  }
  
  /**
   * 创建同步记录
   */
  create(source: string): number {
    const now = new Date().toISOString();
    
    const result = db.prepare(`
      INSERT INTO sync_history (source, started_at, status)
      VALUES (?, ?, ?)
    `).run(source, now, 'pending');
    
    return result.lastInsertRowid as number;
  }
  
  /**
   * 更新同步记录
   */
  update(id: number, data: { status: 'completed' | 'failed', details?: string }) {
    const now = new Date().toISOString();
    
    db.prepare(`
      UPDATE sync_history
      SET 
        status = ?,
        completed_at = ?,
        details = ?
      WHERE id = ?
    `).run(data.status, now, data.details || null, id);
    
    return this.getById(id);
  }
  
  /**
   * 获取当前正在进行的同步
   */
  getPendingSync(source?: string) {
    let query = 'SELECT * FROM sync_history WHERE status = ?';
    const params: any[] = ['pending'];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    const record = db.prepare(query).get(...params) as SyncRecord | undefined;
    return record || null;
  }
}

export default new SyncModel(); 