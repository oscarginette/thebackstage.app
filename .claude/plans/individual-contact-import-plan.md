# Individual Contact Import - Implementation Plan

**Date**: 2026-01-15
**Architecture**: Clean Architecture + SOLID Principles
**Strategy**: Maximum code reuse from existing CSV import functionality

---

## Executive Summary

This plan implements a manual "Add Contact" feature that allows users to add individual contacts through a modal form in the Contacts List UI. The implementation follows the existing CSV import architecture pattern, reusing entities, repositories, and UI components.

**Key Decisions**:
- ✅ Create dedicated `CreateContactUseCase` (Option B from research) for robustness
- ✅ Reuse `ImportedContact` entity for validation consistency
- ✅ Reuse existing repository methods (`bulkImport` with single contact)
- ✅ Add modal form using existing UI components (Button, Input, Modal)
- ✅ Include GDPR consent logging (same as CSV import)

---

## Phase 1: Backend Implementation (Domain + Infrastructure)

### 1.1. Create Domain Use Case

**File**: `/domain/services/CreateContactUseCase.ts`

**Purpose**: Handles individual contact creation with validation, duplicate detection, and GDPR consent logging.

**Dependencies** (injected via DI):
- `IContactRepository` - Contact database operations
- `IConsentHistoryRepository` - GDPR audit trail

**Input Schema**:
```typescript
interface CreateContactInput {
  userId: number;
  email: string;
  name?: string | null;
  subscribed?: boolean;
  metadata?: ContactMetadata;
  ipAddress?: string;
  userAgent?: string;
}
```

**Output Schema**:
```typescript
interface CreateContactResult {
  success: boolean;
  contact?: Contact;
  error?: string;
  action?: 'created' | 'updated' | 'resubscribed';
}
```

**Business Logic**:
1. Validate email/name via `ImportedContact.create()` (reuses existing validation)
2. Check for existing contact via `repository.findByEmail()`
   - If exists and subscribed → Return error "Contact already exists"
   - If exists and unsubscribed → Resubscribe flow (update `subscribed = true`)
3. Generate 64-char unsubscribe token (crypto.randomBytes(32))
4. Insert/update via `repository.bulkImport([contact])`
5. Log consent history (action: 'subscribe' or 'resubscribe')
6. Return result with contact data

**Error Handling**:
- Validation errors from `ImportedContact` entity
- Duplicate email errors (custom message)
- Database errors (generic "Failed to create contact")

---

### 1.2. Create Validation Schema

**File**: `/lib/validation-schemas.ts`

**Add new schema**:
```typescript
export const CreateContactSchema = z.object({
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  name: z.string().max(100, 'Name must be 100 characters or less').optional().nullable(),
  subscribed: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateContactInput = z.infer<typeof CreateContactSchema>;
```

**Validation Rules**:
- Email: Required, valid format (uses Zod's `.email()` validator)
- Name: Optional, max 100 chars (matches `ImportedContact` validation)
- Subscribed: Optional boolean, defaults to `true`
- Metadata: Optional key-value object

---

### 1.3. Update Dependency Injection Container

**File**: `/lib/di-container.ts`

**Add factory function**:
```typescript
export function createCreateContactUseCase(): CreateContactUseCase {
  return new CreateContactUseCase(
    createContactRepository(),
    createConsentHistoryRepository()
  );
}
```

**Purpose**: Centralized dependency injection (follows existing pattern).

---

### 1.4. Create API Route

**File**: `/app/api/contacts/add/route.ts`

**Endpoint**: `POST /api/contacts/add`

**Authentication**: Required (via `getUserSession()`)

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "subscribed": true,
  "metadata": {}
}
```

**Response (Success)**:
```json
{
  "success": true,
  "contact": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe",
    "subscribed": true,
    "createdAt": "2026-01-15T12:00:00Z"
  },
  "action": "created"
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "Contact already exists"
}
```

**Implementation Steps**:
1. Authenticate user via `getUserSession()`
2. Parse request body
3. Validate via `CreateContactSchema`
4. Extract IP address from `request.headers.get('x-forwarded-for')`
5. Extract user agent from `request.headers.get('user-agent')`
6. Call `CreateContactUseCase.execute()`
7. Return JSON response (200 on success, 400/409 on error)

**Error Codes**:
- 400: Validation error (invalid email, name too long)
- 409: Duplicate contact (contact already exists and subscribed)
- 500: Unexpected error (database failure)

---

## Phase 2: Frontend Implementation (Presentation Layer)

### 2.1. Create Modal Component

**File**: `/components/dashboard/AddContactModal.tsx`

**Component Type**: Client component (`'use client'`)

**Props**:
```typescript
interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;  // Callback to refresh contact list
}
```

**State**:
```typescript
const [email, setEmail] = useState('');
const [name, setName] = useState('');
const [subscribed, setSubscribed] = useState(true);
const [saving, setSaving] = useState(false);
const [errors, setErrors] = useState<Record<string, string>>({});
```

**Form Structure**:
```tsx
<Modal isOpen={isOpen} onClose={onClose} size="md" title="Add Contact">
  <ModalBody>
    <Input
      label="Email"
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      error={errors.email}
      helperText="Required field"
      required
      focusVariant="primary"
    />
    <Input
      label="Name (optional)"
      type="text"
      value={name}
      onChange={(e) => setName(e.target.value)}
      error={errors.name}
      helperText="Optional - max 100 characters"
      focusVariant="primary"
    />
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        id="subscribed"
        checked={subscribed}
        onChange={(e) => setSubscribed(e.target.checked)}
        className="rounded border-border focus:ring-primary"
      />
      <label htmlFor="subscribed" className="text-sm text-foreground">
        Subscribed to emails
      </label>
    </div>
  </ModalBody>
  <ModalFooter>
    <Button variant="secondary" onClick={onClose}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleSubmit} loading={saving}>
      Add Contact
    </Button>
  </ModalFooter>
