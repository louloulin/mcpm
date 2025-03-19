import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function initializeDatabase(): Database.Database {
  // 确保数据目录存在
  const dbDir = path.dirname(process.env.DB_PATH || './data/mcpdb.sqlite');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // 创建数据库连接
  const db = new Database(process.env.DB_PATH || './data/mcpdb.sqlite');
  
  // 启用外键约束
  db.pragma('foreign_keys = ON');

  // 创建用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password_hash TEXT,
      is_verified BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建服务器表
  db.exec(`
    CREATE TABLE IF NOT EXISTS servers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key TEXT UNIQUE NOT NULL,
      version TEXT NOT NULL,
      description TEXT,
      author_id TEXT,
      homepage TEXT,
      license TEXT,
      command TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      downloads INTEGER DEFAULT 0,
      rating REAL DEFAULT 0,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );
  `);

  // 创建运行参数表
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_args (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      arg TEXT NOT NULL,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
  `);

  // 创建环境变量表
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_env (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      key TEXT NOT NULL,
      value TEXT,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
  `);

  // 创建工具表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
    );
  `);

  // 创建参数表
  db.exec(`
    CREATE TABLE IF NOT EXISTS parameters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tool_id INTEGER,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      required BOOLEAN DEFAULT 0,
      FOREIGN KEY (tool_id) REFERENCES tools(id) ON DELETE CASCADE
    );
  `);

  // 创建标签表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // 创建服务器标签关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_tags (
      server_id TEXT,
      tag_id INTEGER,
      PRIMARY KEY (server_id, tag_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // 创建兼容客户端表
  db.exec(`
    CREATE TABLE IF NOT EXISTS compatible_clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
  `);

  // 创建服务器兼容客户端关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_clients (
      server_id TEXT,
      client_id INTEGER,
      PRIMARY KEY (server_id, client_id),
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (client_id) REFERENCES compatible_clients(id) ON DELETE CASCADE
    );
  `);

  // 创建评分表
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT,
      user_id TEXT,
      score INTEGER NOT NULL,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // 创建同步记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      status TEXT,
      details TEXT
    );
  `);

  // 创建统计数据表
  db.exec(`
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 创建访问日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS access_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      endpoint TEXT NOT NULL,
      method TEXT NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 创建下载记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS download_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      server_id TEXT NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // 创建Webhook事件表
  db.exec(`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      processed BOOLEAN DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      details TEXT
    );
  `);

  console.log('数据库初始化完成');
  return db;
}

export default initializeDatabase; 