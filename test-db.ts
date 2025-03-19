import { db } from './lib/database';
import { users } from './lib/database/schema';
import { eq } from 'drizzle-orm';

async function main() {
  try {
    console.error('Testing database connection...');
    
    try {
      // 查询所有用户
      const allUsers = await db.select().from(users);
      console.error('All users:', allUsers);
    } catch (err) {
      console.error('Error querying all users:', err);
    }
    
    try {
      // 查询特定用户
      const admin = await db.select().from(users).where(eq(users.name, 'admin')).limit(1);
      console.error('Admin user:', admin);
    } catch (err) {
      console.error('Error querying admin user:', err);
    }
    
    console.error('Database test completed!');
  } catch (error) {
    console.error('Database test error:', error);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 