# Sistema de Templates de Email - Análisis Arquitectural

## 📋 Requisito

**Crear emails desde cero con dos opciones:**
1. Email en blanco (editor vacío)
2. Template por defecto (el actual de tracks)

**UI/UX:**
- Botón visible en el dashboard que abra el editor
- Editor que permita crear/editar contenido
- Opción de guardar como borrador o enviar

---

## 🏗️ Impacto en la Arquitectura (Clean Architecture)

### Estado Actual

```
Flujo actual (solo tracks):
SoundCloud Track → EmailPreviewModal → SendTrackEmailUseCase → Resend

Características:
- Email siempre vinculado a un track
- Template hardcoded en EmailPreviewModal
- No hay concepto de "template" o "campaña independiente"
```

### Nuevo Flujo Propuesto

```
Opción 1: Email basado en Track (existente)
Track → EmailEditor → SendTrackEmailUseCase

Opción 2: Email desde cero (NUEVO)
Botón "Crear Email" → EmailEditor (vacío/template) → SendCustomEmailUseCase → Resend
```

---

## 🎯 Cambios Necesarios por Capa

### 1. Domain Layer (Lógica de Negocio)

#### Nuevas Entidades

**`domain/entities/EmailTemplate.ts`**
```typescript
export class EmailTemplate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly subject: string,
    public readonly greeting: string,
    public readonly message: string,
    public readonly signature: string,
    public readonly type: 'track' | 'custom',  // tipo de template
    public readonly isDefault: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}
```

**`domain/entities/EmailCampaign.ts`**
```typescript
export class EmailCampaign {
  constructor(
    public readonly id: string,
    public readonly templateId: string | null,  // null = email desde cero
    public readonly trackId: string | null,     // null = no vinculado a track
    public readonly subject: string,
    public readonly htmlContent: string,
    public readonly status: 'draft' | 'sent',
    public readonly scheduledAt: Date | null,
    public readonly createdAt: Date
  ) {}
}
```

#### Nuevos Repositorios (Interfaces)

**`domain/repositories/IEmailTemplateRepository.ts`**
```typescript
export interface IEmailTemplateRepository {
  getAll(): Promise<EmailTemplate[]>;
  getById(id: string): Promise<EmailTemplate | null>;
  getDefault(): Promise<EmailTemplate | null>;
  create(template: Omit<EmailTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<EmailTemplate>;
  update(id: string, data: Partial<EmailTemplate>): Promise<EmailTemplate>;
  delete(id: string): Promise<void>;
}
```

**`domain/repositories/IEmailCampaignRepository.ts`**
```typescript
export interface IEmailCampaignRepository {
  getAll(): Promise<EmailCampaign[]>;
  getById(id: string): Promise<EmailCampaign | null>;
  getDrafts(): Promise<EmailCampaign[]>;
  create(campaign: Omit<EmailCampaign, 'id' | 'createdAt'>): Promise<EmailCampaign>;
  update(id: string, data: Partial<EmailCampaign>): Promise<EmailCampaign>;
  delete(id: string): Promise<void>;
}
```

#### Nuevos Use Cases

**`domain/services/SendCustomEmailUseCase.ts`**
```typescript
export interface SendCustomEmailInput {
  subject: string;
  greeting: string;
  message: string;
  signature: string;
  coverImage?: string;
  saveAsDraft?: boolean;
  templateId?: string;  // si se basó en un template
}

export class SendCustomEmailUseCase {
  constructor(
    private contactRepository: IContactRepository,
    private emailProvider: IEmailProvider,
    private emailLogRepository: IEmailLogRepository,
    private executionLogRepository: IExecutionLogRepository,
    private campaignRepository: IEmailCampaignRepository  // NUEVO
  ) {}

  async execute(input: SendCustomEmailInput): Promise<SendEmailResult> {
    // 1. Si es draft, guardar y retornar
    if (input.saveAsDraft) {
      const campaign = await this.campaignRepository.create({
        templateId: input.templateId || null,
        trackId: null,
        subject: input.subject,
        htmlContent: this.buildHtml(input),
        status: 'draft',
        scheduledAt: null
      });
      return { success: true, campaignId: campaign.id };
    }

    // 2. Enviar emails (similar a SendTrackEmailUseCase)
    const contacts = await this.contactRepository.getAllSubscribed();
    // ... resto de lógica de envío
  }
}
```

