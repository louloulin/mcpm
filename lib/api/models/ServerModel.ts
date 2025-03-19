import { eq, sql, ilike } from 'drizzle-orm';
import { db, schema } from '../../database/db';
import { Server } from '../../database/schema';
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
  author_id?: number;
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
    const items = await db.select()
      .from(schema.servers)
      .limit(limit)
      .offset(offset);
    
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    }).from(schema.servers);

    return {
      items,
      total: Number(count)
    };
  }

  // 搜索服务器
  static async search(query: string, tags: string[] = [], limit: number = 10, offset: number = 0): Promise<{ items: Server[], total: number }> {
    const baseQuery = db.select().from(schema.servers);
    
    if (query) {
      baseQuery.where(
        sql`(${schema.servers.name} ILIKE ${`%${query}%`} OR ${schema.servers.description} ILIKE ${`%${query}%`})`
      );
    }

    if (tags.length > 0) {
      const serverIds = await db.select({ id: schema.servers.id })
        .from(schema.servers)
        .innerJoin(schema.serverTags, eq(schema.servers.id, schema.serverTags.serverId))
        .innerJoin(schema.tags, eq(schema.serverTags.tagId, schema.tags.id))
        .where(sql`${schema.tags.name} = ANY(${tags})`);

      baseQuery.where(sql`${schema.servers.id} = ANY(${serverIds.map(s => s.id)})`);
    }

    const items = await baseQuery.limit(limit).offset(offset);

    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    }).from(schema.servers);

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
  static async create(data: Omit<Server, 'id' | 'createdAt' | 'updatedAt' | 'downloads' | 'rating'>): Promise<Server> {
    const [server] = await db.insert(schema.servers)
      .values({
        ...data,
        downloads: 0,
        rating: 0
      })
      .returning();
    
    return server;
  }

  // 更新服务器
  static async update(id: number, data: Partial<Omit<Server, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Server | null> {
    const [server] = await db.update(schema.servers)
      .set({
        ...data,
        updatedAt: new Date()
      })
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

  // 获取服务器总数
  static async getTotalCount(): Promise<number> {
    const [{ count }] = await db.select({
      count: sql<number>`count(*)`
    }).from(schema.servers);
    
    return Number(count);
  }

  // 通过key获取服务器
  static async getByKey(key: string): Promise<Server | null> {
    const [server] = await db.select()
      .from(schema.servers)
      .where(eq(schema.servers.key, key))
      .limit(1);

    if (!server) return null;

    return server;
  }

  // 增加下载计数
  static async incrementDownloads(id: number): Promise<boolean> {
    const [server] = await db.update(schema.servers)
      .set({
        downloads: sql`${schema.servers.downloads} + 1`
      })
      .where(eq(schema.servers.id, id))
      .returning();

    return !!server;
  }

  // 加载服务器关联数据
  static async loadServerRelations(server: Server): Promise<Server & {
    args?: string[];
    env?: { key: string; value?: string }[];
    tools?: { name: string; description?: string; parameters?: { name: string; type: string; description?: string; required: boolean }[] }[];
    tags?: string[];
    compatibleClients?: string[];
  }> {
    // 加载参数
    const args = await db.select()
      .from(schema.serverArgs)
      .where(eq(schema.serverArgs.serverId, server.id));

    // 加载环境变量
    const envVars = await db.select()
      .from(schema.serverEnvVars)
      .where(eq(schema.serverEnvVars.serverId, server.id));

    // 加载工具和参数
    const tools = await db.select()
      .from(schema.tools)
      .where(eq(schema.tools.serverId, server.id));

    const toolsWithParams = await Promise.all(tools.map(async tool => {
      const parameters = await db.select()
        .from(schema.parameters)
        .where(eq(schema.parameters.toolId, tool.id));

      return {
        name: tool.name,
        description: tool.description,
        parameters: parameters.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description,
          required: p.required
        }))
      };
    }));

    // 加载标签
    const tags = await db.select({ name: schema.tags.name })
      .from(schema.tags)
      .innerJoin(schema.serverTags, eq(schema.tags.id, schema.serverTags.tagId))
      .where(eq(schema.serverTags.serverId, server.id));

    // 加载兼容客户端
    const clients = await db.select({ name: schema.compatibleClients.name })
      .from(schema.compatibleClients)
      .innerJoin(schema.serverClients, eq(schema.compatibleClients.id, schema.serverClients.clientId))
      .where(eq(schema.serverClients.serverId, server.id));

    return {
      ...server,
      args: args.map(a => a.arg),
      env: envVars.map(e => ({ key: e.key, value: e.value ?? undefined })),
      tools: toolsWithParams.map(t => ({
        name: t.name,
        description: t.description ?? undefined,
        parameters: t.parameters.map(p => ({
          name: p.name,
          type: p.type,
          description: p.description ?? undefined,
          required: Boolean(p.required)
        }))
      })),
      tags: tags.map(t => t.name),
      compatibleClients: clients.map(c => c.name)
    };
  }
}

export default new ServerModel(); 