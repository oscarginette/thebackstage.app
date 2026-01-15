# Project-Specific Guidelines - Backstage

## 🚨 MANDATORY: Read This First

**BEFORE writing ANY code**, read:
1. **.claude/CODE_STANDARDS.md** - Code standards (MANDATORY)
2. **.claude/COMPONENT_REUSE_SYSTEM.md** - Component reuse system (MANDATORY)
3. This file - Architecture and guidelines

**CRITICAL**: Before creating ANY component or function, ALWAYS check `.claude/COMPONENT_REUSE_SYSTEM.md` to:
- Search for existing similar components
- Verify if code can be reused
- Follow the "Component-First Development" workflow
- Avoid code duplication

**ALL code MUST follow these standards without exceptions.**

---

## 🎯 Decision-Making Philosophy

**CRITICAL RULE: NEVER consider implementation time/speed when making decisions.**

When presenting solutions or recommendations:

- ❌ **FORBIDDEN**: "this will take 2 hours", "quick fix", "fast solution", "easy to implement"
- ❌ **FORBIDDEN**: Comparing options by time/complexity ("Option A is faster", "Option B takes longer")
- ❌ **FORBIDDEN**: Suggesting "quick wins" or "low-hanging fruit" based on implementation speed
- ❌ **FORBIDDEN**: Time estimates in summaries, comparisons, or recommendations

**ALWAYS optimize for:**
1. **Robustness** - Will it handle edge cases, errors, and scale?
2. **Correctness** - Does it solve the root problem completely?
3. **Maintainability** - Will the next developer understand and be able to modify it?
4. **Long-term quality** - Will this stand the test of time?

**When presenting multiple options:**
- Rank by **quality/robustness**, NOT by speed
- Explain **trade-offs in quality**, NOT in time
- Recommend the **best solution**, NOT the fastest

**Examples:**

❌ **WRONG**:
```
Option 1: Quick script (2 hours) - validates basic schema
Option 2: Prisma migrations (1 day) - full schema management
Option 3: Preview environments (3 days) - production parity

Recommendation: Start with Option 1 for quick wins.
```

✅ **CORRECT**:
```
Option 1: Pre-deploy validation script
- Robustness: Medium (manual schema maintenance, prone to drift)
- Correctness: Partial (catches known issues only)
- Maintainability: Low (requires updating script per schema change)

Option 2: Prisma migrations + CI/CD
- Robustness: High (automated, version-controlled schema)
- Correctness: Complete (prevents all schema drift)
- Maintainability: High (single source of truth)

Option 3: Preview environments with DB clones
- Robustness: Very High (tests in production-like environment)
- Correctness: Complete (catches runtime + schema issues)
- Maintainability: Very High (automated, zero manual intervention)

Recommendation: Option 3 (best quality), fallback to Option 2 if preview envs not feasible.
```

**This applies to ALL interactions:**
- Feature design
- Architecture decisions
- Refactoring strategies
- Bug fixes
- Tool selection
- Testing approaches

**The user will decide priorities and timelines. You optimize for quality.**

---

## Architecture: Clean Architecture + SOLID Principles

This project follows Clean Architecture principles with strict separation of concerns.

### Layer Structure

```
domain/              # Business logic (NO external dependencies)
├── entities/        # Domain entities with validation
├── repositories/    # Interfaces only (Dependency Inversion)
├── services/        # Use Cases (business logic orchestration)
└── value-objects/   # Immutable value objects

infrastructure/      # External dependencies
├── database/        # PostgreSQL implementations
│   └── repositories/
├── email/           # Email provider implementations
└── config/

app/api/            # Presentation layer (Next.js routes)
                     # ONLY orchestration, NO business logic
```

---

## SOLID Principles (Mandatory)

### 1. Single Responsibility Principle (SRP)
**Rule**: Each class/function has ONE reason to change.

**Examples**:
- ✅ `UnsubscribeUseCase` - Only handles unsubscribe logic
- ✅ `PostgresContactRepository` - Only data access for contacts
- ✅ `ResendEmailProvider` - Only sends emails via Resend
- ❌ API route with database queries + email sending + logging (violates SRP)

