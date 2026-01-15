# Component Reuse System

## 🎯 Objetivo

**Evitar duplicación de código detectando componentes reutilizables ANTES de construir.**

Este documento establece un sistema eficiente para identificar y reutilizar componentes existentes antes de crear nuevos.

---

## 📋 Caso de Uso Real: CampaignPreviewModal & EmailContentEditor

### Problema Detectado

Dos componentes (`EmailContentEditor` y `CampaignPreviewModal`) tenían **~180 líneas de código duplicado** (19% del codebase combinado):
- Email HTML preview rendering (iframe)
- Loading spinners
- Date formatting utilities
- Campaign metadata display
- Error states
- Button patterns with loading

### Solución Aplicada

**Refactorización en 4 fases paralelas**:
1. **Phase 1**: Utilities compartidas (`/lib/date-utils.ts`)
2. **Phase 2**: UI components básicos (`LoadingSpinner`, `ErrorState`)
3. **Phase 3**: Components complejos (`EmailPreview`)
4. **Phase 4**: Domain components (`CampaignMetadata`)

**Resultado**: 0% duplicación, 5 componentes reutilizables, +250% reusabilidad.

---

## 🔍 Sistema de Detección de Reutilización

### PASO 1: Antes de Crear Cualquier Componente

**MANDATORY CHECKLIST** (ejecutar SIEMPRE):

```bash
# 1. Buscar componentes similares por nombre
find components/ -type f -name "*<keyword>*"

# Ejemplos:
find components/ -type f -name "*Loading*"
find components/ -type f -name "*Spinner*"
find components/ -type f -name "*Preview*"
find components/ -type f -name "*Modal*"
find components/ -type f -name "*Button*"
```

```bash
# 2. Buscar por patrón de código
grep -r "className.*spinner" components/
grep -r "iframe.*srcDoc" components/
grep -r "toLocaleDateString" lib/ components/
grep -r "border-t-accent animate-spin" components/
```

```bash
# 3. Revisar componentes UI existentes
ls -la components/ui/
```

```bash
# 4. Revisar utilidades existentes
ls -la lib/
```

---

### PASO 2: Análisis de Similitud

**Preguntas a hacer ANTES de escribir código**:

1. **¿Existe un componente que haga algo similar?**
   - Sí → Reutilizar o extender
   - No → Continuar al siguiente paso

2. **¿Este código existe en 2+ lugares?**
   - Sí → STOP - Extraer a componente compartido
   - No → Continuar

3. **¿Este patrón UI/lógica se repetirá en el futuro?**
   - Probablemente Sí → Crear componente reutilizable desde el inicio
   - No → OK crear inline

4. **¿Es esto una utilidad (formato, validación, cálculo)?**
   - Sí → DEBE ir en `/lib/` o `/domain/utils/`
   - No → OK como componente

---

### PASO 3: Directorio de Componentes Reutilizables

Mantener actualizado este inventario:

#### `/components/ui/` - UI Components Genéricos

| Componente | Propósito | Props Clave | Cuándo Usar |
|------------|-----------|-------------|-------------|
| **Button** | Botones con estados | `variant`, `size`, `loading`, `disabled` | Todo tipo de botones |
| **Card** | Contenedores con estilo | `variant`, `padding`, `className` | Secciones, panels, wrappers |
| **Modal** | Diálogos/overlays | `isOpen`, `onClose`, `size`, `customHeader` | Formularios, previews, confirmaciones |
| **ModalBody** | Contenido scrollable de modal | `className` | Dentro de Modal |
| **ModalFooter** | Footer fijo de modal | `children` | Botones de acción en Modal |
| **LoadingSpinner** | Indicador de carga | `size`, `message`, `centered` | Estados loading en CUALQUIER lugar |
| **ErrorState** | Display de errores | `title`, `message`, `onRetry` | Error handling con retry |
| **EmailPreview** | Preview de email HTML | `htmlContent`, `sandbox`, `height` | Cualquier vista de email |

#### `/components/dashboard/shared/` - Components de Dominio

| Componente | Propósito | Props Clave | Cuándo Usar |
|------------|-----------|-------------|-------------|
| **CampaignMetadata** | Grid de metadata | `metadata`, `visibleFields` | Mostrar info de campañas |
| **EmailContentEditor** | Editor de emails | `initialContent`, `onSave` | Crear/editar emails |
| **DraftCard** | Tarjeta de borrador | `draft`, `onEdit`, `onDelete` | Listas de borradores |

#### `/lib/` - Utilidades Compartidas