</Modal>
```

**Submit Handler**:
```typescript
const handleSubmit = async () => {
  setSaving(true);
  setErrors({});

  try {
    const response = await fetch('/api/contacts/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name: name || null, subscribed }),
    });

    const result = await response.json();

    if (!response.ok) {
      if (result.error) {
        setErrors({ email: result.error });
      }
      return;
    }

    // Success
    toast.success(`Contact ${result.action === 'resubscribed' ? 'resubscribed' : 'added'} successfully!`);
    onSuccess();  // Refresh list
    onClose();    // Close modal

    // Reset form
    setEmail('');
    setName('');
    setSubscribed(true);
  } catch (error) {
    toast.error('Failed to add contact');
  } finally {
    setSaving(false);
  }
};
```

**Reusable Components**:
- ✅ `Modal` from `/components/ui/Modal.tsx`
- ✅ `ModalBody`, `ModalFooter` from `/components/ui/Modal.tsx`
- ✅ `Button` from `/components/ui/Button.tsx` (with loading state)
- ✅ `Input` from `/components/ui/Input.tsx` (with error display)
- ✅ `toast` from existing toast system

---

### 2.2. Integrate into ContactsList

**File**: `/components/dashboard/ContactsList.tsx`

**Changes**:

1. **Add State**:
```typescript
const [showAddContactModal, setShowAddContactModal] = useState(false);
```

2. **Add Button** (in action bar, around line 288):
```tsx
<div className="flex gap-2">
  {/* Add new button before ImportContactsButton */}
  <Button
    onClick={() => setShowAddContactModal(true)}
    variant="secondary"
    className="flex items-center gap-2"
  >
    <UserPlus className="w-4 h-4" />
    Add Contact
  </Button>

  <ImportContactsButton onClick={onImportClick} />
  {/* ... rest of existing buttons */}
