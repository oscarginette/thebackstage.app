# Email Draft Validation - SOLID Implementation

## Problem Statement

The "Guardar Borrador" (Save Draft) button was showing backend validation errors after clicking, which creates a poor user experience:

```
Validation failed: {"_errors":[],"subject":{"_errors":["Subject is required"]},"htmlContent":{"_errors":["Invalid input: expected string, received undefined"]}}
```

**User Experience Issues:**
1. User clicks "Save Draft" → Error appears → Frustration
2. No indication of what's missing before clicking
3. No visual feedback on invalid fields
4. Unclear why the button is disabled

## Solution: SOLID Architecture

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  (EmailContentEditor.tsx + Tooltip.tsx)                     │
│  - Displays validation errors with red borders              │
│  - Disables button when invalid                             │
│  - Shows tooltip with requirements                          │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    Hooks Layer                               │
│  (useEmailContentValidation.ts)                             │
│  - Real-time validation feedback                            │
│  - Memoized for performance                                 │
│  - ISP: Provides exactly what UI needs                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                              │
│  ValidateEmailContentUseCase.ts                             │
│  - Orchestrates validation                                   │
│  - SRP: Only validates email content                        │
│  - Returns structured validation state                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────────────────────┐
│                    Value Objects                             │
│  EmailContentValidation.ts                                  │
│  - Encapsulates validation rules                            │
│  - Immutable validation state                               │
│  - Business rules enforcement                               │
└─────────────────────────────────────────────────────────────┘
```

---

## SOLID Principles Applied

### 1. Single Responsibility Principle (SRP)

**Each class has ONE reason to change:**

#### `EmailContentValidation` (Value Object)
- **Responsibility**: Validate email content according to business rules
- **Changes if**: Validation rules change (e.g., subject max length)

```typescript
export class EmailContentValidation {
  // ONLY validates - doesn't save, doesn't format, doesn't render
  private validate(): void {
    this.validateSubject();
    this.validateGreeting();
    this.validateMessage();
    this.validateSignature();
  }
}
```

#### `ValidateEmailContentUseCase` (Use Case)
- **Responsibility**: Execute validation and return structured results
- **Changes if**: Validation workflow changes

```typescript
export class ValidateEmailContentUseCase {
  execute(input: ValidateEmailContentInput): ValidateEmailContentResult {
    const validation = new EmailContentValidation(input);
    return {
      isValid: validation.isValid(),
      errors: validation.getErrors(),
      // ... structured results
    };
  }
}
```

#### `useEmailContentValidation` (Hook)
- **Responsibility**: Provide validation state to React components
- **Changes if**: React integration needs change

#### `Tooltip` (Component)
- **Responsibility**: Display tooltip on hover
- **Changes if**: Tooltip UI/UX changes

---

### 2. Open/Closed Principle (OCP)

**Open for extension, closed for modification:**

#### Adding New Validation Rules

```typescript
// ✅ EASY: Add new validation without changing existing code
export class EmailContentValidation {
  private validate(): void {
    this.validateSubject();
    this.validateGreeting();
    this.validateMessage();
    this.validateSignature();
    // Add new validation here (extension)
    this.validateAttachments(); // New!
  }

  // Add new method (extension, not modification)
  private validateAttachments(): void {
    if (this.content.attachments?.length > 10) {
      this.errors.push({
        field: 'attachments',
        message: 'Maximum 10 attachments allowed',
        severity: 'error'
      });
    }
  }
}
```

#### Custom Validation Strategies (Future)

```typescript
// Could extend with custom validators without changing core
interface IValidationStrategy {
  validate(content: EmailContentToValidate): ValidationError[];
}

export class StrictValidation implements IValidationStrategy { ... }
export class LenientValidation implements IValidationStrategy { ... }
```

---

### 3. Liskov Substitution Principle (LSP)

**Subtypes must be substitutable:**

All validation error types follow the same contract:

```typescript
export interface ValidationError {
  field: 'subject' | 'greeting' | 'message' | 'signature';
  message: string;
  severity: 'error' | 'warning';
}
```

Any component can consume `ValidationError[]` without knowing the source:

```typescript
// Works with subject errors, greeting errors, etc.
{validation.getFieldErrors('subject').map(error => (
  <p key={error.message}>{error.message}</p>
))}
```

---

### 4. Interface Segregation Principle (ISP)

**Don't force clients to depend on methods they don't use:**

#### Hook provides exactly what UI needs:

```typescript
export interface UseEmailContentValidationResult {
  isValid: boolean;                    // For button disabled state
  saveButtonTooltip: string;           // For tooltip content
  fieldHasError: (field) => boolean;   // For conditional CSS classes
  getFieldErrorMessages: (field) => string[]; // For error display
}
```

UI doesn't need to know about:
- How validation works internally
- The validation algorithm
- Error collection logic

---

### 5. Dependency Inversion Principle (DIP)

**Depend on abstractions, not concretions:**

#### Use Case depends on Value Object (abstraction), not database or API:

```typescript
// ✅ GOOD: Use Case creates value object (no external dependencies)
export class ValidateEmailContentUseCase {
  execute(input: ValidateEmailContentInput): ValidateEmailContentResult {
    const validation = new EmailContentValidation(input);
    return { ... };
  }
}
```

#### Component depends on Hook (abstraction), not Use Case directly:

```typescript
// ✅ GOOD: Component uses hook, doesn't know about Use Case
const validation = useEmailContentValidation({ subject, greeting, ... });