**Implementation**:
```typescript
// ❌ BAD: API route doing everything
export async function POST(request: Request) {
  const body = await request.json();
  const contact = await sql`SELECT...`; // DB logic
  await resend.emails.send(...);        // Email logic
  await sql`INSERT INTO logs...`;       // Logging logic
  return NextResponse.json(...);
}

// ✅ GOOD: API route only orchestrates
export async function POST(request: Request) {
  const body = await request.json();
  const useCase = new UnsubscribeUseCase(contactRepo, consentRepo);
  const result = await useCase.execute(body);
  return NextResponse.json(result);
}
```

---

### 2. Open/Closed Principle (OCP)
**Rule**: Open for extension, closed for modification.

**Implementation**: Use interfaces and dependency injection.

```typescript
// ✅ Easy to add SendGridEmailProvider without changing UseCase
class SendTrackEmailUseCase {
  constructor(
    private emailProvider: IEmailProvider  // Interface, not concrete class
  ) {}
}
```

**To add new email provider**:
1. Create `SendGridEmailProvider implements IEmailProvider`
2. Inject it: `new SendTrackEmailUseCase(new SendGridEmailProvider())`
3. **Zero changes to UseCase** (OCP!)

---

### 3. Liskov Substitution Principle (LSP)
**Rule**: Subtypes must be substitutable for their base types.

**Implementation**:
```typescript
// All implementations must respect IEmailProvider contract
interface IEmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
}

// ✅ ResendEmailProvider works
// ✅ SendGridEmailProvider works
// ✅ MockEmailProvider works (for tests)
// All behave the same way from UseCase perspective
```

---

### 4. Interface Segregation Principle (ISP)
**Rule**: Don't force clients to depend on methods they don't use.

**Implementation**:
```typescript
// ✅ GOOD: Specific interfaces
interface IContactRepository {
  getSubscribed(): Promise<Contact[]>;
  findByEmail(email: string): Promise<Contact | null>;
  unsubscribe(id: number): Promise<void>;
}

interface IConsentHistoryRepository {
  create(input: CreateConsentHistoryInput): Promise<ConsentHistory>;
  findByContactId(contactId: number): Promise<ConsentHistory[]>;
}

// ❌ BAD: One huge interface
interface IRepository {
  // 50 methods that most use cases don't need
}
```

---

### 5. Dependency Inversion Principle (DIP)
**Rule**: Depend on abstractions, not concretions.

**Implementation**:
```typescript
// ❌ BAD: UseCase depends on concrete implementation
import { PostgresContactRepository } from '@/infrastructure/...';

class UnsubscribeUseCase {
  constructor(private repo: PostgresContactRepository) {} // Concrete!
}

// ✅ GOOD: UseCase depends on interface
import { IContactRepository } from '@/domain/repositories/...';

class UnsubscribeUseCase {
  constructor(private repo: IContactRepository) {} // Interface!
}
```

**Benefits**:
- Easy testing (inject MockContactRepository)
- Easy switching databases (inject MongoContactRepository)
- Domain layer has **zero knowledge** of PostgreSQL

---

## Clean Code Standards

### Function Size
**Rule**: Functions should be small (<30 lines).

```typescript
// ✅ GOOD: Small, focused function
async execute(input: UnsubscribeInput): Promise<UnsubscribeResult> {
  this.validateInput(input);
  const contact = await this.findContact(input.token);
  await this.updateContact(contact);
  await this.logConsentChange(contact, input);
  return this.buildResult(contact);
}

// ❌ BAD: 200 line function doing everything
async execute(input: UnsubscribeInput): Promise<UnsubscribeResult> {
  // 200 lines of mixed validation, DB, logging, error handling...
}
```

---

### Naming Conventions
**Rule**: Names should reveal intent.

