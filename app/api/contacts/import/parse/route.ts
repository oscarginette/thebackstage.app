import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ParseImportFileUseCase } from '@/domain/services/ParseImportFileUseCase';

export const maxDuration = 30; // Maximum duration for parsing (30 seconds)

/**
 * POST /api/contacts/import/parse
 *
 * Parses uploaded CSV or JSON file and returns preview with auto-detected columns.
 * Does NOT import contacts - only parses and detects.
 *
 * Orchestration Layer (Clean Architecture):
 * - Authenticates user
 * - Validates file
 * - Delegates to ParseImportFileUseCase (domain logic)
 * - Returns preview JSON
 */
export async function POST(request: Request) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // 4. Validate file type
    const allowedTypes = ['text/csv', 'application/json', 'text/plain'];
    const allowedExtensions = ['.csv', '.json'];

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const isValidType = allowedTypes.includes(file.type) ||
      (fileExtension && allowedExtensions.includes(`.${fileExtension}`));

    if (!isValidType) {
      return NextResponse.json(
        { error: 'Invalid file type. Only CSV and JSON files are allowed.' },
        { status: 400 }
      );
    }

    // 5. Read file content
    const content = await file.text();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      );
    }

    // 6. Parse file with Use Case
    const parseUseCase = new ParseImportFileUseCase();
    const preview = parseUseCase.execute(content, file.name);

    // 7. Return preview JSON
    return NextResponse.json({
      success: true,
      preview: {
        filename: preview.filename,
        fileType: preview.fileType,
        fileSizeBytes: file.size,
        totalRows: preview.totalRows,
        detectedColumns: preview.detectedColumns,
        sampleRows: preview.sampleRows,
        rawData: preview.rawData // Needed for execute step
      }
    });
  } catch (error: any) {
    console.error('Error parsing import file:', error);

    return NextResponse.json(
      {
        error: 'Failed to parse file',
        details: error.message
      },
      { status: 500 }
    );
  }
}
