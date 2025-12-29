import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

/**
 * DELETE /api/integrations/brevo/disconnect
 *
 * Disconnects user's Brevo integration by deactivating it.
 * Keeps historical data for audit purposes.
 */
export async function DELETE() {
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

    // 2. Deactivate integration (soft delete - keep history)
    const result = await sql`
      UPDATE brevo_integrations
      SET
        is_active = false,
        api_key_encrypted = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${userId}
      RETURNING id
    `;

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'No Brevo integration found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Brevo integration disconnected successfully'
    });

  } catch (error: unknown) {
    console.error('Error disconnecting Brevo:', error);

    return NextResponse.json(
      { error: 'Failed to disconnect Brevo account', details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
