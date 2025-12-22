# Download Gates - Complete Refactor Plan

**Date:** 2025-12-22
**Goal:** Align 100% with CANONICAL_PATTERNS.md standards

---

## Critical Changes Required

### 1. Database Schema Updates

**Missing Fields to Add:**
```sql
ALTER TABLE download_gates
ADD COLUMN artist_name VARCHAR(255),
ADD COLUMN genre VARCHAR(100),
ADD COLUMN file_size_mb DECIMAL(10, 2),
ADD COLUMN soundcloud_user_id VARCHAR(255);
```

**Field Renames Needed:**
- `coverImageUrl` (frontend) → Use `artwork_url` (database already has this)
- `tenantId` (frontend) → Use `user_id` (database already has this)

**Decision:** Keep database names, update frontend to match.

---

### 2. Backend Entity Changes

#### domain/entities/DownloadGate.ts

**Add Missing Fields:**
```typescript
export interface DownloadGateProps {
  // ... existing fields ...

  // NEW FIELDS (add these):
  artistName: string | null;
  genre: string | null;
  fileSizeMb: number | null;
  soundcloudUserId: string | null;

  // RENAME (frontend uses different name):
  // coverImageUrl → artworkUrl (already correct in backend!)
}
```

**Update Getters:**
```typescript
get artistName(): string | null { return this.props.artistName; }
get genre(): string | null { return this.props.genre; }
get fileSizeMb(): number | null { return this.props.fileSizeMb; }
get soundcloudUserId(): string | null { return this.props.soundcloudUserId; }
```

---

### 3. Backend Repository Changes

#### infrastructure/database/repositories/PostgresDownloadGateRepository.ts

**Update CREATE method:**
```typescript
async create(userId: number, input: CreateGateInput): Promise<DownloadGate> {
  const id = randomUUID();

  const result = await sql`
    INSERT INTO download_gates (
      id, user_id, slug, title,
      artist_name, genre, description,       -- ADD THESE
      artwork_url, file_url, file_size_mb, file_type,  -- ADD file_size_mb
      require_email,
      require_soundcloud_repost, require_soundcloud_follow, require_spotify_connect,
      soundcloud_track_id, soundcloud_user_id,  -- ADD soundcloud_user_id
      active, max_downloads, expires_at,
      created_at, updated_at
    ) VALUES (
      ${id}, ${userId}, ${slug}, ${input.title},
      ${input.artistName ?? null}, ${input.genre ?? null}, ${input.description ?? null},
      ${input.artworkUrl ?? null}, ${input.fileUrl}, ${input.fileSizeMb ?? null}, ${input.fileType ?? 'audio/wav'},
      ${input.requireEmail ?? true},
      ${input.requireSoundcloudRepost ?? false}, ${input.requireSoundcloudFollow ?? false}, ${input.requireSpotifyConnect ?? false},
      ${input.soundcloudTrackId ?? null}, ${input.soundcloudUserId ?? null},
      ${input.active ?? true}, ${input.maxDownloads ?? null}, ${expiresAt},
      NOW(), NOW()
    )
    RETURNING *
  `;

  return this.mapToEntity(result.rows[0]);
}
```

**Update mapToEntity:**
```typescript
private mapToEntity(row: any): DownloadGate {
  return DownloadGate.fromDatabase({
    id: row.id,
    userId: row.user_id,
    slug: row.slug,
    title: row.title,

    artistName: row.artist_name,        // ADD
    genre: row.genre,                   // ADD
    description: row.description,
    artworkUrl: row.artwork_url,

    soundcloudTrackId: row.soundcloud_track_id,
    soundcloudTrackUrl: row.soundcloud_track_url,
    soundcloudUserId: row.soundcloud_user_id,  // ADD

    fileUrl: row.file_url,
    fileSizeMb: row.file_size_mb,      // ADD
    fileType: row.file_type,

    requireEmail: row.require_email,
    requireSoundcloudRepost: row.require_soundcloud_repost,
    requireSoundcloudFollow: row.require_soundcloud_follow,
    requireSpotifyConnect: row.require_spotify_connect,

    active: row.active,
    maxDownloads: row.max_downloads,
    expiresAt: row.expires_at ? new Date(row.expires_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at)
  });
}
```

