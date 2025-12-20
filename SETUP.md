# Setup Instructions - SoundCloud to Brevo Automation

## Ya Completado ✅

- ✅ Código de la API route creado en `/app/api/check-soundcloud/route.ts`
- ✅ SoundCloud User ID obtenido: **1318247880**
- ✅ Dependencias instaladas
- ✅ Cron job configurado en `vercel.json`

---

## Pasos Pendientes

### PASO 1: Crear Tablas PostgreSQL (2 min)

1. Ve a tu proyecto en Vercel
2. Ve a **Storage** → **Postgres** (o crea una nueva DB si no existe)
3. Haz click en **Query** o **Data** → **Query**
4. Copia y ejecuta este SQL:

```sql
CREATE TABLE soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  email_sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_track_id ON soundcloud_tracks(track_id);
CREATE INDEX idx_published_at ON soundcloud_tracks(published_at DESC);

CREATE TABLE execution_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW(),
  new_tracks INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER
);
```

5. Verifica que se crearon correctamente:
```sql
SELECT * FROM soundcloud_tracks;
SELECT * FROM execution_logs;
```

---

### PASO 2: Crear Template en Brevo (5 min)

1. Ve a https://app.brevo.com
2. **Campaigns** → **Transactional** → **Templates**
3. Click **Create a new template**
4. **Nombre**: `Nueva Canción SoundCloud`
5. **Subject**: `🎵 Nueva canción: {{ params.TRACK_NAME }}`
6. En el editor HTML, pega este código:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
  <h1 style="color: #ff5500; text-align: center;">🎵 Nueva Canción en SoundCloud</h1>

  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <img src="{{ params.COVER_IMAGE }}" alt="Cover" style="width: 100%; max-width: 400px; border-radius: 4px; display: block; margin: 0 auto;">
    <h2 style="margin-top: 15px; color: #333;">{{ params.TRACK_NAME }}</h2>
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{{ params.TRACK_URL }}"
       style="display: inline-block; background: #ff5500; color: white; padding: 15px 30px;
              text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">
      🎧 Escuchar Ahora
    </a>
  </div>

  <p style="color: #888; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px;">
    Notificación automática de Gee Beat Music<br>
    <a href="https://geebeat.com" style="color: #ff5500;">geebeat.com</a>
  </p>
</body>
</html>
```

7. **Guarda el template**
8. **Copia el Template ID** (número que aparece en la URL o en la lista de templates)

---

### PASO 3: Configurar Variables de Entorno en Vercel (5 min)

1. Ve a tu proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Añade estas variables (una por una):

| Variable | Value | Environment |
|----------|-------|-------------|
| `BREVO_API_KEY` | *[Tu API key de Brevo]* | Production, Preview, Development |
| `BREVO_TEMPLATE_ID` | `[ID del paso 2]` | Production, Preview, Development |
| `SENDER_EMAIL` | `info@geebeat.com` | Production, Preview, Development |
| `SOUNDCLOUD_USER_ID` | `1318247880` | Production, Preview, Development |
| `RECIPIENT_EMAILS` | `["tu@email.com"]` | Production, Preview, Development |

**Notas importantes:**
- `BREVO_TEMPLATE_ID`: Reemplaza con el ID real del template que creaste
- `RECIPIENT_EMAILS`: Cambia `tu@email.com` por el/los emails donde quieres recibir las notificaciones
  - Para múltiples emails: `["email1@example.com","email2@example.com"]`
  - Debe ser un array JSON válido
- `POSTGRES_URL`: Si usas Vercel Postgres, esta variable se crea automáticamente. Si no aparece, copia la connection string desde Storage → Postgres → Settings

4. Guarda todas las variables

---

### PASO 4: Deploy a Vercel (5 min)

#### Opción A - Push desde Git (Recomendado):

```bash
# Hacer commit de los cambios
git add .
git commit -m "Add SoundCloud to Brevo automation"
git push

