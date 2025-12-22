/**
 * UploadCoverImageUseCase
 *
 * Use case for uploading cover images to storage provider
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles image upload orchestration
 * - Dependency Inversion: Depends on IImageStorageProvider interface
 * - Open/Closed: Easy to extend with different storage providers
 */

import { IImageStorageProvider } from '@/infrastructure/storage/IImageStorageProvider';

export interface UploadCoverImageInput {
  file: File;               // From browser file input
  campaignId?: number;      // Optional: link to specific campaign
}

export interface UploadCoverImageResult {
  success: boolean;
  imageUrl?: string;
  publicId?: string;        // Store for future deletion
  error?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UploadCoverImageUseCase {
  constructor(private imageStorageProvider: IImageStorageProvider) {}

  async execute(input: UploadCoverImageInput): Promise<UploadCoverImageResult> {
    try {
      // Validate input
      this.validateInput(input);

      // Upload to storage provider (Cloudinary, Vercel Blob, etc)
      const uploadResult = await this.imageStorageProvider.upload({
        file: input.file,
        fileName: input.file.name,
        folder: 'email-templates',
        tags: this.buildTags(input.campaignId)
      });

      console.log(`Image uploaded successfully: ${uploadResult.url}`);

      return {
        success: true,
        imageUrl: uploadResult.url,
        publicId: uploadResult.publicId
      };
    } catch (error) {
      // Handle validation errors
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message
        };
      }

      // Handle storage provider errors
      console.error('Unexpected error uploading image:', error);
      return {
        success: false,
        error: 'Failed to upload image. Please try again.'
      };
    }
  }

  private validateInput(input: UploadCoverImageInput): void {
    if (!input.file) {
      throw new ValidationError('File is required');
    }

    // Additional validation can be added here (file name sanitization, etc)
    if (!input.file.name || input.file.name.trim().length === 0) {
      throw new ValidationError('File must have a valid name');
    }
  }

  private buildTags(campaignId?: number): string[] {
    const tags = ['email', 'cover-image'];

    if (campaignId) {
      tags.push('campaign', `campaign-${campaignId}`);
    }

    return tags;
  }
}