---

### 4. Backend Type Definitions

#### domain/types/download-gates.ts

**Update CreateGateInput:**
```typescript
export interface CreateGateInput {
  slug: string;
  title: string;
  artistName?: string;           // ADD
  genre?: string;                // ADD
  description?: string;
  artworkUrl?: string;           // Rename from coverImageUrl
  fileUrl: string;
  fileSizeMb?: number;           // ADD
  fileType?: string;
  soundcloudTrackId?: string;
  soundcloudUserId?: string;     // ADD
  requireEmail?: boolean;
  requireSoundcloudRepost?: boolean;
  requireSoundcloudFollow?: boolean;
  requireSpotifyConnect?: boolean;
  active?: boolean;
  maxDownloads?: number;
  expiresAt?: Date;
}
```

---

### 5. API Route Serialization

Create helper to serialize entities to JSON (Date → ISO string).

#### lib/serialization.ts (NEW FILE)

```typescript
/**
 * Serialization utilities for API responses
 * Converts entities (with Date objects) to JSON-safe objects (ISO strings)
 */

import { DownloadGate } from '@/domain/entities/DownloadGate';
import { DownloadSubmission } from '@/domain/entities/DownloadSubmission';

export interface SerializedDownloadGate {
  id: string;
  userId: number;
  slug: string;
  title: string;
  artistName: string | null;
  genre: string | null;
  description: string | null;
  artworkUrl: string | null;
  fileUrl: string;
  fileSizeMb: number | null;
  fileType: string | null;
  soundcloudTrackId: string | null;
  soundcloudUserId: string | null;
  requireEmail: boolean;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  active: boolean;
  maxDownloads: number | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function serializeGate(gate: DownloadGate): SerializedDownloadGate {
  return {
    id: gate.id,
    userId: gate.userId,
    slug: gate.slug,
    title: gate.title,
    artistName: gate.artistName ?? null,
    genre: gate.genre ?? null,
    description: gate.description ?? null,
    artworkUrl: gate.artworkUrl ?? null,
    fileUrl: gate.fileUrl,
    fileSizeMb: gate.fileSizeMb ?? null,
    fileType: gate.fileType ?? null,
    soundcloudTrackId: gate.soundcloudTrackId ?? null,
    soundcloudUserId: gate.soundcloudUserId ?? null,
    requireEmail: gate.requireEmail,
    requireSoundcloudRepost: gate.requireSoundcloudRepost,
    requireSoundcloudFollow: gate.requireSoundcloudFollow,
    requireSpotifyConnect: gate.requireSpotifyConnect,
    active: gate.active,
    maxDownloads: gate.maxDownloads ?? null,
    expiresAt: gate.expiresAt?.toISOString() ?? null,
    createdAt: gate.createdAt.toISOString(),
    updatedAt: gate.updatedAt.toISOString()
  };
}

export interface SerializedDownloadSubmission {
  id: string;
  gateId: string;
  email: string;
  firstName: string | null;
  soundcloudUsername: string | null;
  soundcloudUserId: string | null;
  spotifyUserId: string | null;
  emailVerified: boolean;
  soundcloudRepostVerified: boolean;
  soundcloudFollowVerified: boolean;
  spotifyConnected: boolean;
  downloadCompleted: boolean;
  downloadCompletedAt: string | null;
  consentMarketing: boolean;
  createdAt: string;
}

export function serializeSubmission(submission: DownloadSubmission): SerializedDownloadSubmission {
  return {
    id: submission.id,
    gateId: submission.gateId,
    email: submission.email,
    firstName: submission.firstName ?? null,
    soundcloudUsername: submission.soundcloudUsername ?? null,
    soundcloudUserId: submission.soundcloudUserId ?? null,
    spotifyUserId: submission.spotifyUserId ?? null,
    emailVerified: submission.emailVerified,
    soundcloudRepostVerified: submission.soundcloudRepostVerified,
    soundcloudFollowVerified: submission.soundcloudFollowVerified,
    spotifyConnected: submission.spotifyConnected,
    downloadCompleted: submission.downloadCompleted,
    downloadCompletedAt: submission.downloadCompletedAt?.toISOString() ?? null,
    consentMarketing: submission.consentMarketing,
    createdAt: submission.createdAt.toISOString()
  };
}
```