| Archivo | Funciones | Cuándo Usar |
|---------|-----------|-------------|
| **date-utils.ts** | `formatCampaignDate()`, `formatTimeAgo()`, `formatEmailDate()` | CUALQUIER formateo de fecha |
| **validation-schemas.ts** | Schemas Zod | Validación de formularios/API |
| **env.ts** | Variables de entorno tipadas | Acceso seguro a ENV vars |

---

## 🚀 Workflow Obligatorio: "Component-First Development"

### Antes de Escribir Código

```
┌─────────────────────────────────────────┐
│ 1. Necesito crear <Componente X>        │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. BUSCAR componentes similares:        │
│    • find components/ -name "*keyword*" │
│    • grep -r "pattern" components/      │
│    • Revisar /components/ui/            │
│    • Revisar /lib/                      │
└─────────────────┬───────────────────────┘
                  │
                  ▼
         ┌────────┴────────┐
         │  ¿Encontrado?   │
         └────┬────────┬───┘
              │        │
         Sí   │        │ No
              ▼        ▼
    ┌─────────────┐  ┌──────────────────┐
    │ REUTILIZAR  │  │ ¿Es reutilizable?│
    │ o EXTENDER  │  └────┬──────────┬──┘
    └─────────────┘       │          │
                     Sí   │          │ No
                          ▼          ▼
              ┌────────────────┐  ┌──────────┐
              │ CREAR SHARED   │  │ CREAR    │
              │ COMPONENT en   │  │ INLINE   │
              │ /ui/ o /shared/│  │          │
              └────────────────┘  └──────────┘
```

---

## 📐 Reglas de Decisión

### ¿Cuándo Crear un Componente Compartido?

**SIEMPRE crear componente compartido si**:
- ✅ El código existe en 2+ lugares
- ✅ Es un patrón UI común (spinner, error, modal, botón)
- ✅ Es una utilidad de formateo/validación/cálculo
- ✅ Probablemente se usará en nuevas features

**OK crear inline si**:
- ✅ Es completamente único a un contexto
- ✅ Tiene lógica de negocio muy específica
- ✅ No se repetirá en otros lugares
- ✅ Es < 20 líneas y muy simple

### ¿Dónde Colocar el Componente?

```
/components/ui/
  → UI genéricos (Button, Modal, LoadingSpinner, etc)
  → Sin lógica de negocio
  → Reutilizable en CUALQUIER contexto

/components/dashboard/shared/
  → Componentes de dominio (CampaignMetadata, DraftCard)
  → Lógica de negocio específica de dashboard
  → Reutilizable dentro del dominio

/lib/
  → Utilidades puras (date-utils, string-utils, etc)
  → Solo funciones, sin UI
  → Sin efectos secundarios

/domain/utils/
  → Utilidades de dominio (business logic helpers)
  → Funciones que operan sobre entities/value-objects
```

---

## 🛠️ Herramientas de Auditoría

### Script de Detección de Duplicación

Crear `/scripts/check-duplication.sh`:

```bash
#!/bin/bash

echo "🔍 Buscando código duplicado..."

# Patrones comunes a detectar
PATTERNS=(
  "toLocaleDateString"
  "animate-spin"
  "border-t-accent"
  "srcDoc="
  "iframe"
  "className.*spinner"
  "flex items-center justify-center"
  "text-sm text-muted-foreground"
)

for pattern in "${PATTERNS[@]}"; do
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "Patrón: $pattern"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  count=$(grep -r "$pattern" components/ --include="*.tsx" --include="*.ts" | wc -l)

  if [ "$count" -gt 1 ]; then
    echo "⚠️  DUPLICACIÓN DETECTADA ($count ocurrencias):"
    grep -r "$pattern" components/ --include="*.tsx" --include="*.ts" -n
  else
    echo "✅ No duplicación"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Auditoría completa"
```

**Uso**:
```bash
chmod +x scripts/check-duplication.sh
./scripts/check-duplication.sh
```

---

### Comando Rápido para Búsqueda Pre-Desarrollo

Añadir a tu shell (`.zshrc` o `.bashrc`):

```bash
# Buscar componentes reutilizables
function find-component() {
  echo "🔍 Buscando componentes con: $1"
  echo ""
  echo "━━━ Por nombre de archivo ━━━"
  find components/ -type f -iname "*$1*"
  echo ""
  echo "━━━ Por contenido ━━━"
  grep -r "$1" components/ --include="*.tsx" --include="*.ts" -l
  echo ""
  echo "━━━ Componentes UI disponibles ━━━"
  ls -1 components/ui/
}

# Alias
alias fc="find-component"
```

**Uso**:
```bash
fc Loading        # Encuentra LoadingSpinner, etc
fc "animate-spin" # Encuentra spinners
fc iframe         # Encuentra previews con iframe
```

