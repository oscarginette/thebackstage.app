# 🎵 Plan: Download Gate con SoundCloud + Spotify

**Objetivo**: Crear una pasarela de descarga propia (estilo HyperEdit) simplificada que capture emails y requiera acciones sociales (repost SoundCloud, follow, conexión Spotify).

**Fecha**: 2025-12-22
**Arquitectura**: Clean Architecture + SOLID
**Compliance**: GDPR + CAN-SPAM

---

## 📋 Resumen Ejecutivo

### Funcionalidad Core
1. Usuario llega a página de descarga (ej: `geebeat.com/download/nueva-cancion`)
2. Se le presenta un formulario:
   - **Email + Nombre** (obligatorio)
   - **Acciones sociales** (obligatorias para desbloquear):
     - ✅ Repost en SoundCloud
     - ✅ Follow en SoundCloud
     - ✅ Conectar Spotify (opcional pero incentivado)
3. Sistema verifica que las acciones fueron completadas
4. Se desbloquea link de descarga (temporal, de un solo uso)
5. Usuario se agrega a lista de contactos para futuras campañas

### Diferencias vs HyperEdit/Hypeddit
| Feature | HyperEdit/Hypeddit | Nuestra Implementación |
|---------|-------------------|------------------------|
| Hosting | SaaS externo | Self-hosted (Vercel) |
| Costo | ~$10-20/mes | ~$0-5/mes (storage only) |
| Customización | Limitada | Total control |
| Datos | Los retienen ellos | Propiedad 100% nuestra |
| GDPR | Su responsabilidad | Nuestra responsabilidad |
| Integraciones | OAuth pre-built | Implementar desde cero |

---

## 💾 Comparación de Storage (Costos)

### Opción 1: Vercel Blob Storage
```
Pricing:
- Gratis: 500 MB
- $0.15/GB storage/month
- $2/GB transfer

Ejemplo:
- 10 tracks x 10MB = 100MB storage → GRATIS
- 1000 downloads/mes = 10GB transfer → $20/mes
```

**Pros**:
- ✅ Integración nativa con Vercel
- ✅ Fácil setup (5 minutos)
- ✅ Managed, no configuración

**Contras**:
- ❌ Costoso si tienes muchas descargas
- ❌ No hay CDN gratis

---

### Opción 2: AWS S3 + CloudFront
```
Pricing:
- S3 Storage: $0.023/GB/month
- CloudFront transfer: $0.085/GB (primeros 10TB)
- Request costs: $0.0004/1000 requests

Ejemplo:
- 10 tracks x 10MB = 100MB → $0.002/mes
- 1000 downloads/mes = 10GB transfer → $0.85/mes
- Total: ~$1/mes
```

**Pros**:
- ✅ Extremadamente barato
- ✅ CDN global incluido
- ✅ Escalable a millones de descargas

**Contras**:
- ❌ Requiere AWS account setup
- ❌ Más complejo (15-20 min setup)
- ❌ Necesitas conocimientos de IAM

---

### Opción 3: Cloudflare R2
```
Pricing:
- Storage: $0.015/GB/month
- Egress: GRATIS (0 costo de transferencia!)
- Request costs: $0.36/millón writes, $4.50/millón reads

Ejemplo:
- 10 tracks x 10MB = 100MB → $0.0015/mes
- 1000 downloads/mes = 10GB transfer → $0 (GRATIS!)
- Total: ~$0.05/mes
```

**Pros**:
- ✅ **MÁS BARATO** (casi gratis)
- ✅ Sin costos de egress (ideal para downloads)
- ✅ Compatible con S3 API
- ✅ CDN incluido

**Contras**:
- ❌ Cloudflare account requerido
- ❌ Menos maduro que S3

---

### Opción 4: SoundCloud Private Links
```
Pricing: GRATIS

Funciona generando secret tokens de SoundCloud directamente.
```

**Pros**:
- ✅ GRATIS
- ✅ No necesitas storage propio
- ✅ SoundCloud maneja bandwidth

**Contras**:
- ❌ Solo funciona para tracks ya en SoundCloud
- ❌ No funciona para stems/exclusivos
- ❌ Dependes de SoundCloud API
- ❌ Links pueden expirar

---

## 🏆 **RECOMENDACIÓN: Cloudflare R2**

**Por qué**:
1. **Costo**: ~$0.05/mes para 1000 downloads → 200x más barato que Vercel Blob
2. **Escalabilidad**: Sin costo de egress, puedes tener 100k downloads/mes por ~$0.50
3. **Simplicidad**: API compatible con S3 (fácil migrar después)
4. **CDN**: Incluido, downloads rápidos globalmente

