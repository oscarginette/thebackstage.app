import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

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

    // 2. Ejecutar migración de email_events
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
