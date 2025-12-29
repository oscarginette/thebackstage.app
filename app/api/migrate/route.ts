import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // Ejecutar migración de email_events
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
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_email_log_id ON email_events(email_log_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_contact_id ON email_events(contact_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_track_id ON email_events(track_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_created_at ON email_events(created_at DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_email_events_resend_id ON email_events(resend_email_id)`;

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully'
    });

  } catch (error: unknown) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
