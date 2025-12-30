# Quick Reference - Code Standards

## 🚀 Before Writing Code

1. ✅ Read `.claude/CODE_STANDARDS.md`
2. ✅ Import constants (NEVER use literals)
3. ✅ Follow SOLID principles
4. ✅ Keep functions small (<30 lines)

---

## 📦 Import Constants (ALWAYS)

```typescript
// Subscription Plans
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

// User Roles
import { USER_ROLES } from '@/domain/types/user-roles';

// Consent Actions
import { CONSENT_ACTIONS, CONSENT_SOURCES } from '@/domain/entities/ConsentHistory';
```

---

## ❌ NEVER Do This

```typescript
// ❌ String literals
if (user.role === 'admin') { }
if (plan === 'free') { }
if (action === 'subscribe') { }

// ❌ Business logic in API routes
export async function POST(request: Request) {
  const contact = await sql`SELECT...`;  // ❌ Direct DB query
  await resend.emails.send(...);         // ❌ Direct email send
}

// ❌ Importing concrete implementations in domain
import { PostgresUserRepository } from '@/infrastructure/...';
```

---

## ✅ ALWAYS Do This

```typescript
// ✅ Use constants
import { USER_ROLES } from '@/domain/types/user-roles';
if (user.role === USER_ROLES.ADMIN) { }

// ✅ Use cases in API routes
export async function POST(request: Request) {
  const useCase = new SendEmailUseCase(contactRepo, emailProvider);
  const result = await useCase.execute(input);
  return NextResponse.json(result);
}

// ✅ Depend on interfaces
import { IUserRepository } from '@/domain/repositories/...';
```

---

## 🏗️ File Structure

```
domain/types/          ← Put new constants here
domain/entities/       ← Domain entities
domain/repositories/   ← Interfaces (NOT implementations)
domain/services/       ← Use Cases

infrastructure/        ← Concrete implementations
app/api/              ← ONLY orchestration
```

---

## ✅ Pre-Commit Checklist

- [ ] No string literals (using constants)
- [ ] No business logic in API routes
- [ ] Depending on interfaces, not concrete classes
- [ ] Functions < 30 lines
- [ ] Descriptive names
- [ ] Error handling explicit
- [ ] No magic numbers

---

## 📖 Full Documentation

- **Complete Standards**: `.claude/CODE_STANDARDS.md`
- **Architecture Guide**: `.claude/CLAUDE.md`
- **Examples**: `domain/services/UnsubscribeUseCase.ts`
