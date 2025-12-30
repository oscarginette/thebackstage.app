# Code Standards - Backstage Project

## 🎯 Objetivo

Este documento establece los estándares de código **obligatorios** para el proyecto. Toda contribución debe seguir estas reglas sin excepciones.

---

## 📜 Principios Fundamentales

### 1. **NUNCA usar literales de string**

❌ **PROHIBIDO**:
```typescript
if (user.role === 'admin') { ... }
if (plan === 'free') { ... }
if (action === 'subscribe') { ... }
```

✅ **CORRECTO**:
```typescript
import { USER_ROLES } from '@/domain/types/user-roles';
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';
import { CONSENT_ACTIONS } from '@/domain/entities/ConsentHistory';

if (user.role === USER_ROLES.ADMIN) { ... }
if (plan === SUBSCRIPTION_PLANS.FREE) { ... }
if (action === CONSENT_ACTIONS.SUBSCRIBE) { ... }
```

**Razón**: Type safety, autocomplete, refactoring seguro, prevención de typos.

---

### 2. **Constantes Disponibles**

#### **Planes de Suscripción**
```typescript
import { SUBSCRIPTION_PLANS } from '@/domain/types/subscriptions';

SUBSCRIPTION_PLANS.FREE       // 'free'
SUBSCRIPTION_PLANS.PRO        // 'pro'
SUBSCRIPTION_PLANS.BUSINESS   // 'business'
SUBSCRIPTION_PLANS.UNLIMITED  // 'unlimited'
```

#### **Roles de Usuario**
```typescript
import { USER_ROLES } from '@/domain/types/user-roles';

USER_ROLES.ADMIN   // 'admin'
USER_ROLES.ARTIST  // 'artist'
```

#### **Acciones de Consentimiento**
```typescript
import { CONSENT_ACTIONS } from '@/domain/entities/ConsentHistory';

CONSENT_ACTIONS.SUBSCRIBE       // 'subscribe'
CONSENT_ACTIONS.UNSUBSCRIBE     // 'unsubscribe'
CONSENT_ACTIONS.RESUBSCRIBE     // 'resubscribe'
CONSENT_ACTIONS.DELETE_REQUEST  // 'delete_request'
CONSENT_ACTIONS.BOUNCE          // 'bounce'
CONSENT_ACTIONS.SPAM_COMPLAINT  // 'spam_complaint'
```

#### **Fuentes de Consentimiento**
```typescript
import { CONSENT_SOURCES } from '@/domain/entities/ConsentHistory';

CONSENT_SOURCES.EMAIL_LINK      // 'email_link'
CONSENT_SOURCES.API_REQUEST     // 'api_request'
CONSENT_SOURCES.ADMIN_ACTION    // 'admin_action'
CONSENT_SOURCES.WEBHOOK_BOUNCE  // 'webhook_bounce'
CONSENT_SOURCES.HYPEDIT_SIGNUP  // 'hypedit_signup'
CONSENT_SOURCES.MANUAL_IMPORT   // 'manual_import'
```

---

### 3. **Crear Constantes para Nuevos Literales**

Si necesitas un nuevo conjunto de valores literales:

1. **Crea el tipo**:
```typescript
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';
```

2. **Crea las constantes**:
```typescript
export const PAYMENT_STATUS = {
  PENDING: 'pending' as const,
  COMPLETED: 'completed' as const,
  FAILED: 'failed' as const,
  REFUNDED: 'refunded' as const,
} as const;
```

3. **Úsalas siempre**:
```typescript
if (payment.status === PAYMENT_STATUS.COMPLETED) { ... }
```

---

## 🏗️ Clean Architecture

### Estructura de Capas

```
domain/              # ⭐ Capa de Dominio (NUNCA depende de nada externo)
├── entities/        # Entidades de negocio con validación
├── repositories/    # Interfaces (Dependency Inversion)
├── services/        # Use Cases (lógica de negocio)
├── types/           # Tipos y constantes del dominio
└── value-objects/   # Value Objects inmutables

infrastructure/      # 🔧 Implementaciones externas
├── database/        # PostgreSQL, repositorios concretos
├── email/           # Proveedores de email (Resend)
└── config/          # Configuración externa

app/api/            # 🌐 API Routes (SOLO orquestación)
app/                # 📱 Páginas Next.js
components/         # 🎨 Componentes React
```

---

## 💎 SOLID Principles (OBLIGATORIO)

### **S - Single Responsibility Principle**

❌ **MAL**:
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // ❌ Validación aquí
  if (!body.email.includes('@')) throw new Error('Invalid email');

  // ❌ Lógica de negocio aquí
  const contact = await sql`SELECT * FROM contacts WHERE email = ${body.email}`;

  // ❌ Envío de email aquí
  await resend.emails.send({ ... });

  return NextResponse.json({ success: true });
}
```

✅ **BIEN**:
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  // ✅ SOLO orquestación
  const useCase = new SendEmailUseCase(contactRepo, emailProvider);
  const result = await useCase.execute(body);

  return NextResponse.json(result);
}
```

---

### **O - Open/Closed Principle**

Abierto para extensión, cerrado para modificación.

✅ **Usar interfaces**:
```typescript
class SendEmailUseCase {
  constructor(
    private emailProvider: IEmailProvider  // ✅ Interface
  ) {}
}

// Fácil agregar SendGridEmailProvider sin modificar UseCase
```

---

### **L - Liskov Substitution Principle**

Todas las implementaciones de una interfaz deben ser intercambiables.

```typescript
interface IEmailProvider {
  send(params: EmailParams): Promise<EmailResult>;
}

// ✅ ResendEmailProvider
// ✅ SendGridEmailProvider
// ✅ MockEmailProvider (testing)
// Todos funcionan igual desde el punto de vista del UseCase
```

