/**
 * PostgresSendingDomainRepository
 *
 * PostgreSQL implementation of ISendingDomainRepository.
 * Implements Dependency Inversion Principle (SOLID).
 *
 * Database: Vercel Postgres with @vercel/postgres
 * Security: Parameterized queries (SQL injection safe)
 */

import { sql } from '@/lib/db';
import { SendingDomain, DNSRecords, DomainStatus } from '@/domain/entities/SendingDomain';
import {
  ISendingDomainRepository,
  CreateSendingDomainInput,
  UpdateDNSRecordsInput,
  UpdateVerificationStatusInput,
} from '@/domain/repositories/ISendingDomainRepository';

export class PostgresSendingDomainRepository implements ISendingDomainRepository {
  /**
   * Create new sending domain
   * @param input - Domain creation data
   * @returns Created domain entity
   */
  async create(input: CreateSendingDomainInput): Promise<SendingDomain> {
    const result = await sql`
      INSERT INTO sending_domains (
        user_id,
        domain,
        status,
        created_at,
        updated_at
      )
      VALUES (
        ${input.userId},
        ${input.domain},
        'pending',
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return this.mapToEntity(result.rows[0]);
  }

  /**
   * Find domain by ID
   * @param id - Domain ID
   * @returns Domain or null if not found
   */
  async findById(id: number): Promise<SendingDomain | null> {
    const result = await sql`
      SELECT * FROM sending_domains WHERE id = ${id}
    `;

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  /**
   * Find all domains for a user
   * @param userId - User ID
   * @returns List of domains (newest first)
   */
  async findByUserId(userId: number): Promise<SendingDomain[]> {
    const result = await sql`
      SELECT * FROM sending_domains
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return result.rows.map((row: any) => this.mapToEntity(row));
  }

  /**
   * Find domain by name
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Domain or null if not found
   */
  async findByDomain(domain: string): Promise<SendingDomain | null> {
    const result = await sql`
      SELECT * FROM sending_domains WHERE domain = ${domain}
    `;

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  /**
   * Find domain by user ID and domain name
   * Used to check if a specific domain is configured and verified for a user
   * @param userId - User ID
   * @param domain - Domain name (e.g., "geebeat.com")
   * @returns Domain or null if not found
   */
  async findByUserIdAndDomain(userId: number, domain: string): Promise<SendingDomain | null> {
    const result = await sql`
      SELECT * FROM sending_domains
      WHERE user_id = ${userId} AND domain = ${domain}
      LIMIT 1
    `;

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  /**
   * Find verified domain for user
   * @param userId - User ID
   * @returns Most recently verified domain or null
   */
  async findVerifiedByUserId(userId: number): Promise<SendingDomain | null> {
    const result = await sql`
      SELECT * FROM sending_domains
      WHERE user_id = ${userId} AND status = 'verified'
      ORDER BY verified_at DESC
      LIMIT 1
    `;

    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  /**
   * Update DNS records
   * @param id - Domain ID
   * @param input - DNS records and Mailgun domain name
   * @returns Updated domain entity
   */
  async updateDNSRecords(
    id: number,
    input: UpdateDNSRecordsInput
  ): Promise<SendingDomain> {
    const result = await sql`
      UPDATE sending_domains
      SET
        dns_records = ${JSON.stringify(input.dnsRecords)},
        mailgun_domain_name = ${input.mailgunDomainName},
        status = 'dns_configured',
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return this.mapToEntity(result.rows[0]);
  }

  /**
   * Update verification status
   * @param id - Domain ID
   * @param input - New status and optional error message
   * @returns Updated domain entity
   */
  async updateVerificationStatus(
    id: number,
    input: UpdateVerificationStatusInput
  ): Promise<SendingDomain> {
    const result = await sql`
      UPDATE sending_domains
      SET
        status = ${input.status},
        error_message = ${input.errorMessage || null},
        verification_attempts = verification_attempts + 1,
        last_verification_at = NOW(),
        verified_at = CASE
          WHEN ${input.status} = 'verified' THEN NOW()
          ELSE verified_at
        END,
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return this.mapToEntity(result.rows[0]);
  }

  /**
   * Delete domain
   * @param id - Domain ID
   */
  async delete(id: number): Promise<void> {
    await sql`DELETE FROM sending_domains WHERE id = ${id}`;
  }

  /**
   * Map database row to domain entity
   * @param row - PostgreSQL row
   * @returns SendingDomain entity
   */
  private mapToEntity(row: any): SendingDomain {
    return new SendingDomain(
      row.id,
      row.user_id,
      row.domain,
      row.status as DomainStatus,
      row.dns_records ? (JSON.parse(row.dns_records) as DNSRecords) : null,
      row.mailgun_domain_name,
      row.verification_attempts || 0,
      row.last_verification_at,
      row.verified_at,
      row.error_message,
      row.created_at,
      row.updated_at
    );
  }
}
