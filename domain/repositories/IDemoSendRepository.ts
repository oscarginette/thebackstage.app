/**
 * IDemoSendRepository
 *
 * Repository interface for DemoSend entity following Dependency Inversion Principle.
 * Defines contracts for demo send tracking and analytics with zero implementation details.
 *
 * Clean Architecture: Domain layer defines interface, infrastructure layer implements it.
 */

import type { DemoSend } from '../entities/DemoSend';
import type { DemoSendMetadata } from '../types/demo-types';

/**
 * Input for creating a new demo send record
 */
export interface CreateDemoSendInput {
  id: string; // UUID
  demoId: string;
  contactId: number;
  userId: number;
  emailSubject: string;
  emailBodyHtml: string;
  personalNote?: string | null;
  resendEmailId?: string | null;
  metadata?: DemoSendMetadata | null;
}

/**
 * Demo send statistics for analytics
 */
export interface DemoSendStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number; // percentage (0-100)
  clickRate: number; // percentage (0-100)
}

/**
 * DemoSend Repository Interface
 *
 * Defines persistence and tracking operations for demo send entities.
 * Tracks email delivery, opens, and clicks for engagement analytics.
 */
export interface IDemoSendRepository {
  /**
   * Creates a new demo send record
   *
   * Records that a demo was sent to a DJ contact.
   * Database constraint prevents duplicate sends (demo_id + contact_id unique).
   *
   * @param input - Demo send creation data
   * @returns The created demo send entity
   * @throws Error if validation fails or duplicate send detected
   */
  create(input: CreateDemoSendInput): Promise<DemoSend>;

  /**
   * Finds a demo send by ID
   *
   * @param sendId - Demo send UUID
   * @returns DemoSend entity if found, null otherwise
   */
  findById(sendId: string): Promise<DemoSend | null>;

  /**
   * Finds all sends for a specific demo
   *
   * Useful for tracking which DJs received a specific demo.
   *
   * @param demoId - Demo UUID
   * @returns Array of demo sends for the demo
   */
  findByDemoId(demoId: string): Promise<DemoSend[]>;

  /**
   * Finds all demos sent to a specific contact
   *
   * Useful for viewing DJ's demo history.
   *
   * @param contactId - Contact identifier
   * @returns Array of demo sends to the contact
   */
  findByContactId(contactId: number): Promise<DemoSend[]>;

  /**
   * Finds all demo sends for a specific user
   *
   * @param userId - User identifier
   * @returns Array of all demo sends by the user
   */
  findByUserId(userId: number): Promise<DemoSend[]>;

  /**
   * Marks a demo send as opened
   *
   * Updates status to 'opened' and sets openedAt timestamp.
   * Idempotent: If already opened, this is a no-op.
   *
   * @param sendId - Demo send UUID
   * @param timestamp - When the email was opened
   * @returns Updated demo send entity
   * @throws Error if send not found or timestamp invalid
   */
  markAsOpened(sendId: string, timestamp: Date): Promise<DemoSend>;

  /**
   * Marks a demo send as clicked
   *
   * Updates status to 'clicked' and sets clickedAt timestamp.
   * Also marks as opened if not already opened.
   * Idempotent: If already clicked, this is a no-op.
   *
   * @param sendId - Demo send UUID
   * @param timestamp - When the demo link was clicked
   * @returns Updated demo send entity
   * @throws Error if send not found or timestamp invalid
   */
  markAsClicked(sendId: string, timestamp: Date): Promise<DemoSend>;

  /**
   * Gets engagement statistics for a specific demo
   *
   * Calculates total sent, opened, clicked counts and rates.
   *
   * @param demoId - Demo UUID
   * @returns Statistics for the demo
   */
  getStatsByDemo(demoId: string): Promise<DemoSendStats>;

  /**
   * Gets engagement statistics for all demos by a user
   *
   * Aggregates statistics across all user's demos.
   *
   * @param userId - User identifier
   * @returns Aggregated statistics for the user
   */
  getStatsByUser(userId: number): Promise<DemoSendStats>;

  /**
   * Finds all demo sends for a specific contact email
   *
   * GDPR compliance: Used for data export/deletion requests.
   *
   * @param email - Contact email address
   * @returns Array of demo sends to the email address
   */
  findByContactEmail(email: string): Promise<DemoSend[]>;

  /**
   * Checks if a demo has already been sent to a contact
   *
   * Used to prevent duplicate sends (validation before sending).
   *
   * @param demoId - Demo UUID
   * @param contactId - Contact identifier
   * @returns true if demo was already sent to contact, false otherwise
   */
  hasBeenSent(demoId: string, contactId: number): Promise<boolean>;
}
