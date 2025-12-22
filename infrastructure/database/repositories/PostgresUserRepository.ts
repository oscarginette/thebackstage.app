/**
 * PostgresUserRepository
 *
 * PostgreSQL implementation of IUserRepository.
 * Uses @vercel/postgres with parameterized queries for security.
 *
 * Clean Architecture: Infrastructure layer implementation.
 * SOLID: Implements interface from domain layer (DIP).
 */

import { sql } from '@/lib/db';
import { IUserRepository, CreateUserData } from '@/domain/repositories/IUserRepository';
import { User } from '@/domain/entities/User';

export class PostgresUserRepository implements IUserRepository {
  /**
   * Create new user
   * SECURITY: Uses parameterized queries to prevent SQL injection
   */
  async create(data: CreateUserData): Promise<User> {
    try {
      const result = await sql`
        INSERT INTO users (
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        )
        VALUES (
          ${data.email.toLowerCase().trim()},
          ${data.passwordHash},
          'user',
          true,
          NOW(),
          NOW()
        )
        RETURNING
          id,
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
      `;

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    } catch (error) {
      console.error('PostgresUserRepository.create error:', error);

      // Check for unique constraint violation (duplicate email)
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error('Email already exists');
      }

      throw new Error(
        `Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find user by email (case-insensitive)
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        WHERE LOWER(email) = LOWER(${email.trim()})
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    } catch (error) {
      console.error('PostgresUserRepository.findByEmail error:', error);
      throw new Error(
        `Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: number): Promise<User | null> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        WHERE id = ${id}
        LIMIT 1
      `;

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return User.fromDatabase(
        row.id,
        row.email,
        row.password_hash,
        row.role,
        row.active,
        new Date(row.created_at),
        new Date(row.updated_at)
      );
    } catch (error) {
      console.error('PostgresUserRepository.findById error:', error);
      throw new Error(
        `Failed to find user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update user's last session timestamp
   * Called by NextAuth on successful login
   */
  async updateLastSession(userId: number): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateLastSession error:', error);
      throw new Error(
        `Failed to update last session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if email already exists (case-insensitive)
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const result = await sql`
        SELECT EXISTS(
          SELECT 1
          FROM users
          WHERE LOWER(email) = LOWER(${email.trim()})
        ) as exists
      `;

      return result.rows[0].exists;
    } catch (error) {
      console.error('PostgresUserRepository.emailExists error:', error);
      throw new Error(
        `Failed to check email existence: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all users (admin only)
   */
  async findAll(): Promise<User[]> {
    try {
      const result = await sql`
        SELECT
          id,
          email,
          password_hash,
          role,
          active,
          created_at,
          updated_at
        FROM users
        ORDER BY created_at DESC
      `;

      return result.rows.map((row) =>
        User.fromDatabase(
          row.id,
          row.email,
          row.password_hash,
          row.role,
          row.active,
          new Date(row.created_at),
          new Date(row.updated_at)
        )
      );
    } catch (error) {
      console.error('PostgresUserRepository.findAll error:', error);
      throw new Error(
        `Failed to get all users: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Toggle user active status (admin only)
   */
  async updateActiveStatus(userId: number, active: boolean): Promise<void> {
    try {
      const result = await sql`
        UPDATE users
        SET
          active = ${active},
          updated_at = NOW()
        WHERE id = ${userId}
        RETURNING id
      `;

      if (result.rowCount === 0) {
        throw new Error(`User not found: ${userId}`);
      }
    } catch (error) {
      console.error('PostgresUserRepository.updateActiveStatus error:', error);
      throw new Error(
        `Failed to update active status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
