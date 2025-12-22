/**
 * Run Multi-Tenant Migration
 *
 * Executes the multi-tenant migration SQL file using @vercel/postgres
 */

import * as dotenv from 'dotenv';
import { sql } from '@vercel/postgres';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local (Next.js default)
dotenv.config({ path: '.env.local' });

async function runMigration() {
  console.log('🚀 Running multi-tenant migration...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'sql', 'migration-multi-tenant.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('📝 Executing migration SQL...');
    await sql.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify tables created
    console.log('🔍 Verifying new tables...');

    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('users', 'user_settings', 'sessions')
    `;

    console.log(`✅ Found ${tables.rows.length} new tables:`);
    tables.rows.forEach(row => console.log(`   - ${row.table_name}`));

    // Verify user_id columns added
    console.log('\n🔍 Verifying user_id columns...');
    const columns = await sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE column_name = 'user_id'
      AND table_schema = 'public'
      ORDER BY table_name
    `;

    console.log(`✅ Found user_id in ${columns.rows.length} tables:`);
    columns.rows.forEach(row => console.log(`   - ${row.table_name}.user_id`));

    console.log('\n✅ Migration complete!\n');
    console.log('Next steps:');
    console.log('  1. npm install next-auth@beta bcrypt @types/bcrypt');
    console.log('  2. Create domain entities and repositories');
    console.log('  3. Run data migration script\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
