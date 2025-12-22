# 📚 Documentación - Backstage

Documentación completa del proyecto de email automation para notificaciones de SoundCloud.

---

## 🗂️ Estructura

### 🏗️ [Architecture](./architecture/)
Documentación de arquitectura, patrones de diseño y refactoring.

- **[Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md)** - Implementación completa de Clean Architecture + SOLID
- **[Refactoring Summary](./architecture/REFACTORING_SUMMARY.md)** - Resumen de todas las refactorizaciones aplicadas

### ⚙️ [Setup](./setup/)
Guías de configuración e instalación.

- **[Setup Neon](./setup/SETUP-NEON.md)** - Configuración de base de datos Neon PostgreSQL
- **[Setup Resend](./setup/SETUP-RESEND.md)** - Configuración del servicio de email Resend
- **[Deploy Vercel](./setup/DEPLOY-VERCEL.md)** - Despliegue en Vercel con cron jobs
- **[Crear API Key](./setup/CREAR-API-KEY.md)** - Generación de API keys

### ✨ [Features](./features/)
Documentación de funcionalidades implementadas.

- **[Email Template System](./features/EMAIL_TEMPLATE_SYSTEM.md)** - Sistema de templates de email
- **[Email Template Implementation](./features/EMAIL_TEMPLATE_SYSTEM_IMPLEMENTATION.md)** - Implementación detallada
- **[Unsubscribe Improvements](./features/UNSUBSCRIBE_IMPROVEMENTS.md)** - Sistema de unsubscribe con GDPR compliance
- **[Migración Postmark](./features/MIGRACION-POSTMARK.md)** - Referencia histórica de migración

### 🔌 [Integrations](./integrations/)
Integraciones con servicios externos.

- **[Hypeddit Webhook](./integrations/HYPEDDIT-WEBHOOK-GRATIS.md)** - Integración gratuita con Hypeddit
- **[Debugging Webhook](./integrations/DEBUGGING-WEBHOOK.md)** - Guía de debugging de webhooks
- **[Webhook Status](./integrations/WEBHOOK-STATUS.md)** - Estado actual de webhooks

### 🔧 [Operations](./operations/)
Documentación operacional y mantenimiento.

- **[Monitoring Queries](./operations/MONITORING_QUERIES.md)** - Queries SQL para monitoreo
- **[Manual Replicar DJ](./operations/MANUAL-REPLICAR-OTRO-DJ.md)** - Guía para replicar setup para otro DJ

---

## 🚀 Quick Start

Para empezar rápidamente:

1. Lee **[Setup Neon](./setup/SETUP-NEON.md)** para configurar la base de datos
2. Lee **[Setup Resend](./setup/SETUP-RESEND.md)** para configurar el email
3. Lee **[Deploy Vercel](./setup/DEPLOY-VERCEL.md)** para hacer el deployment
4. Revisa **[Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md)** para entender la estructura del código

---

## 📖 Documentación Adicional

### Proyecto
- **[README.md](../README.md)** - README principal del proyecto
- **[.claude/CLAUDE.md](../.claude/CLAUDE.md)** - Estándares de código SOLID + Clean Code

### Skills (Claude)
- **[Skills README](../.claude/skills/README.md)** - Skills disponibles para Claude
- **[GDPR Compliance Helper](../.claude/skills/gdpr-compliance-helper/skill.md)**
- **[Webhook Debugger](../.claude/skills/webhook-debugger/skill.md)**

---

## 🎯 Documentos por Caso de Uso

### Quiero entender la arquitectura
→ [Architecture](./architecture/)

### Quiero hacer un nuevo deployment
→ [Setup](./setup/) + [Deploy Vercel](./setup/DEPLOY-VERCEL.md)

### Quiero implementar una nueva feature
→ [Clean Architecture](./architecture/CLEAN_ARCHITECTURE.md) + [Features](./features/)

### Quiero debuggear webhooks
→ [Debugging Webhook](./integrations/DEBUGGING-WEBHOOK.md)

### Quiero monitorear el sistema
→ [Monitoring Queries](./operations/MONITORING_QUERIES.md)

### Quiero replicar esto para otro artista
→ [Manual Replicar DJ](./operations/MANUAL-REPLICAR-OTRO-DJ.md)

---

## 📊 Resumen del Sistema

**Stack**:
- Next.js 14+ (App Router)
- PostgreSQL (Neon)
- Resend (Email)
- Vercel (Hosting + Cron)

**Arquitectura**:
- Clean Architecture
- SOLID Principles
- Repository Pattern
- Use Case Pattern
- Dependency Injection

**Features**:
- Email automation para tracks de SoundCloud
- Sistema de unsubscribe GDPR-compliant
- Webhook processing (Resend, Hypeddit)
- Analytics de email
- Consent history tracking

---

**Última actualización**: 2025-12-22