**Fallback**: Si no quieres configurar R2, usa **SoundCloud Private Links** para MVPear gratis.

---

## 🗄️ Database Schema

### Tabla: `download_gates`
```sql
CREATE TABLE download_gates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE CASCADE,

  -- Gate config
  slug VARCHAR(255) UNIQUE NOT NULL,           -- geebeat.com/download/nueva-cancion
  title VARCHAR(500) NOT NULL,
  description TEXT,
  cover_image_url TEXT,

  -- File config
  file_url TEXT NOT NULL,                      -- Cloudflare R2 URL o SoundCloud private link
  file_size_mb DECIMAL(10,2),
  file_type VARCHAR(50),                       -- 'audio/wav', 'audio/flac', 'application/zip'

  -- Requirements
  require_email BOOLEAN DEFAULT TRUE,
  require_soundcloud_repost BOOLEAN DEFAULT FALSE,
  require_soundcloud_follow BOOLEAN DEFAULT FALSE,
  require_spotify_connect BOOLEAN DEFAULT FALSE,
  soundcloud_track_id VARCHAR(255),            -- Track ID para verificar repost
  soundcloud_user_id VARCHAR(255),             -- User ID para verificar follow

  -- Settings
  active BOOLEAN DEFAULT TRUE,
  max_downloads INTEGER,                       -- NULL = unlimited
  expires_at TIMESTAMP,

  -- Stats
  total_downloads INTEGER DEFAULT 0,
  total_views INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2),                -- downloads / views

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_download_gates_slug ON download_gates(slug);
CREATE INDEX idx_download_gates_tenant ON download_gates(tenant_id);
```

### Tabla: `download_submissions`
```sql
CREATE TABLE download_submissions (
  id SERIAL PRIMARY KEY,
  gate_id INTEGER REFERENCES download_gates(id) ON DELETE CASCADE,

  -- User data (GDPR compliant)
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),

  -- Social profiles (if connected)
  soundcloud_username VARCHAR(255),
  soundcloud_user_id VARCHAR(255),
  spotify_user_id VARCHAR(255),

  -- Verification
  email_verified BOOLEAN DEFAULT FALSE,
  soundcloud_repost_verified BOOLEAN DEFAULT FALSE,
  soundcloud_follow_verified BOOLEAN DEFAULT FALSE,
  spotify_connected BOOLEAN DEFAULT FALSE,

  -- Download tracking
  download_link_generated BOOLEAN DEFAULT FALSE,
  download_token VARCHAR(255) UNIQUE,          -- One-time use token
  download_completed BOOLEAN DEFAULT FALSE,
  download_completed_at TIMESTAMP,
  download_link_expires_at TIMESTAMP,

  -- GDPR
  ip_address VARCHAR(45),
  user_agent TEXT,
  consent_marketing BOOLEAN DEFAULT TRUE,      -- Opted-in to email list

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_submissions_gate ON download_submissions(gate_id);
CREATE INDEX idx_submissions_email ON download_submissions(email);
CREATE INDEX idx_submissions_token ON download_submissions(download_token);
```

### Tabla: `download_analytics`
```sql
CREATE TABLE download_analytics (
  id SERIAL PRIMARY KEY,
  gate_id INTEGER REFERENCES download_gates(id) ON DELETE CASCADE,

  event_type VARCHAR(50) NOT NULL,             -- 'view', 'submit', 'download'

  -- Anonymous tracking
  session_id VARCHAR(255),
  referrer TEXT,
  utm_source VARCHAR(255),
  utm_medium VARCHAR(255),
  utm_campaign VARCHAR(255),

  -- Metadata
  ip_address VARCHAR(45),
  user_agent TEXT,
  country VARCHAR(2),                          -- From IP geolocation

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_analytics_gate_event ON download_analytics(gate_id, event_type);
CREATE INDEX idx_analytics_date ON download_analytics(created_at);
```

---

## 🏗️ Architecture (Clean Architecture)

### Domain Layer
```
domain/
├── entities/
│   ├── DownloadGate.ts
│   ├── DownloadSubmission.ts
│   └── DownloadAnalytics.ts
│
├── repositories/
│   ├── IDownloadGateRepository.ts
│   ├── IDownloadSubmissionRepository.ts
│   └── IDownloadAnalyticsRepository.ts
│
├── services/
│   ├── CreateDownloadGateUseCase.ts
│   ├── SubmitDownloadFormUseCase.ts
│   ├── VerifySoundCloudRepostUseCase.ts
│   ├── VerifySoundCloudFollowUseCase.ts
│   ├── GenerateDownloadLinkUseCase.ts
│   └── TrackDownloadAnalyticsUseCase.ts
│
└── value-objects/
    ├── DownloadToken.ts
    └── GateSlug.ts
```

