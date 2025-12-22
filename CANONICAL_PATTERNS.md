# Canonical Patterns - Backstage Codebase Standards

**Version:** 1.0.0
**Date:** 2025-12-22
**Status:** OFFICIAL STANDARD - All code MUST follow these patterns

---

## Purpose

This document defines the **ONE AND ONLY WAY** to write code in this codebase. No variations, no exceptions. If you see code that doesn't follow these patterns, it's a bug that must be fixed.

---

## 1. API Route Patterns

### 1.1 Response Format (MANDATORY)

```typescript
// ✅ SUCCESS: Always wrap in property
{ gates: DownloadGate[] }           // List
{ gate: DownloadGate }              // Single object
{ success: true }                   // Boolean operation
{ contacts: Contact[], stats: {} }  // Multiple properties

// ✅ ERROR: Always simple object
{ error: "Descriptive message" }

// ❌ NEVER return bare arrays or objects
[...]          // WRONG
{ ...gate }    // WRONG
```

**Rule**: All successful responses wrap data in a descriptive property name. All errors return `{ error: string }` + HTTP status.

---

### 1.2 Error Handling (MANDATORY)

```typescript
export async function POST(request: Request) {
  try {
    // 1. Auth check (401)
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = parseInt(session.user.id);

    // 2. Parse body
    const body = await request.json();

    // 3. Validation (400)
    if (!body.title || !body.fileUrl) {
      return NextResponse.json(
        { error: 'Title and fileUrl are required' },
        { status: 400 }
      );
    }

    // 4. Execute use case
    const useCase = new CreateGateUseCase(gateRepository);
    const result = await useCase.execute(userId, body);

    // 5. Handle use case errors (400)
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // 6. Success (201 for creation, 200 for others)
    return NextResponse.json(
      { gate: result.gate },
      { status: 201 }
    );

  } catch (error) {
    // 7. Log and return 500
    console.error('POST /api/download-gates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**HTTP Status Codes:**
- `200`: Success (GET, PATCH, DELETE)
- `201`: Created (POST)
- `400`: Bad Request (validation errors, use case failures)
- `401`: Unauthorized (missing/invalid auth)
- `404`: Not Found (resource doesn't exist)
- `500`: Internal Server Error (unexpected exceptions)

---

### 1.3 Repository Instantiation (MANDATORY)

```typescript
// ✅ ALWAYS: Singleton at module level
const gateRepository = new PostgresDownloadGateRepository();
const submissionRepository = new PostgresDownloadSubmissionRepository();

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Reuse singleton instances
  const useCase = new ListGatesUseCase(gateRepository);
  // ...
}

export async function POST(request: Request) {
  // Reuse singleton instances
  const useCase = new CreateGateUseCase(gateRepository);
  // ...
}
```

**Rule**: Repositories are stateless singletons. Create once at module level, reuse for all requests.

---

### 1.4 Use Case Instantiation (MANDATORY)

```typescript
// ✅ ALWAYS: New instance per request
export async function GET(request: Request) {
  const useCase = new ListGatesUseCase(
    gateRepository,
    analyticsRepository
  );

  const result = await useCase.execute(userId);
  return NextResponse.json({ gates: result });
}
```

**Rule**: Use cases are per-request. Create new instance for each HTTP request, inject singleton repositories.

---

### 1.5 File Structure (MANDATORY)

```
app/api/
  └── resource-name/          # kebab-case
      ├── route.ts            # GET, POST for collection
      └── [id]/
          ├── route.ts        # GET, PATCH, DELETE for single item
          └── nested-resource/
              └── route.ts    # Nested routes
```

**Every route.ts MUST have:**
```typescript
export const dynamic = 'force-dynamic';

export async function GET(request: Request) { ... }
export async function POST(request: Request) { ... }
// etc.
```

---

## 2. Entity Patterns

### 2.1 Entity Class Structure (MANDATORY)

```typescript
/**
 * Entity Name
 *
 * Business description of what this entity represents.
 * Include invariants and business rules.
 */

export interface EntityProps {
  id: string;
  userId: number;

  // Required fields
  title: string;
  fileUrl: string;

