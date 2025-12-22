# 🎵 Backstage - Email Automation Platform

Email automation platform for notifying subscribers about new SoundCloud releases.

## 🚀 Setup

### 1. Variables de Entorno (Vercel)

Configura estas variables en tu proyecto de Vercel:

```env
BREVO_API_KEY=your_brevo_api_key_here
SOUNDCLOUD_USER_ID=[obtener de SoundCloud]
POSTGRES_URL=[tu connection string]
BREVO_TEMPLATE_ID=[ID del template en Brevo]
SENDER_EMAIL=info@geebeat.com
RECIPIENT_EMAILS=["email1@example.com","email2@example.com"]
```

### 2. Obtener SoundCloud User ID

1. Ve a https://soundcloud.com/geebeatmusic
2. Click en "Share" → "Embed"
3. Copia el código y busca el número después de `/users/`

### 3. Crear Template en Brevo

1. Dashboard → Transactional → Templates → New Template
2. Nombre: "Nueva Canción en SoundCloud"
3. Asunto: `🎵 Nueva canción: {{ params.track_name }}`
4. Usar estos parámetros en el template:
   - `{{ params.track_name }}`
   - `{{ params.track_url }}`
   - `{{ params.cover_image }}`
5. Guardar y copiar el Template ID

### 4. Base de Datos (PostgreSQL)

Ejecutar estas migraciones:

```sql
CREATE TABLE soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) UNIQUE,
  title VARCHAR(500),
  url TEXT,
  cover_url TEXT,
  published_at TIMESTAMP,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW(),
  tracks_found INTEGER,
  new_tracks INTEGER,
  emails_sent INTEGER,
  error TEXT,
  duration_ms INTEGER
);
```

## 📦 Stack

- Next.js 14+ (App Router)
- PostgreSQL
- Vercel (hosting + cron)
- Brevo API
- SoundCloud RSS

## 🔄 Funcionamiento

1. **Cron Job**: Se ejecuta cada 30 minutos automáticamente
2. **Check RSS**: Obtiene el último track del feed de SoundCloud
3. **Compara DB**: Verifica si ya fue procesado
4. **Envía Email**: Si es nuevo, envía notificación vía Brevo
5. **Log**: Guarda registro de ejecución en PostgreSQL

## 🎯 Endpoints

- `/api/check-soundcloud` - Endpoint del cron (automático)
- `/dashboard` - UI para ver logs y probar manualmente

## 📝 Notas

- El cron job se configura en `vercel.json`
- Los logs se pueden ver en el dashboard de Vercel
- El template de Brevo debe estar activo y aprobado

---

**Creado para**: Gee Beat  
**Website**: https://geebeat.com