```typescript
// ✅ GOOD
class UnsubscribeUseCase
interface IConsentHistoryRepository
function createUnsubscribe(contactId: number, ipAddress: string)

// ❌ BAD
class Handler
interface IRepo
function process(data: any)
```

---

### Error Handling
**Rule**: Don't hide errors, handle them explicitly.

```typescript
// ✅ GOOD: Explicit error types
try {
  const result = await useCase.execute(input);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  // Unexpected error
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
}

// ❌ BAD: Generic catch-all
try {
  // ...
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

---

### Avoid Magic Values
**Rule**: Extract constants and enums.

```typescript
// ✅ GOOD
const UNSUBSCRIBE_TOKEN_LENGTH = 64;
const GDPR_RETENTION_YEARS = 7;

export type ConsentAction =
  | 'subscribe'
  | 'unsubscribe'
  | 'resubscribe';

// ❌ BAD
if (token.length !== 64) { ... }  // What's 64?
// Retention: 7 years                // Where's this enforced?
```

---

## Testing Standards

### Test Structure
**Rule**: Use Use Cases for business logic tests (easy to test).

```typescript
// ✅ EASY: Test Use Case with mocks
describe('UnsubscribeUseCase', () => {
  it('should unsubscribe contact and log consent', async () => {
    const mockContactRepo = new MockContactRepository();
    const mockConsentRepo = new MockConsentHistoryRepository();

    const useCase = new UnsubscribeUseCase(mockContactRepo, mockConsentRepo);

    const result = await useCase.execute({
      token: 'valid_token',
      ipAddress: '127.0.0.1',
      userAgent: 'test'
    });

    expect(result.success).toBe(true);
    expect(mockConsentRepo.logs).toHaveLength(1);
  });
});

// ❌ HARD: Test API route (requires DB, HTTP mocks, etc)
```

---

## GDPR & Legal Compliance

### Audit Trail (Mandatory)
**Rule**: Log ALL consent changes with IP and timestamp.

```typescript
// ✅ Every unsubscribe logged
await consentHistoryRepository.create({
  contactId: contact.id,
  action: 'unsubscribe',
  timestamp: new Date(),
  source: 'email_link',
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
  metadata: { reason: 'too_many_emails' }
});
```

**GDPR Article 30**: "Records of processing activities"

---

### List-Unsubscribe Header (CAN-SPAM)
**Rule**: ALWAYS include `List-Unsubscribe` header in marketing emails.

```typescript
// ✅ Enables Gmail/Outlook unsubscribe button
emailPayload.headers = {
  'List-Unsubscribe': `<https://thebackstage.app/unsubscribe?token=${token}>`,
  'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
};
```

**Why**: CAN-SPAM Act requirement + better deliverability.

---

### Data Anonymization (Not Deletion)
**Rule**: Don't DELETE, ANONYMIZE for legal retention.

```typescript
// ✅ GDPR compliant deletion
UPDATE contacts
SET
  email = 'deleted-' || id || '@anonymized.local',
  subscribed = false,
  metadata = metadata || '{"gdpr_deleted": true}'::jsonb
WHERE id = ${contactId};

// ❌ WRONG: Hard delete loses legal defense
DELETE FROM contacts WHERE id = ${contactId};
```

**Why**: Keep anonymized records for 7 years (legal disputes, fraud).

---

## Code Review Checklist

Before committing, verify:

- [ ] **SRP**: Does each class/function have ONE responsibility?
- [ ] **DIP**: Are you depending on interfaces, not concrete classes?
- [ ] **Clean Code**: Functions <30 lines, descriptive names?
- [ ] **No Business Logic in API Routes**: Only orchestration?
- [ ] **Error Handling**: Explicit error types, not generic catch-all?
- [ ] **GDPR**: Consent changes logged with IP/timestamp?
- [ ] **CAN-SPAM**: List-Unsubscribe header included?
- [ ] **Tests**: Can you test this with mocks (no real DB)?
- [ ] **No Magic Values**: Constants extracted?
- [ ] **Comments**: Only where logic isn't self-evident?

---

## Example: Perfect Use Case

```typescript
/**
 * UnsubscribeUseCase
 *
 * Handles contact unsubscription with GDPR audit trail.
 * Clean Architecture + SOLID compliant.
 */