</div>
```

3. **Add Modal** (in component JSX, near other modals):
```tsx
{showAddContactModal && (
  <AddContactModal
    isOpen={showAddContactModal}
    onClose={() => setShowAddContactModal(false)}
    onSuccess={() => {
      fetchContacts();  // Refresh list (existing function)
    }}
  />
)}
```

4. **Import Icon** (add to imports):
```typescript
import { UserPlus } from 'lucide-react';
```

**UI Placement**: Button appears left of "Import from CSV" in the action bar.

---

### 2.3. Toast Notifications

**Messages**:
- Success: `"Contact added successfully!"` or `"Contact resubscribed successfully!"`
- Error: `"Failed to add contact"` (generic) or specific validation error

**Implementation**: Use existing toast system (already imported in ContactsList).

---

## Phase 3: GDPR Compliance

### 3.1. Consent History Logging

**Use Case**: `CreateContactUseCase` logs consent via `IConsentHistoryRepository`

**Data Logged**:
```typescript
{
  contactId: newContact.id,
  action: 'subscribe',      // or 'resubscribe' if updating unsubscribed contact
  source: 'manual_add',      // Distinguishes from CSV import
  ipAddress: input.ipAddress,  // From request headers
  userAgent: input.userAgent,  // From request headers
  timestamp: new Date(),
  metadata: {
    addedBy: 'user',
    method: 'web_form'
  }
}
```

**Legal Compliance**:
- GDPR Article 30: Records of processing activities
- CAN-SPAM: Consent at time of collection

---

### 3.2. Unsubscribe Token Generation

**Implementation**: Same as CSV import
```typescript
const unsubscribeToken = crypto.randomBytes(32).toString('hex'); // 64 chars
```

**Storage**: Stored in `contacts.unsubscribe_token` (unique index ensures no collisions).

---

## Phase 4: Testing & Validation

### 4.1. Backend Tests

**File**: `/domain/services/__tests__/CreateContactUseCase.test.ts`

**Test Cases**:
1. ✅ Creates new contact successfully
2. ✅ Validates email format (rejects invalid emails)
3. ✅ Validates name length (rejects > 100 chars)
4. ✅ Detects duplicate email (subscribed contact)
5. ✅ Resubscribes unsubscribed contact
6. ✅ Logs consent history on create
7. ✅ Logs consent history on resubscribe
8. ✅ Generates unique unsubscribe token

**Mocks**:
- `MockContactRepository` (implements `IContactRepository`)
- `MockConsentHistoryRepository` (implements `IConsentHistoryRepository`)

---

### 4.2. API Route Tests

**File**: `/app/api/contacts/add/__tests__/route.test.ts` (optional, manual testing OK)

**Test Cases**:
1. ✅ Returns 401 if not authenticated
2. ✅ Returns 400 if email missing
3. ✅ Returns 400 if email invalid format
4. ✅ Returns 400 if name > 100 chars
5. ✅ Returns 409 if contact already exists
6. ✅ Returns 200 with contact data on success

---

### 4.3. Frontend Manual Testing

**Checklist**:
- [ ] Click "Add Contact" button opens modal
- [ ] Email field validation (required, format)
- [ ] Name field validation (max 100 chars)
- [ ] Subscribed checkbox works
- [ ] Submit button shows loading state
- [ ] Success toast appears on success
- [ ] Contact list refreshes after add
- [ ] Modal closes after success
- [ ] Error message displays on duplicate email
- [ ] Error message displays on validation error
- [ ] Cancel button closes modal without saving

---

### 4.4. End-to-End Testing

**Scenarios**:
1. Add contact with email only → Success
2. Add contact with email + name → Success
3. Add contact with unsubscribed = false → Creates unsubscribed contact
4. Add duplicate email (subscribed) → Error "Contact already exists"
5. Add duplicate email (unsubscribed) → Resubscribes successfully
6. Verify consent history logged in database
7. Verify unsubscribe token generated

**Database Validation**:
```sql
SELECT * FROM contacts WHERE email = 'test@example.com';
SELECT * FROM consent_history WHERE contact_id = <id> ORDER BY timestamp DESC;
```

---

## Implementation Order

### Sprint 1: Backend (1 task)
1. **Backend Implementation** (single subagent):
   - Create `CreateContactUseCase.ts`
   - Add `CreateContactSchema` to validation-schemas.ts
   - Add factory to di-container.ts
   - Create API route `/app/api/contacts/add/route.ts`
   - Write use case tests

### Sprint 2: Frontend (1 task)
2. **Frontend Implementation** (single subagent):
   - Create `AddContactModal.tsx`
   - Update `ContactsList.tsx` (add button + modal)
   - Test UI interactions

### Sprint 3: Testing (1 task)
3. **End-to-End Testing** (manual):
   - Test all scenarios
   - Verify GDPR compliance
   - Database validation

---

## Code Reuse Summary

**Reused from CSV Import**:
- ✅ `ImportedContact` entity (email/name validation)
- ✅ `Email` value object (email format validation)
- ✅ `IContactRepository.bulkImport()` (single contact = batch of 1)
- ✅ `IConsentHistoryRepository.create()` (consent logging)
- ✅ Unsubscribe token generation pattern
- ✅ Repository upsert logic (ON CONFLICT DO UPDATE)

**Reused UI Components**:
- ✅ `Modal`, `ModalBody`, `ModalFooter`
- ✅ `Button` (with loading state)
- ✅ `Input` (with error display)
- ✅ Toast notifications
- ✅ Contact list refresh pattern (`fetchContacts()`)

**New Code**:
- ✅ `CreateContactUseCase` (orchestrates logic, ~80 lines)
- ✅ `AddContactModal` (form UI, ~150 lines)
- ✅ API route `/api/contacts/add/route.ts` (~60 lines)
- ✅ Validation schema `CreateContactSchema` (~10 lines)

**Total New Lines**: ~300 lines (vs ~1000+ if built from scratch)

---

## Architecture Compliance

### SOLID Principles
- ✅ **SRP**: Use case has one responsibility (create contact)
- ✅ **OCP**: Easy to extend (add new contact sources without changing code)
- ✅ **LSP**: Repositories are substitutable (mock for tests)
- ✅ **ISP**: Uses specific interfaces (IContactRepository, IConsentHistoryRepository)
- ✅ **DIP**: Depends on interfaces, not concrete implementations

### Clean Architecture Layers
- ✅ **Domain**: Use case contains business logic (no framework dependencies)
- ✅ **Infrastructure**: Repository handles database (PostgreSQL implementation)
- ✅ **Application**: API route orchestrates (no business logic)
- ✅ **Presentation**: Modal component handles UI (no business logic)

### Code Standards
- ✅ **Functions < 30 lines**: All methods are small and focused
- ✅ **Descriptive names**: `CreateContactUseCase`, `AddContactModal`
- ✅ **Explicit error handling**: Validation errors, duplicate errors, database errors
- ✅ **No magic values**: Uses constants (CONSENT_ACTIONS, CONSENT_SOURCES)
- ✅ **GDPR compliant**: Logs consent with IP/timestamp
- ✅ **Testable**: Easy to mock repositories

---

## Risk Mitigation

### Duplicate Email Handling
**Risk**: User tries to add existing contact
**Solution**:
- Check `repository.findByEmail()` before insert
- If subscribed → Return error with clear message
- If unsubscribed → Offer resubscribe flow (update `subscribed = true`)

### Validation Bypass
**Risk**: Invalid data bypasses frontend validation
**Solution**:
- Double validation: frontend (UX) + backend (security)
- Backend uses Zod schema + `ImportedContact` entity validation
- Database constraints (email format, unique constraint)

### GDPR Compliance
**Risk**: Missing consent audit trail
**Solution**:
- Always log to `consent_history` table
- Store IP address + user agent
- Source = `'manual_add'` (distinguishes from other sources)

### Performance
**Risk**: Slow insert for single contact
**Solution**:
- Reuses optimized `bulkImport()` method (batch of 1)
- No performance degradation (single insert is fast)

---

## Success Criteria

**Backend**:
- [ ] Use case creates contact with validation
- [ ] Use case detects duplicates correctly
- [ ] Use case logs GDPR consent
- [ ] API route returns proper error codes
- [ ] Tests pass (validation, duplicate, consent)

**Frontend**:
- [ ] Modal opens/closes correctly
- [ ] Form validates email + name
- [ ] Loading state shows during save
- [ ] Success toast appears
- [ ] Contact list refreshes
- [ ] Error messages display

**Compliance**:
- [ ] Consent history logged with IP/timestamp
- [ ] Unsubscribe token generated (64 chars)
- [ ] Source = 'manual_add' (audit trail)

**Code Quality**:
- [ ] Follows Clean Architecture structure
- [ ] Passes SOLID principles checklist
- [ ] Reuses existing components/entities
- [ ] No code duplication
- [ ] Descriptive naming conventions

---

## File Changes Summary

**New Files**:
- `/domain/services/CreateContactUseCase.ts` (~80 lines)
- `/app/api/contacts/add/route.ts` (~60 lines)
- `/components/dashboard/AddContactModal.tsx` (~150 lines)
- `/domain/services/__tests__/CreateContactUseCase.test.ts` (~100 lines)

**Modified Files**:
- `/lib/validation-schemas.ts` (+10 lines) - Add CreateContactSchema
- `/lib/di-container.ts` (+5 lines) - Add factory function
- `/components/dashboard/ContactsList.tsx` (+15 lines) - Add button + modal

**Total**: ~420 lines of new code, ~30 lines of modifications

---

## Timeline Estimate

**Phase 1 (Backend)**: 1 subagent task
**Phase 2 (Frontend)**: 1 subagent task
**Phase 3 (Testing)**: Manual testing

**Total**: 2 automated tasks + manual validation

---

## Next Steps

1. ✅ Review plan with user
2. ✅ Execute Phase 1 (Backend) with subagent
3. ✅ Execute Phase 2 (Frontend) with subagent
4. ✅ Manual testing + GDPR verification

---

*Plan created: 2026-01-15*
*Architecture: Clean Architecture + SOLID*
*Code Reuse: Maximum (entities, repositories, UI components)*
*GDPR Compliant: Yes*
