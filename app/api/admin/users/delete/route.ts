/**
 * Admin Delete Users API Route
 *
 * POST /api/admin/users/delete - Delete multiple users by IDs
 *
 * Admin-only endpoint for bulk user deletion
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Check admin role
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { ids } = body;

    // Validate input
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of user IDs.' },
        { status: 400 }
      );
    }

    // Prevent deletion of admin users
    const adminCheck = await sql`
      SELECT id, email, role
      FROM users
      WHERE id = ANY(${ids})
      AND role = 'admin'
    `;

    if (adminCheck.rows.length > 0) {
      const adminEmails = adminCheck.rows.map((row: any) => row.email).join(', ');
      return NextResponse.json(
        { error: `Cannot delete admin users: ${adminEmails}` },
        { status: 400 }
      );
    }

    // Delete users
    const result = await sql`
      DELETE FROM users
      WHERE id = ANY(${ids})
      AND role != 'admin'
      RETURNING id
    `;

    const deletedCount = result.rows.length;

    return NextResponse.json(
      {
        success: true,
        deleted: deletedCount,
        message: `Successfully deleted ${deletedCount} user${deletedCount !== 1 ? 's' : ''}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete users API error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
