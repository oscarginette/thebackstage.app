/**
 * GET /api/contacts/export
 *
 * Exports contacts to CSV format.
 *
 * Query Params:
 * - scope: 'all' | 'selected' (default: 'all')
 * - ids: comma-separated contact IDs (required if scope=selected)
 * - columns: comma-separated column names (default: email,name,subscribed,source,createdAt)
 * - format: 'csv' (default, only format supported currently)
 *
 * Returns:
 * - Success: CSV data (text/csv)
 * - Error: JSON error message
 *
 * Clean Architecture: Only HTTP orchestration, no business logic
 * Multi-tenant: Returns only contacts belonging to authenticated user
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';
import {
  EXPORT_SCOPES,
  EXPORT_FORMATS,
  DEFAULT_EXPORT_COLUMNS,
  ContactExportColumn,
  ExportScope,
  ExportFormat,
} from '@/domain/types/csv-export';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    // Parse query params
    const { searchParams } = new URL(request.url);
    const scope = (searchParams.get('scope') || EXPORT_SCOPES.ALL) as ExportScope;
    const idsParam = searchParams.get('ids');
    const columnsParam = searchParams.get('columns');
    const format = (searchParams.get('format') || EXPORT_FORMATS.CSV) as ExportFormat;

    // Parse selected IDs
    const selectedIds = idsParam
      ? idsParam.split(',').map((id) => parseInt(id, 10))
      : undefined;

    // Parse columns
    const columns = columnsParam
      ? (columnsParam.split(',') as ContactExportColumn[])
      : DEFAULT_EXPORT_COLUMNS;

    // Validate scope
    if (!Object.values(EXPORT_SCOPES).includes(scope)) {
      return NextResponse.json(
        { error: `Invalid scope. Must be one of: ${Object.values(EXPORT_SCOPES).join(', ')}` },
        { status: 400 }
      );
    }

    // Validate format
    if (!Object.values(EXPORT_FORMATS).includes(format)) {
      return NextResponse.json(
        { error: `Invalid format. Must be one of: ${Object.values(EXPORT_FORMATS).join(', ')}` },
        { status: 400 }
      );
    }

    // Execute use case (DI)
    const useCase = UseCaseFactory.createExportContactsUseCase();

    const result = await useCase.execute({
      userId,
      scope,
      selectedIds,
      columns,
      format,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Return CSV with proper headers
    return new NextResponse(result.data, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv;charset=utf-8',
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'X-Row-Count': String(result.rowCount),
      },
    });
  } catch (error) {
    console.error('[API Export] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to export contacts' },
      { status: 500 }
    );
  }
}