  // Optional fields use | null (not undefined)
  description: string | null;
  expiresAt: Date | null;

  // Boolean flags
  active: boolean;
  verified: boolean;

  // Timestamps (always Date, never string)
  createdAt: Date;
  updatedAt: Date;
}

export class Entity {
  // ALWAYS private constructor
  private constructor(private readonly props: EntityProps) {
    this.validate();
  }

  // ALWAYS private validate
  private validate(): void {
    if (!this.props.title || this.props.title.trim().length === 0) {
      throw new Error('Title is required');
    }

    if (this.props.title.length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }

    // All validation logic here
  }

  // Getters for ALL properties
  get id(): string { return this.props.id; }
  get userId(): number { return this.props.userId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get active(): boolean { return this.props.active; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  // Business logic methods (read-only)
  isActive(): boolean {
    if (!this.props.active) return false;
    if (this.props.expiresAt && this.props.expiresAt < new Date()) return false;
    return true;
  }

  // ALWAYS static factory methods
  static fromDatabase(props: EntityProps): Entity {
    return new Entity(props);
  }

  static create(props: Omit<EntityProps, 'id' | 'createdAt' | 'updatedAt'>): Entity {
    const now = new Date();
    return new Entity({
      ...props,
      id: '', // Will be set by database
      createdAt: now,
      updatedAt: now
    });
  }
}
```

**Rules:**
- Private constructor with readonly props
- Props interface in same file
- All validation in private validate()
- Getters for all properties
- Business logic methods are read-only (no setters!)
- Static factories: `fromDatabase()` and `create()`

---

### 2.2 Type Definitions (MANDATORY)

**Location**: `domain/types/resource-name.ts`

```typescript
/**
 * Input type for creating entity
 * Omits id, createdAt, updatedAt (set by system)
 */
export interface CreateEntityInput {
  title: string;
  description?: string;
  fileUrl: string;
  active?: boolean;  // Optional with default
}

/**
 * Input type for updating entity
 * All fields optional except id
 */
export interface UpdateEntityInput {
  id: string;
  title?: string;
  description?: string | null;
  active?: boolean;
}

/**
 * Statistics/Analytics types
 */
export interface EntityStats {
  totalViews: number;
  totalDownloads: number;
  conversionRate: number;
}

/**
 * Enums for domain concepts
 */
export type EventType = 'view' | 'submit' | 'download';
export type OAuthProvider = 'soundcloud' | 'spotify';
```

**Rule**: Input/Output types go in `domain/types/`. Entity Props go in entity file.

---

## 3. Repository Patterns

### 3.1 Repository Interface (MANDATORY)

**Location**: `domain/repositories/IEntityRepository.ts`

```typescript
import { Entity } from '@/domain/entities/Entity';
import { CreateEntityInput, UpdateEntityInput } from '@/domain/types/entity';

/**
 * IEntityRepository
 *
 * Repository interface for Entity persistence.
 * Follows Dependency Inversion Principle (DIP).
 *
 * Domain layer defines interface, infrastructure implements it.
 */
export interface IEntityRepository {
  // Creation
  create(userId: number, input: CreateEntityInput): Promise<Entity>;

  // Retrieval
  findById(userId: number, id: string): Promise<Entity | null>;
  findAllByUser(userId: number): Promise<Entity[]>;
  findBySlug(slug: string): Promise<Entity | null>;

  // Update
  update(userId: number, input: UpdateEntityInput): Promise<Entity>;

  // Deletion
  delete(userId: number, id: string): Promise<void>;

  // Business queries
  isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;
  count(userId: number): Promise<number>;
}
```

**Rules:**
- Interface name: `IEntityRepository`
- Methods return entities, not POJOs
- Multi-tenant: ALWAYS include userId parameter
- Meaningful method names (not generic "get/set")
- JSDoc comment explaining repository purpose

---

### 3.2 Repository Implementation (MANDATORY)

**Location**: `infrastructure/database/repositories/PostgresEntityRepository.ts`

```typescript
import { sql } from '@/lib/db';
import { randomUUID } from 'crypto';
import { IEntityRepository } from '@/domain/repositories/IEntityRepository';
import { Entity } from '@/domain/entities/Entity';
import {
  CreateEntityInput,
  UpdateEntityInput
} from '@/domain/types/entity';

/**
 * PostgresEntityRepository
 *
 * PostgreSQL implementation of IEntityRepository.
 * Handles data persistence and retrieval for Entity.
 */
export class PostgresEntityRepository implements IEntityRepository {

  async create(userId: number, input: CreateEntityInput): Promise<Entity> {
    try {
      const id = randomUUID();

      const result = await sql`
        INSERT INTO entities (
          id,
          user_id,
          title,
          description,
          file_url,
          active,
          created_at,
          updated_at
        ) VALUES (
          ${id},
          ${userId},
          ${input.title},
          ${input.description ?? null},
          ${input.fileUrl},
          ${input.active ?? true},
          NOW(),
          NOW()
        )
        RETURNING *
      `;

      return this.mapToEntity(result.rows[0]);

    } catch (error) {
      console.error('PostgresEntityRepository.create error:', error);

      // Handle specific constraint violations
      if (error instanceof Error && error.message.includes('unique')) {
        throw new Error(`Title "${input.title}" already exists`);
      }

      throw new Error(
        `Failed to create entity: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findById(userId: number, id: string): Promise<Entity | null> {
    try {
      const result = await sql`
        SELECT * FROM entities
        WHERE id = ${id}
          AND user_id = ${userId}  -- ALWAYS filter by user!
      `;

      return result.rows.length > 0
        ? this.mapToEntity(result.rows[0])
        : null;

    } catch (error) {
      console.error('PostgresEntityRepository.findById error:', error);
      throw new Error(
        `Failed to find entity: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async findAllByUser(userId: number): Promise<Entity[]> {
    try {
      const result = await sql`
        SELECT * FROM entities
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return result.rows.map(row => this.mapToEntity(row));

    } catch (error) {
      console.error('PostgresEntityRepository.findAllByUser error:', error);
      throw new Error(
        `Failed to list entities: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async update(userId: number, input: UpdateEntityInput): Promise<Entity> {
    try {
      const result = await sql`
        UPDATE entities
        SET
          title = COALESCE(${input.title}, title),
          description = COALESCE(${input.description}, description),
          updated_at = NOW()
        WHERE id = ${input.id}
          AND user_id = ${userId}
        RETURNING *
      `;

      if (result.rows.length === 0) {
        throw new Error('Entity not found or access denied');
      }

      return this.mapToEntity(result.rows[0]);

    } catch (error) {
      console.error('PostgresEntityRepository.update error:', error);
      throw new Error(
        `Failed to update entity: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async delete(userId: number, id: string): Promise<void> {
    try {
      const result = await sql`
        DELETE FROM entities
        WHERE id = ${id}
          AND user_id = ${userId}
      `;

      if (result.rowCount === 0) {
        throw new Error('Entity not found or access denied');
      }

    } catch (error) {
      console.error('PostgresEntityRepository.delete error:', error);
      throw new Error(
        `Failed to delete entity: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * PRIVATE: Maps database row to Entity domain object
   * Converts snake_case (DB) to camelCase (code)
   */
  private mapToEntity(row: any): Entity {
    return Entity.fromDatabase({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      description: row.description,
      fileUrl: row.file_url,
      active: row.active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      expiresAt: row.expires_at ? new Date(row.expires_at) : null
    });
  }
}
```

**Rules:**
- Implements interface exactly
- Try-catch ALL database operations
- console.error() for logging
- Descriptive error messages
- Private `mapToEntity()` for DB row conversion
- snake_case (DB) → camelCase (code)
- Multi-tenant: ALWAYS `AND user_id = ${userId}`
- Use `COALESCE()` for partial updates

---

## 4. Use Case Patterns

### 4.1 Use Case Structure (MANDATORY)

**Location**: `domain/services/VerbNounUseCase.ts`

```typescript
import { IEntityRepository } from '@/domain/repositories/IEntityRepository';
import { Entity } from '@/domain/entities/Entity';
import { CreateEntityInput } from '@/domain/types/entity';

/**
 * CreateEntityUseCase
 *
 * Business logic for creating a new Entity.
 *
 * Responsibilities:
 * - Input validation
 * - Business rule enforcement
 * - Repository orchestration
 * - Result formatting
 *
 * Clean Architecture: No knowledge of HTTP, database, or external services.
 */

export interface CreateEntityResult {
  success: boolean;
  entity?: Entity;
  error?: string;
}

export class CreateEntityUseCase {
  constructor(
    private readonly entityRepository: IEntityRepository
  ) {}

  async execute(
    userId: number,
    input: CreateEntityInput
  ): Promise<CreateEntityResult> {
    try {
      // 1. Validation
      if (!input.title || input.title.trim().length === 0) {
        return {
          success: false,
          error: 'Title is required'
        };
      }

      // 2. Business rules
      const slugAvailable = await this.entityRepository.isSlugAvailable(
        this.generateSlug(input.title)
      );

      if (!slugAvailable) {
        return {
          success: false,
          error: 'A gate with this title already exists'
        };
      }

      // 3. Execute operation
      const entity = await this.entityRepository.create(userId, {
        ...input,
        slug: this.generateSlug(input.title)
      });

      // 4. Return success
      return {
        success: true,
        entity
      };

    } catch (error) {
      console.error('CreateEntityUseCase.execute error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create entity'
      };
    }
  }

  // Private helper methods
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
```

**Rules:**
- Name: `VerbNounUseCase` (CreateEntity, ListEntities, UpdateEntity)
- Result interface: `VerbNounResult`
- Constructor injection (repositories only)
- `async execute()` method
- Return `{ success, data?, error? }`
- No HTTP knowledge
- No database knowledge (uses repositories)
- Private helpers for business logic

---

## 5. Naming Conventions

### 5.1 Comprehensive Naming Guide

| Type | Convention | Examples |
|------|------------|----------|
| **Files/Directories** | kebab-case | `download-gates/`, `route.ts`, `user-profile.tsx` |
| **Variables** | camelCase | `const userId = 123;`, `let isActive = true;` |
| **Functions** | camelCase | `async function getUser()`, `handleSubmit()` |
| **Classes** | PascalCase | `class DownloadGate`, `PostgresRepository` |
| **Interfaces** | PascalCase + I prefix | `interface IRepository`, `IEmailProvider` |
| **Types** | PascalCase | `type EventType`, `type OAuthProvider` |
| **Enums** | PascalCase | `enum Status`, values: `UPPERCASE_SNAKE` |
| **Constants** | UPPERCASE_SNAKE | `const MAX_RETRIES = 3;` |
| **Database Columns** | snake_case | `user_id`, `created_at`, `soundcloud_track_id` |
| **JSON Properties** | camelCase | `{ userId: 123, createdAt: "..." }` |
| **React Components** | PascalCase | `function DownloadGatesList()` |
| **React Props** | camelCase | `interface Props { onSubmit: () => void }` |
| **CSS Classes** | kebab-case | `class="download-gate-card"` |

---

## 6. Date Handling

### 6.1 Date Standards (MANDATORY)

```typescript
// ✅ In Entities: ALWAYS Date type
export interface EntityProps {
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date | null;
}

// ✅ In Database: Use NOW() for server-side defaults
INSERT INTO entities (created_at, updated_at)
VALUES (NOW(), NOW())

// ✅ In Repository: Convert string to Date
private mapToEntity(row: any): Entity {
  return Entity.fromDatabase({
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : null
  });
}

// ✅ In API Routes: Convert Date to ISO string
return NextResponse.json({
  gate: {
    id: gate.id,
    title: gate.title,
    createdAt: gate.createdAt.toISOString(),
    updatedAt: gate.updatedAt.toISOString(),
    expiresAt: gate.expiresAt?.toISOString() ?? null
  }
});

// ✅ In Frontend: Parse ISO string back to Date if needed
const createdAt = new Date(apiResponse.createdAt);
```

**Rules:**
- Entities: `Date` type
- Database: `timestamp` or `timestamptz`
- API responses: ISO strings via `.toISOString()`
- Optional dates: `Date | null` (not `undefined`)

---

## 7. Frontend Patterns

### 7.1 API Client Pattern (MANDATORY)

```typescript
// ✅ Fetch with proper error handling
const fetchGates = async () => {
  try {
    const res = await fetch('/api/download-gates');

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch gates');
    }

    const data = await res.json();
    setGates(data.gates || []);  // Unwrap from property

  } catch (error) {
    console.error('Error fetching gates:', error);
    setError(error instanceof Error ? error.message : 'Unknown error');
  } finally {
    setLoading(false);
  }
};

// ✅ POST with body
const createGate = async (input: CreateGateInput) => {
  try {
    const res = await fetch('/api/download-gates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to create gate');
    }

    const data = await res.json();
    return data.gate;  // Unwrap from property

  } catch (error) {
    console.error('Error creating gate:', error);
    throw error;
  }
};
```

**Rules:**
- Always check `res.ok`
- Always unwrap response from property
- Always handle errors with try-catch
- Always set loading states

---

### 7.2 TypeScript Types (Frontend)

**Location**: `types/resource-name.ts`

```typescript
/**
 * Frontend type definitions
 * Must match backend API responses (after serialization)
 */

export interface DownloadGate {
  id: string;
  userId: number;
  slug: string;
  title: string;
  description: string | null;
  artworkUrl: string | null;
  fileUrl: string;
  active: boolean;

  // Dates as ISO strings (from API)
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;

  // Embedded stats
  stats: DownloadGateStats;
}

export interface DownloadGateStats {
  views: number;
  submissions: number;
  downloads: number;
  conversionRate: number;
}

export interface CreateGateFormData {
  title: string;
  description?: string;
  artworkUrl?: string;
  fileUrl: string;
  soundcloudTrackUrl: string;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
}
```

**Rules:**
- Dates are `string` (ISO format from API)
- Nulls use `| null` (not undefined)
- Match backend field names exactly (camelCase)
- Form data types separate from entity types

---

## 8. Database Patterns

### 8.1 Schema Conventions (MANDATORY)

```sql
-- Table names: snake_case, plural
CREATE TABLE download_gates (
  -- Primary key: id (UUID or SERIAL)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys: table_name_id
  user_id INTEGER NOT NULL REFERENCES users(id),

  -- Columns: snake_case
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  artwork_url TEXT,
  file_url TEXT NOT NULL,

  -- Boolean flags
  active BOOLEAN DEFAULT true,
  require_soundcloud_repost BOOLEAN DEFAULT false,

  -- Timestamps: created_at, updated_at
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Optional timestamps
  expires_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Indexes: idx_tablename_column
CREATE INDEX idx_download_gates_user_id ON download_gates(user_id);
CREATE INDEX idx_download_gates_slug ON download_gates(slug);

-- Auto-update trigger
CREATE TRIGGER update_download_gates_updated_at
  BEFORE UPDATE ON download_gates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Rules:**
- Tables: `snake_case`, plural
- Columns: `snake_case`
- Primary key: `id`
- Foreign keys: `table_id`
- Timestamps: `created_at`, `updated_at` (TIMESTAMPTZ)
- Indexes: `idx_table_column`
- Triggers: `update_table_updated_at`

---

## 9. Testing Patterns

### 9.1 Unit Test Structure (MANDATORY)

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { CreateEntityUseCase } from '@/domain/services/CreateEntityUseCase';
import { MockEntityRepository } from './mocks/MockEntityRepository';

describe('CreateEntityUseCase', () => {
  let useCase: CreateEntityUseCase;
  let mockRepository: MockEntityRepository;

  beforeEach(() => {
    mockRepository = new MockEntityRepository();
    useCase = new CreateEntityUseCase(mockRepository);
  });

  it('should create entity successfully', async () => {
    const input = {
      title: 'Test Entity',
      fileUrl: 'https://example.com/file.wav'
    };

    const result = await useCase.execute(1, input);

    expect(result.success).toBe(true);
    expect(result.entity).toBeDefined();
    expect(result.entity?.title).toBe('Test Entity');
  });

  it('should return error when title is missing', async () => {
    const input = {
      title: '',
      fileUrl: 'https://example.com/file.wav'
    };

    const result = await useCase.execute(1, input);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Title is required');
  });
});
```

**Rules:**
- Test use cases, not API routes
- Use mock repositories (test domain logic only)
- One test file per use case
- Descriptive test names
- Arrange-Act-Assert pattern

---

## 10. Documentation Standards

### 10.1 Code Comments (MANDATORY)

```typescript
/**
 * Class/Function JSDoc Comment
 *
 * Explain WHAT this does (one sentence).
 *
 * WHY it exists (business context).
 * HOW it fits into larger system.
 *
 * @param userId - The authenticated user ID
 * @param input - Entity creation input
 * @returns Promise resolving to operation result
 *
 * @example
 * const result = await useCase.execute(123, { title: 'Test' });
 */
export class CreateEntityUseCase {
  // Implementation
}
```

**When to Comment:**
- ❌ Don't explain WHAT (code should be self-documenting)
- ✅ DO explain WHY (business rules, legal requirements, tradeoffs)
- ✅ DO explain complex algorithms
- ✅ DO explain non-obvious business rules

**Example:**
```typescript
// ❌ BAD: Obvious comment
// Get the user by ID
const user = await userRepository.findById(userId);

// ✅ GOOD: Explains business rule
// GDPR requires 7-year retention for legal defense.
// We anonymize instead of deleting to maintain audit trail.
await contactRepository.anonymize(contactId);
```

---

## 11. Checklist for New Features

When adding a new feature, ensure:

### Backend:
- [ ] Entity class with private constructor and Props interface
- [ ] Repository interface in `domain/repositories/`
- [ ] Repository implementation in `infrastructure/database/repositories/`
- [ ] Use case classes in `domain/services/`
- [ ] Type definitions in `domain/types/`
- [ ] API routes in `app/api/` following pattern
- [ ] Database migration in `sql/`
- [ ] All dates use `Date` type in entities
- [ ] All responses wrapped in property
- [ ] All errors return `{ error: string }`
- [ ] Multi-tenant queries filter by `user_id`
- [ ] snake_case in DB, camelCase in code
- [ ] Singleton repositories, per-request use cases

### Frontend:
- [ ] Types in `types/` matching backend (dates as strings)
- [ ] API client unwraps response properties
- [ ] Error handling with try-catch
- [ ] Loading states
- [ ] Components follow naming conventions
- [ ] Forms use controlled inputs

### Testing:
- [ ] Unit tests for use cases
- [ ] Mock repositories
- [ ] Happy path and error cases

---

## 12. Anti-Patterns (FORBIDDEN)

```typescript
// ❌ WRONG: Bare array response
return NextResponse.json([...gates]);

// ❌ WRONG: Inline queries in API route
const result = await sql`SELECT...`;

// ❌ WRONG: Per-request repository creation
const repo = new PostgresGateRepository();

// ❌ WRONG: Singleton use case
const useCase = new CreateGateUseCase(repo);
export async function POST() { useCase.execute() }

// ❌ WRONG: Missing user_id filter
SELECT * FROM gates WHERE id = ${id}  -- Missing AND user_id = ${userId}

// ❌ WRONG: Dates as strings in entities
export interface Props {
  createdAt: string;  // Should be Date
}

// ❌ WRONG: snake_case in API response
{ user_id: 123, created_at: "..." }

// ❌ WRONG: Complex error objects
{ error: { code: 'X', details: {...} } }
```

---

## 13. Migration Guide

When refactoring existing code:

1. **Identify pattern violations** (compare against this doc)
2. **Create new canonical version** following patterns exactly
3. **Test new version** with unit tests
4. **Replace old code** atomically
5. **Delete old code** (no dead code)
6. **Update documentation** if needed

---

## Final Rule

**If it's not in this document, it doesn't exist.**

Every piece of code must follow these patterns. No exceptions. No "just this once". No "I'll refactor later".

**Code that doesn't follow these patterns is a bug.**

---

**Last Updated:** 2025-12-22
**Next Review:** When adding major new features
**Maintained By:** Architecture Team