---

## 📖 Proceso de Code Review

### Checklist para Reviewers

Antes de aprobar un PR, verificar:

- [ ] **¿Hay código duplicado?**
  - Ejecutar `./scripts/check-duplication.sh`
  - Si duplicación > 10 líneas → Request changes

- [ ] **¿Este componente debería ser compartido?**
  - Si se usa en 2+ lugares → Extraer a `/components/ui/` o `/shared/`

- [ ] **¿Esta utilidad debería estar en `/lib/`?**
  - Si es formateo, validación, cálculo → Debe estar en `/lib/`

- [ ] **¿Se está reinventando la rueda?**
  - Buscar en `components/ui/` y `/lib/`
  - Si existe similar → Reutilizar o extender

- [ ] **¿Sigue SOLID?**
  - Single Responsibility: ¿Hace una cosa?
  - Open/Closed: ¿Extendible sin modificar?
  - Dependency Inversion: ¿Depende de interfaces (props)?

---

## 🎓 Training: Cómo Identificar Oportunidades de Reutilización

### Señales de Alerta (Code Smells)

🚨 **STOP y refactorizar si ves**:

1. **Copy-Paste entre archivos**
   ```tsx
   // Si hiciste Cmd+C → Cmd+V de otro archivo
   // → Extraer a componente compartido
   ```

2. **Mismo patrón JSX 2+ veces**
   ```tsx
   // Archivo A:
   <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin" />

   // Archivo B:
   <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin" />

   // → Crear <LoadingSpinner />
   ```

3. **Mismas funciones de utilidad**
   ```typescript
   // Archivo A:
   const formatDate = (d) => new Date(d).toLocaleDateString(...)

   // Archivo B:
   const formatDate = (d) => new Date(d).toLocaleDateString(...)

   // → Crear /lib/date-utils.ts
   ```

4. **Componentes con >50% similitud**
   ```tsx
   // ComponentA.tsx y ComponentB.tsx tienen 80% del mismo código
   // → Extraer componente base, especializar con props
   ```

---

## 📊 Métricas de Éxito

### KPIs para Medir Reutilización

**Objetivo**: Mantener estas métricas en verde

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| % Duplicación | < 5% | 0% | 🟢 |
| Componentes en `/ui/` | > 8 | 8 | 🟢 |
| Utilidades en `/lib/` | > 3 | 3 | 🟢 |
| Líneas promedio por componente | < 100 | ~60 | 🟢 |
| Componentes reutilizados 2+ veces | > 70% | 100% | 🟢 |

**Actualizar mensualmente** después de cada refactorización.

---

## 🔄 Proceso de Refactorización Incremental

### Cuando Detectas Duplicación en Producción

**No entrar en pánico. Seguir este proceso**:

1. **Documentar la duplicación**
   ```bash
   # Crear issue en GitHub
   Title: [REFACTOR] Duplicate code in <Component A> and <Component B>
   Labels: refactoring, technical-debt
   ```

2. **Analizar con sub-agente**
   ```
   Prompt: "Analiza duplicación entre ComponentA.tsx y ComponentB.tsx.
           Identifica código duplicado y propón componentes compartidos
           siguiendo SOLID. Genera plan de refactorización."
   ```

3. **Ejecutar refactorización en fases paralelas**
   - Phase 1: Utilities (`/lib/`)
   - Phase 2: Simple UI (`LoadingSpinner`, `ErrorState`)
   - Phase 3: Complex UI (`EmailPreview`)
   - Phase 4: Domain components (`CampaignMetadata`)

4. **Validar con build + tests**
   ```bash
   npm run build
   npm run test
   npm run lint
   ```

5. **Actualizar documentación**
   - Añadir componente a tabla en este documento
   - Actualizar ejemplos de uso

---

## 📚 Ejemplos de Reutilización Exitosa

### Ejemplo 1: LoadingSpinner

**Antes (Duplicado en 3 archivos)**:
```tsx
// EmailContentEditor.tsx
<div className="flex items-center justify-center py-12">
  <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
</div>

// CampaignPreviewModal.tsx
<div className="flex flex-col items-center justify-center py-12">
  <div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin mb-4"></div>
  <p className="text-sm text-muted-foreground">Loading...</p>
</div>

// DraftsList.tsx
<div className="w-12 h-12 rounded-full border-4 border-border border-t-accent animate-spin"></div>
```

**Después (Un componente)**:
```tsx
// components/ui/LoadingSpinner.tsx
export default function LoadingSpinner({ size, message, centered }) { ... }

// Uso en 3+ lugares:
<LoadingSpinner size="lg" message="Loading..." centered />
<LoadingSpinner />
<LoadingSpinner size="md" centered />
```

