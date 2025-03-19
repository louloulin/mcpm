import { initializeDatabase } from './init';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 初始化数据库并导出
const db = initializeDatabase();

export default db; 