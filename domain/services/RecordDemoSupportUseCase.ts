/**
 * RecordDemoSupportUseCase
 *
 * Records manual DJ support for a demo (artist logs it).
 *
 * Responsibilities:
 * - Validate demo exists and belongs to user
 * - Validate contact exists and is DJ type
 * - Generate unique UUID for support record
 * - Validate support data using DemoSupport entity
 * - Persist support record to database
 *
 * Clean Architecture: Domain layer use case with zero infrastructure dependencies.
 * SOLID: Single Responsibility (only handles support recording logic).
 * Dependency Inversion: Depends on interfaces, not concrete implementations.
 *
 * Manual Tracking:
 * - Artist manually logs DJ support (not automated)
 * - Examples: Radio play, DJ set, playlist add, social share
 * - Allows adding proof URL, notes, platform details
 * - Used for analytics and relationship tracking
 */

import { randomUUID } from 'crypto';
import type { IDemoRepository } from '../repositories/IDemoRepository';
import type { IDemoSupportRepository } from '../repositories/IDemoSupportRepository';
import type { IContactRepository } from '../repositories/IContactRepository';
import { DemoSupport } from '../entities/DemoSupport';
import type { DemoSupportType } from '../types/demo-types';
import { CONTACT_TYPES } from '../types/contact-types';
import { ValidationError } from '@/lib/errors';

/**
 * Input for recording demo support
 */
export interface RecordDemoSupportInput {
  demoId: string;
  contactId: number;
  userId: number;
  supportType: DemoSupportType;
  platform?: string;
  eventName?: string;
  playedAt?: Date;
  proofUrl?: string;
  notes?: string;
}

/**
 * Result of recording demo support
 */
export interface RecordDemoSupportResult {
  success: boolean;
  support?: DemoSupport;
  error?: string;
}

/**
 * RecordDemoSupportUseCase
 *
 * Handles manual recording of DJ support with comprehensive validation.
 * Ensures demo and contact ownership before creating support record.
 */
export class RecordDemoSupportUseCase {
  constructor(
    private readonly demoRepository: IDemoRepository,
    private readonly demoSupportRepository: IDemoSupportRepository,
    private readonly contactRepository: IContactRepository
  ) {}

  /**
   * Executes demo support recording
   *
   * @param input - Support recording data
   * @returns Result with created support record or error message
   */
  async execute(input: RecordDemoSupportInput): Promise<RecordDemoSupportResult> {
    try {
      // 1. Validate input
      this.validateInput(input);

      // 2. Validate demo exists and belongs to user
      const demo = await this.demoRepository.findById(input.demoId, input.userId);

      if (!demo) {
        return {
          success: false,
          error: 'Demo not found or access denied',
        };
      }

      // 3. Validate contact exists and belongs to user
      const allContacts = await this.contactRepository.findAll(input.userId);
      const contact = allContacts.find((c) => c.id === input.contactId);

      if (!contact) {
        return {
          success: false,
          error: 'Contact not found or access denied',
        };
      }

      // 4. Validate contact is DJ type
      const isDJ = contact.metadata?.types?.includes(CONTACT_TYPES.DJ);

      if (!isDJ) {
        return {
          success: false,
          error: 'Contact is not a DJ',
        };
      }

      // 5. Generate unique UUID for support record
      const supportId = randomUUID();

      // 6. Use DemoSupport entity factory to create and validate
      // This throws if validation fails (invalid support type, invalid proof URL, etc)
      const support = DemoSupport.create({
        id: supportId,
        demoId: input.demoId,
        contactId: input.contactId,
        userId: input.userId.toString(),
        supportType: input.supportType,
        platform: input.platform,
        eventName: input.eventName,
        playedAt: input.playedAt,
        proofUrl: input.proofUrl,
        notes: input.notes,
      });

      // 7. Persist to database
      const createdSupport = await this.demoSupportRepository.create({
        id: support.id,
        demoId: support.demoId,
        contactId: support.contactId,
        userId: input.userId,
        supportType: support.supportType,
        platform: support.platform,
        eventName: support.eventName,
        playedAt: support.playedAt,
        proofUrl: support.proofUrl,
        notes: support.notes,
      });

      // 8. Return success result
      return {
        success: true,
        support: createdSupport,
      };
    } catch (error) {
      // Handle validation errors from DemoSupport entity
      if (error instanceof Error) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Unexpected error
      return {
        success: false,
        error: 'Failed to record demo support',
      };
    }
  }

  /**
   * Validates record demo support input
   *
   * @param input - Input to validate
   * @throws ValidationError if input is invalid
   */
  private validateInput(input: RecordDemoSupportInput): void {
    if (!input.userId || input.userId <= 0) {
      throw new ValidationError('Invalid userId');
    }

    if (!input.demoId || input.demoId.trim().length === 0) {
      throw new ValidationError('Demo ID cannot be empty');
    }

    if (!input.contactId || input.contactId <= 0) {
      throw new ValidationError('Invalid contact ID');
    }

    if (!input.supportType || input.supportType.trim().length === 0) {
      throw new ValidationError('Support type cannot be empty');
    }

    // Additional domain validation happens in DemoSupport.create()
  }
}
