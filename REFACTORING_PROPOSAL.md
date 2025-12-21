# Propuesta de Refactoring - Clean Architecture

## Problemas Actuales

### Violaciones SOLID
1. **SRP**: Funciones hacen múltiples responsabilidades
2. **OCP**: Código rígido, difícil de extender
3. **DIP**: Acoplado a implementaciones concretas (Resend, Vercel Postgres)

### Problemas Clean Code
- Funciones demasiado largas (>100 líneas)
- Código duplicado (queries SQL, validaciones)
- Magic strings y numbers
- Error handling inconsistente
- Mezcla de lógica de negocio con infraestructura

---

## Arquitectura Propuesta

```
src/
├── domain/              # Lógica de negocio pura (sin dependencias externas)
│   ├── entities/
│   │   ├── Track.ts
│   │   ├── Contact.ts
│   │   └── EmailEvent.ts
│   ├── repositories/    # Interfaces (Dependency Inversion)
│   │   ├── ITrackRepository.ts
│   │   ├── IContactRepository.ts
│   │   └── IEmailEventRepository.ts
│   ├── services/        # Casos de uso
│   │   ├── SendTrackEmailUseCase.ts
│   │   ├── ProcessEmailEventUseCase.ts
│   │   └── GetCampaignStatsUseCase.ts
│   └── value-objects/
│       ├── Email.ts
│       └── TrackId.ts
│
├── infrastructure/      # Implementaciones concretas
│   ├── database/
│   │   ├── repositories/
│   │   │   ├── PostgresTrackRepository.ts
│   │   │   ├── PostgresContactRepository.ts
│   │   │   └── PostgresEmailEventRepository.ts
│   │   └── migrations/
│   ├── email/
│   │   ├── IEmailProvider.ts        # Interface
│   │   ├── ResendEmailProvider.ts   # Implementación
│   │   └── SendGridEmailProvider.ts # Fácil de añadir
│   └── config/
│       └── Database.ts
│
└── presentation/        # API Routes (solo orquestación)
    └── api/
        ├── send-track/
        │   └── route.ts            # <-- 20 líneas máximo
        ├── webhooks/
        │   └── resend/
        │       └── route.ts        # <-- 15 líneas máximo
        └── stats/
            └── route.ts
```

---

## Ejemplo: Refactoring de send-track/route.ts

### ANTES (177 líneas, 9 responsabilidades)
```typescript
export async function POST(request: Request) {
  // 177 líneas de código mezclando todo
}
```

### DESPUÉS (20 líneas, 1 responsabilidad: orquestación)
```typescript
// presentation/api/send-track/route.ts
import { SendTrackEmailUseCase } from '@/domain/services/SendTrackEmailUseCase';
import { trackRepository } from '@/infrastructure/database/repositories';
import { resendEmailProvider } from '@/infrastructure/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const useCase = new SendTrackEmailUseCase(
      trackRepository,
      resendEmailProvider
    );

    const result = await useCase.execute({
      trackId: body.trackId,
      title: body.title,
      url: body.url,
      coverImage: body.coverImage,
      customContent: body.customContent
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Ejemplo: Lógica de Negocio Separada

### domain/services/SendTrackEmailUseCase.ts
```typescript
export class SendTrackEmailUseCase {
  constructor(
    private trackRepository: ITrackRepository,
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private emailLogRepository: IEmailLogRepository
  ) {}

  async execute(input: SendTrackInput): Promise<SendTrackResult> {
    // 1. Validar
    this.validateInput(input);

    // 2. Verificar duplicados
    await this.checkDuplicateTrack(input.trackId);

    // 3. Obtener contactos
    const contacts = await this.contactRepository.getSubscribed();

    // 4. Enviar emails
    const results = await this.sendEmails(contacts, input);

    // 5. Guardar track
    await this.trackRepository.save(this.buildTrack(input));

    // 6. Log de ejecución
    await this.logExecution(results);

    return this.buildResult(results);
  }

  private async sendEmails(contacts, input) {
    return Promise.all(
      contacts.map(contact =>
        this.sendSingleEmail(contact, input)
      )
    );
  }

  private async sendSingleEmail(contact, input) {
    // Lógica clara y testeable
  }
}
```

---

## Ventajas del Refactoring

### 1. Testabilidad
```typescript
// ANTES: Imposible testear sin DB real
// DESPUÉS: Test con mocks
const mockRepository = new MockTrackRepository();
const mockEmailProvider = new MockEmailProvider();
const useCase = new SendTrackEmailUseCase(mockRepository, mockEmailProvider);

test('should send emails to all subscribed contacts', async () => {
  mockRepository.setContacts([...]);
  const result = await useCase.execute({...});
  expect(result.emailsSent).toBe(5);
});
```

### 2. Mantenibilidad
- Cada clase tiene UNA responsabilidad
- Funciones pequeñas (<20 líneas)
- Fácil encontrar bugs

### 3. Extensibilidad (Open/Closed)
```typescript
// Cambiar de Resend a SendGrid sin tocar lógica de negocio
const sendGridProvider = new SendGridEmailProvider();
const useCase = new SendTrackEmailUseCase(repo, sendGridProvider);
```

### 4. Reutilización
```typescript
// Usar el mismo caso de uso desde diferentes contextos
// API Route
const result = await sendTrackUseCase.execute(data);

// Cron Job
const result = await sendTrackUseCase.execute(data);

// CLI
const result = await sendTrackUseCase.execute(data);
```

---

## Plan de Migración

### Fase 1: Extraer Repositories (sin romper nada)
1. Crear interfaces `ITrackRepository`, `IContactRepository`
2. Crear `PostgresTrackRepository` que wrappea `sql`
3. Inyectar en routes existentes

### Fase 2: Extraer Use Cases
1. Mover lógica de `send-track/route.ts` a `SendTrackEmailUseCase`
2. Routes solo orquestan

### Fase 3: Extraer Email Provider
1. Crear `IEmailProvider` interface
2. Implementar `ResendEmailProvider`
3. Inyectar en use cases

### Fase 4: Value Objects y Entities
1. Crear `Email`, `TrackId` value objects
2. Crear `Track`, `Contact` entities
3. Validación en constructores

---

## Métricas de Mejora

| Métrica | Antes | Después |
|---------|-------|---------|
| Líneas por función | 177 | <20 |
| Responsabilidades por clase | 9 | 1 |
| Acoplamiento | Alto | Bajo |
| Testeable sin DB | No | Sí |
| Tiempo para añadir provider | 2h | 15min |
| Comprensión del código | Difícil | Fácil |

---

## Conclusión

El código actual **funciona**, pero **no es mantenible a largo plazo**.

A medida que el proyecto crece:
- ❌ Bugs más difíciles de encontrar
- ❌ Features más lentos de implementar
- ❌ Tests imposibles de escribir
- ❌ Onboarding de nuevos devs más lento

**Recomendación**:
- ✅ Para MVP/prototipo: Código actual es aceptable
- ✅ Para producción a largo plazo: Refactoring necesario
