import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create the PostgreSQL connection
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5433/mcpm";
const sql = postgres(connectionString, { max: 1 });

async function main() {
  try {
    const db = drizzle(sql);
    
    console.log('Starting database migration...');
    // Run the migrations
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    // Close the database connection
    await sql.end();
  }
}

main(); 