// Component doesn't know:
// - How validation is performed
// - What Use Case is being called
// - What Value Object exists
```

---

## Business Rules

### Subject (REQUIRED)
- **Rule**: Must be non-empty and 1-500 characters
- **Why**: Email subject is required for deliverability and user understanding
- **Error**: "Subject is required"

### Greeting (OPTIONAL)
- **Rule**: Maximum 200 characters
- **Why**: Keep greetings concise for readability
- **Error**: "Greeting must be 200 characters or less"

### Message (OPTIONAL)
- **Rule**: Maximum 5000 characters
- **Why**: Email should be concise, not a novel
- **Error**: "Message must be 5000 characters or less"

### Signature (OPTIONAL)
- **Rule**: Maximum 500 characters
- **Why**: Signatures should be short and professional
- **Error**: "Signature must be 500 characters or less"

---

## User Experience Features

### 1. Real-Time Validation

As the user types, validation runs automatically:

```typescript
const validation = useEmailContentValidation({
  subject,    // Updates on every keystroke
  greeting,
  message,
  signature
});
```

**Performance**: Uses `useMemo` to avoid unnecessary re-computation.

---

### 2. Visual Feedback

#### Red Border on Invalid Fields

```tsx
<input
  className={`... ${
    validation.fieldHasError('subject')
      ? 'border-red-500'  // Invalid: Red border
      : 'border-border'    // Valid: Normal border
  }`}
