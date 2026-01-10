/**
 * CloudinaryImageStorage
 *
 * Service for uploading and managing email signature logos in Cloudinary.
 * Provides automatic image optimization and CDN delivery.
 */

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary (environment variables required)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface UploadLogoResult {
  url: string; // HTTPS URL for email templates
  publicId: string; // For deletion
}

export class CloudinaryImageStorage {
  /**
   * Upload logo to Cloudinary with email-optimized transformations
   * @param file - File buffer or base64 string
   * @param userId - User ID for folder organization
   * @returns Upload result with URL and public ID
   */
  async uploadLogo(
    file: Buffer | string,
    userId: number
  ): Promise<UploadLogoResult> {
    // Convert Buffer to base64 data URI for Cloudinary
    const fileToUpload: string = file instanceof Buffer
      ? `data:image/png;base64,${file.toString('base64')}`
      : (file as string);

    const result = await cloudinary.uploader.upload(
      fileToUpload,
      {
        folder: `email-signatures/${userId}`,
        transformation: {
          width: 200,
          height: 80,
          crop: 'fit', // Maintain aspect ratio
          quality: 85, // Balance size vs. quality
          fetch_format: 'auto', // Automatic format selection (WebP for modern clients)
        },
        overwrite: true, // Replace existing logo
        unique_filename: false, // Use consistent filename
        public_id: 'signature-logo', // Fixed ID per user
      }
    );

    return {
      url: result.secure_url, // HTTPS URL
      publicId: result.public_id,
    };
  }

  /**
   * Delete logo from Cloudinary
   * @param publicId - Cloudinary public ID
   */
  async deleteLogo(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
  }

  /**
   * Delete all logos for a user (cleanup)
   * @param userId - User ID
   */
  async deleteUserFolder(userId: number): Promise<void> {
    await cloudinary.api.delete_resources_by_prefix(
      `email-signatures/${userId}/`
    );
    await cloudinary.api.delete_folder(`email-signatures/${userId}`);
  }
}
