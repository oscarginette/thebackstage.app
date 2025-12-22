# Project-Specific Guidelines - Backstage

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
  'List-Unsubscribe': `<https://geebeat.com/unsubscribe?token=${token}>`,
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

## Security Checklist

- [ ] **Input Validation**: All user input validated in Use Cases
- [ ] **SQL Injection**: Using parameterized queries (Vercel Postgres safe)
- [ ] **XSS**: React escapes by default (safe)
- [ ] **CSRF**: Unsubscribe intentionally allows GET (CAN-SPAM compliant)
- [ ] **Token Security**: 64-char random tokens (32 bytes = strong)
- [ ] **Rate Limiting**: Consider adding for API routes
- [ ] **Signature Verification**: Add webhook signature validation (TODO)

---

**Remember**: This is not optional. Clean Architecture + SOLID is our standard.
**Always code as if the person maintaining your code is a violent psychopath who knows where you live.**

---

*Last Updated: 2025-12-22*
*Architecture: Clean Architecture + SOLID*
*GDPR Compliant: Yes*
*CAN-SPAM Compliant: Yes*