export class UnsubscribeUseCase {
  // DIP: Depend on interfaces
  constructor(
    private contactRepository: IContactRepository,
    private consentHistoryRepository: IConsentHistoryRepository
  ) {}

  // SRP: One public method, one responsibility
  async execute(input: UnsubscribeInput): Promise<UnsubscribeResult> {
    this.validateInput(input);

    const contact = await this.findContact(input.token);
    if (!contact) {
      return { success: false, error: 'Invalid token' };
    }

    const alreadyUnsubscribed = !contact.subscribed;

    if (!alreadyUnsubscribed) {
      await this.contactRepository.unsubscribe(contact.id);
    }

    // GDPR: Log consent change
    await this.logConsentChange(contact.id, input);

    return {
      success: true,
      email: contact.email,
      alreadyUnsubscribed
    };
  }

  // Private helpers (SRP)
  private validateInput(input: UnsubscribeInput): void {
    if (!input.token || input.token.length !== 64) {
      throw new ValidationError('Invalid token format');
    }
  }

  private async findContact(token: string): Promise<Contact | null> {
    return this.contactRepository.findByUnsubscribeToken(token);
  }

  private async logConsentChange(
    contactId: number,
    input: UnsubscribeInput
  ): Promise<void> {
    const consentData = ConsentHistory.createUnsubscribe(
      contactId,
      input.ipAddress,
      input.userAgent,
      input.reason
    );

    await this.consentHistoryRepository.create({
      contactId: consentData.contactId,
      action: consentData.action,
      timestamp: consentData.timestamp,
      source: consentData.source,
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
      metadata: consentData.metadata
    });
  }
}
```

**Why this is perfect**:
- ✅ SRP: One responsibility (unsubscribe)
- ✅ OCP: Easy to extend (add new repositories)
- ✅ LSP: Repositories substitutable
- ✅ ISP: Uses specific interfaces
- ✅ DIP: Depends on interfaces
- ✅ Clean: Small functions, clear names
- ✅ GDPR: Audit trail logging
- ✅ Testable: Easy to mock repositories

---

## Anti-Patterns (Forbidden)

### ❌ God Objects
```typescript
// DON'T: One class doing everything
class EmailService {
  sendEmail() { ... }
  unsubscribe() { ... }
  validateEmail() { ... }
  logEvent() { ... }
  updateDatabase() { ... }
}
```

### ❌ Business Logic in API Routes
```typescript
// DON'T: API route with business logic
export async function POST(request: Request) {
  const body = await request.json();

  // ❌ Validation logic here
  if (!body.email.includes('@')) { ... }

  // ❌ Database queries here
  const contact = await sql`SELECT...`;

  // ❌ Business rules here
  if (contact.email_count > 100) { ... }
}
```

### ❌ Tight Coupling
```typescript
// DON'T: Import concrete implementations in domain
import { PostgresContactRepository } from '@/infrastructure/...';

class UnsubscribeUseCase {
  private repo = new PostgresContactRepository(); // ❌ Tight coupling!
}
```

---

## Migration Guide (For Legacy Code)

When refactoring existing code:

1. **Extract Repository**: Move DB queries to `PostgresXRepository`
2. **Create Interface**: Define `IXRepository` in domain/
3. **Extract Use Case**: Move business logic to `XUseCase`
4. **Update API Route**: Make it only orchestrate

**Example**:
```typescript
// BEFORE: app/api/unsubscribe/route.ts (83 lines)
async function handleUnsubscribe(request: Request) {
  const token = searchParams.get('token');
  const result = await sql`UPDATE contacts...`;
  // ... more DB queries, validation, etc
}

// AFTER: app/api/unsubscribe/route.ts (40 lines)
async function handleUnsubscribe(request: Request) {
  const token = searchParams.get('token');
  const useCase = new UnsubscribeUseCase(contactRepo, consentRepo);
  const result = await useCase.execute({ token, ipAddress, userAgent });
  return NextResponse.json(result);
}

