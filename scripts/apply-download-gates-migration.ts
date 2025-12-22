
import { config } from 'dotenv';
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: '.env.local' });

async function applyMigration() {
  console.log('🚀 Applying download gates migration...');
  
  const migrationPath = join(process.cwd(), 'sql', 'migration-download-gates.sql');
  const migrationSql = readFileSync(migrationPath, 'utf-8');
  
  // Split the migration into individual statements if necessary, 
  // but vercel/postgres should handle multiple statements if they are separated by semicolons.
  // However, often it's safer to execute separately or as a transaction.
  
  try {
    // Vercel postgres sql tag might not like a huge string with multiple statements.
    // Let's try to execute it.
    await sql.query(migrationSql);
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
