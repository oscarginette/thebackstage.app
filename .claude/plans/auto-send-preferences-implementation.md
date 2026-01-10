# Implementation Plan: Auto-Send Preferences for New Tracks

## 📋 Overview

**Goal**: Add user settings to control whether new tracks from SoundCloud or Spotify are automatically announced via email to their subscribers.

**Current State**:
- ✅ Spotify auto-save is implemented (saves new albums to fan's library)
- ❌ No automatic email announcements for new tracks (only manual via `/api/send-track`)
- ❌ No user preferences for controlling auto-send behavior
- ✅ Clean Architecture + SOLID principles already in place
- ✅ Settings infrastructure exists (theme preferences)

**Target State**:
- ✅ Users can enable/disable auto-send for SoundCloud tracks
- ✅ Users can enable/disable auto-send for Spotify tracks
- ✅ Settings persist across devices (database)
- ✅ Settings UI in `/settings` page
- ✅ Future cron job will respect these preferences

---

## 🏗️ Architecture Design

Following the existing **UserAppearance** pattern for theme preferences.

### Layer Structure

```
domain/                                    # Business logic (NO external dependencies)
├── entities/
│   └── UserNotificationPreferences.ts     # NEW: Domain entity
├── repositories/
│   └── IUserNotificationPreferencesRepository.ts  # NEW: Interface
├── services/
│   ├── GetUserNotificationPreferencesUseCase.ts   # NEW: Fetch preferences
│   └── UpdateUserNotificationPreferencesUseCase.ts # NEW: Update preferences
└── types/
    └── notification-preferences.ts         # NEW: Typed constants

infrastructure/                             # External dependencies
└── database/
    └── repositories/
        └── PostgresUserNotificationPreferencesRepository.ts  # NEW: Implementation

app/                                        # Presentation layer
├── settings/
│   └── NotificationPreferencesSection.tsx  # NEW: Settings UI component
└── api/
    └── user/
        └── notification-preferences/
            └── route.ts                    # NEW: API endpoint
```

---

## 📐 SOLID Principles Application

### 1. **Single Responsibility Principle (SRP)**
- `UserNotificationPreferences` entity: Only represents notification preferences
- `GetUserNotificationPreferencesUseCase`: Only fetches preferences
- `UpdateUserNotificationPreferencesUseCase`: Only updates preferences
- `PostgresUserNotificationPreferencesRepository`: Only handles database operations
- API route: Only orchestrates (no business logic)

### 2. **Open/Closed Principle (OCP)**
- Easy to add new notification types (e.g., `autoSendInstagram`) without modifying existing code
- Interface-based design allows swapping implementations

### 3. **Liskov Substitution Principle (LSP)**
- `PostgresUserNotificationPreferencesRepository` implements `IUserNotificationPreferencesRepository`
- Can swap with `InMemoryUserNotificationPreferencesRepository` for testing

### 4. **Interface Segregation Principle (ISP)**
- Separate interface for notification preferences (not bundled with UserSettings)
- Clients only depend on methods they use

### 5. **Dependency Inversion Principle (DIP)**
- Use Cases depend on `IUserNotificationPreferencesRepository` interface
- No concrete PostgreSQL dependencies in domain layer

---

## 🔧 Implementation Steps

### **Step 1: Define Domain Types** ✅

**File**: `domain/types/notification-preferences.ts`

```typescript
/**
 * Auto-send notification types
 * Controls automatic email announcements for new content
 */
export type NotificationPreferenceType =
  | 'soundcloud_auto_send'
  | 'spotify_auto_send';

/**
 * Typed constants for notification preferences
 * ALWAYS use these instead of string literals
 */
export const NOTIFICATION_PREFERENCES = {
  SOUNDCLOUD_AUTO_SEND: 'soundcloud_auto_send' as const,
  SPOTIFY_AUTO_SEND: 'spotify_auto_send' as const,
} as const;

/**
 * User notification preferences
 */
export interface NotificationPreferencesData {
  userId: number;
  autoSendSoundcloud: boolean;
  autoSendSpotify: boolean;
  updatedAt: Date;
}
```

**Why**:
- Type safety (no magic strings)
- Easy to extend (add new preferences)
- Follows existing pattern (see `domain/types/appearance.ts`)

---

### **Step 2: Create Domain Entity** ✅

**File**: `domain/entities/UserNotificationPreferences.ts`

```typescript
import type { NotificationPreferencesData } from '@/domain/types/notification-preferences';

/**
 * UserNotificationPreferences Entity
 *
 * Represents user preferences for automatic email notifications.
 * Controls whether new tracks from SoundCloud/Spotify are auto-announced.
 *
 * Business Rules:
 * - Defaults to enabled (better engagement)
 * - Per-platform granularity (users can disable one, keep the other)
 * - Changes take effect immediately (no cron delay)
 */
export class UserNotificationPreferences {
  readonly userId: number;
  readonly autoSendSoundcloud: boolean;
  readonly autoSendSpotify: boolean;
  readonly updatedAt: Date;

  private constructor(data: NotificationPreferencesData) {
    this.userId = data.userId;
    this.autoSendSoundcloud = data.autoSendSoundcloud;
    this.autoSendSpotify = data.autoSendSpotify;
    this.updatedAt = data.updatedAt;
  }

  /**
   * Factory: Create from database row
   */
  static fromDatabase(data: NotificationPreferencesData): UserNotificationPreferences {
    return new UserNotificationPreferences(data);
  }

  /**
   * Factory: Create default preferences for new user
   */
  static createDefault(userId: number): UserNotificationPreferences {
    return new UserNotificationPreferences({
      userId,
      autoSendSoundcloud: true,  // Enabled by default
      autoSendSpotify: true,     // Enabled by default
      updatedAt: new Date(),
    });
  }

  /**
   * Create updated preferences (immutable)
   */
  update(updates: {
    autoSendSoundcloud?: boolean;
    autoSendSpotify?: boolean;
  }): UserNotificationPreferences {
    return new UserNotificationPreferences({
      userId: this.userId,
      autoSendSoundcloud: updates.autoSendSoundcloud ?? this.autoSendSoundcloud,
      autoSendSpotify: updates.autoSendSpotify ?? this.autoSendSpotify,
      updatedAt: new Date(),
    });
  }

  /**
   * Convert to plain object (for API responses)
   */
  toJSON() {
    return {
      userId: this.userId,
      autoSendSoundcloud: this.autoSendSoundcloud,
      autoSendSpotify: this.autoSendSpotify,
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
```

**Why**:
- Immutable (domain entities should not mutate)
- Factory methods for creation
- Business rule documentation
- Type-safe

---

### **Step 3: Create Repository Interface** ✅

**File**: `domain/repositories/IUserNotificationPreferencesRepository.ts`

```typescript
import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * Repository interface for notification preferences
 * Follows Dependency Inversion Principle (DIP)
 */
export interface IUserNotificationPreferencesRepository {
  /**
   * Get notification preferences for a user
   * Returns default preferences if none exist
   */
  getByUserId(userId: number): Promise<UserNotificationPreferences>;

  /**
   * Update notification preferences
   * Creates preferences if they don't exist (upsert)
   */
  update(
    userId: number,
    preferences: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences>;
}
```

**Why**:
- Interface segregation (only 2 methods needed)
- DIP: Use Cases depend on interface, not implementation
- Upsert pattern (no separate create method needed)

---

### **Step 4: Implement Repository** ✅

**File**: `infrastructure/database/repositories/PostgresUserNotificationPreferencesRepository.ts`

```typescript
import { sql } from '@vercel/postgres';
import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * PostgreSQL implementation of notification preferences repository
 */
export class PostgresUserNotificationPreferencesRepository
  implements IUserNotificationPreferencesRepository
{
  /**
   * Get notification preferences for a user
   * Returns default preferences if none exist
   */
  async getByUserId(userId: number): Promise<UserNotificationPreferences> {
    const result = await sql`
      SELECT
        user_id as "userId",
        auto_send_soundcloud as "autoSendSoundcloud",
        auto_send_spotify as "autoSendSpotify",
        updated_at as "updatedAt"
      FROM user_notification_preferences
      WHERE user_id = ${userId}
    `;

    if (result.rows.length === 0) {
      // No preferences exist, return defaults
      return UserNotificationPreferences.createDefault(userId);
    }

    return UserNotificationPreferences.fromDatabase(result.rows[0] as any);
  }

  /**
   * Update notification preferences (upsert)
   */
  async update(
    userId: number,
    preferences: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences> {
    const now = new Date();

    // Build SET clause dynamically (only update provided fields)
    const updates: string[] = [];
    const values: any[] = [userId];

    if (preferences.autoSendSoundcloud !== undefined) {
      updates.push(`auto_send_soundcloud = $${values.length + 1}`);
      values.push(preferences.autoSendSoundcloud);
    }

    if (preferences.autoSendSpotify !== undefined) {
      updates.push(`auto_send_spotify = $${values.length + 1}`);
      values.push(preferences.autoSendSpotify);
    }

    updates.push(`updated_at = $${values.length + 1}`);
    values.push(now);

    const result = await sql.query(`
      INSERT INTO user_notification_preferences (
        user_id,
        auto_send_soundcloud,
        auto_send_spotify,
        updated_at
      )
      VALUES (
        $1,
        COALESCE($2, true),
        COALESCE($3, true),
        $4
      )
      ON CONFLICT (user_id)
      DO UPDATE SET ${updates.join(', ')}
      RETURNING
        user_id as "userId",
        auto_send_soundcloud as "autoSendSoundcloud",
        auto_send_spotify as "autoSendSpotify",
        updated_at as "updatedAt"
    `, [userId, preferences.autoSendSoundcloud, preferences.autoSendSpotify, now, ...values.slice(1)]);

    return UserNotificationPreferences.fromDatabase(result.rows[0] as any);
  }
}
```

**Why**:
- Upsert pattern (INSERT ... ON CONFLICT)
- Returns default if no preferences exist (no null checks needed)
- Type-safe (uses entity factory methods)
- Parameterized queries (SQL injection safe)

---

### **Step 5: Create Use Cases** ✅

#### **File**: `domain/services/GetUserNotificationPreferencesUseCase.ts`

```typescript
import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * GetUserNotificationPreferencesUseCase
 *
 * Fetches notification preferences for a user.
 * Returns default preferences if none exist.
 */
export class GetUserNotificationPreferencesUseCase {
  constructor(
    private notificationPreferencesRepository: IUserNotificationPreferencesRepository
  ) {}

  async execute(userId: number): Promise<UserNotificationPreferences> {
    return this.notificationPreferencesRepository.getByUserId(userId);
  }
}
```

#### **File**: `domain/services/UpdateUserNotificationPreferencesUseCase.ts`

```typescript
import type { IUserNotificationPreferencesRepository } from '@/domain/repositories/IUserNotificationPreferencesRepository';
import type { UserNotificationPreferences } from '@/domain/entities/UserNotificationPreferences';

/**
 * UpdateUserNotificationPreferencesUseCase
 *
 * Updates notification preferences for a user.
 * Validates input and ensures business rules are followed.
 */
export class UpdateUserNotificationPreferencesUseCase {
  constructor(
    private notificationPreferencesRepository: IUserNotificationPreferencesRepository
  ) {}

  async execute(
    userId: number,
    updates: {
      autoSendSoundcloud?: boolean;
      autoSendSpotify?: boolean;
    }
  ): Promise<UserNotificationPreferences> {
    // Validate input
    this.validateInput(updates);

    // Update preferences
    return this.notificationPreferencesRepository.update(userId, updates);
  }

  private validateInput(updates: {
    autoSendSoundcloud?: boolean;
    autoSendSpotify?: boolean;
  }): void {
    // Ensure at least one field is provided
    if (
      updates.autoSendSoundcloud === undefined &&
      updates.autoSendSpotify === undefined
    ) {
      throw new Error('At least one preference must be provided');
    }

    // Ensure values are booleans
    if (
      updates.autoSendSoundcloud !== undefined &&
      typeof updates.autoSendSoundcloud !== 'boolean'
    ) {
      throw new Error('autoSendSoundcloud must be a boolean');
    }

    if (
      updates.autoSendSpotify !== undefined &&
      typeof updates.autoSendSpotify !== 'boolean'
    ) {
      throw new Error('autoSendSpotify must be a boolean');
    }
  }
}
```

**Why**:
- SRP: Use Cases only orchestrate business logic
- Validation centralized in Use Case (not in API route)
- Type-safe
- Easy to test (inject mock repository)

---

### **Step 6: Update DI Container** ✅

**File**: `lib/di-container.ts`

Add factory methods to create Use Cases with proper dependency injection.

```typescript
// Add to UseCaseFactory class:

/**
 * Create GetUserNotificationPreferencesUseCase
 */
static createGetUserNotificationPreferencesUseCase(): GetUserNotificationPreferencesUseCase {
  const notificationPreferencesRepository = new PostgresUserNotificationPreferencesRepository();
  return new GetUserNotificationPreferencesUseCase(notificationPreferencesRepository);
}

/**
 * Create UpdateUserNotificationPreferencesUseCase
 */
static createUpdateUserNotificationPreferencesUseCase(): UpdateUserNotificationPreferencesUseCase {
  const notificationPreferencesRepository = new PostgresUserNotificationPreferencesRepository();
  return new UpdateUserNotificationPreferencesUseCase(notificationPreferencesRepository);
}
```

**Why**:
- Single source of truth for dependency injection
- Easy to swap implementations (e.g., for testing)
- Follows existing pattern

---

### **Step 7: Create Database Migration** ✅

**File**: `prisma/migrations/YYYYMMDDHHMMSS_add_user_notification_preferences/migration.sql`

```sql
-- Create user_notification_preferences table
CREATE TABLE user_notification_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_send_soundcloud BOOLEAN NOT NULL DEFAULT true,
  auto_send_spotify BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);

-- Add comment for documentation
COMMENT ON TABLE user_notification_preferences IS 'User preferences for automatic email notifications when new tracks are released';
COMMENT ON COLUMN user_notification_preferences.auto_send_soundcloud IS 'Whether to automatically email subscribers when new SoundCloud tracks are detected';
COMMENT ON COLUMN user_notification_preferences.auto_send_spotify IS 'Whether to automatically email subscribers when new Spotify tracks are detected';
```

**Why**:
- Separate table (not adding columns to `users` - follows ISP)
- Foreign key constraint (referential integrity)
- Defaults to `true` (better engagement)
- ON DELETE CASCADE (cleanup when user deleted)

---

### **Step 8: Update Prisma Schema** ✅

**File**: `prisma/schema.prisma`

Add the model definition:

```prisma
model UserNotificationPreferences {
  userId             Int      @id @map("user_id")
  autoSendSoundcloud Boolean  @default(true) @map("auto_send_soundcloud")
  autoSendSpotify    Boolean  @default(true) @map("auto_send_spotify")
  updatedAt          DateTime @default(now()) @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_notification_preferences")
  @@index([userId], name: "idx_user_notification_preferences_user_id")
}
```

**And update the User model**:

```prisma
model User {
  id                         Int                           @id @default(autoincrement())
  // ... existing fields ...

  // Relations
  notificationPreferences    UserNotificationPreferences?
  // ... other relations ...
}
```

**Why**:
- Follows existing Prisma patterns
- Type generation for TypeScript
- Relation to User model

---

### **Step 9: Create API Endpoint** ✅

**File**: `app/api/user/notification-preferences/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { UseCaseFactory } from '@/lib/di-container';

/**
 * GET /api/user/notification-preferences
 * Fetch notification preferences for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch preferences
    const useCase = UseCaseFactory.createGetUserNotificationPreferencesUseCase();
    const preferences = await useCase.execute(Number(session.user.id));

    return NextResponse.json(preferences.toJSON());
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/notification-preferences
 * Update notification preferences for authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();

    // Update preferences
    const useCase = UseCaseFactory.createUpdateUserNotificationPreferencesUseCase();
    const preferences = await useCase.execute(Number(session.user.id), {
      autoSendSoundcloud: body.autoSendSoundcloud,
      autoSendSpotify: body.autoSendSpotify,
    });

    return NextResponse.json(preferences.toJSON());
  } catch (error: any) {
    console.error('Error updating notification preferences:', error);

    // Handle validation errors
    if (error.message?.includes('must be')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}
```

**Why**:
- Only orchestration (no business logic)
- Authentication handled
- Error handling with specific HTTP status codes
- Uses DI container for Use Case creation

---

### **Step 10: Create Settings UI Component** ✅

**File**: `app/settings/NotificationPreferencesSection.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';

interface NotificationPreferences {
  autoSendSoundcloud: boolean;
  autoSendSpotify: boolean;
}

export function NotificationPreferencesSection() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notification-preferences');

      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }

      const data = await response.json();
      setPreferences({
        autoSendSoundcloud: data.autoSendSoundcloud,
        autoSendSpotify: data.autoSendSpotify,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreference = async (field: keyof NotificationPreferences, value: boolean) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch('/api/user/notification-preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update preference');
      }

      const data = await response.json();
      setPreferences({
        autoSendSoundcloud: data.autoSendSoundcloud,
        autoSendSpotify: data.autoSendSpotify,
      });

      setSuccessMessage('Preferences updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update preference');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
        <p className="text-sm text-muted-foreground">Loading preferences...</p>
      </div>
    );
  }

  if (!preferences) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Email Notifications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Control when your subscribers receive emails about new tracks
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">{successMessage}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* SoundCloud Auto-Send */}
        <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
          <div className="flex-1">
            <label
              htmlFor="autoSendSoundcloud"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              SoundCloud New Tracks
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically email subscribers when you release new tracks on SoundCloud
            </p>
          </div>
          <div className="ml-4">
            <input
              type="checkbox"
              id="autoSendSoundcloud"
              checked={preferences.autoSendSoundcloud}
              onChange={(e) => updatePreference('autoSendSoundcloud', e.target.checked)}
              disabled={saving}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Spotify Auto-Send */}
        <div className="flex items-start justify-between p-4 border border-border rounded-lg bg-card">
          <div className="flex-1">
            <label
              htmlFor="autoSendSpotify"
              className="text-sm font-medium text-foreground cursor-pointer"
            >
              Spotify New Releases
            </label>
            <p className="text-sm text-muted-foreground mt-1">
              Automatically email subscribers when you release new music on Spotify
            </p>
          </div>
          <div className="ml-4">
            <input
              type="checkbox"
              id="autoSendSpotify"
              checked={preferences.autoSendSpotify}
              onChange={(e) => updatePreference('autoSendSpotify', e.target.checked)}
              disabled={saving}
              className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Note: You can still manually send track announcements from the dashboard regardless of these settings.
      </p>
    </div>
  );
}
```

**Why**:
- Client component (interactive)
- Optimistic UI (immediate toggle feedback)
- Error handling with user-friendly messages
- Success feedback
- Accessible (labels, disabled states)
- Follows existing design patterns

---

### **Step 11: Integrate into Settings Page** ✅

**File**: `app/settings/SettingsClient.tsx`

Add the new section to the settings page:

```typescript
import { NotificationPreferencesSection } from './NotificationPreferencesSection';

export default function SettingsClient({ initialSettings }: Props) {
  return (
    <div className="space-y-8">
      {/* Existing sections */}
      <ProfileSection initialSettings={initialSettings} />
      <ThemeSwitcher />

      {/* NEW: Notification Preferences Section */}
      <NotificationPreferencesSection />

      {/* Existing sections */}
      <BrevoIntegrationSection />
    </div>
  );
}
```

**Why**:
- Separates concerns (each section is independent)
- Consistent with existing UI structure
- Easy to reorder sections

---

### **Step 12: Future Cron Job Integration** 🔮

When implementing auto-send cron jobs, the preferences will be checked:

**Example**: `app/api/cron/auto-send-soundcloud-tracks/route.ts`

```typescript
// Pseudocode for future implementation
export async function GET(request: Request) {
  // 1. Authenticate cron job
  // 2. Fetch all users with connected SoundCloud
  const users = await fetchUsersWithSoundCloud();

  for (const user of users) {
    // 3. Check if user has auto-send enabled
    const prefsUseCase = UseCaseFactory.createGetUserNotificationPreferencesUseCase();
    const prefs = await prefsUseCase.execute(user.id);

    if (!prefs.autoSendSoundcloud) {
      console.log(`Skipping user ${user.id}: auto-send disabled`);
      continue; // Skip this user
    }

    // 4. Check for new tracks
    // 5. Send emails if new tracks found
  }
}
```

**Why**:
- Preferences checked before sending
- Users have full control
- Follows existing cron pattern

---

## 📊 Summary

### **What We're Building**

| Component | Description | Layer |
|-----------|-------------|-------|
| **UserNotificationPreferences** | Domain entity representing preferences | Domain |
| **IUserNotificationPreferencesRepository** | Repository interface | Domain |
| **PostgresUserNotificationPreferencesRepository** | PostgreSQL implementation | Infrastructure |
| **GetUserNotificationPreferencesUseCase** | Fetch preferences Use Case | Domain |
| **UpdateUserNotificationPreferencesUseCase** | Update preferences Use Case | Domain |
| **NOTIFICATION_PREFERENCES** | Typed constants | Domain |
| **user_notification_preferences** | Database table | Infrastructure |
| **NotificationPreferencesSection** | Settings UI component | Presentation |
| **GET/PATCH /api/user/notification-preferences** | API endpoints | Presentation |

---

### **SOLID Principles Verification**

✅ **SRP**: Each class has one responsibility
✅ **OCP**: Easy to extend (add new notification types)
✅ **LSP**: Repository implementations substitutable
✅ **ISP**: Specific interfaces (not bloated)
✅ **DIP**: Use Cases depend on interfaces

---

### **Database Schema**

```sql
CREATE TABLE user_notification_preferences (
  user_id INT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  auto_send_soundcloud BOOLEAN NOT NULL DEFAULT true,
  auto_send_spotify BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Default Behavior**: Both enabled (maximizes engagement)

---

### **API Contract**

**GET /api/user/notification-preferences**
```json
{
  "userId": 123,
  "autoSendSoundcloud": true,
  "autoSendSpotify": true,
  "updatedAt": "2026-01-10T12:00:00Z"
}
```

**PATCH /api/user/notification-preferences**

Request:
```json
{
  "autoSendSoundcloud": false,
  "autoSendSpotify": true
}
```

Response:
```json
{
  "userId": 123,
  "autoSendSoundcloud": false,
  "autoSendSpotify": true,
  "updatedAt": "2026-01-10T12:05:00Z"
}
```

---

### **UI Mockup**

```
┌─────────────────────────────────────────────────┐
│ Email Notifications                             │
│ Control when your subscribers receive emails    │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ SoundCloud New Tracks              [✓]   │  │
│ │ Automatically email subscribers when you  │  │
│ │ release new tracks on SoundCloud          │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ ┌───────────────────────────────────────────┐  │
│ │ Spotify New Releases               [✓]   │  │
│ │ Automatically email subscribers when you  │  │
│ │ release new music on Spotify              │  │
│ └───────────────────────────────────────────┘  │
│                                                 │
│ Note: You can still manually send track         │
│ announcements from the dashboard regardless     │
│ of these settings.                              │
└─────────────────────────────────────────────────┘
```

---

## 🎯 Benefits of This Design

### **Maintainability**
- Easy to add new notification types (just extend entity + UI)
- Clear separation of concerns
- Follows existing patterns

### **Testability**
- Use Cases easy to test (inject mock repositories)
- No database needed for business logic tests
- Type-safe

### **Extensibility**
- Easy to add: Instagram auto-send, YouTube auto-send, etc.
- Can add notification scheduling (e.g., "only send on Fridays")
- Can add notification templates per platform

### **User Experience**
- Granular control (per-platform)
- Immediate feedback in UI
- Default behavior encourages engagement

### **GDPR Compliance**
- Users have full control over communications
- Preferences logged with timestamps
- Can prove user consent

---

## 🚀 Next Steps (After Implementation)

1. **Add Notification Frequency Preferences**
   - Daily digest vs. immediate
   - Maximum emails per week

2. **Add Notification Templates**
   - Customize email content per platform
   - A/B testing support

3. **Add Notification Analytics**
   - Track open rates per preference setting
   - Optimize defaults based on data

4. **Add Bulk Import/Export**
   - Export preferences as JSON
   - Import preferences from backup

---

## 📚 References

- **Existing Pattern**: `UserAppearance` (theme preferences)
- **SOLID Principles**: `.claude/CLAUDE.md`
- **Clean Architecture**: Robert C. Martin
- **Database Schema**: `prisma/schema.prisma`
- **DI Container**: `lib/di-container.ts`

---

*Last Updated: 2026-01-10*
*Architecture: Clean Architecture + SOLID + Typed Constants*
*Status: Ready for Implementation*