---

### 6. API Routes Updates

#### app/api/download-gates/route.ts

**Update GET handler:**
```typescript
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const listGatesUseCase = new ListDownloadGatesUseCase(gateRepository, analyticsRepository);
    const gatesWithStats = await listGatesUseCase.execute(userId);

    // Serialize dates to ISO strings
    const serializedGates = gatesWithStats.map(gate => ({
      ...serializeGate(gate),
      stats: gate.stats  // Stats already has numbers, no dates
    }));

    return NextResponse.json({ gates: serializedGates });

  } catch (error) {
    console.error('GET /api/download-gates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Update POST handler:**
```typescript
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    const createGateUseCase = new CreateDownloadGateUseCase(gateRepository);
    const result = await createGateUseCase.execute(userId, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Serialize gate
    const serializedGate = serializeGate(result.gate!);

    return NextResponse.json({ gate: serializedGate }, { status: 201 });

  } catch (error) {
    console.error('POST /api/download-gates error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Apply same pattern to:**
- `app/api/download-gates/[id]/route.ts` (GET, PATCH, DELETE)
- `app/api/gate/[slug]/route.ts` (GET)
- `app/api/gate/[slug]/submit/route.ts` (POST)

---

### 7. Frontend Type Updates

#### types/download-gates.ts

**Replace entire file with canonical version:**
```typescript
/**
 * Frontend type definitions for Download Gates
 * Matches backend API responses (after serialization)
 */

export interface DownloadGate {
  id: string;
  userId: number;
  slug: string;
  title: string;
  artistName: string | null;
  genre: string | null;
  description: string | null;
  artworkUrl: string | null;  // RENAME from coverImageUrl
  fileUrl: string;
  fileSizeMb: number | null;
  fileType: string | null;
  soundcloudTrackId: string | null;
  soundcloudUserId: string | null;
  requireEmail: boolean;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  active: boolean;
  maxDownloads: number | null;
  expiresAt: string | null;  // ISO string from API
  createdAt: string;          // ISO string from API
  updatedAt: string;          // ISO string from API
  stats: DownloadGateStats;
}

export interface DownloadGateStats {
  views: number;
  submissions: number;
  downloads: number;
  conversionRate: number;
  soundcloudReposts: number;
  soundcloudFollows: number;
  spotifyConnections: number;
}

export interface DownloadSubmission {
  id: string;
  gateId: string;
  email: string;
  firstName: string | null;
  soundcloudUsername: string | null;
  soundcloudUserId: string | null;
  spotifyUserId: string | null;
  emailVerified: boolean;
  soundcloudRepostVerified: boolean;
  soundcloudFollowVerified: boolean;
  spotifyConnected: boolean;
  downloadCompleted: boolean;
  downloadCompletedAt: string | null;
  consentMarketing: boolean;
  createdAt: string;
}

export interface CreateGateFormData {
  title: string;
  artistName?: string;
  genre?: string;
  description?: string;
  soundcloudTrackUrl: string;
  artworkUrl?: string;         // RENAME from coverImageUrl
  fileUrl: string;
  fileSizeMb?: number;
  fileType: string;
  requireSoundcloudRepost: boolean;
  requireSoundcloudFollow: boolean;
  requireSpotifyConnect: boolean;
  maxDownloads?: number;
  expiresAt?: string;
  slug?: string;
}
```

---

### 8. Frontend Component Updates

#### components/dashboard/DownloadGatesList.tsx

**Update fetch handler:**
```typescript
const fetchGates = async () => {
  try {
    const res = await fetch('/api/download-gates');
    if (res.ok) {
      const data = await res.json();
      setGates(data.gates || []);  // UNWRAP from { gates: [...] }
    }
  } catch (error) {
    console.error('Error fetching download gates:', error);
  } finally {
    setLoading(false);
  }
};
```

**Update rendering:**
```typescript
{gate.artworkUrl ? (  // RENAME from coverImageUrl
  <img src={gate.artworkUrl} alt={gate.title} ... />
) : (
  ...
)}
```

---

#### components/dashboard/CreateGateForm.tsx

**Update form state:**
```typescript
const [formData, setFormData] = useState<CreateGateFormData>({
  title: '',
  artistName: '',   // ADD
  genre: '',        // ADD
  description: '',
  soundcloudTrackUrl: '',
  artworkUrl: '',   // RENAME from coverImageUrl
  fileUrl: '',
  fileSizeMb: undefined,  // ADD
  fileType: 'audio/wav',
  requireSoundcloudRepost: true,
  requireSoundcloudFollow: true,
  requireSpotifyConnect: false,
  maxDownloads: undefined,
  expiresAt: '',
  slug: ''
});
```

**Update submit handler:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  try {
    const response = await fetch('/api/download-gates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create gate');
    }

    const data = await response.json();
    router.push(`/dashboard/download-gates/${data.gate.id}`);  // UNWRAP .gate

  } catch (error) {
    console.error('Error creating gate:', error);
    alert('Error al crear el gate. Por favor intenta de nuevo.');
  } finally {
    setSubmitting(false);
  }
};
```

---

#### app/gate/[slug]/page.tsx

**Update fetch handler:**
```typescript
const fetchGate = async () => {
  try {
    const res = await fetch(`/api/gate/${slug}`);
    if (res.ok) {
      const data = await res.json();
      setGate(data.gate);  // UNWRAP from { gate: {...} }
    } else {
      // Fallback mock data
      setGate({ ... });
    }
  } catch (e) {
    setGate({ ... });
  } finally {
    setLoading(false);
  }
};
```

**Update rendering:**
```typescript
{gate.artworkUrl && (  // RENAME from coverImageUrl
  <div style={{ backgroundImage: `url(${gate.artworkUrl})` }} />
)}
```

---

## Execution Order

1. **Database Migration** (run first)
   ```sql
   ALTER TABLE download_gates
   ADD COLUMN artist_name VARCHAR(255),
   ADD COLUMN genre VARCHAR(100),
   ADD COLUMN file_size_mb DECIMAL(10, 2),
   ADD COLUMN soundcloud_user_id VARCHAR(255);
   ```

2. **Backend Updates** (bottom-up)
   - domain/types/download-gates.ts
   - domain/entities/DownloadGate.ts
   - infrastructure/database/repositories/PostgresDownloadGateRepository.ts
   - lib/serialization.ts (new)
   - app/api/download-gates/route.ts
   - app/api/download-gates/[id]/route.ts
   - app/api/gate/[slug]/route.ts
   - app/api/gate/[slug]/submit/route.ts

3. **Frontend Updates** (types first, then components)
   - types/download-gates.ts
   - components/dashboard/DownloadGatesList.tsx
   - components/dashboard/CreateGateForm.tsx
   - components/dashboard/GatePreview.tsx
   - app/gate/[slug]/page.tsx

4. **Testing**
   - Create test gate via dashboard
   - Verify all fields save correctly
   - Visit public gate page
   - Submit email
   - Check analytics

---

## Success Criteria

- [ ] All API responses wrapped in property
- [ ] All dates serialized to ISO strings
- [ ] All field names consistent (artworkUrl, not coverImageUrl)
- [ ] All missing fields added to database and entities
- [ ] Frontend unwraps all API responses
- [ ] TypeScript compiles with no errors
- [ ] Integration test passes (create → view → submit → download)
- [ ] 100% alignment with CANONICAL_PATTERNS.md

---

**Total Estimated Time:** 3-4 hours
**Risk Level:** Low (backward compatible, additive changes)
**Rollback Strategy:** Revert git commits
