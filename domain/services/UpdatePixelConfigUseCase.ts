/**
 * UpdatePixelConfigUseCase
 *
 * Updates pixel tracking configuration for a download gate.
 * Validates pixel config and encrypts access tokens before storage.
 *
 * Clean Architecture: Business logic isolated from database concerns.
 * SOLID: Single Responsibility (only handles pixel config updates).
 */

import { IDownloadGateRepository } from '@/domain/repositories/IDownloadGateRepository';
import { PixelConfig } from '@/domain/entities/PixelConfig';
import { NotFoundError, ValidationError } from '@/lib/errors';

export interface UpdatePixelConfigInput {
  userId: number;
  gateId: string;
  pixelConfig: {
    facebook?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
    google?: {
      enabled: boolean;
      tagId: string;
      conversionLabels?: {
        view?: string;
        submit?: string;
        download?: string;
      };
    };
    tiktok?: {
      enabled: boolean;
      pixelId: string;
      accessToken?: string;
    };
  };
}

export interface UpdatePixelConfigResult {
  success: boolean;
  message: string;
}

/**
 * UpdatePixelConfigUseCase
 *
 * Updates pixel configuration for a download gate with validation and encryption.
 */
export class UpdatePixelConfigUseCase {
  constructor(private downloadGateRepository: IDownloadGateRepository) {}

  /**
   * Execute the use case
   *
   * @param input - User ID, gate ID, and pixel config
   * @returns Success result
   * @throws NotFoundError if gate not found or user doesn't own it
   * @throws ValidationError if pixel config is invalid
   */
  async execute(input: UpdatePixelConfigInput): Promise<UpdatePixelConfigResult> {
    // Verify gate exists and user owns it
    const gate = await this.downloadGateRepository.findById(
      input.userId,
      input.gateId
    );

    if (!gate) {
      throw new NotFoundError('Download gate not found or access denied');
    }

    // Encrypt access tokens (base64, same as Brevo pattern)
    const configWithEncryptedTokens = this.encryptTokens(input.pixelConfig);

    // Validate pixel config (throws if invalid)
    let pixelConfig: PixelConfig | null = null;

    if (Object.keys(configWithEncryptedTokens).length > 0) {
      try {
        pixelConfig = PixelConfig.create(configWithEncryptedTokens);
      } catch (error) {
        throw new ValidationError(
          error instanceof Error ? error.message : 'Invalid pixel configuration'
        );
      }
    }

    // Update gate with new pixel config
    await this.downloadGateRepository.update(input.userId, input.gateId, {
      pixelConfig: pixelConfig || undefined,
    } as any);

    return {
      success: true,
      message: 'Pixel configuration updated successfully',
    };
  }

  /**
   * Encrypt access tokens before storing in database
   * Base64 encoding (same as Brevo integration pattern)
   *
   * @param config - Pixel config with plain text tokens
   * @returns Config with encrypted tokens
   * @private
   */
  private encryptTokens(config: any): any {
    const encrypted = { ...config };

    // Encrypt Facebook access token
    if (config.facebook?.accessToken) {
      encrypted.facebook = {
        ...config.facebook,
        accessTokenEncrypted: Buffer.from(config.facebook.accessToken).toString(
          'base64'
        ),
      };
      delete encrypted.facebook.accessToken;
    }

    // Encrypt TikTok access token
    if (config.tiktok?.accessToken) {
      encrypted.tiktok = {
        ...config.tiktok,
        accessTokenEncrypted: Buffer.from(config.tiktok.accessToken).toString(
          'base64'
        ),
      };
      delete encrypted.tiktok.accessToken;
    }

    return encrypted;
  }
}
