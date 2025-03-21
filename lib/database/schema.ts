import { pgTable, text, bigint, boolean, timestamp, primaryKey, varchar, pgEnum, uniqueIndex, uuid, numeric, integer, serial, json } from "drizzle-orm/pg-core";
import { type InferSelectModel, type InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";

/**
 * 用户角色枚举
 */
export const roleEnum = pgEnum('role', ['user', 'admin']);

/**
 * 用户表
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 100 }),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  website: text("website"),
  role: varchar("role", { length: 50 }).default("user"),
  isVerified: boolean("is_verified").default(false).notNull(),
  verificationToken: text("verification_token"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 服务器表
 */
export const servers = pgTable("servers", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  key: varchar("key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  description: text("description"),
  authorId: uuid("author_id"),
  homepage: text("homepage"),
  repository: text("repository"),
  license: text("license"),
  startCommand: text("start_command"),
  downloads: bigint("downloads", { mode: "number" }).default(0).notNull(),
  rating: numeric('rating').notNull().default('0'),
  ratingCount: integer('rating_count').notNull().default(0),
  totalRatings: integer('total_ratings').notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  url: varchar("url", { length: 255 }).notNull(),
  status: varchar("status", { length: 50 }).default("offline"),
  type: varchar("type", { length: 50 }).notNull(),
  tags: text("tags").array(),
  ownerId: uuid("owner_id"),
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
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  value: text("value"),
});

/**
 * 服务器启动参数表
 */
export const serverArgs = pgTable("server_args", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  arg: text("arg").notNull(),
});

/**
 * 工具表
 */
export const tools = pgTable("tools", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
});

/**
 * 参数表
 */
export const parameters = pgTable("parameters", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  toolId: uuid("tool_id")
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
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
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
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id")
    .notNull()
    .references(() => tags.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.serverId, t.tagId] }),
}));

/**
 * 兼容客户端表
 */
export const compatibleClients = pgTable("compatible_clients", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
});

/**
 * 服务器客户端关联表
 */
export const serverClients = pgTable("server_clients", {
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => compatibleClients.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.serverId, t.clientId] }),
}));

/**
 * 评分表
 */
export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  score: bigint("score", { mode: "number" }).notNull(),
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
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
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
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 访问日志表
 */
export const accessLogs = pgTable("access_logs", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * 下载记录表
 */
export const downloadHistory = pgTable("download_history", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  serverId: uuid("server_id")
    .notNull()
    .references(() => servers.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

/**
 * Webhook事件表
 */
export const webhookEvents = pgTable("webhook_events", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),
  eventType: text("event_type").notNull(),
  payload: text("payload").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
  details: text("details"),
});

/**
 * Webhooks表
 */
export const webhooks = pgTable("webhooks", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  events: text("events").array().notNull(),
  description: text("description"),
  secret: text("secret").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Add ratings table
export const serverRatings = pgTable('server_ratings', {
  id: serial('id').primaryKey(),
  serverId: uuid('server_id').notNull().references(() => servers.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  rating: numeric('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const userPreferences = pgTable('user_preferences', {
  userId: text('user_id').primaryKey().references(() => users.id),
  showRecentlyViewed: boolean('show_recently_viewed').notNull().default(true),
  showFavorites: boolean('show_favorites').notNull().default(true),
  showDownloads: boolean('show_downloads').notNull().default(true),
  showRatings: boolean('show_ratings').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const serverViews = pgTable('server_views', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  serverId: text('server_id').notNull().references(() => servers.id),
  viewedAt: timestamp('viewed_at').notNull().defaultNow(),
});

export const serverFavorites = pgTable('server_favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  serverId: text('server_id').notNull().references(() => servers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const serverDownloads = pgTable('server_downloads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  serverId: text('server_id').notNull().references(() => servers.id),
  downloadedAt: timestamp('downloaded_at').notNull().defaultNow(),
});

/**
 * 通知表
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'info', 'success', 'warning', 'error'
  category: text("category").notNull(), // 'system', 'server', 'user', etc.
  read: boolean("read").default(false).notNull(),
  link: text("link"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
});

/**
 * 通知设置表
 */
export const notificationSettings = pgTable("notification_settings", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  // 启用所有通知
  enableAll: boolean("enable_all").default(true).notNull(),
  // 是否通过邮件接收
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  // 是否通过浏览器推送接收
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  // 是否通过站内消息接收
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
  // 每种通知类型的具体设置
  categorySettings: json("category_settings"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/**
 * 通知模板表
 */
export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  titleTemplate: text("title_template").notNull(),
  messageTemplate: text("message_template").notNull(),
  defaultType: text("default_type").default("info").notNull(),
  variables: json("variables"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 用户会话表
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  userAgent: text('user_agent'),
  ip: text('ip'),
});

/**
 * 集成类型枚举
 */
export const integrationTypeEnum = pgEnum('integration_type', ['ide', 'ai', 'cicd', 'chat', 'custom']);

/**
 * 第三方集成表
 */
export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  type: text("type").notNull(),
  apiKey: text("api_key").notNull().unique(),
  webhookUrl: text("webhook_url"),
  settings: json("settings").default('{}').notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  enabled: boolean("enabled").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
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

export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type ServerView = typeof serverViews.$inferSelect;
export type NewServerView = typeof serverViews.$inferInsert;

export type ServerFavorite = typeof serverFavorites.$inferSelect;
export type NewServerFavorite = typeof serverFavorites.$inferInsert;

// Add type exports for the webhooks table
export type Webhook = InferSelectModel<typeof webhooks>;
export type NewWebhook = InferInsertModel<typeof webhooks>;

export type Integration = InferSelectModel<typeof integrations>;
export type NewIntegration = InferInsertModel<typeof integrations>; 