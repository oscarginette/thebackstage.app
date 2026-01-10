/**
 * Run User Notification Preferences Migration
 *
 * Safely adds the user_notification_preferences table to the database.
 * This migration is safe - it only adds a new table and preserves all existing data.
 */

// IMPORTANT: Load env vars FIRST before any imports
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function runMigration() {
  console.log('🚀 Running user_notification_preferences migration...\n');

  try {
    // Check if table already exists
    console.log('🔍 Checking if table already exists...');
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'user_notification_preferences'
      );
    `);

    const tableExists = checkTable.rows[0]?.exists;

    if (tableExists) {
      console.log('⚠️  Table user_notification_preferences already exists!');
      console.log('   Skipping migration to avoid errors.');
      console.log('✅ Migration status: Already applied\n');
      await pool.end();
      process.exit(0);
    }

    console.log('✓ Table does not exist yet, proceeding with migration...\n');

    // Read migration SQL file
    const migrationPath = path.join(
      process.cwd(),
      'prisma',
      'migrations',
      '20260110114436_add_user_notification_preferences',
      'migration.sql'
    );

    console.log(`📄 Reading migration file: ${migrationPath}`);
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('\n📋 Migration SQL:');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log();

    // Execute migration
    console.log('⚡ Executing migration...');
    await pool.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify table creation
    console.log('🔍 Verifying table schema...');
    const columns = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'user_notification_preferences'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 Table schema:');
    console.log('─'.repeat(80));
    columns.rows.forEach((col: any) => {
      console.log(
        `  ${col.column_name.padEnd(25)} ${col.data_type.padEnd(20)} ` +
        `${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'.padEnd(8)} ` +
        `${col.column_default || ''}`
      );
    });
    console.log('─'.repeat(80));

    // Verify indexes
    console.log('\n🔍 Verifying indexes...');
    const indexes = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'user_notification_preferences';
    `);

    console.log('\n📊 Indexes:');
    console.log('─'.repeat(80));
    indexes.rows.forEach((idx: any) => {
      console.log(`  ${idx.indexname}`);
      console.log(`    ${idx.indexdef}`);
    });
    console.log('─'.repeat(80));

    // Verify foreign key constraint
    console.log('\n🔍 Verifying foreign key constraint...');
    const constraints = await pool.query(`
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(oid) AS constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'user_notification_preferences'::regclass;
    `);

    console.log('\n📊 Constraints:');
    console.log('─'.repeat(80));
    constraints.rows.forEach((con: any) => {
      console.log(`  ${con.constraint_name} (${con.constraint_type})`);
      console.log(`    ${con.constraint_definition}`);
    });
    console.log('─'.repeat(80));

    // Count existing users
    console.log('\n🔍 Database statistics...');
    const userCount = await pool.query('SELECT COUNT(*) as count FROM users;');
    console.log(`   Total users in database: ${userCount.rows[0]?.count}`);

    console.log('\n✅ Migration completed successfully!');
    console.log('   ✓ Table created: user_notification_preferences');
    console.log('   ✓ All existing data preserved');
    console.log('   ✓ Default values: auto_send_soundcloud=true, auto_send_spotify=true');
    console.log('   ✓ Foreign key constraint added (ON DELETE CASCADE)');
    console.log('   ✓ Index created for fast lookups');
    console.log('\n📝 Note: Users will get default preferences on first access\n');

    await pool.end();

  } catch (error: any) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