### Infrastructure Layer
```
infrastructure/
├── database/repositories/
│   ├── PostgresDownloadGateRepository.ts
│   ├── PostgresDownloadSubmissionRepository.ts
│   └── PostgresDownloadAnalyticsRepository.ts
│
├── storage/
│   ├── IFileStorageProvider.ts
│   ├── CloudflareR2Provider.ts
│   ├── VercelBlobProvider.ts
│   └── S3Provider.ts
│
├── oauth/
│   ├── SoundCloudOAuthProvider.ts
│   └── SpotifyOAuthProvider.ts
│
└── verification/
    ├── SoundCloudVerificationService.ts
    └── SpotifyVerificationService.ts
```

### Presentation Layer (API Routes)
```
app/
├── api/
│   ├── download-gate/
│   │   ├── [slug]/route.ts              # GET gate config
│   │   ├── submit/route.ts              # POST form submission
│   │   └── verify/route.ts              # POST verify actions
│   │
│   ├── oauth/
│   │   ├── soundcloud/callback/route.ts
│   │   └── spotify/callback/route.ts
│   │
│   └── download/
│       └── [token]/route.ts             # GET download file (one-time)
│
└── download/
    └── [slug]/page.tsx                  # Download gate UI
```

---

## 🔐 OAuth Implementations

### SoundCloud OAuth Flow

**Problema**: SoundCloud OAuth es **Authorization Code Flow** con PKCE (no soporta Client Credentials para acciones de usuario).

**Flujo**:
```
1. User clicks "Repost en SoundCloud"
2. Redirect a SoundCloud OAuth:
   https://soundcloud.com/connect?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=https://geebeat.com/api/oauth/soundcloud/callback&
     response_type=code&
     scope=non-expiring

3. User autoriza → SoundCloud redirects con ?code=XXX

4. Backend intercambia code por access_token:
   POST https://api.soundcloud.com/oauth2/token
   {
     grant_type: 'authorization_code',
     client_id: XXX,
     client_secret: XXX,
     redirect_uri: XXX,
     code: XXX
   }

5. Con access_token, verificamos:
   - GET /me (perfil del usuario)
   - GET /me/tracks/{track_id}/reposters (verificar repost)
   - GET /me/followings (verificar follow)

6. Si todo está OK → Generar download token
```

**Environment Variables**:
```env
SOUNDCLOUD_CLIENT_ID=xxx
SOUNDCLOUD_CLIENT_SECRET=xxx
SOUNDCLOUD_REDIRECT_URI=https://geebeat.com/api/oauth/soundcloud/callback
```

---

### Spotify OAuth Flow

**Flujo** (similar a SoundCloud):
```
1. User clicks "Conectar Spotify"
2. Redirect a Spotify OAuth:
   https://accounts.spotify.com/authorize?
     client_id=YOUR_CLIENT_ID&
     redirect_uri=https://geebeat.com/api/oauth/spotify/callback&
     response_type=code&
     scope=user-read-email user-follow-modify

3. User autoriza → Spotify redirects con ?code=XXX

4. Backend intercambia code por access_token

5. Con access_token:
   - GET /me (perfil)
   - PUT /me/following (auto-follow artist)

6. Marcar spotify_connected = true
```

**Environment Variables**:
```env
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=https://geebeat.com/api/oauth/spotify/callback
SPOTIFY_ARTIST_ID=xxx  # Tu Spotify Artist ID para auto-follow
```

---

## 🎨 User Flow (UI/UX)

### Página de Download Gate (`/download/nueva-cancion`)

```
┌─────────────────────────────────────────┐
│                                         │
│   🎵 Nueva Canción - Free Download     │
│                                         │
│   [Cover Image]                         │
│                                         │
│   "Descarga gratis este track          │
│    completando estos pasos:"            │
│                                         │
│   ✅ 1. Ingresa tu email                │
│      [____________] Email               │
│      [____________] Nombre              │
│                                         │
│   ⏳ 2. Haz repost en SoundCloud        │
│      [Repost en SoundCloud]  ← OAuth   │
│                                         │
│   ⏳ 3. Sígueme en SoundCloud           │
│      [Follow en SoundCloud]  ← OAuth   │
│                                         │
│   ⏳ 4. Conecta Spotify (opcional)      │
│      [Conectar Spotify]      ← OAuth   │
│                                         │
│   [ Desbloquear Descarga ] ← disabled  │
│    hasta completar pasos                │
│                                         │
└─────────────────────────────────────────┘
```

