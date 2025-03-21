import { db } from "@/lib/database";
import { notifications, notificationSettings, notificationTemplates } from "@/lib/database/schema";
import { and, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";
import { SQL } from "drizzle-orm/sql";

/**
 * 通知类型
 */
export enum NotificationType {
  INFO = "info",
  SUCCESS = "success",
  WARNING = "warning",
  ERROR = "error",
}

/**
 * 通知分类
 */
export enum NotificationCategory {
  SYSTEM = "system",
  SERVER = "server",
  USER = "user",
  SECURITY = "security",
  BILLING = "billing",
  PERFORMANCE = "performance",
}

/**
 * 通知传输渠道
 */
export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH = "push",
}

/**
 * 通知数据接口
 */
export interface NotificationData {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  read?: boolean;
  link?: string;
  metadata?: Record<string, any>;
  createdAt?: Date;
  expiresAt?: Date;
}

/**
 * 通知配置接口
 */
export interface NotificationConfig {
  // 用于替换模板中的变量
  variables?: Record<string, any>;
  // 通知链接
  link?: string;
  // 附加元数据
  metadata?: Record<string, any>;
  // 过期时间(天)
  expiresInDays?: number;
  // 通知渠道
  channels?: NotificationChannel[];
}

/**
 * 通知设置接口
 */
export interface NotificationSettings {
  id?: string;
  userId: string;
  enableAll: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  categorySettings?: Record<NotificationCategory, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
}

/**
 * 通知服务类
 * 
 * 负责创建、查询和管理通知
 */
export class NotificationService {
  private static instance: NotificationService;
  private eventEmitter: EventEmitter;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.eventEmitter.setMaxListeners(100);
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * 创建新通知
   * @param data 通知数据
   */
  public async createNotification(data: NotificationData): Promise<string> {
    try {
      // 检查用户的通知设置
      const settings = await this.getUserSettings(data.userId);
      
      // 如果用户关闭了所有通知，或此类别的通知，则不创建
      if (!settings.enableAll) {
        return "";
      }
      
      // 检查此类别是否需要特殊处理
      if (settings.categorySettings && 
          settings.categorySettings[data.category] && 
          !settings.categorySettings[data.category].enabled) {
        return "";
      }
      
      // 设置ID和默认值
      const notificationId = data.id || uuidv4();
      const now = new Date();
      
      // 插入通知
      await db.insert(notifications).values({
        id: notificationId,
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type,
        category: data.category,
        read: data.read || false,
        link: data.link,
        metadata: data.metadata,
        createdAt: data.createdAt || now,
        expiresAt: data.expiresAt,
      });
      
      // 发出通知创建事件
      this.emitNotification({
        ...data,
        id: notificationId,
        createdAt: data.createdAt || now,
      });
      
      return notificationId;
    } catch (error) {
      console.error("创建通知失败:", error);
      throw error;
    }
  }

  /**
   * 使用模板创建通知
   * @param templateName 模板名称
   * @param userId 用户ID
   * @param config 通知配置
   */
  public async createNotificationFromTemplate(
    templateName: string,
    userId: string,
    config?: NotificationConfig
  ): Promise<string> {
    try {
      // 查找模板
      const [template] = await db
        .select()
        .from(notificationTemplates)
        .where(eq(notificationTemplates.name, templateName));
      
      if (!template) {
        throw new Error(`通知模板 "${templateName}" 不存在`);
      }
      
      // 替换模板变量
      const variables = config?.variables || {};
      let title = template.titleTemplate;
      let message = template.messageTemplate;
      
      // 简单的变量替换
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
        title = title.replace(regex, String(value));
        message = message.replace(regex, String(value));
      }
      
      // 创建通知数据
      const notificationData: NotificationData = {
        userId,
        title,
        message,
        type: (template.defaultType as NotificationType) || NotificationType.INFO,
        category: template.category as NotificationCategory,
        link: config?.link,
        metadata: config?.metadata,
      };
      
      // 如果设置了过期时间
      if (config?.expiresInDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + config.expiresInDays);
        notificationData.expiresAt = expiresAt;
      }
      