**`domain/services/CreateEmailTemplateUseCase.ts`**
```typescript
export class CreateEmailTemplateUseCase {
  constructor(
    private templateRepository: IEmailTemplateRepository
  ) {}

  async execute(input: {
    name: string;
    subject: string;
    greeting: string;
    message: string;
    signature: string;
    type: 'track' | 'custom';
    isDefault: boolean;
  }): Promise<EmailTemplate> {
    return await this.templateRepository.create(input);
  }
}
```

---

### 2. Infrastructure Layer (Implementaciones)

#### Nuevos Repositorios

**`infrastructure/database/repositories/PostgresEmailTemplateRepository.ts`**
```typescript
export class PostgresEmailTemplateRepository implements IEmailTemplateRepository {
  async getAll(): Promise<EmailTemplate[]> {
    const result = await sql`
      SELECT * FROM email_templates
      ORDER BY created_at DESC
    `;
    return result.rows.map(row => this.mapToEntity(row));
  }

  async getDefault(): Promise<EmailTemplate | null> {
    const result = await sql`
      SELECT * FROM email_templates
      WHERE is_default = true
      LIMIT 1
    `;
    return result.rows[0] ? this.mapToEntity(result.rows[0]) : null;
  }

  // ... resto de métodos
}
```

**`infrastructure/database/repositories/PostgresEmailCampaignRepository.ts`**
```typescript
export class PostgresEmailCampaignRepository implements IEmailCampaignRepository {
  async getDrafts(): Promise<EmailCampaign[]> {
    const result = await sql`
      SELECT * FROM email_campaigns
      WHERE status = 'draft'
      ORDER BY created_at DESC
    `;
    return result.rows.map(row => this.mapToEntity(row));
  }

  // ... resto de métodos
}
```

---

### 3. Database Schema (Migraciones)

**Nuevas tablas:**

```sql
-- Tabla de templates
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  greeting TEXT NOT NULL,
  message TEXT NOT NULL,
  signature TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('track', 'custom')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de campañas/borradores
CREATE TABLE email_campaigns (
  id SERIAL PRIMARY KEY,
  template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
  track_id VARCHAR(255) REFERENCES tracks(track_id) ON DELETE SET NULL,
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'sent')),
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Template por defecto (migración inicial)
INSERT INTO email_templates (name, subject, greeting, message, signature, type, is_default)
VALUES (
  'Default Track Template',
  'New music from Gee Beat',
  'Hey mate,',
  'This is my new track **{{trackTitle}}** and it''s now on Soundcloud!',
  'Much love,\nGee Beat',
  'track',
  true
);
```

---

### 4. Presentation Layer (UI/API)

#### Nuevos API Endpoints

**`app/api/templates/route.ts`** (GET, POST)
```typescript
// GET: Listar templates
export async function GET() {
  const useCase = new GetEmailTemplatesUseCase(templateRepository);
  const templates = await useCase.execute();
  return NextResponse.json(templates);
}

// POST: Crear template
export async function POST(request: Request) {
  const body = await request.json();
  const useCase = new CreateEmailTemplateUseCase(templateRepository);
  const template = await useCase.execute(body);
  return NextResponse.json(template);
}
```

**`app/api/templates/[id]/route.ts`** (GET, PUT, DELETE)
```typescript
// GET: Obtener template por ID
// PUT: Actualizar template
// DELETE: Eliminar template
```

**`app/api/campaigns/route.ts`** (GET, POST)
```typescript
// GET: Listar campañas/borradores
// POST: Crear campaña o borrador
```

**`app/api/campaigns/[id]/route.ts`** (GET, PUT, DELETE)
```typescript
// GET: Obtener campaña
// PUT: Actualizar o enviar borrador
// DELETE: Eliminar borrador
```

**`app/api/send-custom-email/route.ts`** (POST)
```typescript
export async function POST(request: Request) {
  const body = await request.json();

  const useCase = new SendCustomEmailUseCase(
    contactRepository,
    resendEmailProvider,
    emailLogRepository,
    executionLogRepository,
    campaignRepository
  );

  const result = await useCase.execute({
    subject: body.subject,
    greeting: body.greeting,
    message: body.message,
    signature: body.signature,
    coverImage: body.coverImage,
    saveAsDraft: body.saveAsDraft,
    templateId: body.templateId
  });

  return NextResponse.json(result);
}
```

#### Nuevos Componentes React

**`components/dashboard/CreateEmailButton.tsx`**
```typescript
export default function CreateEmailButton() {
  return (
    <button
      onClick={() => setShowEmailEditor(true)}
      className="px-6 py-3 bg-[#FF5500] text-white rounded-xl"
    >
      ✉️ Crear Nuevo Email
    </button>
  );
}
```