**Estados**:
- **Step 1 (Email)**: Siempre disponible
- **Step 2-3 (SoundCloud)**: Botón dispara OAuth flow
- **Step 4 (Spotify)**: Opcional, pero suma bonus (ej: descarga en mejor calidad)
- **Unlock Button**: Se habilita cuando todos los pasos requeridos están ✅

---

## 📊 Analytics Dashboard

### Métricas a Trackear

**Por Gate**:
- Total views
- Total submissions
- Total downloads
- Conversion rate (downloads / views)
- Drop-off por step:
  - Views → Email submitted
  - Email → SoundCloud repost
  - SoundCloud → Spotify connect
  - All steps → Download

**Por Fuente**:
- Tráfico por referrer (Instagram, Twitter, etc)
- Tráfico por UTM campaign
- Tráfico geográfico (top countries)

**Vista SQL** (para dashboard):
```sql
CREATE VIEW download_gate_stats AS
SELECT
  dg.id,
  dg.title,
  dg.slug,
  dg.total_views,
  dg.total_downloads,
  COUNT(DISTINCT ds.id) as total_submissions,
  ROUND(dg.total_downloads::DECIMAL / NULLIF(dg.total_views, 0) * 100, 2) as conversion_rate,
  COUNT(DISTINCT CASE WHEN ds.soundcloud_repost_verified THEN ds.id END) as soundcloud_reposts,
  COUNT(DISTINCT CASE WHEN ds.spotify_connected THEN ds.id END) as spotify_connects
FROM download_gates dg
LEFT JOIN download_submissions ds ON ds.gate_id = dg.id
WHERE dg.tenant_id = $1
GROUP BY dg.id;
```

---

## 🔒 Security & GDPR

### Security Checklist

1. **Download Tokens**:
   - ✅ One-time use (marcar como usado después de descarga)
   - ✅ Expiran en 24 horas
   - ✅ 64 caracteres random (crypto-secure)
   - ✅ Rate limit: 5 intentos por IP por hora

2. **OAuth Tokens**:
   - ✅ Stored encrypted en DB (AES-256)
   - ✅ Auto-refresh antes de expirar
   - ✅ Scoped mínimamente (solo permisos necesarios)

3. **File Access**:
   - ✅ Signed URLs (CloudflareR2 / S3)
   - ✅ Expiran en 5 minutos
   - ✅ No direct access a storage (solo via API)

### GDPR Compliance

**Consentimiento**:
```typescript
// En formulario de download
const consentText = `
Al descargar, aceptas recibir emails sobre nuevos lanzamientos.
Puedes darte de baja en cualquier momento.
`;

// Checkbox obligatorio
<input type="checkbox" required />
```

**Audit Trail**:
```typescript
await consentHistoryRepository.create({
  contactId: submission.contactId,
  action: 'subscribe',
  source: 'download_gate',
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent'),
  metadata: {
    gateId: gate.id,
    gateSlug: gate.slug
  }
});
```

**Right to Erasure**:
```typescript
// Al hacer GDPR deletion request:
// 1. Anonymize submission
UPDATE download_submissions
SET
  email = 'deleted-' || id || '@anonymized.local',
  name = NULL,
  soundcloud_username = NULL,
  spotify_user_id = NULL,
  metadata = metadata || '{"gdpr_deleted": true}'::jsonb
WHERE email = ${userEmail};

// 2. Remove from contacts
// (usar sistema existente de UnsubscribeUseCase)
```

---

## 🚀 Implementation Plan (Fases)

### Fase 1: MVP (1-2 días)
**Objetivo**: Download gate básico funcional

- [ ] Database migrations (tablas + indexes)
- [ ] Domain entities + repositories interfaces
- [ ] UseCase: `CreateDownloadGateUseCase`
- [ ] UseCase: `SubmitDownloadFormUseCase`
- [ ] UseCase: `GenerateDownloadLinkUseCase`
- [ ] UI: Landing page de download gate (solo email + download)
- [ ] API: `POST /api/download-gate/submit`
- [ ] API: `GET /api/download/[token]`
- [ ] Storage: Implementar SoundCloud Private Links (gratis, rápido)

**Resultado**: Gate funcional que captura email y permite descarga.

---

### Fase 2: SoundCloud Integration (2-3 días)
**Objetivo**: Verificar repost + follow

