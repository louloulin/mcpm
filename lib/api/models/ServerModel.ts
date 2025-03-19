import { eq } from 'drizzle-orm';
import { db, schema } from '../../database/db';
import { Server } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export interface Tool {
  name: string;
  description?: string;
  parameters?: Parameter[];
}

export interface Parameter {
  name: string;
  type: string;
  description?: string;
  required: boolean;
}

export interface EnvVar {
  key: string;
  value?: string;
}

export interface ServerInput {
  name: string;
  key: string;
  version: string;
  description?: string;
  author_id?: string;
  homepage?: string;
  license?: string;
  command?: string;
  args?: string[];
  env?: EnvVar[];
  tools?: Tool[];
  tags?: string[];
  compatibleClients?: string[];
}

export class ServerModel {
  // 获取所有服务器
  static async getAll(limit: number = 10, offset: number = 0): Promise<{ items: Server[], total: number }> {
    const items = await db.select().from(schema.servers)
      .limit(limit)
      .offset(offset);
    
    const [{ count }] = await db.select({
      count: db.fn.count()
    }).from(schema.servers);

    return {
      items,
      total: Number(count)
    };
  }

  // 搜索服务器
  static async search(query: string, tags: string[] = [], limit: number = 10, offset: number = 0): Promise<{ items: Server[], total: number }> {
    const items = await db.select()
      .from(schema.servers)
      .where(
        query ? 
          db.sql`(name ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`})` :
          undefined
      )
      .where(
        tags.length > 0 ?
          db.sql`tags && ${tags}` :
          undefined
      )
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({
      count: db.fn.count()
    })
    .from(schema.servers)
    .where(
      query ? 
        db.sql`(name ILIKE ${`%${query}%`} OR description ILIKE ${`%${query}%`})` :
        undefined
    )
    .where(
      tags.length > 0 ?
        db.sql`tags && ${tags}` :
        undefined
    );

    return {
      items,
      total: Number(count)
    };
  }

  // 根据ID获取服务器
  static async getById(id: number): Promise<Server | null> {
    const [server] = await db.select()
      .from(schema.servers)
      .where(eq(schema.servers.id, id))
      .limit(1);
    
    return server || null;
  }

  // 创建服务器
  static async create(data: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>): Promise<Server> {
    const [server] = await db.insert(schema.servers)
      .values(data)
      .returning();
    
    return server;
  }

  // 更新服务器
  static async update(id: number, data: Partial<Server>): Promise<Server | null> {
    const [server] = await db.update(schema.servers)
      .set(data)
      .where(eq(schema.servers.id, id))
      .returning();
    
    return server || null;
  }

  // 删除服务器
  static async delete(id: number): Promise<boolean> {
    const [server] = await db.delete(schema.servers)
      .where(eq(schema.servers.id, id))
      .returning();
    
    return !!server;
  }

  // 暴露数据库实例用于统计查询
  db = db;
  
  /**
   * 获取服务器总数
   */
  getTotalCount() {
    const result = db.prepare('SELECT COUNT(*) as count FROM servers').get() as { count: number };
    return result.count || 0;
  }
  
  /**
   * 通过key获取服务器
   */
  getByKey(key: string) {
    const server = db.prepare('SELECT * FROM servers WHERE key = ?').get(key) as Server | undefined;
    if (!server) return null;
    
    return this.loadServerRelations(server);
  }
  
  /**
   * 增加下载计数
   */
  incrementDownloads(id: string) {
    const result = db.prepare('UPDATE servers SET downloads = downloads + 1 WHERE id = ?').run(id);
    return result.changes > 0;
  }
  
  /**
   * 加载服务器关联数据
   */
  private loadServerRelations(server: Server): Server {
    // 加载参数
    const args = db.prepare('SELECT arg FROM server_args WHERE server_id = ?').all(server.id) as { arg: string }[];
    server.args = args.map(a => a.arg);
    
    // 加载环境变量
    const envVars = db.prepare('SELECT key, value FROM server_env WHERE server_id = ?').all(server.id) as EnvVar[];
    server.env = envVars;
    
    // 加载工具和参数
    const tools = db.prepare('SELECT id, name, description FROM tools WHERE server_id = ?').all(server.id) as (Tool & { id: number })[];
    server.tools = tools.map(tool => {
      const parameters = db.prepare(`
        SELECT name, type, description, required 
        FROM parameters 
        WHERE tool_id = ?
      `).all(tool.id) as Parameter[];
      
      return {
        name: tool.name,
        description: tool.description,
        parameters: parameters.map(p => ({
          ...p,
          required: Boolean(p.required)
        }))
      };
    });
    
    // 加载标签
    const tags = db.prepare(`
      SELECT tags.name
      FROM server_tags
      JOIN tags ON server_tags.tag_id = tags.id
      WHERE server_tags.server_id = ?
    `).all(server.id) as { name: string }[];
    server.tags = tags.map(t => t.name);
    
    // 加载兼容客户端
    const clients = db.prepare(`
      SELECT compatible_clients.name
      FROM server_clients
      JOIN compatible_clients ON server_clients.client_id = compatible_clients.id
      WHERE server_clients.server_id = ?
    `).all(server.id) as { name: string }[];
    server.compatibleClients = clients.map(c => c.name);
    
    return server;
  }
}

export default new ServerModel(); 