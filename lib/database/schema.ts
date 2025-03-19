import { pgTable, text, integer, boolean, timestamp, serial, primaryKey, varchar, pgEnum, uniqueIndex } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";

/**
 * 用户角色枚举
 */
export const roleEnum = pgEnum('role', ['user', 'admin']);

/**
 * 用户表
 */
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  fullName: varchar("full_name", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  website: text("website"),
  role: roleEnum("role").default("user").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 服务器表
 */
export const servers = pgTable("servers", {
  id: text("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  description: text("description"),
  authorId: text("author_id").references(() => users.id),
  homepage: text("homepage"),
  repository: text("repository"),
  license: text("license"),
  startCommand: text("start_command"),
  downloads: integer("downloads").default(0).notNull(),
  rating: integer("rating").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    keyIdx: uniqueIndex("key_idx").on(table.key),
    nameIdx: uniqueIndex("name_idx").on(table.name),
  };
});

/**
 * 服务器环境变量表
 */
export const serverEnvVars = pgTable("server_env_vars", {
  id: serial("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value"),
});

/**
 * 服务器启动参数表
 */
export const serverArgs = pgTable("server_args", {
  id: serial("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  arg: text("arg").notNull(),
});

/**
 * 工具表
 */
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
});

/**
 * 参数表
 */
export const parameters = pgTable("parameters", {
  id: serial("id").primaryKey(),
  toolId: integer("tool_id")
    .notNull()
    .references(() => tools.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  description: text("description"),
  required: boolean("required").default(false),
});

/**
 * 标签表
 */
export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  color: varchar("color", { length: 7 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * 服务器标签关联表
 */
export const serverTags = pgTable("server_tags", {
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  tagId: integer("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.serverId, t.tagId] }),
}));

/**
 * 兼容客户端表
 */
export const compatibleClients = pgTable("compatible_clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

/**
 * 服务器客户端关联表
 */
export const serverClients = pgTable("server_clients", {
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => compatibleClients.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.serverId, t.clientId] }),
}));

/**
 * 评分表
 */
export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => {
  return {
    userServerIdx: uniqueIndex("user_server_idx").on(table.userId, table.serverId),
  };
});

/**
 * 同步记录表
 */
export const syncHistory = pgTable("sync_history", {
  id: serial("id").primaryKey(),
  source: varchar("source", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  details: text("details"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

/**
 * 统计数据表
 */
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 访问日志表
 */
export const accessLogs = pgTable("access_logs", {
  id: serial("id").primaryKey(),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * 下载记录表
 */
export const downloadHistory = pgTable("download_history", {
  id: serial("id").primaryKey(),
  serverId: text("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * Webhook事件表
 */
export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  details: text("details"),
});

// 类型定义导出
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Server = InferSelectModel<typeof servers>;
export type NewServer = InferInsertModel<typeof servers>;

export type Tool = InferSelectModel<typeof tools>;
export type NewTool = InferInsertModel<typeof tools>;

export type Parameter = InferSelectModel<typeof parameters>;
export type NewParameter = InferInsertModel<typeof parameters>;

export type Tag = InferSelectModel<typeof tags>;
export type NewTag = InferInsertModel<typeof tags>;

export type ServerTag = InferSelectModel<typeof serverTags>;
export type NewServerTag = InferInsertModel<typeof serverTags>;

export type Rating = InferSelectModel<typeof ratings>;
export type NewRating = InferInsertModel<typeof ratings>;

export type SyncRecord = InferSelectModel<typeof syncHistory>;
export type NewSyncRecord = InferInsertModel<typeof syncHistory>;

export type AccessLog = InferSelectModel<typeof accessLogs>;
export type NewAccessLog = InferInsertModel<typeof accessLogs>;

export type DownloadRecord = InferSelectModel<typeof downloadHistory>;
export type NewDownloadRecord = InferInsertModel<typeof downloadHistory>;

export type WebhookEvent = InferSelectModel<typeof webhookEvents>;
export type NewWebhookEvent = InferInsertModel<typeof webhookEvents>; 