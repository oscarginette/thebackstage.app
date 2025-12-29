import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

/**
 * GET /api/integrations/brevo/status
 *
 * Returns the current status of the user's Brevo integration.
 */
export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id);

    // 2. Fetch integration status with stats
    const result = await sql`
      SELECT
        bi.id,
        bi.account_email,
        bi.account_name,
        bi.company_name,
        bi.is_active,
        bi.last_sync_at,
        bi.last_error,
        bi.created_at,
        bi.updated_at,
        COUNT(c.id) FILTER (WHERE c.brevo_id IS NOT NULL) as contacts_from_brevo,
        (
          SELECT COUNT(*)
          FROM brevo_import_history bih
          WHERE bih.integration_id = bi.id
        ) as total_imports,
        (
          SELECT MAX(started_at)
          FROM brevo_import_history bih
          WHERE bih.integration_id = bi.id AND bih.status = 'completed'
        ) as last_successful_import
      FROM brevo_integrations bi
      LEFT JOIN contacts c ON c.user_id = bi.user_id
      WHERE bi.user_id = ${userId}
      GROUP BY bi.id
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({
        connected: false
      });
    }

    const integration = result.rows[0];

    return NextResponse.json({
      connected: integration.is_active,
      integration: integration.is_active ? {
        id: integration.id,
        accountEmail: integration.account_email,
        accountName: integration.account_name,
        companyName: integration.company_name,
        connectedAt: integration.created_at,
        lastSyncAt: integration.last_sync_at,
        lastError: integration.last_error,
        stats: {
          contactsFromBrevo: parseInt(integration.contacts_from_brevo || '0'),
          totalImports: parseInt(integration.total_imports || '0'),
          lastSuccessfulImport: integration.last_successful_import
        }
      } : undefined
    });

  } catch (error: unknown) {
    console.error('Error fetching Brevo status:', error);

    return NextResponse.json(
      { error: 'Failed to fetch Brevo status', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