**`components/dashboard/EmailEditorModal.tsx`**
```typescript
interface EmailEditorModalProps {
  mode: 'blank' | 'template' | 'track';
  track?: SoundCloudTrack;
  template?: EmailTemplate;
  onClose: () => void;
}

export default function EmailEditorModal({
  mode,
  track,
  template,
  onClose
}: EmailEditorModalProps) {
  const [step, setStep] = useState<'choose' | 'edit'>('choose');

  // Paso 1: Elegir tipo (solo si mode no es 'track')
  if (step === 'choose' && mode !== 'track') {
    return (
      <TemplateChooser
        onSelectBlank={() => {/* cargar editor vacío */}}
        onSelectDefault={() => {/* cargar template por defecto */}}
        onClose={onClose}
      />
    );
  }

  // Paso 2: Editor de contenido
  return (
    <EmailContentEditor
      initialContent={getInitialContent()}
      onSave={handleSave}
      onSaveDraft={handleSaveDraft}
      onClose={onClose}
    />
  );
}
```

**`components/dashboard/TemplateChooser.tsx`**
```typescript
export default function TemplateChooser({
  onSelectBlank,
  onSelectDefault,
  onClose
}: TemplateChooserProps) {
  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Opción 1: Email en blanco */}
      <button
        onClick={onSelectBlank}
        className="p-8 border-2 border-dashed rounded-xl hover:border-[#FF5500]"
      >
        <div className="text-6xl mb-4">📝</div>
        <h3 className="font-semibold text-lg">Email en Blanco</h3>
        <p className="text-sm text-gray-500">Empieza desde cero</p>
      </button>

      {/* Opción 2: Template por defecto */}
      <button
        onClick={onSelectDefault}
        className="p-8 border-2 rounded-xl hover:border-[#FF5500]"
      >
        <div className="text-6xl mb-4">📄</div>
        <h3 className="font-semibold text-lg">Template Predeterminado</h3>
        <p className="text-sm text-gray-500">Usa el template de tracks</p>
      </button>
    </div>
  );
}
```

**`components/dashboard/DraftsList.tsx`**
```typescript
export default function DraftsList() {
  const [drafts, setDrafts] = useState<EmailCampaign[]>([]);

  useEffect(() => {
    fetch('/api/campaigns?status=draft')
      .then(res => res.json())
      .then(data => setDrafts(data));
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Borradores</h3>
      {drafts.map(draft => (
        <DraftCard
          key={draft.id}
          draft={draft}
          onEdit={() => {/* abrir editor */}}
          onDelete={() => {/* eliminar */}}
          onSend={() => {/* enviar */}}
        />
      ))}
    </div>
  );
}
```

---

## 📊 Resumen de Archivos a Crear/Modificar

### Domain Layer (9 archivos)
- ✅ **NUEVO:** `domain/entities/EmailTemplate.ts`
- ✅ **NUEVO:** `domain/entities/EmailCampaign.ts`
- ✅ **NUEVO:** `domain/repositories/IEmailTemplateRepository.ts`
- ✅ **NUEVO:** `domain/repositories/IEmailCampaignRepository.ts`
- ✅ **NUEVO:** `domain/services/SendCustomEmailUseCase.ts`
- ✅ **NUEVO:** `domain/services/CreateEmailTemplateUseCase.ts`
- ✅ **NUEVO:** `domain/services/GetEmailTemplatesUseCase.ts`
- ✅ **NUEVO:** `domain/services/SaveDraftUseCase.ts`
- ✅ **NUEVO:** `domain/services/SendDraftUseCase.ts`

### Infrastructure Layer (3 archivos)
- ✅ **NUEVO:** `infrastructure/database/repositories/PostgresEmailTemplateRepository.ts`
- ✅ **NUEVO:** `infrastructure/database/repositories/PostgresEmailCampaignRepository.ts`
- ✅ **MODIFICAR:** `infrastructure/database/repositories/index.ts` (exportar nuevos repos)

### Database (1 migración)
- ✅ **NUEVO:** `migrations/create-email-templates-and-campaigns.sql`

### API Layer (4 archivos)
- ✅ **NUEVO:** `app/api/templates/route.ts`
- ✅ **NUEVO:** `app/api/templates/[id]/route.ts`
- ✅ **NUEVO:** `app/api/campaigns/route.ts`
- ✅ **NUEVO:** `app/api/campaigns/[id]/route.ts`
- ✅ **NUEVO:** `app/api/send-custom-email/route.ts`

