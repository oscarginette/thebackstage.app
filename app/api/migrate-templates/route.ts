import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST() {
  try {
    const migrationPath = path.join(process.cwd(), 'sql', 'migration-email-templates.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    await sql.query(migrationSQL);
    return NextResponse.json({ success: true, message: 'Templates migration executed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
