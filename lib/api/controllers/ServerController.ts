import { Request, Response } from 'express';
import ServerModel, { ServerInput } from '../models/ServerModel';

class ServerController {
  /**
   * 获取所有服务器
   */
  async getAll(req: Request, res: Response) {
    try {
      const { limit, offset, author_id, tags } = req.query;
      
      const options: {
        limit?: number;
        offset?: number;
        author_id?: string;
        tags?: string[];
      } = {};
      
      if (limit) options.limit = parseInt(limit as string);
      if (offset) options.offset = parseInt(offset as string);
      if (author_id) options.author_id = author_id as string;
      if (tags) {
        options.tags = Array.isArray(tags) 
          ? tags as string[]
          : [tags as string];
      }
      
      const servers = ServerModel.getAll(options);
      return res.json(servers);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取服务器列表失败' });
    }
  }
  
  /**
   * 通过ID获取服务器
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const server = ServerModel.getById(id);
      
      if (!server) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      return res.json(server);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取服务器失败' });
    }
  }
  
  /**
   * 通过Key获取服务器
   */
  async getByKey(req: Request, res: Response) {
    try {
      const { key } = req.params;
      const server = ServerModel.getByKey(key);
      
      if (!server) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      return res.json(server);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '获取服务器失败' });
    }
  }
  
  /**
   * 搜索服务器
   */
  async search(req: Request, res: Response) {
    try {
      const searchQuery = req.query.query as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      const tagIds = req.query.tags ? 
        Array.isArray(req.query.tags) ? 
          req.query.tags : [req.query.tags] : undefined;
      
      // 新增的高级筛选参数
      const sort = req.query.sort as 'newest' | 'oldest' | 'downloads' | 'rating' || 'newest';
      const minRating = parseFloat(req.query.minRating as string) || 0;
      const toolsRequired = req.query.tools ? 
        Array.isArray(req.query.tools) ? 
          req.query.tools : [req.query.tools] : undefined;

      if (!searchQuery || searchQuery.trim() === '') {
        return res.status(400).json({ error: 'Search query is required' });
      }

      const result = await ServerModel.search(searchQuery, { 
        tagIds, 
        limit, 
        offset,
        sort,
        minRating,
        toolsRequired
      });
      
      return res.json(result);
    } catch (error) {
      console.error('Error searching servers:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  /**
   * 创建服务器
   */
  async create(req: Request, res: Response) {
    try {
      const serverData: ServerInput = req.body;
      
      // 验证必填字段
      if (!serverData.name || !serverData.key || !serverData.version) {
        return res.status(400).json({ error: '名称、标识符和版本是必填的' });
      }
      
      // 检查key是否已存在
      const existingServer = ServerModel.getByKey(serverData.key);
      if (existingServer) {
        return res.status(400).json({ error: '该标识符已被使用' });
      }
      
      // 添加作者ID
      if (req.user) {
        serverData.author_id = req.user.id;
      }
      
      const server = ServerModel.create(serverData);
      return res.status(201).json(server);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '创建服务器失败' });
    }
  }
  
  /**
   * 更新服务器
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const serverData: Partial<ServerInput> = req.body;
      
      // 检查服务器是否存在
      const existingServer = ServerModel.getById(id);
      if (!existingServer) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      // 权限检查 - 只有作者或管理员可以更新
      if (
        req.user &&
        existingServer.author_id && 
        existingServer.author_id !== req.user.id && 
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ error: '无权更新此服务器' });
      }
      
      // 如果更新key，需要检查是否冲突
      if (serverData.key && serverData.key !== existingServer.key) {
        const keyExists = ServerModel.getByKey(serverData.key);
        if (keyExists) {
          return res.status(400).json({ error: '该标识符已被使用' });
        }
      }
      
      const updatedServer = ServerModel.update(id, serverData);
      return res.json(updatedServer);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '更新服务器失败' });
    }
  }
  
  /**
   * 删除服务器
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 检查服务器是否存在
      const existingServer = ServerModel.getById(id);
      if (!existingServer) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      // 权限检查 - 只有作者或管理员可以删除
      if (
        req.user &&
        existingServer.author_id && 
        existingServer.author_id !== req.user.id && 
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({ error: '无权删除此服务器' });
      }
      
      const result = ServerModel.delete(id);
      if (result) {
        return res.status(204).send();
      } else {
        return res.status(500).json({ error: '删除服务器失败' });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '删除服务器失败' });
    }
  }
  
  /**
   * 记录服务器下载
   */
  async recordDownload(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // 检查服务器是否存在
      const existingServer = ServerModel.getById(id);
      if (!existingServer) {
        return res.status(404).json({ error: '服务器不存在' });
      }
      
      const result = ServerModel.incrementDownloads(id);
      if (result) {
        return res.json({ success: true });
      } else {
        return res.status(500).json({ error: '记录下载失败' });
      }
    } catch (error: any) {
      return res.status(500).json({ error: error.message || '记录下载失败' });
    }
  }
}

// 为Express扩展Request类型，添加用户信息
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role?: string;
      };
    }
  }
}

export default new ServerController(); 