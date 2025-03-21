import { compareVersions } from 'compare-versions';
import { db } from '@/lib/database';
import { servers, dependencies, notifications } from '@/lib/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * 更新通知服务
 * 用于检查服务器依赖更新并通知用户
 */
export class UpdateNotifier {
  /**
   * 检查所有服务器的依赖更新
   */
  public async checkUpdates(): Promise<number> {
    try {
      console.log('开始检查服务器依赖更新...');
      
      // 获取所有有依赖关系的服务器
      const allDependencies = await db.select().from(dependencies);
      
      if (allDependencies.length === 0) {
        console.log('没有找到依赖关系，跳过更新检查');
        return 0;
      }
      
      // 跟踪已发送的通知数量
      let notificationCount = 0;
      
      // 检查每个依赖关系
      for (const dep of allDependencies) {
        try {
          // 获取依赖的服务器当前信息
          const dependencyServer = await db.query.servers.findFirst({
            where: eq(servers.key, dep.dependencyKey),
          });
          
          if (!dependencyServer) {
            console.log(`依赖服务器 ${dep.dependencyKey} 不存在，跳过`);
            continue;
          }
          
          // 检查版本是否有更新
          if (compareVersions(dependencyServer.version, dep.version) > 0) {
            console.log(`发现更新: ${dependencyServer.name} 从 ${dep.version} 更新到 ${dependencyServer.version}`);
            
            // 获取依赖此服务器的服务器信息
            const dependentServer = await db.query.servers.findFirst({
              where: eq(servers.id, dep.serverId),
            });
            
            if (!dependentServer) {
              console.log(`依赖方服务器 ${dep.serverId} 不存在，跳过`);
              continue;
            }
            
            // 查找使用该服务器的用户
            const usersToNotify = await this.findUsersForServer(dep.serverId);
            
            // 为每个用户创建通知
            for (const userId of usersToNotify) {
              // 检查是否已有此更新的通知
              const existingNotification = await db.select()
                .from(notifications)
                .where(
                  and(
                    eq(notifications.userId, userId),
                    eq(notifications.category, 'update'),
                    sql`metadata->>'dependencyKey' = ${dependencyServer.key}`,
                    eq(notifications.read, false)
                  )
                )
                .limit(1);
              
              // 如果已有通知，跳过
              if (existingNotification.length > 0) {
                console.log(`用户 ${userId} 已经收到了关于 ${dependencyServer.name} 更新的通知`);
                continue;
              }
              
              // 创建新通知
              await db.insert(notifications).values({
                id: uuidv4(),
                userId: userId,
                title: `依赖更新: ${dependencyServer.name}`,
                message: `${dependencyServer.name} 已从 ${dep.version} 更新到 ${dependencyServer.version}。您的服务器 ${dependentServer.name} 可能需要适配此更新。`,
                type: 'info',
                category: 'update',
                read: false,
                link: `/servers/${dependencyServer.id}`,
                metadata: {
                  dependencyKey: dependencyServer.key,
                  dependencyName: dependencyServer.name,
                  oldVersion: dep.version,
                  newVersion: dependencyServer.version,
                  serverId: dependentServer.id,
                  serverName: dependentServer.name
                },
                createdAt: new Date()
              });
              
              notificationCount++;
            }
          }
        } catch (depError) {
          console.error(`处理依赖 ${dep.id} 时出错:`, depError);
          // 继续处理其他依赖
        }
      }
      
      console.log(`完成依赖更新检查，发送了 ${notificationCount} 条通知`);
      return notificationCount;
    } catch (error) {
      console.error('检查更新时出错:', error);
      throw error;
    }
  }
  
  /**
   * 查找使用特定服务器的用户列表
   */
  private async findUsersForServer(serverId: string): Promise<string[]> {
    // 这里应该查询使用该服务器的用户
    // 可能的来源:
    // 1. server_downloads 表
    // 2. user_servers 表 (如果存在)
    // 3. server_favorites 表

    try {
      // 这是一个简化实现，合并了下载、喜欢和查看过该服务器的用户
      const downloadUsers = await db.select({ userId: sql`DISTINCT user_id` })
        .from(sql`server_downloads`)
        .where(sql`server_id = ${serverId}`);
        
      const favoriteUsers = await db.select({ userId: sql`DISTINCT user_id` })
        .from(sql`server_favorites`)
        .where(sql`server_id = ${serverId}`);
        
      const viewUsers = await db.select({ userId: sql`DISTINCT user_id` })
        .from(sql`server_views`)
        .where(sql`server_id = ${serverId}`);
      
      const userServerUsers = await db.select({ userId: sql`DISTINCT user_id` })
        .from(sql`user_servers`)
        .where(sql`server_id = ${serverId}`);
      
      // 合并用户ID去重
      const allUserIds = new Set<string>();
      
      [...downloadUsers, ...favoriteUsers, ...viewUsers, ...userServerUsers].forEach(item => {
        if (item.userId) {
          allUserIds.add(item.userId.toString());
        }
      });
      
      return Array.from(allUserIds);
    } catch (error) {
      console.error(`查找服务器 ${serverId} 的用户时出错:`, error);
      return [];
    }
  }
}

// 创建单例实例
export const updateNotifier = new UpdateNotifier(); 