# Vercel deployará automáticamente
```

#### Opción B - Deploy manual desde Vercel:

1. Ve al proyecto en Vercel
2. **Deployments** → **Redeploy**

---

### PASO 5: Verificar que Funciona (5 min)

#### A. Verificar el Cron Job:

1. En Vercel: **Settings** → **Cron Jobs**
2. Deberías ver: `/api/check-soundcloud` ejecutándose cada 30 min

#### B. Test Manual:

**Opción 1 - Desde Vercel Dashboard:**
1. **Functions** → busca `check-soundcloud`
2. Click en **Invoke** o **Test**
3. Revisa los logs en tiempo real

**Opción 2 - Desde la Terminal:**
```bash
curl https://[tu-proyecto].vercel.app/api/check-soundcloud
```

**Opción 3 - Desde el navegador:**
```
https://[tu-proyecto].vercel.app/api/check-soundcloud
```

#### C. Verificar Email:

- Si hay un track nuevo (o es la primera vez), deberías recibir un email
- Revisa la bandeja de entrada del email configurado en `RECIPIENT_EMAILS`
- Si no llega, revisa spam/junk

#### D. Verificar Logs en Database:

```sql
-- Ver tracks procesados
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC LIMIT 10;

-- Ver logs de ejecución
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 10;
```

---

## Testing Local (Opcional)

Si quieres probar localmente antes de deployar:

1. Crea `.env.local` con las mismas variables:

```env
BREVO_API_KEY=your_brevo_api_key_here
BREVO_TEMPLATE_ID=[tu template ID]
SENDER_EMAIL=info@geebeat.com
SOUNDCLOUD_USER_ID=1318247880
POSTGRES_URL=[tu connection string]
RECIPIENT_EMAILS=["tu@email.com"]
```

2. Ejecuta el dev server:

```bash
npm run dev
```

3. Llama al endpoint:

```bash
curl http://localhost:3000/api/check-soundcloud
```

---

## Troubleshooting

### "No tracks found in feed"
- Verifica que el User ID sea correcto: `1318247880`
- Prueba el RSS manualmente: https://feeds.soundcloud.com/users/soundcloud:users:1318247880/sounds.rss

### "Database connection error"
- Verifica que `POSTGRES_URL` esté configurada correctamente
- Asegúrate de que las tablas estén creadas (Paso 1)

### "Brevo API error"
- Verifica que el `BREVO_API_KEY` sea correcto
- Verifica que el `BREVO_TEMPLATE_ID` exista
- Asegúrate de que el template esté activo en Brevo

### "Email not received"
- Revisa spam/junk
- Verifica que `SENDER_EMAIL` (info@geebeat.com) esté verificado en Brevo
- Verifica los logs en Vercel para ver si hubo errores

### Cron no se ejecuta
- Verifica que `vercel.json` tenga la configuración correcta
- Los cron jobs de Vercel solo funcionan en producción (no en preview)
- Espera al menos 30 minutos desde el último deploy

---

## Monitoreo Continuo

### Ver Logs en Vercel:
1. **Dashboard** → Tu proyecto
2. **Functions** → `check-soundcloud`
3. **Logs** (tab superior)

### Ver Stats en Database:

```sql
-- Cuántos tracks procesados
SELECT COUNT(*) as total_tracks FROM soundcloud_tracks;

-- Últimos 5 tracks enviados
SELECT title, email_sent_at FROM soundcloud_tracks
ORDER BY email_sent_at DESC LIMIT 5;

-- Errores recientes
SELECT executed_at, error FROM execution_logs
WHERE error IS NOT NULL
ORDER BY executed_at DESC LIMIT 10;

-- Performance (duración promedio)
SELECT AVG(duration_ms) as avg_duration_ms FROM execution_logs;
```

---

## Próximos Pasos (Opcional)

Una vez que esto funcione, puedes añadir:

1. **Dashboard UI** - Interfaz para ver logs y stats
2. **Notificaciones en Discord/Slack** - Además del email
3. **Múltiples artistas** - Seguir varios perfiles de SoundCloud
4. **Webhook manual** - Trigger bajo demanda
5. **Retry logic** - Si Brevo falla, reintentar

---

¡Listo! Una vez completados estos 5 pasos, tu automatización estará funcionando 24/7.