- [ ] SoundCloud OAuth setup (client ID + secret)
- [ ] OAuth flow: `/api/oauth/soundcloud/callback`
- [ ] UseCase: `VerifySoundCloudRepostUseCase`
- [ ] UseCase: `VerifySoundCloudFollowUseCase`
- [ ] Infrastructure: `SoundCloudVerificationService`
- [ ] UI: Botones de OAuth + estado de verificación
- [ ] Testing: E2E flow completo

**Resultado**: Usuario debe hacer repost + follow para desbloquear.

---

### Fase 3: Spotify Integration (1-2 días)
**Objetivo**: Conectar Spotify (opcional)

- [ ] Spotify OAuth setup
- [ ] OAuth flow: `/api/oauth/spotify/callback`
- [ ] Auto-follow artist en Spotify
- [ ] UI: Botón "Conectar Spotify" (bonus step)
- [ ] Testing: E2E flow

**Resultado**: Opción de conectar Spotify para bonus.

---

### Fase 4: Storage (1-2 días)
**Objetivo**: Migrar a Cloudflare R2

- [ ] Cloudflare R2 account setup
- [ ] Infrastructure: `CloudflareR2Provider`
- [ ] Signed URLs para downloads
- [ ] Upload flow para archivos
- [ ] Testing: Upload + download

**Resultado**: Files alojados en R2, downloads via signed URLs.

---

### Fase 5: Analytics (1 día)
**Objetivo**: Dashboard de métricas

- [ ] UseCase: `TrackDownloadAnalyticsUseCase`
- [ ] Analytics views (SQL)
- [ ] Dashboard UI: Gráficas de conversión
- [ ] Dashboard UI: Tabla de submissions
- [ ] Integrar con dashboard existente

**Resultado**: Dashboard para ver performance de cada gate.

---

### Fase 6: Multi-Gate Management (1 día)
**Objetivo**: Admin para crear/editar gates

- [ ] UI: Formulario "Create Download Gate"
- [ ] UI: Lista de gates activos
- [ ] UI: Editar gate settings
- [ ] UseCase: `UpdateDownloadGateUseCase`
- [ ] UseCase: `DeleteDownloadGateUseCase`

**Resultado**: Admin completo para gestionar gates.

---

## 📝 Environment Variables Necesarias

```env
# SoundCloud OAuth
SOUNDCLOUD_CLIENT_ID=xxx
SOUNDCLOUD_CLIENT_SECRET=xxx
SOUNDCLOUD_REDIRECT_URI=https://geebeat.com/api/oauth/soundcloud/callback
SOUNDCLOUD_USER_ID=1318247880  # Para verificar follow

# Spotify OAuth
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_REDIRECT_URI=https://geebeat.com/api/oauth/spotify/callback
SPOTIFY_ARTIST_ID=xxx  # Para auto-follow

# Cloudflare R2 (Storage)
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=geebeat-downloads
R2_PUBLIC_URL=https://downloads.geebeat.com

# JWT para download tokens
DOWNLOAD_TOKEN_SECRET=xxx  # Random 64-char string
```

---

## 💰 Costos Estimados (1000 downloads/mes)

| Servicio | Costo/Mes | Notas |
|----------|-----------|-------|
| **Cloudflare R2** | $0.05 | 10 tracks x 10MB |
| **Vercel Hosting** | $0 | Free tier |
| **PostgreSQL (Neon)** | $0 | Free tier |
| **SoundCloud API** | $0 | Free OAuth |
| **Spotify API** | $0 | Free OAuth |
| **Total** | **~$0.05/mes** | 🎉 |

**Escalabilidad**:
- 10k downloads/mes → $0.50/mes
- 100k downloads/mes → $5/mes
- 1M downloads/mes → $50/mes

vs HyperEdit: $20/mes flat → **40x más barato**

---

## 🎯 Próximos Pasos

1. **¿Aprobar este plan?** → Comenzar con Fase 1 (MVP)
2. **Crear SoundCloud OAuth app** → Obtener client_id/secret
3. **Crear Spotify OAuth app** → Obtener client_id/secret
4. **Setup Cloudflare R2** → O quedarnos con SoundCloud links por ahora

**Tiempo estimado total**: 8-10 días de desarrollo

---

## 📚 Referencias

- [SoundCloud OAuth Guide](https://developers.soundcloud.com/docs/api/guide#authentication)
- [Spotify OAuth Guide](https://developer.spotify.com/documentation/web-api/tutorials/code-flow)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [GDPR Consent Requirements](https://gdpr.eu/article-7-how-to-get-consent/)

---

**¿Quieres que empiece con la Fase 1 (MVP) o prefieres ajustar algo del plan primero?**