### UI Components (6 archivos)
- ✅ **NUEVO:** `components/dashboard/CreateEmailButton.tsx`
- ✅ **NUEVO:** `components/dashboard/EmailEditorModal.tsx`
- ✅ **NUEVO:** `components/dashboard/TemplateChooser.tsx`
- ✅ **NUEVO:** `components/dashboard/EmailContentEditor.tsx`
- ✅ **NUEVO:** `components/dashboard/DraftsList.tsx`
- ✅ **NUEVO:** `components/dashboard/DraftCard.tsx`
- ✅ **MODIFICAR:** `app/dashboard/page.tsx` (agregar botón y lista de borradores)
- ✅ **MODIFICAR:** `components/dashboard/EmailPreviewModal.tsx` (refactorizar para reusar lógica)

### Hooks (2 archivos)
- ✅ **NUEVO:** `hooks/useEmailTemplates.ts`
- ✅ **NUEVO:** `hooks/useDrafts.ts`
- ✅ **MODIFICAR:** `hooks/useDashboardData.ts` (agregar estados para templates/drafts)

---

## 🔄 Flujo de Usuario

### Escenario 1: Crear Email desde Cero

1. Usuario hace click en **"Crear Nuevo Email"**
2. Modal se abre con 2 opciones:
   - Email en Blanco
   - Template Predeterminado
3. Usuario selecciona opción
4. Editor se abre con contenido inicial (vacío o template)
5. Usuario edita:
   - Subject
   - Greeting
   - Message
   - Signature
   - (Opcional) Cover Image
6. Usuario puede:
   - **Guardar como Borrador** → Se guarda en DB, puede editar después
   - **Enviar Ahora** → Se ejecuta SendCustomEmailUseCase
7. Si envía, se muestra confirmación con estadísticas

### Escenario 2: Editar Borrador

1. Usuario ve lista de borradores en el dashboard
2. Click en "Editar" en un borrador
3. Editor se abre con contenido guardado
4. Usuario edita y guarda cambios o envía

### Escenario 3: Crear Template Personalizado (Futuro)

1. Usuario crea un email custom
2. Opción de "Guardar como Template"
3. Template queda disponible para reusar

---

## ⚠️ Consideraciones Arquitecturales

### 1. Reutilización de Código

El `EmailPreviewModal` actual puede refactorizarse en:
- `EmailContentEditor` (lógica de edición)
- `EmailPreview` (solo visualización)
- Ambos componentes reutilizables

### 2. Backward Compatibility

- El flujo existente de tracks NO cambia
- `SendTrackEmailUseCase` se mantiene igual
- Nuevos use cases son aditivos, no modifican existentes

### 3. Database Schema

- Las tablas nuevas son independientes
- No afectan tablas existentes
- Migración sin downtime

### 4. Escalabilidad

Esta arquitectura permite fácilmente:
- Agregar editor WYSIWYG (React Email, Unlayer, etc.)
- Programar envíos (scheduled_at)
- A/B testing de templates
- Personalización por contacto (merge tags)
- Analytics por template

---

## 📈 Beneficios de esta Arquitectura

✅ **Separation of Concerns**: Templates, Campaigns y Envíos están separados
✅ **Testeable**: Cada use case puede testearse independientemente
✅ **Extensible**: Fácil agregar features como scheduling, A/B testing
✅ **SOLID compliant**: Mantiene los principios de Clean Architecture
✅ **Backward compatible**: No rompe funcionalidad existente
✅ **DRY**: Reutilización de componentes de UI y lógica de envío

---

## 🚀 Plan de Implementación (Fases)

### Fase 1: Backend Foundation (2-3 horas)
1. Crear entidades y repositorios (domain + infrastructure)
2. Crear use cases básicos
3. Migración de base de datos
4. API endpoints

### Fase 2: UI Components (2-3 horas)
5. CreateEmailButton
6. EmailEditorModal con TemplateChooser
7. EmailContentEditor (refactor de EmailPreviewModal)
8. Integración en dashboard

### Fase 3: Drafts Feature (1-2 horas)
9. DraftsList y DraftCard components
10. Hooks para templates y drafts
11. Edit/Delete draft functionality

### Fase 4: Testing & Polish (1 hora)
12. Tests de use cases
13. UI polish
14. Documentación

**Total estimado: 6-9 horas**

---

## ✅ Siguiente Paso

¿Quieres que empiece con la **Fase 1** (Backend Foundation)?

1. Crear las entidades `EmailTemplate` y `EmailCampaign`
2. Crear los repositorios e implementaciones
3. Crear los use cases
4. Migración de base de datos
5. API endpoints

¿Procedemos?