/>
```

#### Error Messages Below Fields

```tsx
{validation.fieldHasError('subject') && (
  <p className="text-red-600" role="alert">
    {validation.getFieldErrorMessages('subject').join('. ')}
  </p>
)}
```

---

### 3. Disabled Button with Tooltip

#### Button Disabled When Invalid

```tsx
<button
  disabled={!validation.isValid || saving || savingDraft}
  className={validation.isValid ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
>
  Save Draft
</button>
```

#### Tooltip Shows What's Missing

```tsx
<Tooltip
  content={validation.isValid
    ? 'Save draft'
    : 'Cannot save draft:\n• Subject is required'
  }
>
  <button>Save Draft</button>
</Tooltip>
```

**Multiline Support**: Tooltip uses `whitespace-pre-line` for newlines.

---

### 4. Accessibility (ARIA)

#### Invalid State

```tsx
<input
  aria-invalid={validation.fieldHasError('subject')}
  aria-describedby={validation.fieldHasError('subject') ? 'subject-error' : undefined}
/>
```

#### Error Messages

```tsx
<p id="subject-error" role="alert">
  Subject is required
</p>
```

Screen readers will announce errors automatically.

---

## Testing

### Unit Tests (Domain Layer)

```typescript
// __tests__/domain/value-objects/EmailContentValidation.test.ts
describe('EmailContentValidation', () => {
  it('should fail when subject is empty', () => {
    const validation = new EmailContentValidation({
      subject: '',
      greeting: 'Hello',
      message: 'Test',
      signature: 'Best'
    });

    expect(validation.isValid()).toBe(false);
    expect(validation.hasFieldErrors('subject')).toBe(true);
  });

  it('should pass with valid content', () => {
    const validation = new EmailContentValidation({
      subject: 'Valid subject',
      greeting: 'Hello',
      message: 'Test',
      signature: 'Best'
    });

    expect(validation.isValid()).toBe(true);
  });
});
```

### Manual Testing Scenarios

#### Scenario 1: Empty Subject
1. Open email editor
2. Leave subject empty
3. **Expected**: Subject field has red border, error message below
4. **Expected**: "Save Draft" button is disabled with tooltip

#### Scenario 2: Subject Too Long
1. Type 501 characters in subject
2. **Expected**: Red border, error: "Subject must be 500 characters or less"
3. **Expected**: Button disabled

#### Scenario 3: All Valid
1. Enter valid subject (1-500 chars)
2. **Expected**: Green/normal border, no error
3. **Expected**: Button enabled, tooltip says "Save draft"

#### Scenario 4: Multiple Errors
1. Empty subject + 501-char greeting
2. **Expected**: Both fields have red borders
3. **Expected**: Tooltip shows all errors in list format

---

## File Structure

```
domain/
├── value-objects/
│   └── EmailContentValidation.ts       # Validation rules
└── services/
    └── ValidateEmailContentUseCase.ts  # Validation orchestration

hooks/
└── useEmailContentValidation.ts        # React integration

components/
├── ui/
│   └── Tooltip.tsx                     # Reusable tooltip
└── dashboard/
    └── EmailContentEditor.tsx          # Form with validation

__tests__/
└── domain/
    └── value-objects/
        └── EmailContentValidation.test.ts  # Unit tests
```

---

## Performance Considerations

### 1. Memoization

```typescript
const validationResult = useMemo(() => {
  return useCase.execute(content);
}, [content.subject, content.greeting, content.message, content.signature]);
```

**Why**: Validation only re-runs when content changes, not on every render.

### 2. Field-Level Validation Helpers

```typescript
const fieldHasError = useMemo(() => {
  return (field) => validationResult.errors.some(e => e.field === field);
}, [validationResult.errors]);
```

**Why**: Memoized functions avoid re-creating on every render.

### 3. No External Dependencies

Validation runs in-memory (no API calls, no database queries).

**Why**: Instant feedback, no network latency.

---

## Migration Guide

### Before (Backend Validation Only)

```tsx
// User clicks button → API call → Error returned
<button onClick={handleSaveDraft}>Save Draft</button>

// Error shows AFTER click
// No visual feedback
// No tooltip
```

### After (Frontend + Backend Validation)

```tsx
// Real-time validation as user types
const validation = useEmailContentValidation({ subject, ... });

// Button disabled if invalid
<Tooltip content={validation.saveButtonTooltip}>
  <button disabled={!validation.isValid}>Save Draft</button>
</Tooltip>

// Red borders on invalid fields
<input className={validation.fieldHasError('subject') ? 'border-red-500' : ''} />
```

**Result**: User knows what's required BEFORE clicking.

---

## Future Enhancements

### 1. Warning-Level Validation

```typescript
// Current: Only errors (block save)
// Future: Warnings (allow save but show notice)

if (subject.length < 10) {
  this.errors.push({
    field: 'subject',
    message: 'Subject is very short. Consider adding more detail.',
    severity: 'warning'  // Not blocking
  });
}
```

### 2. Custom Validation Rules Per User

```typescript
// Load user-specific rules from database
const userRules = await getUserValidationRules(userId);
const validation = new EmailContentValidation(content, userRules);
```

### 3. Async Validation (API Checks)

```typescript
// Check if subject is unique
const isDuplicate = await checkDuplicateSubject(subject);
if (isDuplicate) {
  this.errors.push({
    field: 'subject',
    message: 'Similar subject already exists',
    severity: 'warning'
  });
}
```

---

## Benefits Summary

### User Experience
✅ Instant feedback (no waiting for API)
✅ Clear visual indicators (red borders)
✅ Helpful tooltips (explains what's needed)
✅ Accessible (ARIA support)
✅ Prevents frustration (no unexpected errors)

### Code Quality
✅ SOLID principles (maintainable, testable)
✅ Separation of concerns (domain, hooks, UI)
✅ Type-safe (TypeScript throughout)
✅ Well-tested (unit tests for business logic)
✅ Reusable (Tooltip, validation hook)

### Business Value
✅ Fewer support tickets (better UX)
✅ Higher draft completion rate (users know what's needed)
✅ Faster development (SOLID makes changes easy)
✅ Better data quality (validation prevents bad drafts)

---

## Code Review Checklist

- [x] **SRP**: Each class has one responsibility
- [x] **OCP**: Easy to add new validation rules
- [x] **LSP**: Errors follow same contract
- [x] **ISP**: Hook provides exactly what UI needs
- [x] **DIP**: Components depend on abstractions
- [x] **Tests**: Unit tests for validation logic
- [x] **Accessibility**: ARIA attributes for screen readers
- [x] **Performance**: Memoization prevents unnecessary re-renders
- [x] **UX**: Red borders, error messages, tooltips
- [x] **Type Safety**: Full TypeScript typing

---

## Related Documentation

- [Clean Architecture Guide](../.claude/CLAUDE.md)
- [SOLID Principles](../.claude/CODE_STANDARDS.md)
- [Component Standards](../.claude/CODE_STANDARDS.md#react-components)
- [Testing Standards](../.claude/CODE_STANDARDS.md#testing)

---

*Last Updated: 2026-01-11*
*Implementation: SOLID + Clean Architecture*
*Status: Production Ready ✅*