// Business logic moved to: domain/services/UnsubscribeUseCase.ts
```

---

## Documentation Requirements

### When to Comment
- **Don't**: Explain WHAT (code should be self-documenting)
- **Do**: Explain WHY (business rules, legal requirements, tradeoffs)

```typescript
// ❌ BAD: Obvious comment
// Get the contact by email
const contact = await this.contactRepository.findByEmail(email);

// ✅ GOOD: Explains business rule
// GDPR requires 7-year retention for legal defense
// So we anonymize instead of deleting
await this.contactRepository.anonymize(contact.id);
```

### File Headers
```typescript
/**
 * UnsubscribeUseCase
 *
 * Handles contact unsubscription with GDPR-compliant audit trail.
 * Implements CAN-SPAM one-click unsubscribe requirements.
 *
 * GDPR: Article 21 (Right to object)
 * CAN-SPAM: Section 7704 (Opt-out requirements)
 */
```

---

## Performance Guidelines

### Database Queries
```typescript
// ✅ GOOD: Single query with JOIN
const contacts = await sql`
  SELECT c.*, ch.action
  FROM contacts c
  LEFT JOIN consent_history ch ON ch.contact_id = c.id
  WHERE c.subscribed = true
`;

// ❌ BAD: N+1 queries
const contacts = await sql`SELECT * FROM contacts`;
for (const contact of contacts) {
  const history = await sql`SELECT * FROM consent_history WHERE contact_id = ${contact.id}`;
}
```

### Email Sending
```typescript
// ✅ GOOD: Batch send with Promise.all
const results = await Promise.all(
  contacts.map(contact => this.sendEmail(contact))
);

// ❌ BAD: Sequential (slow)
for (const contact of contacts) {
  await this.sendEmail(contact); // Blocks!
}
```

---

## 🔄 Component Reuse System (MANDATORY)

**CRITICAL**: Before creating ANY new component, function, or utility, follow the Component Reuse System.

### Mandatory Pre-Development Checklist

**ALWAYS execute BEFORE writing code**:

1. **Search for existing components**:
   ```bash
   find components/ -name "*<keyword>*"
   grep -r "<pattern>" components/
   ```

2. **Review component inventories**:
   - `/components/ui/` - Generic UI components
   - `/components/dashboard/shared/` - Domain components
   - `/lib/` - Shared utilities

3. **Check `.claude/COMPONENT_REUSE_SYSTEM.md`**:
   - Read the "Directorio de Componentes Reutilizables" section
   - Verify if similar component exists
   - Follow the decision tree for creating vs reusing

### Available Reusable Components

**Always check these BEFORE creating new ones**:

#### UI Components (`/components/ui/`)
- `Button` - All button variants with loading states
- `Card` - Containers with styling variants
- `Modal`, `ModalBody`, `ModalFooter` - Dialog/overlay system
- `LoadingSpinner` - Loading indicators (sm/md/lg)
- `ErrorState` - Error displays with retry
- `EmailPreview` - Email HTML rendering in iframe

#### Domain Components (`/components/dashboard/shared/`)
- `CampaignMetadata` - Campaign metadata grid display
- `EmailContentEditor` - Email creation/editing
- `DraftCard` - Draft campaign cards

#### Utilities (`/lib/`)
- `date-utils.ts` - Date formatting (`formatCampaignDate`, `formatTimeAgo`, `formatEmailDate`)
- `validation-schemas.ts` - Zod validation schemas
- `env.ts` - Typed environment variables

### Decision Rules

**When to create a shared component**:
- ✅ Code exists in 2+ places (ALWAYS extract)
- ✅ Common UI pattern (spinner, error, modal, button)
- ✅ Formatting/validation/calculation utility
- ✅ Will likely be reused in future features

**When OK to create inline**:
- ✅ Completely unique to one context
- ✅ Highly specific business logic
- ✅ Won't repeat elsewhere
- ✅ < 20 lines and very simple

### Where to Place Components

```
/components/ui/          → Generic UI (no business logic)
/components/[domain]/shared/  → Domain-specific reusable
/lib/                    → Pure utilities (no UI)
/domain/utils/           → Business logic helpers
```

### Workflow: "Component-First Development"

```
1. Need to create <Component X>
   ↓
