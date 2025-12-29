import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await sql`DELETE FROM soundcloud_tracks WHERE title LIKE '%Kamiel%'`;
    return NextResponse.json({ success: true, message: 'Track deleted' });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
