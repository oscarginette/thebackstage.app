/**
 * CloudinaryImageProvider
 *
 * Cloudinary implementation of IImageStorageProvider
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles Cloudinary image operations
 * - Liskov Substitution: Can be swapped with any IImageStorageProvider
 * - Dependency Inversion: Implements interface from domain layer
 */

import { v2 as cloudinary } from 'cloudinary';
import {
  IImageStorageProvider,
  UploadImageInput,
  UploadImageOutput,
  DeleteImageInput
} from '@/domain/providers/IImageStorageProvider';
import { getRequiredEnv } from '@/lib/env';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CloudinaryImageProvider implements IImageStorageProvider {
  constructor() {
    // Initialize Cloudinary with environment variables (validated)
    cloudinary.config({
      cloud_name: getRequiredEnv('CLOUDINARY_CLOUD_NAME'),
      api_key: getRequiredEnv('CLOUDINARY_API_KEY'),
      api_secret: getRequiredEnv('CLOUDINARY_API_SECRET')
    });
  }

  async upload(input: UploadImageInput): Promise<UploadImageOutput> {
    // Validate input
    this.validateInput(input);

    try {
      // Convert File to base64 data URL for Cloudinary
      const fileBuffer = await this.fileToBuffer(input.file);
      const base64Data = `data:${this.getFileType(input.file)};base64,${fileBuffer.toString('base64')}`;

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64Data, {
        folder: input.folder || 'email-templates',
        tags: input.tags || ['email', 'cover-image'],
        resource_type: 'image',
        filename_override: input.fileName
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error('Failed to upload image to Cloudinary');
    }
  }

  async delete(input: DeleteImageInput): Promise<void> {
    try {
      await cloudinary.uploader.destroy(input.publicId);
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  private validateInput(input: UploadImageInput): void {
    // Validate file exists
    if (!input.file) {
      throw new ValidationError('File is required');
    }

    // Validate file size (max 5MB for email images)
    const maxSize = 5 * 1024 * 1024; // 5MB
    const fileSize = input.file instanceof File ? input.file.size : input.file.length;

    if (fileSize > maxSize) {
      throw new ValidationError('Image size cannot exceed 5MB');
    }

    // Validate file type (only images)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const fileType = this.getFileType(input.file);

    if (!allowedTypes.includes(fileType)) {
      throw new ValidationError('Only JPEG, PNG, GIF, and WebP images are allowed');
    }

    // Validate filename
    if (!input.fileName || input.fileName.trim().length === 0) {
      throw new ValidationError('File name is required');
    }
  }

  private getFileType(file: File | Buffer): string {
    if (file instanceof File) {
      return file.type;
    }

    // For Buffer, try to detect type from magic numbers (simple detection)
    // In production, you might want to use a library like 'file-type'
    const magicNumbers = file.slice(0, 4);

    // JPEG: FF D8 FF
    if (magicNumbers[0] === 0xFF && magicNumbers[1] === 0xD8 && magicNumbers[2] === 0xFF) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47
    if (magicNumbers[0] === 0x89 && magicNumbers[1] === 0x50 && magicNumbers[2] === 0x4E && magicNumbers[3] === 0x47) {
      return 'image/png';
    }

    // GIF: 47 49 46 38
    if (magicNumbers[0] === 0x47 && magicNumbers[1] === 0x49 && magicNumbers[2] === 0x46 && magicNumbers[3] === 0x38) {
      return 'image/gif';
    }

    // WebP: 52 49 46 46 (RIFF)
    if (magicNumbers[0] === 0x52 && magicNumbers[1] === 0x49 && magicNumbers[2] === 0x46 && magicNumbers[3] === 0x46) {
      // Need to check further bytes for WebP signature, but for simplicity assume WebP
      return 'image/webp';
    }

    throw new ValidationError('Unsupported image format');
  }

  private async fileToBuffer(file: File | Buffer): Promise<Buffer> {
    if (Buffer.isBuffer(file)) {
      return file;
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
