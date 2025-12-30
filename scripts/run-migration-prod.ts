/**
 * Run Multi-Tenant Migration in Production
 *
 * This script executes the multi-tenant migration in production.
 * It adds user_id columns to all relevant tables.
 *
 * USAGE:
 *   npx tsx scripts/run-migration-prod.ts
 *
 * SAFETY:
 * - Uses IF NOT EXISTS to avoid errors if already run
 * - Transactions for atomicity
 * - Dry-run mode available
 */

import 'dotenv/config'; // Load .env.local
import { sql } from '@vercel/postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

const DRY_RUN = process.env.DRY_RUN === 'true';

async function runMigration() {
  console.log('🚀 Starting multi-tenant migration...');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('');

  try {
    // Read migration file
    const migrationPath = join(process.cwd(), 'sql', 'migration-multi-tenant.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file loaded successfully');
    console.log('');

    if (DRY_RUN) {
      console.log('📋 Migration SQL (DRY RUN):');
      console.log('=' .repeat(60));
      console.log(migrationSQL);
      console.log('=' .repeat(60));
      console.log('');
      console.log('✅ Dry run completed. No changes made to database.');
      return;
    }

    // Execute migration
    console.log('🔄 Executing migration...');
    await sql.query(migrationSQL);

    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📊 Changes applied:');
    console.log('  - users table: ensured all required columns exist');
    console.log('  - contacts table: added user_id column + index');
    console.log('  - download_gates table: added user_id column + index');
    console.log('  - email_templates table: added user_id column + index');
    console.log('  - email_campaigns table: added user_id column + index');
    console.log('  - consent_history table: added user_id column + index');
    console.log('  - email_logs table: added user_id column + index');
    console.log('  - created admin_user_stats view');

  } catch (error) {
    console.error('');
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  }
}

runMigration()
  .then(() => {
    console.log('');
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
