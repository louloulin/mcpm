import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function initializeDatabase(): any {
  // 确保数据目录存在
  const dbPath = process.env.DB_PATH || './data/mcpdb.sqlite';
  const dbDir = path.dirname(dbPath);
  
  console.log(`数据库路径: ${dbPath}`);
  console.log(`数据库目录: ${dbDir}`);
  
  try {
    if (!fs.existsSync(dbDir)) {
      console.log(`创建数据库目录: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // 尝试创建数据库连接
    try {
      console.log('尝试使用better-sqlite3连接数据库...');
      const db = new Database(dbPath, { verbose: console.log });
      
      // 启用外键约束
      db.pragma('foreign_keys = ON');
      console.log('数据库连接成功');
      
      // 初始化表结构
      initializeTables(db);
      
      return db;
    } catch (betterSqliteError) {
      console.error('better-sqlite3连接失败:', betterSqliteError);
      
      // 在生产环境中，你可能希望使用内存数据库作为回退
      console.log('使用内存数据库作为回退...');
      const memoryDb = new Database(':memory:', { verbose: console.log });
      memoryDb.pragma('foreign_keys = ON');
      
      // 初始化表结构
      initializeTables(memoryDb);
      
      return memoryDb;
    }
  } catch (error) {
    console.error('数据库初始化过程中发生错误:', error);
    
    // 返回一个模拟数据库对象，防止应用崩溃
    // 这只是一个临时解决方案，实际应用中应该有更好的错误处理
    return createMockDatabase();
  }
}

function initializeTables(db: Database.Database) {
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

  console.log('数据库表结构初始化完成');
}

// 创建模拟数据库对象，用于临时回退
function createMockDatabase() {
  console.log('创建模拟数据库对象作为临时解决方案');
  
  // 返回一个简单的内存存储和模拟方法
  const mockData: Record<string, any[]> = {};
  
  return {
    prepare: (sql: string) => {
      console.log(`模拟预处理SQL: ${sql}`);
      return {
        run: (...params: any[]) => {
          console.log('模拟执行SQL，参数:', params);
          return { changes: 0 };
        },
        get: (...params: any[]) => {
          const tableNameMatch = sql.match(/FROM\s+(\w+)/i);
          const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
          console.log(`模拟从表 ${tableName} 获取数据，参数:`, params);
          return mockData[tableName] ? mockData[tableName][0] : null;
        },
        all: (...params: any[]) => {
          const tableNameMatch = sql.match(/FROM\s+(\w+)/i);
          const tableName = tableNameMatch ? tableNameMatch[1] : 'unknown';
          console.log(`模拟从表 ${tableName} 获取所有数据，参数:`, params);
          return mockData[tableName] || [];
        }
      };
    },
    exec: (sql: string) => {
      console.log(`模拟执行SQL: ${sql}`);
      
      // 如果是建表语句，初始化该表的空数组
      const tableMatch = sql.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
      if (tableMatch && tableMatch[1]) {
        const tableName = tableMatch[1];
        if (!mockData[tableName]) {
          mockData[tableName] = [];
        }
      }
    },
    pragma: (pragma: string) => {
      console.log(`模拟设置Pragma: ${pragma}`);
      return null;
    },
    close: () => {
      console.log('模拟关闭数据库连接');
    }
  };
}

export default initializeDatabase; 