---

### **I - Interface Segregation Principle**

No forzar dependencias de métodos no usados.

❌ **MAL**:
```typescript
interface IRepository {
  findAll(): Promise<User[]>;
  findById(id: number): Promise<User>;
  create(data: any): Promise<User>;
  update(id: number, data: any): Promise<User>;
  delete(id: number): Promise<void>;
  // ... 50 métodos más
}
```

✅ **BIEN**:
```typescript
interface IUserRepository {
  findById(id: number): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserInput): Promise<User>;
}

interface IAdminUserRepository {
  findAll(): Promise<User[]>;
  updateRole(id: number, role: UserRole): Promise<void>;
}
```

---

### **D - Dependency Inversion Principle**

Depender de abstracciones, no de implementaciones concretas.

❌ **MAL**:
```typescript
import { PostgresUserRepository } from '@/infrastructure/...';

class UpdateUserUseCase {
  constructor(private repo: PostgresUserRepository) {} // ❌ Concreto
}
```

✅ **BIEN**:
```typescript
import { IUserRepository } from '@/domain/repositories/...';

class UpdateUserUseCase {
  constructor(private repo: IUserRepository) {} // ✅ Interface
}
```

---

## 📏 Clean Code Standards

### **Funciones pequeñas (<30 líneas)**

❌ **MAL**:
```typescript
async execute(input: any): Promise<any> {
  // 200 líneas de validación, DB, lógica, logging...
}
```

✅ **BIEN**:
```typescript
async execute(input: UnsubscribeInput): Promise<UnsubscribeResult> {
  this.validateInput(input);                    // 5 líneas
  const contact = await this.findContact(input); // 3 líneas
  await this.updateContact(contact);             // 2 líneas
  await this.logConsentChange(contact, input);   // 4 líneas
  return this.buildResult(contact);              // 2 líneas
}
```

---

### **Nombres descriptivos**

❌ **MAL**:
```typescript
class Handler { ... }
function process(data: any) { ... }
const x = getUserData();
```

✅ **BIEN**:
```typescript
class UnsubscribeUseCase { ... }
function createConsentHistory(contactId: number, action: ConsentAction) { ... }
const userQuotaInfo = getUserQuotaInformation();
```

---

### **Evitar magic numbers/strings**

❌ **MAL**:
```typescript
if (token.length !== 64) { ... }
setTimeout(() => {}, 3600000);
```

✅ **BIEN**:
```typescript
const UNSUBSCRIBE_TOKEN_LENGTH = 64;
const ONE_HOUR_MS = 60 * 60 * 1000;

if (token.length !== UNSUBSCRIBE_TOKEN_LENGTH) { ... }
setTimeout(() => {}, ONE_HOUR_MS);
```

---

### **Manejo de errores explícito**

❌ **MAL**:
```typescript
try {
  const result = await useCase.execute(input);
} catch (error: any) {
  return NextResponse.json({ error: error.message }, { status: 500 });
}
```

✅ **BIEN**:
```typescript
try {
  const result = await useCase.execute(input);
  return NextResponse.json(result);
} catch (error) {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  console.error('Unexpected error:', error);
  return NextResponse.json({ error: 'Internal error' }, { status: 500 });
}
```

---

## 🚫 Anti-Patterns Prohibidos

### **1. God Objects**
```typescript
// ❌ NO hacer esto
class EmailService {
  sendEmail() { ... }
  unsubscribe() { ... }
  validateEmail() { ... }
  logEvent() { ... }
  updateDatabase() { ... }
}
```

### **2. Lógica de negocio en API routes**
```typescript
// ❌ NO hacer esto
export async function POST(request: Request) {
  const body = await request.json();

  // ❌ Validación aquí
  if (!body.email.includes('@')) { ... }

  // ❌ Queries directos aquí
  const contact = await sql`SELECT...`;
}
```

### **3. Tight Coupling**
```typescript
// ❌ NO hacer esto
import { PostgresContactRepository } from '@/infrastructure/...';

class UnsubscribeUseCase {
  private repo = new PostgresContactRepository(); // ❌ Acoplamiento directo
}
```

---

## ✅ Checklist de Code Review

Antes de hacer commit, verificar:

- [ ] **Sin literales**: ¿Usé constantes en lugar de strings literales?
- [ ] **SRP**: ¿Cada clase/función tiene UNA sola responsabilidad?
- [ ] **DIP**: ¿Dependo de interfaces, no de clases concretas?
- [ ] **Clean Code**: ¿Funciones <30 líneas? ¿Nombres descriptivos?
- [ ] **No business logic en API routes**: ¿Solo orquestación?
- [ ] **Error handling**: ¿Manejo errores explícitamente?
- [ ] **GDPR**: ¿Logeo cambios de consentimiento con IP/timestamp?
- [ ] **Sin magic values**: ¿Extraje constantes?
- [ ] **Comentarios útiles**: ¿Solo explico el "por qué", no el "qué"?

---

## 📚 Recursos

- **Ejemplos perfectos en el proyecto**:
  - `domain/services/UnsubscribeUseCase.ts`
  - `domain/entities/ConsentHistory.ts`
  - `domain/entities/User.ts`

- **Documentación**:
  - `.claude/CLAUDE.md` - Arquitectura del proyecto
  - `docs/` - Documentación técnica

---

## 🔒 Enforcement

**Estos estándares son obligatorios**. Si ves código que no los sigue:

1. **Refactorizar inmediatamente**
2. **Documentar en PR** por qué se hizo el cambio
3. **Educar al equipo** sobre el estándar violado

**Nunca hacer excepciones** a estos principios. La deuda técnica comienza con "solo esta vez".

---

*Última actualización: 2025-12-30*
*Versión: 1.0.0*
