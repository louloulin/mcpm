import db from '../../database/db';
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

export interface Server {
  id: string;
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
  created_at: string;
  updated_at: string;
  downloads: number;
  rating: number;
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

class ServerModel {
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
   * 获取所有服务器
   */
  getAll(options: { limit?: number; offset?: number; author_id?: string; tags?: string[] } = {}) {
    const { limit = 100, offset = 0, author_id, tags } = options;
    
    // 基本查询
    let query = `
      SELECT * FROM servers
      WHERE 1=1
    `;
    const params: any[] = [];
    
    // 作者筛选
    if (author_id) {
      query += ' AND author_id = ?';
      params.push(author_id);
    }
    
    // 标签筛选 (需要通过子查询或连接来处理)
    if (tags && tags.length > 0) {
      const placeholders = tags.map(() => '?').join(',');
      query += `
        AND id IN (
          SELECT server_id FROM server_tags
          JOIN tags ON server_tags.tag_id = tags.id
          WHERE tags.name IN (${placeholders})
          GROUP BY server_id
          HAVING COUNT(DISTINCT tags.name) = ?
        )
      `;
      params.push(...tags, tags.length);
    }
    
    // 分页
    query += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    // 执行查询
    const servers = db.prepare(query).all(...params) as Server[];
    
    // 加载相关数据
    return servers.map(server => this.loadServerRelations(server));
  }
  
