/**
 * Upload Cover Image API Route
 *
 * POST /api/upload/cover-image
 *
 * Accepts multipart/form-data with file upload
 * Returns image URL and public ID
 *
 * Clean Architecture:
 * - API route is thin orchestration layer
 * - Business logic in UploadCoverImageUseCase
 * - Infrastructure concerns in CloudinaryImageProvider
 */

import { NextRequest, NextResponse } from 'next/server';
import { UploadCoverImageUseCase } from '@/domain/services/UploadCoverImageUseCase';
import { CloudinaryImageProvider } from '@/infrastructure/storage/CloudinaryImageProvider';

export const runtime = 'nodejs'; // Required for file upload handling

export async function POST(request: NextRequest) {
  try {
    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const campaignId = formData.get('campaignId') as string | null;

    // Validate file exists
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Initialize use case with Cloudinary provider (Dependency Injection)
    const imageProvider = new CloudinaryImageProvider();
    const uploadUseCase = new UploadCoverImageUseCase(imageProvider);

    // Execute use case
    const result = await uploadUseCase.execute({
      file,
      campaignId: campaignId ? parseInt(campaignId, 10) : undefined
    });

    // Return result
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Upload API error:', error);

    // Handle configuration errors
    if (error instanceof Error && error.message.includes('environment variable')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image upload service is not configured. Please contact support.'
        },
        { status: 500 }
      );
    }

    // Generic error
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Configure max file size (5MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb'
    }
  }
};