2. SEARCH for similar components
   • find components/ -name "*keyword*"
   • grep -r "pattern" components/
   • Review /components/ui/ inventory
   ↓
3. Found similar?
   YES → Reuse or extend existing
   NO  → Check if reusable
         ↓
         Reusable? → Create in /ui/ or /shared/
         Not reusable? → Create inline
```

### Code Review Requirement

**PRs will be rejected if**:
- ❌ Code duplication > 10 lines detected
- ❌ Component should be shared but created inline
- ❌ Utility function should be in `/lib/` but isn't
- ❌ Didn't check `.claude/COMPONENT_REUSE_SYSTEM.md` before coding

**See `.claude/COMPONENT_REUSE_SYSTEM.md` for complete system documentation.**

---

## Security Checklist

- [ ] **Input Validation**: All user input validated in Use Cases
- [ ] **SQL Injection**: Using parameterized queries (Vercel Postgres safe)
- [ ] **XSS**: React escapes by default (safe)
- [ ] **CSRF**: Unsubscribe intentionally allows GET (CAN-SPAM compliant)
- [ ] **Token Security**: 64-char random tokens (32 bytes = strong)
- [ ] **Rate Limiting**: Consider adding for API routes
- [ ] **Signature Verification**: Add webhook signature validation (TODO)

---

## 🔑 Constants Usage (MANDATORY)

### Rule: NEVER use string literals for domain values

**ALWAYS use typed constants instead of string literals.**

#### Available Constants

1. **Subscription Plans** (`domain/types/subscriptions.ts`):
```typescript
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

SUBSCRIPTION_PLANS.FREE       // 'free'
SUBSCRIPTION_PLANS.PRO        // 'pro'
SUBSCRIPTION_PLANS.BUSINESS   // 'business'
SUBSCRIPTION_PLANS.UNLIMITED  // 'unlimited'
```

2. **User Roles** (`domain/types/user-roles.ts`):
```typescript
import { USER_ROLES } from '@/domain/types/user-roles';

USER_ROLES.ADMIN   // 'admin'
USER_ROLES.ARTIST  // 'artist'
```

3. **Consent Actions** (`domain/entities/ConsentHistory.ts`):
```typescript
import { CONSENT_ACTIONS, CONSENT_SOURCES } from '@/domain/entities/ConsentHistory';

CONSENT_ACTIONS.SUBSCRIBE
CONSENT_ACTIONS.UNSUBSCRIBE
CONSENT_ACTIONS.RESUBSCRIBE
// etc.
```

#### Examples

❌ **WRONG**:
```typescript
if (user.role === 'admin') { ... }
if (plan === 'free') { ... }
const prices = { free: 0, pro: 29, business: 79 };
```

✅ **CORRECT**:
```typescript
import { USER_ROLES } from '@/domain/types/user-roles';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

if (user.role === USER_ROLES.ADMIN) { ... }
if (plan === SUBSCRIPTION_PLANS.FREE) { ... }
const prices = {
  [SUBSCRIPTION_PLANS.FREE]: 0,
  [SUBSCRIPTION_PLANS.PRO]: 29,
  [SUBSCRIPTION_PLANS.BUSINESS]: 79
};
```

#### Creating New Constants

When adding new domain values:

1. Create the type:
```typescript
export type PaymentStatus = 'pending' | 'completed' | 'failed';
```

2. Create constants:
```typescript
export const PAYMENT_STATUS = {
  PENDING: 'pending' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
} as const;
```

3. Always use constants, never literals.

**See `.claude/CODE_STANDARDS.md` for complete reference.**

---

**Remember**: This is not optional. Clean Architecture + SOLID + Typed Constants is our standard.
**Always code as if the person maintaining your code is a violent psychopath who knows where you live.**

---

## 🌓 Dark Mode Architecture

This project implements dark mode using Clean Architecture + SOLID principles.

### Quick Start

**Use the theme hook** (client components):
```tsx
'use client';

