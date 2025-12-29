/**
 * PostgresProductRepository
 *
 * PostgreSQL implementation of IProductRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { IProductRepository } from '@/domain/repositories/IProductRepository';
import { Product } from '@/domain/entities/Product';
import type { MarketingFeature, ProductMetadata } from '@/domain/types/stripe';

export class PostgresProductRepository implements IProductRepository {
  /**
   * Get all products (including inactive)
   */
  async findAll(): Promise<Product[]> {
    const result = await sql`
      SELECT
        id,
        object,
        name,
        description,
        active,
        marketing_features,
        metadata,
        created,
        updated,
        livemode
      FROM products
      ORDER BY (metadata->>'plan_tier')::INTEGER ASC
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Get only active products
   */
  async findActive(): Promise<Product[]> {
    const result = await sql`
      SELECT
        id,
        object,
        name,
        description,
        active,
        marketing_features,
        metadata,
        created,
        updated,
        livemode
      FROM products
      WHERE active = true
      ORDER BY (metadata->>'plan_tier')::INTEGER ASC
    `;

    return result.rows.map((row: any) => this.mapToDomain(row));
  }

  /**
   * Find product by ID
   */
  async findById(id: string): Promise<Product | null> {
    const result = await sql`
      SELECT
        id,
        object,
        name,
        description,
        active,
        marketing_features,
        metadata,
        created,
        updated,
        livemode
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  /**
   * Find product by name (case-insensitive)
   */
  async findByName(name: string): Promise<Product | null> {
    const result = await sql`
      SELECT
        id,
        object,
        name,
        description,
        active,
        marketing_features,
        metadata,
        created,
        updated,
        livemode
      FROM products
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (result.rows.length === 0) return null;

    return this.mapToDomain(result.rows[0]);
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Map database row to Product domain entity
   */
  private mapToDomain(row: any): Product {
    return new Product(
      row.id,
      row.object,
      row.name,
      row.description,
      row.active,
      row.marketing_features as MarketingFeature[],
      row.metadata as ProductMetadata,
      new Date(row.created),
      new Date(row.updated),
      row.livemode
    );
  }
}
