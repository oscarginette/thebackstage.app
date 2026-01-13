/**
 * Run Migration: Add sending_domains table
 *
 * Executes the SQL migration to create sending_domains table
 */

import * as fs from 'fs';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';

async function runMigration() {
  console.log('📦 Running migration: 20260113_add_sending_domains\n');

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL environment variable not set');
    console.error('Run: export POSTGRES_URL="your_connection_string"');
    process.exit(1);
  }

  const sql = neon(connectionString);

  const migrationPath = path.join(
    process.cwd(),
    'prisma/migrations/20260113_add_sending_domains/migration.sql'
  );

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  try {
    // Remove comments and split into statements
    const cleanSQL = migrationSQL
      .split('\n')
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');

    const statements = cleanSQL
      .split(';')
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    console.log(`Executing ${statements.length} SQL statements...\n`);

    // Execute each statement separately
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
      await sql(statement);
    }

    console.log('✅ Migration completed successfully\n');
    console.log('Created table: sending_domains');
    console.log('Created indexes:');
    console.log('  - idx_sending_domains_user_id');
    console.log('  - idx_sending_domains_status');
    console.log('  - idx_sending_domains_domain');
    console.log('  - idx_sending_domains_user_verified (unique, partial)\n');

    console.log('Table structure:');
    console.log('  - id (serial primary key)');
    console.log('  - user_id (references users)');
    console.log('  - domain (unique)');
    console.log('  - status (pending | dns_configured | verifying | verified | failed)');
    console.log('  - dns_records (jsonb - SPF, DKIM, DMARC, MX, tracking)');
    console.log('  - mailgun_domain_name (Mailgun internal ID)');
    console.log('  - verification_attempts (counter)');
    console.log('  - last_verification_at (timestamp)');
    console.log('  - verified_at (timestamp)');
    console.log('  - error_message (text)');
    console.log('  - created_at, updated_at (timestamps)\n');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

runMigration().catch((error) => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
