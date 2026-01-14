/**
 * ISendingDomainRepository
 *
 * Repository interface for SendingDomain entity.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Domain layer defines the interface (this file).
 * Infrastructure layer implements it (PostgresSendingDomainRepository).
 *
 * Benefits:
 * - Easy testing (mock implementations)
 * - Easy database switching (MongoDB, etc)
 * - Domain layer independent of infrastructure
 */

import { SendingDomain, DNSRecords, DomainStatus } from '../entities/SendingDomain';

export interface CreateSendingDomainInput {
  userId: number;
  domain: string;
}

export interface UpdateDNSRecordsInput {
  dnsRecords: DNSRecords;
  mailgunDomainName: string;
}

export interface UpdateVerificationStatusInput {
  status: DomainStatus;
  errorMessage?: string | null;
}

export interface ISendingDomainRepository {
  /**
   * Create new domain
   * @param input - Domain creation data
   * @returns Created domain entity
   */
  create(input: CreateSendingDomainInput): Promise<SendingDomain>;

  /**
   * Find domain by ID
   * @param id - Domain ID
   * @returns Domain or null if not found
   */
  findById(id: number): Promise<SendingDomain | null>;

  /**
   * Find all domains for a user
   * @param userId - User ID
   * @returns List of domains (newest first)
   */
  findByUserId(userId: number): Promise<SendingDomain[]>;

  /**
   * Find domain by name
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Domain or null if not found
   */
  findByDomain(domain: string): Promise<SendingDomain | null>;

  /**
   * Find domain by user ID and domain name
   * Used to check if a specific domain is configured and verified for a user
   * @param userId - User ID
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Domain or null if not found
   */
  findByUserIdAndDomain(userId: number, domain: string): Promise<SendingDomain | null>;

  /**
   * Find verified domain for user
   * @param userId - User ID
   * @returns Most recently verified domain or null
   */
  findVerifiedByUserId(userId: number): Promise<SendingDomain | null>;

  /**
   * Update DNS records
   * @param id - Domain ID
   * @param input - DNS records and Mailgun domain name
   * @returns Updated domain entity
   */
  updateDNSRecords(
    id: number,
    input: UpdateDNSRecordsInput
  ): Promise<SendingDomain>;

  /**
   * Update verification status
   * @param id - Domain ID
   * @param input - New status and optional error message
   * @returns Updated domain entity
   */
  updateVerificationStatus(
    id: number,
    input: UpdateVerificationStatusInput
  ): Promise<SendingDomain>;

  /**
   * Delete domain
   * @param id - Domain ID
   */
  delete(id: number): Promise<void>;
}
