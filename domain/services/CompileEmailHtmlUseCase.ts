/**
 * CompileEmailHtmlUseCase
 *
 * Use case for compiling email HTML from draft fields (greeting, message, signature).
 * Follows Clean Architecture + SOLID principles.
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles HTML compilation logic
 * - Open/Closed: Easy to add new email templates without modifying this class
 * - Dependency Inversion: Depends on abstractions (IEmailSignatureRepository)
 *
 * Clean Architecture:
 * - Domain layer (no infrastructure dependencies)
 * - Business logic centralized in one place
 * - Reusable across multiple contexts (send, preview, update)
 */

import { render } from '@react-email/components';
import CustomEmail from '@/emails/custom-email';
import { IEmailSignatureRepository } from '@/domain/repositories/IEmailSignatureRepository';
import { EmailSignature } from '@/domain/value-objects/EmailSignature';

export interface CompileEmailHtmlInput {
  userId: number;
  greeting: string;
  message: string;
  signature: string;
  coverImageUrl?: string | null;
  /**
   * Temporary unsubscribe URL placeholder.
   * Will be replaced with contact-specific token during sending.
   * Default: 'TEMP_TOKEN'
   */
  unsubscribeUrlPlaceholder?: string;
}

export interface CompileEmailHtmlResult {
  html: string;
  success: boolean;
}

export class CompileEmailHtmlUseCase {
  constructor(
    private emailSignatureRepository: IEmailSignatureRepository
  ) {}

  /**
   * Compile email HTML from draft fields.
   *
   * Process:
   * 1. Retrieve user's email signature from repository
   * 2. Render React email template with provided content
   * 3. Return compiled HTML string
   *
   * @param input - Draft fields (greeting, message, signature, etc.)
   * @returns Compiled HTML string ready for sending
   */
  async execute(input: CompileEmailHtmlInput): Promise<CompileEmailHtmlResult> {
    try {
      // 1. Retrieve user's email signature
      const userSignature = await this.emailSignatureRepository.findByUserId(input.userId);

      // 2. Use default signature if user hasn't customized
      const emailSignature = userSignature
        ? userSignature.toJSON()
        : EmailSignature.createGeeBeatDefault().toJSON();

      // 3. Build unsubscribe URL placeholder
      // This will be replaced with contact-specific token during sending
      const unsubscribeUrl = input.unsubscribeUrlPlaceholder || 'TEMP_TOKEN';

      // 4. Render React email template
      const html = await render(
        CustomEmail({
          greeting: input.greeting || '',
          message: input.message || '',
          signature: input.signature || '',
          coverImage: input.coverImageUrl || '',
          unsubscribeUrl,
          emailSignature,
        })
      );

      return {
        html,
        success: true,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CompileEmailHtmlUseCase] Error compiling HTML:', errorMessage);

      throw new Error(`Failed to compile email HTML: ${errorMessage}`);
    }
  }
}