      // 创建通知
      return this.createNotification(notificationData);
    } catch (error) {
      console.error("使用模板创建通知失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户通知列表
   * @param userId 用户ID
   * @param options 查询选项
   */
  public async getUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      category?: NotificationCategory | NotificationCategory[];
      limit?: number;
      offset?: number;
    }
  ): Promise<NotificationData[]> {
    try {
      let query = db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            options?.unreadOnly ? eq(notifications.read, false) : undefined,
            options?.category
              ? Array.isArray(options.category)
                ? inArray(notifications.category, options.category)
                : eq(notifications.category, options.category)
              : undefined,
            isNull(notifications.expiresAt) as SQL<unknown> || 
              lt(sql`NOW()`, notifications.expiresAt)
          )
        )
        .orderBy(sql`${notifications.createdAt} DESC`);
      
      // 应用分页
      if (options?.limit) {
        query = query.limit(options.limit) as any;
      }
      
      if (options?.offset) {
        query = query.offset(options.offset) as any;
      }
      
      const results = await query;
      
      return results.map(notification => ({
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: notification.type as NotificationType,
        category: notification.category as NotificationCategory,
        read: notification.read,
        link: notification.link || undefined,
        metadata: notification.metadata as Record<string, any> || {},
        createdAt: notification.createdAt as Date,
        expiresAt: notification.expiresAt as Date || undefined,
      }));
    } catch (error) {
      console.error("获取用户通知失败:", error);
      throw error;
    }
  }

  /**
   * 标记通知为已读
   * @param notificationId 通知ID
   * @param userId 用户ID (用于验证)
   */
  public async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("标记通知为已读失败:", error);
      throw error;
    }
  }

  /**
   * 标记用户所有通知为已读
   * @param userId 用户ID
   * @param category 可选类别筛选
   */
  public async markAllAsRead(
    userId: string,
    category?: NotificationCategory
  ): Promise<number> {
    try {
      const result = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false),
            category ? eq(notifications.category, category) : undefined
          )
        );
      
      return result.rowCount || 0;
    } catch (error) {
      console.error("标记所有通知为已读失败:", error);
      throw error;
    }
  }

  /**
   * 获取用户的通知设置
   * @param userId 用户ID
   */
  public async getUserSettings(userId: string): Promise<NotificationSettings> {
    try {
      // 查询用户的设置
      const existingSettings = await db
        .select()
        .from(notificationSettings)
        .where(eq(notificationSettings.userId, userId));
      
      // 如果有设置，返回
      if (existingSettings.length > 0) {
        const settings = existingSettings[0];
        return {
          id: settings.id,
          userId: settings.userId,
          enableAll: settings.enableAll,
          emailEnabled: settings.emailEnabled,
          pushEnabled: settings.pushEnabled,
          inAppEnabled: settings.inAppEnabled,
          categorySettings: settings.categorySettings as Record<
            NotificationCategory,
            { enabled: boolean; channels: NotificationChannel[] }
          >,
        };
      }
      
      // 如果没有设置，创建默认设置
      const defaultSettings: NotificationSettings = {
        userId,
        enableAll: true,
        emailEnabled: true,
        pushEnabled: true,
        inAppEnabled: true,
        categorySettings: {
          [NotificationCategory.SYSTEM]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.EMAIL,
            ],
          },
          [NotificationCategory.SERVER]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.EMAIL,
              NotificationChannel.PUSH,
            ],
          },
          [NotificationCategory.USER]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          },
          [NotificationCategory.SECURITY]: {
            enabled: true,
            channels: [
              NotificationChannel.IN_APP,
              NotificationChannel.EMAIL,
              NotificationChannel.PUSH,
            ],
          },
          [NotificationCategory.BILLING]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
          },
          [NotificationCategory.PERFORMANCE]: {
            enabled: true,
            channels: [NotificationChannel.IN_APP],
          },
        },
      };
      
      // 创建用户的默认设置
      const [result] = await db
        .insert(notificationSettings)
        .values({
          userId,
          enableAll: defaultSettings.enableAll,
          emailEnabled: defaultSettings.emailEnabled,
          pushEnabled: defaultSettings.pushEnabled,
          inAppEnabled: defaultSettings.inAppEnabled,
          categorySettings: defaultSettings.categorySettings,
        })
        .returning();
      
      return {
        ...defaultSettings,
        id: result.id,
      };
    } catch (error) {
      console.error("获取用户通知设置失败:", error);
      throw error;
    }
  }

  /**
   * 更新用户的通知设置
   * @param userId 用户ID
   * @param settings 新的设置
   */
  public async updateUserSettings(
    userId: string,
    settings: Partial<NotificationSettings>
  ): Promise<NotificationSettings> {
    try {
      // 先获取现有设置
      const currentSettings = await this.getUserSettings(userId);
      
      // 准备更新
      const updateData: Record<string, any> = {};
      
      if (settings.enableAll !== undefined) {
        updateData.enableAll = settings.enableAll;
      }
      
      if (settings.emailEnabled !== undefined) {
        updateData.emailEnabled = settings.emailEnabled;
      }
      
      if (settings.pushEnabled !== undefined) {
        updateData.pushEnabled = settings.pushEnabled;
      }
      
      if (settings.inAppEnabled !== undefined) {
        updateData.inAppEnabled = settings.inAppEnabled;
      }
      
      if (settings.categorySettings) {
        // 合并类别设置，而不是完全替换
        updateData.categorySettings = {
          ...currentSettings.categorySettings,
          ...settings.categorySettings,
        };
      }
      
      // 更新设置
      const [updatedSettings] = await db
        .update(notificationSettings)
        .set(updateData)
        .where(eq(notificationSettings.userId, userId))
        .returning();
      
      return {
        id: updatedSettings.id,
        userId: updatedSettings.userId,
        enableAll: updatedSettings.enableAll,
        emailEnabled: updatedSettings.emailEnabled,
        pushEnabled: updatedSettings.pushEnabled,
        inAppEnabled: updatedSettings.inAppEnabled,
        categorySettings: updatedSettings.categorySettings as Record<
          NotificationCategory,
          { enabled: boolean; channels: NotificationChannel[] }
        >,
      };
    } catch (error) {
      console.error("更新用户通知设置失败:", error);
      throw error;
    }
  }

  /**
   * 删除通知
   * @param notificationId 通知ID
   * @param userId 用户ID (用于验证)
   */
  public async deleteNotification(
    notificationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const result = await db
        .delete(notifications)
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        );
      
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("删除通知失败:", error);
      throw error;
    }
  }

  /**
   * 清理已过期的通知
   */
  public async cleanupExpiredNotifications(): Promise<number> {
    try {
      const result = await db
        .delete(notifications)
        .where(
          and(
            sql`${notifications.expiresAt} IS NOT NULL`,
            sql`${notifications.expiresAt} < NOW()`
          )
        );
      
      return result.rowCount || 0;
    } catch (error) {
      console.error("清理过期通知失败:", error);
      throw error;
    }
  }

  /**
   * 创建通知模板
   * @param template 模板数据
   */
  public async createTemplate(template: {
    name: string;
    category: NotificationCategory;
    titleTemplate: string;
    messageTemplate: string;
    defaultType?: NotificationType;
    variables?: Record<string, string>;
  }): Promise<string> {
    try {
      const [result] = await db
        .insert(notificationTemplates)
        .values({
          name: template.name,
          category: template.category,
          titleTemplate: template.titleTemplate,
          messageTemplate: template.messageTemplate,
          defaultType: template.defaultType || NotificationType.INFO,
          variables: template.variables || {},
        })
        .returning();
      
      return result.id;
    } catch (error) {
      console.error("创建通知模板失败:", error);
      throw error;
    }
  }

  /**
   * 监听用户的实时通知
   * @param userId 用户ID
   * @param callback 回调函数
   */
  public subscribeToUserNotifications(
    userId: string,
    callback: (notification: NotificationData) => void
  ): () => void {
    const eventName = `notification:${userId}`;
    
    // 添加事件监听器
    this.eventEmitter.on(eventName, callback);
    
    // 返回取消订阅的函数
    return () => {
      this.eventEmitter.off(eventName, callback);
    };
  }

  /**
   * 发出通知事件
   * @param notification 通知数据
   */
  private emitNotification(notification: NotificationData): void {
    const eventName = `notification:${notification.userId}`;
    this.eventEmitter.emit(eventName, notification);
  }
}

// 导出单例实例
export const notificationService = NotificationService.getInstance(); 