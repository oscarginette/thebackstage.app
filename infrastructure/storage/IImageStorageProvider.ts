/**
 * IImageStorageProvider
 *
 * Interface for image storage providers (Cloudinary, Vercel Blob, etc.)
 * Follows Dependency Inversion Principle (DIP) - domain depends on interface, not implementation
 */

export interface UploadImageInput {
  file: File | Buffer;          // File from browser or Buffer from server
  fileName: string;
  folder?: string;              // Storage folder path
  tags?: string[];              // For organization and categorization
}

export interface UploadImageOutput {
  url: string;                  // Public URL to access the image
  publicId: string;             // Provider-specific ID for deletion
  width: number;
  height: number;
  format: string;               // jpg, png, webp, etc
}

export interface DeleteImageInput {
  publicId: string;             // Provider-specific ID
}

/**
 * Interface segregation principle (ISP) - small, focused interface
 * Only methods actually needed by clients
 */
export interface IImageStorageProvider {
  /**
   * Upload an image to storage
   */
  upload(input: UploadImageInput): Promise<UploadImageOutput>;

  /**
   * Delete an image from storage
   */
  delete(input: DeleteImageInput): Promise<void>;
}
