# 🚀 DEPLOY A VERCEL - Instrucciones Finales

## ✅ Lo que ya está listo:

- ✅ Código completo pusheado a GitHub
- ✅ Template ID: **3**
- ✅ SoundCloud User ID: **1318247880**
- ✅ Listas de Brevo configuradas: **IDs 2 y 3**
- ✅ Cron configurado: **Diario 20:00 España** (19:00 UTC)
- ✅ Dashboard funcionando

---

## 📝 PASOS PARA DEPLOYAR

### PASO 1: Crear Base de Datos en Vercel (5 min)

1. Ve a tu proyecto en Vercel: https://vercel.com/oscarginette/soundcloud-brevo
2. Click en **Storage** (menú lateral)
3. **Create Database** → **Postgres**
4. Nombre: `soundcloud-automation`
5. Click **Create**
6. Una vez creada, ve a **Data** → **Query**
7. **Copia y ejecuta** este SQL:

```sql
-- Main table: tracks that have been processed
CREATE TABLE IF NOT EXISTS soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  url TEXT NOT NULL,
  published_at TIMESTAMP NOT NULL,
  email_sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_track_id ON soundcloud_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_published_at ON soundcloud_tracks(published_at DESC);

-- Execution logs table
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT NOW(),
  new_tracks INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  error TEXT,
  duration_ms INTEGER
);

-- App configuration table
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY,
  brevo_list_ids TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default config (lists 2 and 3)
INSERT INTO app_config (id, brevo_list_ids, updated_at)
VALUES (1, '[2,3]', NOW())
ON CONFLICT (id) DO NOTHING;
```

---

### PASO 2: Configurar Variables de Entorno (3 min)

Ve a **Settings** → **Environment Variables** y añade:

| Variable | Valor | Environments |
|----------|-------|--------------|
| `BREVO_API_KEY` | `[La API key que te proporcioné]` | Production, Preview, Development |
| `BREVO_TEMPLATE_ID` | `3` | Production, Preview, Development |
| `SENDER_EMAIL` | `info@geebeat.com` | Production, Preview, Development |
| `SOUNDCLOUD_USER_ID` | `1318247880` | Production, Preview, Development |
| `POSTGRES_URL` | *(Auto-generado por Vercel)* | ✅ Ya existe |

**NOTA**: `POSTGRES_URL` se crea automáticamente cuando creas la base de datos. Verifica que existe.

---

### PASO 3: Redeploy (Automático)

Al configurar las variables, Vercel redesplegará automáticamente.

1. Ve a **Deployments**
2. Espera que el último deployment esté **"Ready"** (1-2 min)

---

### PASO 4: Verificar que TODO funciona

#### A. Verificar Cron Job

1. **Settings** → **Cron Jobs**
2. Debe aparecer:
   - **Path**: `/api/check-soundcloud`
   - **Schedule**: `0 19 * * *` (19:00 UTC = 20:00 España)
   - **Status**: Active

#### B. Abrir Dashboard

URL: `https://backstage-art.vercel.app/dashboard`

Deberías ver:
- ✅ 2 listas (Lista 2 y Lista 3)
- ✅ Ambas con checkbox seleccionado
- ✅ Botones "Guardar Configuración" y "🚀 Probar Ahora"

#### C. Test Manual

1. En el dashboard, click **"🚀 Probar Ahora"**
2. Espera 5-10 segundos
3. Resultado esperado:
   - Si hay track nuevo: "✅ Email enviado: [nombre del track] a 2 lista(s)"
   - Si no hay nuevo: "No hay nuevos tracks"

#### D. Verificar Email

Si hay track nuevo:
- Los contactos en las **listas 2 y 3** de Brevo recibirán el email
- Revisa en Brevo → Logs → Transactional para ver el envío

---

## 🎯 Cómo Funciona el Sistema

```
1. CRON DIARIO (20:00 España)
   ↓
2. Fetch RSS de SoundCloud
   ↓
3. ¿Hay track nuevo?
   ├─ NO → Termina
   └─ SÍ → Continuar
   ↓
4. Lee configuración de DB (listas 2 y 3)
   ↓
5. Envía email a TODAS las listas configuradas
   ↓
6. Guarda track en DB (para no repetir)
   ↓
7. Log de ejecución
```

---

## 🔍 Monitoreo

### Ver Logs en Tiempo Real:

1. **Vercel** → **Functions** → `check-soundcloud`
2. Click **Logs**
3. Verás cada ejecución del cron

### Ver Stats en Database:

Ve a **Storage** → **Postgres** → **Data** → **Query**:

```sql
-- Último track enviado
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC LIMIT 1;

-- Últimas 10 ejecuciones
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 10;

-- Configuración actual
SELECT * FROM app_config;
```

---

## ⚙️ Cambiar Configuración

### Cambiar Listas de Destino:

**Opción A - Desde Dashboard:**
1. Ve a `https://backstage-art.vercel.app/dashboard`
2. Selecciona/deselecciona listas
3. Click "Guardar Configuración"

**Opción B - Directamente en DB:**
```sql
-- Cambiar a solo lista 2
UPDATE app_config SET brevo_list_ids = '[2]' WHERE id = 1;

-- Usar ambas listas
UPDATE app_config SET brevo_list_ids = '[2,3]' WHERE id = 1;
```

### Cambiar Horario del Cron:

Edita `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/check-soundcloud",
    "schedule": "0 19 * * *"  // 19:00 UTC = 20:00 España
  }]
}
```

Referencia: https://crontab.guru

---

## 🐛 Troubleshooting

### "Database connection error"
- Verifica que `POSTGRES_URL` existe en Environment Variables
- Verifica que las tablas fueron creadas (Paso 1)

### "No Brevo lists configured"
- Verifica que ejecutaste el SQL completo del Paso 1
- O ve al dashboard y selecciona listas manualmente

### Cron no se ejecuta
- Los cron jobs solo funcionan en **Production**
- Espera al menos 24 horas para la primera ejecución
- Usa el botón "🚀 Probar Ahora" para test manual

### Email no llega
- Verifica que las listas 2 y 3 existen en Brevo
- Verifica que tienen contactos
- Revisa spam/junk
- Ve a Brevo → Logs → Transactional para ver si se envió

---

## 📊 URLs Importantes

- **Dashboard**: https://backstage-art.vercel.app/dashboard
- **Vercel Project**: https://vercel.com/oscarginette/soundcloud-brevo
- **GitHub Repo**: https://github.com/oscarginette/soundcloud-brevo
- **Brevo Dashboard**: https://app.brevo.com

---

## ✅ Checklist Final

- [ ] Base de datos creada y SQL ejecutado
- [ ] 5 variables de entorno configuradas
- [ ] Deployment exitoso (Ready)
- [ ] Cron job visible en Settings
- [ ] Dashboard accesible
- [ ] Test manual funciona
- [ ] Configuración de listas guardada

---

## 🎉 ¡Listo!

Una vez completados todos los pasos, el sistema funcionará **100% automático**:

- ⏰ Cada día a las **20:00 (España)**
- 🎵 Revisa si hay track nuevo en SoundCloud
- 📧 Envía email a **todas las listas configuradas**
- 🤖 **Sin intervención manual nunca más**

**¿Necesitas ayuda?** Avísame cuando hayas completado los pasos y te ayudo a verificar.
