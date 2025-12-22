# 🎵 Backstage - Email Automation Platform

Email automation platform for notifying subscribers about new SoundCloud releases.

> **📚 [Ver Documentación Completa](./docs/README.md)**

## 🚀 Quick Start

Para configurar el proyecto completo, sigue esta guía:

1. **[Setup Base de Datos](./docs/setup/SETUP-NEON.md)** - Configurar Neon PostgreSQL
2. **[Setup Email](./docs/setup/SETUP-RESEND.md)** - Configurar Resend
3. **[Deploy](./docs/setup/DEPLOY-VERCEL.md)** - Desplegar en Vercel

### Configuración Rápida

Configurar variables de entorno en Vercel:

```env
BREVO_API_KEY=your_brevo_api_key_here
SOUNDCLOUD_USER_ID=1318247880
POSTGRES_URL=[auto-generado por Vercel/Neon]
SENDER_EMAIL=info@geebeat.com
```

Para más detalles, ver [documentación de setup](./docs/setup/)

## 📦 Stack

- **Frontend**: Next.js 14+ (App Router)
- **Database**: PostgreSQL (Neon)
- **Email**: Resend
- **Hosting**: Vercel (con cron jobs)
- **External API**: SoundCloud RSS

## 🏗️ Arquitectura

Este proyecto sigue **Clean Architecture** y principios **SOLID**:

- **Domain Layer**: Entities, Use Cases, Repository Interfaces
- **Infrastructure Layer**: PostgreSQL, Resend, External APIs
- **Presentation Layer**: Next.js API Routes

Ver [Clean Architecture documentation](./docs/architecture/CLEAN_ARCHITECTURE.md) para más detalles.

## 🔄 Funcionamiento

1. **Cron Job**: Se ejecuta automáticamente (configurado en `vercel.json`)
2. **Check RSS**: Obtiene tracks nuevos de SoundCloud
3. **Process**: Verifica duplicados en la base de datos
4. **Send Emails**: Envía notificaciones a suscriptores
5. **Logging**: Registra todas las operaciones

## 🎯 Endpoints

- `/api/check-soundcloud` - Cron job automático
- `/api/send-track` - Envío manual de track
- `/api/webhooks/resend` - Webhook de eventos de email
- `/api/unsubscribe` - Gestión de unsubscribe
- `/dashboard` - Dashboard de administración

## 📚 Documentación

- **[Arquitectura](./docs/architecture/)** - Clean Architecture, SOLID, refactorings
- **[Setup](./docs/setup/)** - Guías de instalación y configuración
- **[Features](./docs/features/)** - Funcionalidades implementadas
- **[Integrations](./docs/integrations/)** - Webhooks y servicios externos
- **[Operations](./docs/operations/)** - Monitoreo y mantenimiento

## 🧪 Development

Para estándares de desarrollo, ver [.claude/CLAUDE.md](./.claude/CLAUDE.md).

---

**Creado para**: Gee Beat
**Website**: https://geebeat.com
**Arquitectura**: Clean Architecture + SOLID