import { useTheme } from '@/infrastructure/theme/ThemeProvider';
import { THEMES } from '@/domain/types/appearance';

export function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <button onClick={() => setTheme(THEMES.DARK)}>
      Current: {resolvedTheme}
    </button>
  );
}
```

**Use CSS variables** (adaptive colors):
```css
.my-component {
  background-color: var(--background);
  color: var(--foreground);
  border: 1px solid var(--border);
}
```

**Use Tailwind utilities** (recommended):
```tsx
<div className="bg-background text-foreground border-border">
  Adaptive colors that work in both light and dark themes
</div>
```

### Architecture Layers

- **Domain**: `domain/entities/UserAppearance.ts`, `domain/services/*AppearanceUseCase.ts`
- **Infrastructure**: `infrastructure/database/repositories/PostgresUserAppearanceRepository.ts`, `infrastructure/theme/ThemeProvider.tsx`
- **Presentation**: `app/settings/ThemeSwitcher.tsx`, `app/api/user/appearance/route.ts`

### Constants (MANDATORY)

**ALWAYS use typed constants instead of string literals**:
```typescript
import { THEMES } from '@/domain/types/appearance';

// ✅ CORRECT
if (theme === THEMES.DARK) { ... }
setTheme(THEMES.SYSTEM);

// ❌ WRONG
if (theme === 'dark') { ... }
setTheme('system');
```

### Available Theme Constants

```typescript
THEMES.LIGHT    // 'light' - Always use light theme
THEMES.DARK     // 'dark' - Always use dark theme
THEMES.SYSTEM   // 'system' - Follow OS preference (default)
```

### CSS Variables Reference

**Light Theme**:
- `--background`: #FDFCF8 (Cream)
- `--foreground`: #1c1c1c (Almost black)
- `--primary`: #FF5500 (Orange)
- `--border`: #E8E6DF

**Dark Theme**:
- `--background`: #0A0A0A (Near black)
- `--foreground`: #EDEDED (Off-white)
- `--primary`: #FF6B2C (Brighter orange)
- `--border`: #2D2D2D

### Features

- ✅ **Zero Flicker**: Script runs before first paint
- ✅ **SSR Compatible**: Cookie + script prevent hydration mismatch
- ✅ **Multi-layer Persistence**: Cookie (client) + Database (cross-device)
- ✅ **System Theme Detection**: Respects OS preference
- ✅ **Auto-Update**: Listener for real-time OS theme changes
- ✅ **Type-Safe**: Typed constants throughout

### Testing Dark Mode

```bash
# Run development server
npm run dev

# Navigate to /settings
# Click "Dark" or "System" theme
# Verify no flicker on page reload
# Test system theme: Change OS theme preference
```

### Implementation Details

See `.claude/plans/dark-mode-implementation.md` for complete architecture documentation.

---

## 📚 Additional Documentation

**MANDATORY reading before development**:
- **`.claude/CODE_STANDARDS.md`** - Comprehensive code standards and TypeScript guidelines
- **`.claude/COMPONENT_REUSE_SYSTEM.md`** - Component reuse workflow and anti-duplication system
- **`.claude/plans/dark-mode-implementation.md`** - Dark mode architecture details

**Project structure references**:
- `/components/ui/` - Reusable UI components inventory
- `/components/dashboard/shared/` - Domain-specific shared components
- `/lib/` - Shared utilities (date formatting, validation, etc.)
- `/domain/` - Business logic (entities, services, repositories)

---

*Last Updated: 2026-01-15*
*Architecture: Clean Architecture + SOLID + Typed Constants + Dark Mode + Component Reuse System*
*GDPR Compliant: Yes*
*CAN-SPAM Compliant: Yes*