  /**
   * 通过ID获取服务器
   */
  getById(id: string) {
    const server = db.prepare('SELECT * FROM servers WHERE id = ?').get(id) as Server | undefined;
    if (!server) return null;
    
    return this.loadServerRelations(server);
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
   * 搜索服务器
   */
  search(query: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options;
    
    // 简单的文本搜索 (生产环境应使用全文搜索或向量搜索)
    const searchQuery = `
      SELECT * FROM servers
      WHERE name LIKE ? OR description LIKE ? OR key LIKE ?
      LIMIT ? OFFSET ?
    `;
    const searchParam = `%${query}%`;
    
    const servers = db.prepare(searchQuery).all(searchParam, searchParam, searchParam, limit, offset) as Server[];
    
    return servers.map(server => this.loadServerRelations(server));
  }
  
  /**
   * 创建服务器
   */
  create(serverData: ServerInput) {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    // 开始事务
    const createServer = db.transaction((data: ServerInput & { id: string; created_at: string; updated_at: string }) => {
      // 插入基本服务器信息
      db.prepare(`
        INSERT INTO servers 
        (id, name, key, version, description, author_id, homepage, license, command, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.id,
        data.name,
        data.key,
        data.version,
        data.description || null,
        data.author_id || null,
        data.homepage || null,
        data.license || null,
        data.command || null,
        data.created_at,
        data.updated_at
      );
      
      // 插入参数
      if (data.args && data.args.length > 0) {
        const insertArg = db.prepare('INSERT INTO server_args (server_id, arg) VALUES (?, ?)');
        for (const arg of data.args) {
          insertArg.run(data.id, arg);
        }
      }
      
      // 插入环境变量
      if (data.env && data.env.length > 0) {
        const insertEnv = db.prepare('INSERT INTO server_env (server_id, key, value) VALUES (?, ?, ?)');
        for (const env of data.env) {
          insertEnv.run(data.id, env.key, env.value || null);
        }
      }
      
      // 插入工具
      if (data.tools && data.tools.length > 0) {
        const insertTool = db.prepare('INSERT INTO tools (server_id, name, description) VALUES (?, ?, ?)');
        const insertParam = db.prepare(
          'INSERT INTO parameters (tool_id, name, type, description, required) VALUES (?, ?, ?, ?, ?)'
        );
        
        for (const tool of data.tools) {
          const toolInfo = insertTool.run(data.id, tool.name, tool.description || null);
          const toolId = toolInfo.lastInsertRowid as number;
          
          if (tool.parameters && tool.parameters.length > 0) {
            for (const param of tool.parameters) {
              insertParam.run(
                toolId,
                param.name,
                param.type,
                param.description || null,
                param.required ? 1 : 0
              );
            }
          }
        }
      }
      
      // 处理标签
      if (data.tags && data.tags.length > 0) {
        const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
        const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?) RETURNING id');
        const linkTag = db.prepare('INSERT INTO server_tags (server_id, tag_id) VALUES (?, ?)');
        
        for (const tagName of data.tags) {
          // 查找或创建标签
          let tagId: number;
          const existingTag = getTagId.get(tagName) as { id: number } | undefined;
          
          if (existingTag) {
            tagId = existingTag.id;
          } else {
            const newTag = insertTag.get(tagName) as { id: number };
            tagId = newTag.id;
          }
          
          // 关联标签到服务器
          linkTag.run(data.id, tagId);
        }
      }
      
      // 处理兼容客户端
      if (data.compatibleClients && data.compatibleClients.length > 0) {
        const getClientId = db.prepare('SELECT id FROM compatible_clients WHERE name = ?');
        const insertClient = db.prepare('INSERT INTO compatible_clients (name) VALUES (?) RETURNING id');
        const linkClient = db.prepare('INSERT INTO server_clients (server_id, client_id) VALUES (?, ?)');
        
        for (const clientName of data.compatibleClients) {
          // 查找或创建客户端
          let clientId: number;
          const existingClient = getClientId.get(clientName) as { id: number } | undefined;
          
          if (existingClient) {
            clientId = existingClient.id;
          } else {
            const newClient = insertClient.get(clientName) as { id: number };
            clientId = newClient.id;
          }
          
          // 关联客户端到服务器
          linkClient.run(data.id, clientId);
        }
      }
      
      return data.id;
    });
    
    // 执行事务
    const serverId = createServer({
      ...serverData,
      id,
      created_at: now,
      updated_at: now
    });
    
    return this.getById(serverId);
  }
  
  /**
   * 更新服务器
   */
  update(id: string, serverData: Partial<ServerInput>) {
    const now = new Date().toISOString();
    
    // 检查服务器是否存在
    const existing = this.getById(id);
    if (!existing) return null;
    
    // 开始事务
    const updateServer = db.transaction((data: Partial<ServerInput> & { id: string; updated_at: string }) => {
      // 更新基本信息
      let updateQuery = 'UPDATE servers SET updated_at = ?';
      const params: any[] = [data.updated_at];
      
      if (data.name) {
        updateQuery += ', name = ?';
        params.push(data.name);
      }
      
      if (data.version) {
        updateQuery += ', version = ?';
        params.push(data.version);
      }
      
      if (data.description !== undefined) {
        updateQuery += ', description = ?';
        params.push(data.description || null);
      }
      
      if (data.homepage !== undefined) {
        updateQuery += ', homepage = ?';
        params.push(data.homepage || null);
      }
      
      if (data.license !== undefined) {
        updateQuery += ', license = ?';
        params.push(data.license || null);
      }
      
      if (data.command !== undefined) {
        updateQuery += ', command = ?';
        params.push(data.command || null);
      }
      
      updateQuery += ' WHERE id = ?';
      params.push(data.id);
      
      db.prepare(updateQuery).run(...params);
      
      // 更新参数 (删除后重新插入)
      if (data.args !== undefined) {
        db.prepare('DELETE FROM server_args WHERE server_id = ?').run(data.id);
        
        if (data.args && data.args.length > 0) {
          const insertArg = db.prepare('INSERT INTO server_args (server_id, arg) VALUES (?, ?)');
          for (const arg of data.args) {
            insertArg.run(data.id, arg);
          }
        }
      }
      
      // 更新环境变量 (删除后重新插入)
      if (data.env !== undefined) {
        db.prepare('DELETE FROM server_env WHERE server_id = ?').run(data.id);
        
        if (data.env && data.env.length > 0) {
          const insertEnv = db.prepare('INSERT INTO server_env (server_id, key, value) VALUES (?, ?, ?)');
          for (const env of data.env) {
            insertEnv.run(data.id, env.key, env.value || null);
          }
        }
      }
      
      // 更新工具 (删除后重新插入)
      if (data.tools !== undefined) {
        // 获取所有工具ID
        const toolIds = db.prepare('SELECT id FROM tools WHERE server_id = ?').all(data.id) as { id: number }[];
        
        // 删除参数
        for (const { id: toolId } of toolIds) {
          db.prepare('DELETE FROM parameters WHERE tool_id = ?').run(toolId);
        }
        
        // 删除工具
        db.prepare('DELETE FROM tools WHERE server_id = ?').run(data.id);
        
        // 重新插入工具和参数
        if (data.tools && data.tools.length > 0) {
          const insertTool = db.prepare('INSERT INTO tools (server_id, name, description) VALUES (?, ?, ?)');
          const insertParam = db.prepare(
            'INSERT INTO parameters (tool_id, name, type, description, required) VALUES (?, ?, ?, ?, ?)'
          );
          
          for (const tool of data.tools) {
            const toolInfo = insertTool.run(data.id, tool.name, tool.description || null);
            const toolId = toolInfo.lastInsertRowid as number;
            
            if (tool.parameters && tool.parameters.length > 0) {
              for (const param of tool.parameters) {
                insertParam.run(
                  toolId,
                  param.name,
                  param.type,
                  param.description || null,
                  param.required ? 1 : 0
                );
              }
            }
          }
        }
      }
      
      // 更新标签 (删除后重新插入)
      if (data.tags !== undefined) {
        db.prepare('DELETE FROM server_tags WHERE server_id = ?').run(data.id);
        
        if (data.tags && data.tags.length > 0) {
          const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
          const insertTag = db.prepare('INSERT INTO tags (name) VALUES (?) RETURNING id');
          const linkTag = db.prepare('INSERT INTO server_tags (server_id, tag_id) VALUES (?, ?)');
          
          for (const tagName of data.tags) {
            // 查找或创建标签
            let tagId: number;
            const existingTag = getTagId.get(tagName) as { id: number } | undefined;
            
            if (existingTag) {
              tagId = existingTag.id;
            } else {
              const newTag = insertTag.get(tagName) as { id: number };
              tagId = newTag.id;
            }
            
            // 关联标签到服务器
            linkTag.run(data.id, tagId);
          }
        }
      }
      
      // 更新兼容客户端 (删除后重新插入)
      if (data.compatibleClients !== undefined) {
        db.prepare('DELETE FROM server_clients WHERE server_id = ?').run(data.id);
        
        if (data.compatibleClients && data.compatibleClients.length > 0) {
          const getClientId = db.prepare('SELECT id FROM compatible_clients WHERE name = ?');
          const insertClient = db.prepare('INSERT INTO compatible_clients (name) VALUES (?) RETURNING id');
          const linkClient = db.prepare('INSERT INTO server_clients (server_id, client_id) VALUES (?, ?)');
          
          for (const clientName of data.compatibleClients) {
            // 查找或创建客户端
            let clientId: number;
            const existingClient = getClientId.get(clientName) as { id: number } | undefined;
            
            if (existingClient) {
              clientId = existingClient.id;
            } else {
              const newClient = insertClient.get(clientName) as { id: number };
              clientId = newClient.id;
            }
            
            // 关联客户端到服务器
            linkClient.run(data.id, clientId);
          }
        }
      }
      
      return data.id;
    });
    
    // 执行事务
    updateServer({
      ...serverData,
      id,
      updated_at: now
    });
    
    return this.getById(id);
  }
  
  /**
   * 删除服务器
   */
  delete(id: string) {
    const server = this.getById(id);
    if (!server) return false;
    
    // 由于我们在表结构中使用了ON DELETE CASCADE，所以只需删除服务器主记录
    const result = db.prepare('DELETE FROM servers WHERE id = ?').run(id);
    return result.changes > 0;
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