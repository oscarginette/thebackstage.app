/**
 * Run Subscription System Migration
 *
 * Executes the subscription system migration SQL file
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
  console.log('🚀 Running subscription system migration...\n');

  try {
    // Read migration SQL file
    const migrationPath = path.join(process.cwd(), 'sql', 'migration-subscription-system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Execute migration
    console.log('📝 Executing migration SQL...');
    await pool.query(migrationSQL);

    console.log('✅ Migration executed successfully!\n');

    // Verify subscription columns added
    console.log('🔍 Verifying subscription columns...');

    const columns = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('subscription_started_at', 'subscription_expires_at', 'max_contacts', 'max_monthly_emails')
      ORDER BY column_name
    `);

    console.log(`✅ Found ${columns.rows.length} subscription columns in users table:`);
    columns.rows.forEach(row => console.log(`   - ${row.column_name}`));

    // Verify pricing_plans table
    console.log('\n🔍 Verifying pricing_plans table...');
    const plans = await pool.query('SELECT plan_name, max_contacts, max_monthly_emails FROM pricing_plans ORDER BY price_monthly_eur');

    console.log(`✅ Found ${plans.rows.length} pricing plans:`);
    plans.rows.forEach((row: any) => console.log(`   - ${row.plan_name}: ${row.max_contacts} contacts, ${row.max_monthly_emails || 'unlimited'} emails/month`));

    console.log('\n✅ Migration complete!\n');

    await pool.end();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }

  process.exit(0);
}

runMigration();
