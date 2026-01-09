/**
 * Database Migration API Route
 *
 * Admin endpoint for running database migrations.
 * This route intentionally uses direct SQL queries as migrations need low-level
 * database access to modify schema (ALTER TABLE, CREATE TABLE, etc.).
 *
 * ARCHITECTURAL NOTE:
 * This route violates Clean Architecture principles by design:
 * - Migrations are infrastructure-level operations, not business logic
 * - They need direct SQL access for DDL operations (ALTER, CREATE, DROP)
 * - Creating use cases for migrations would add unnecessary abstraction
 * - This is an admin-only, rarely-used endpoint for schema updates
 *
 * SECURITY: This should be protected with admin authentication in production.
 * For production, consider using proper migration tools like Prisma Migrate or Flyway.
 *
 * Clean Architecture: Intentionally exempted (infrastructure operation).
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * POST /api/migrate
 *
 * Runs database migrations to update schema
 *
 * Response:
 * {
 *   success: true,
 *   message: string,
 *   details: object
 * }
 */
export async function POST() {
  try {
    console.log('[Migration] Starting database migration...');

    // 1. Add subscription-related columns to users table
    console.log('[Migration] Adding subscription columns to users table...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free'`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS max_contacts INTEGER DEFAULT 500`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS max_monthly_emails INTEGER DEFAULT 2000`;
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS emails_sent_this_month INTEGER DEFAULT 0`;

    console.log('[Migration] Setting default values for existing users...');
    // Update existing users with free plan limits
    await sql`
      UPDATE users
      SET
        max_contacts = 500,
        max_monthly_emails = 2000,
        emails_sent_this_month = 0
      WHERE max_contacts IS NULL OR max_monthly_emails IS NULL
    `;

    // Fix contacts table for multi-tenant support
    console.log('[Migration] Fixing contacts table for multi-tenant...');

    // Add user_id column if it doesn't exist
    await sql`ALTER TABLE contacts ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id)`;

    // Drop old UNIQUE constraint on email (if exists)
    await sql`ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_email_key`;

    // Add UNIQUE constraint on (user_id, email) for multi-tenant support
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'contacts_user_id_email_key'
        ) THEN
          ALTER TABLE contacts ADD CONSTRAINT contacts_user_id_email_key UNIQUE (user_id, email);
        END IF;
      END $$
    `;

    // 2. Create contact_import_history table
    console.log('[Migration] Creating contact_import_history table...');
    await sql`
      CREATE TABLE IF NOT EXISTS contact_import_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- File metadata
        original_filename VARCHAR(500) NOT NULL,
        file_size_bytes INTEGER,
        file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('csv', 'json', 'brevo')),

        -- Import statistics
        rows_total INTEGER DEFAULT 0,
        contacts_inserted INTEGER DEFAULT 0,
        contacts_updated INTEGER DEFAULT 0,
        contacts_skipped INTEGER DEFAULT 0,

        -- Column mapping (for CSV - stores user-confirmed mapping)
        column_mapping JSONB,

        -- Execution tracking
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'parsing', 'importing', 'completed', 'failed')),
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        duration_ms INTEGER,

        -- Error tracking
        error_message TEXT,
        errors_detail JSONB
      )
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_contact_import_history_user_id ON contact_import_history(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contact_import_history_status ON contact_import_history(status)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_contact_import_history_started_at ON contact_import_history(started_at DESC)`;

    // 3. Ejecutar migración de email_events
    console.log('[Migration] Creating email_events table...');
    await sql`
      CREATE TABLE IF NOT EXISTS email_events (
        id SERIAL PRIMARY KEY,
        email_log_id INTEGER NOT NULL REFERENCES email_logs(id) ON DELETE CASCADE,
        contact_id INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        track_id TEXT NOT NULL REFERENCES soundcloud_tracks(track_id) ON DELETE CASCADE,
        event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'delayed', 'bounced', 'opened', 'clicked')),
        event_data JSONB DEFAULT '{}'::jsonb,
        resend_email_id TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Índices
    console.log('[Migration] Creating indexes...');
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_contact_id ON email_events(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_track_id ON email_events(track_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_email_id)`;

    console.log('[Migration] Migration completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      details: {
        subscription_columns_added: true,
        contacts_table_fixed: true,
        contact_import_history_table_created: true,
        email_events_table_created: true
      }
    });

  } catch (error: unknown) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
