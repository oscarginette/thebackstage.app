# 🚀 Quick Start - 3 Pasos para Activar

## ✅ Ya Completado
- Código creado y commiteado
- SoundCloud User ID: `1318247880`
- API Key de Brevo lista

---

## 📝 Lo que NECESITO de ti (15 minutos)

### 1️⃣ CREAR BASE DE DATOS (2 min)

**Paso a paso:**
1. Ve a https://vercel.com → Tu proyecto
2. Click en **Storage** (menú lateral)
3. Si NO tienes una DB PostgreSQL:
   - Click **Create Database**
   - Selecciona **Postgres**
   - Click **Continue**
4. Una vez creada, click en **Query** (o Data → Query)
5. Copia TODO el contenido del archivo `sql/setup.sql`
6. Pégalo en el editor y click **Run Query**
7. Verifica que diga: "Tables created successfully"

**¿Qué hace esto?**
- Crea 2 tablas: `soundcloud_tracks` y `execution_logs`
- Son necesarias para que la API funcione

---

### 2️⃣ CREAR TEMPLATE EN BREVO (5 min)

**Paso a paso:**
1. Ve a https://app.brevo.com
2. Login con tu cuenta
3. **Campaigns** → **Transactional** → **Templates**
4. Click **Create a new template**
5. Configuración:
   - **Name**: `Nueva Canción SoundCloud`
   - **Subject**: `🎵 Nueva canción: {{ params.TRACK_NAME }}`
6. En el editor:
   - Cambia a modo **HTML** (si está en drag & drop)
   - Copia TODO el contenido de `brevo-template.html`
   - Pégalo y guarda
7. **IMPORTANTE**: Copia el **Template ID** (número que aparece)
   - Lo encontrarás en la URL o en la lista de templates
   - Ejemplo: Si la URL es `...templates/123`, el ID es `123`

**Dame este dato:**
```
BREVO_TEMPLATE_ID = _______
```

---

### 3️⃣ CONFIGURAR VARIABLES EN VERCEL (5 min)

**Paso a paso:**
1. Ve a https://vercel.com → Tu proyecto
2. **Settings** → **Environment Variables**
3. Añade estas 6 variables (click **Add** para cada una):

| Key | Value |
|-----|-------|
| `BREVO_API_KEY` | *[Tu API key de Brevo - ver dashboard]* |
| `BREVO_TEMPLATE_ID` | *[El ID del paso 2]* |
| `SENDER_EMAIL` | `info@geebeat.com` |
| `SOUNDCLOUD_USER_ID` | `1318247880` |
| `RECIPIENT_EMAILS` | *[Ver abajo]* |
| `POSTGRES_URL` | *[Auto-generado, verificar que existe]* |

**Para `RECIPIENT_EMAILS`:**
- Si es 1 email: `["tu@email.com"]`
- Si son varios: `["email1@gmail.com","email2@gmail.com"]`
- **DEBE ser JSON válido** (con comillas dobles y corchetes)

**Dame estos datos:**
```
BREVO_TEMPLATE_ID = _______
RECIPIENT_EMAILS = _______
```

**IMPORTANTE**: Selecciona **Production, Preview, Development** para todas las variables

---

## 🚀 Deploy Automático

Una vez configures las variables en Vercel, el proyecto se re-deployará automáticamente.

**Verificar:**
1. Ve a **Deployments** en Vercel
2. Espera a que el último deployment esté "Ready"
3. Click en el deployment → **Functions**
4. Busca `check-soundcloud` y verifica que existe

---

## ✅ Test Manual (2 min)

**Opción 1 - Desde Vercel:**
1. **Functions** → `check-soundcloud`
2. Click **Invoke**
3. Ver resultado en logs

**Opción 2 - Desde navegador:**
```
https://[tu-proyecto].vercel.app/api/check-soundcloud
```

**Resultado esperado:**
- Si hay un track nuevo: Recibirás email + respuesta `{"success": true, ...}`
- Si no hay nuevo: `{"message": "No new tracks", ...}`

---

## 🔍 Verificar que TODO funciona

### A. Verificar Cron Job:
1. Vercel → **Settings** → **Cron Jobs**
2. Debe aparecer: `/api/check-soundcloud` cada 30 min

### B. Verificar Email:
- Revisa tu inbox (el configurado en `RECIPIENT_EMAILS`)
- Si no llega, revisa spam

### C. Verificar Database:
En Vercel Postgres → Query:
```sql
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC LIMIT 5;
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 5;
```

---

## 🆘 Si algo falla

**Error: "Database connection failed"**
- Verifica que la variable `POSTGRES_URL` exista
- Verifica que las tablas estén creadas (paso 1)

**Error: "Brevo API error"**
- Verifica el `BREVO_API_KEY`
- Verifica el `BREVO_TEMPLATE_ID`
- Asegúrate de que info@geebeat.com esté verificado en Brevo

**No recibo email:**
- Revisa spam/junk
- Verifica que `RECIPIENT_EMAILS` tenga formato JSON correcto
- Ve a Brevo → Logs → Transactional para ver si se envió

**Cron no funciona:**
- Los cron jobs solo funcionan en **Production**
- Espera al menos 30 minutos después del deploy
- Ve a Settings → Cron Jobs para verificar que esté activo

---

## 📊 Monitoreo

**Ver logs:**
- Vercel → Functions → check-soundcloud → Logs

**Ver stats:**
```sql
-- Cuántos tracks procesados
SELECT COUNT(*) FROM soundcloud_tracks;

-- Último track enviado
SELECT title, email_sent_at FROM soundcloud_tracks
ORDER BY email_sent_at DESC LIMIT 1;
```

---

## 🎯 ¿Qué hace el sistema?

1. **Cada 30 minutos** Vercel ejecuta `/api/check-soundcloud`
2. Descarga el RSS de tu SoundCloud
3. Compara el último track con la base de datos
4. Si es nuevo → Envía email via Brevo
5. Guarda el track en la DB para no repetir
6. Registra logs de ejecución

**¡Eso es todo!** 🎉

---

## Resumen de lo que NECESITO:

1. ✅ Crear tablas en Vercel Postgres (ejecutar `sql/setup.sql`)
2. ✅ Crear template en Brevo y darme el **Template ID**
3. ✅ Configurar variables en Vercel (especialmente `RECIPIENT_EMAILS`)
4. ✅ Esperar deploy automático
5. ✅ Test manual

**Dame:**
- `BREVO_TEMPLATE_ID` = ?
- `RECIPIENT_EMAILS` = ?

Cuando me des estos datos, te ayudo a verificar que todo funciona! 🚀