**Resultado**: -45 líneas, 100% consistencia, fácil de testear

---

### Ejemplo 2: Date Formatting

**Antes (Duplicado en 5 archivos)**:
```typescript
// Archivo A
const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
  weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
})

// Archivo B
const timeAgo = (date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  // ...
}

// + 3 archivos más con variaciones
```

**Después (Una utilidad)**:
```typescript
// lib/date-utils.ts
export function formatCampaignDate(dateString: string): string { ... }
export function formatTimeAgo(date: Date): string { ... }
export function formatEmailDate(date: Date): string { ... }

// Uso en 5+ lugares:
import { formatCampaignDate, formatTimeAgo } from '@/lib/date-utils';
```

**Resultado**: -25 líneas, Single Source of Truth, fácil de testear

---

## ⚡ Quick Reference Card

**PEGAR EN TU EDITOR**:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 ANTES DE CREAR COMPONENTE/FUNCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. BUSCAR:
   find components/ -name "*<keyword>*"
   grep -r "<pattern>" components/

2. REVISAR:
   ls components/ui/      # UI components
   ls lib/                # Utilities

3. PREGUNTAR:
   ¿Existe algo similar? → Reutilizar
   ¿Se usará 2+ veces?   → Crear shared
   ¿Es utilidad pura?    → Va en /lib/

4. UBICACIÓN:
   UI genérico    → /components/ui/
   Dominio        → /components/dashboard/shared/
   Utilidad       → /lib/
   Business logic → /domain/utils/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🎯 Mantra del Desarrollador

```
┌─────────────────────────────────────────────┐
│                                             │
│  "Buscar PRIMERO, codear DESPUÉS"          │
│                                             │
│  "Si existe 2 veces, extraer a compartido" │
│                                             │
│  "Single Source of Truth siempre"          │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🔧 Integración con Claude Code

### Prompt Template para Nuevas Features

Cuando pidas a Claude crear algo, usa este template:

```
ANTES de implementar <feature>, necesito que:

1. BUSQUES componentes/utilidades similares en:
   - /components/ui/
   - /components/dashboard/shared/
   - /lib/

2. ANALICES si podemos reutilizar código existente

3. Si encuentras duplicación potencial:
   - Propón componentes compartidos
   - Sigue el sistema en .claude/COMPONENT_REUSE_SYSTEM.md

4. Implementa siguiendo SOLID + DRY

Solo después de validar (1-3), procede a implementar.
```

### Ejemplo de Uso

```
Claude, necesito crear un modal para confirmar eliminación de contactos.

ANTES de implementar, busca:
- ¿Tenemos componentes Modal reutilizables?
- ¿Hay patterns de confirmación existentes?
- ¿Botones con loading states?

Luego implementa siguiendo .claude/COMPONENT_REUSE_SYSTEM.md
```

---

## 📅 Mantenimiento

### Review Mensual

**Checklist**:
- [ ] Ejecutar `./scripts/check-duplication.sh`
- [ ] Actualizar tabla de componentes en este documento
- [ ] Revisar métricas de reutilización
- [ ] Identificar nuevos patrones para extraer
- [ ] Actualizar Quick Reference si es necesario

### Cuando Añadir Nuevo Componente Compartido

**Siempre actualizar**:
1. Tabla en este documento (sección "Directorio de Componentes")
2. JSDoc comments en el componente
3. Ejemplos de uso en este doc
4. Ejecutar `npm run build` para validar

---

## 🎓 Onboarding para Nuevos Desarrolladores

**Leer OBLIGATORIO**:
1. `.claude/CLAUDE.md` - Principios SOLID + Clean Architecture
2. `.claude/CODE_STANDARDS.md` - Estándares de código
3. **`.claude/COMPONENT_REUSE_SYSTEM.md`** (este documento)

**Ejercicio práctico**:
```
1. Buscar componentes que contengan "spinner"
2. Buscar utilidades de fecha en /lib/
3. Identificar 3 componentes reutilizables en /ui/
4. Crear un componente nuevo reutilizando 2 existentes
```

---

## 📖 Referencias

- **SOLID Principles**: `.claude/CLAUDE.md`
- **Clean Architecture**: `.claude/CLAUDE.md`
- **Code Standards**: `.claude/CODE_STANDARDS.md`
- **Caso de Uso Real**: Esta refactorización (CampaignPreviewModal + EmailContentEditor)

---

**Última actualización**: 2026-01-15
**Versión**: 1.0
**Autor**: Refactorización CampaignPreviewModal & EmailContentEditor
**Status**: ✅ Activo - Usar en TODOS los desarrollos
