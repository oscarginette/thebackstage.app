# 🎯 PASOS FINALES - Lo que necesito de ti

## ✅ Completado

- ✅ Código deployado a GitHub
- ✅ SoundCloud User ID obtenido: `1318247880`
- ✅ Brevo API Key guardada (la usaremos en Vercel)
- ✅ Estructura completa lista

---

## 📝 3 Cosas que NECESITO que hagas (15 min total)

### 1️⃣ CREAR BASE DE DATOS EN VERCEL (3 min)

**Link directo**: https://vercel.com/oscarginette/soundcloud-brevo

1. Ve a tu proyecto en Vercel
2. Click en **Storage** (menú lateral izquierdo)
3. **Si NO tienes PostgreSQL todavía**:
   - Click **Create Database**
   - Selecciona **Postgres**
   - Dale un nombre: `soundcloud-automation`
   - Click **Create**
4. Una vez creada, ve a **Data** → **Query** (o botón Query)
5. **Copia y pega** TODO el contenido del archivo `sql/setup.sql`:

```sql
-- Archivo: sql/setup.sql (copialo completo)
```

6. Click **Run Query**
7. Verifica que aparezcan las tablas: `soundcloud_tracks` y `execution_logs`

---

### 2️⃣ CREAR TEMPLATE EN BREVO (5 min)

**Link directo**: https://app.brevo.com

1. Login en Brevo
2. Ve a **Campaigns** → **Transactional** → **Templates**
3. Click **Create a new template**
4. Configuración:
   - **Template name**: `Nueva Canción SoundCloud`
   - **Subject**: `🎵 Nueva canción: {{ params.TRACK_NAME }}`
5. En el editor:
   - Cambia a **HTML** (si está en drag & drop)
   - **Copia TODO el archivo** `brevo-template.html`
   - Pégalo en el editor
6. Click **Save**
7. **IMPORTANTE**: Copia el **Template ID**
   - Lo verás en la URL: `.../templates/XXXXX`
   - O en la lista de templates
   - **Ejemplo**: Si la URL es `app.brevo.com/camp/template/edit/12345`, el ID es `12345`

**🔴 DAME ESTE DATO:**
```
BREVO_TEMPLATE_ID = _________
```

---

### 3️⃣ CONFIGURAR VARIABLES EN VERCEL (7 min)

**Link directo**: https://vercel.com/oscarginette/soundcloud-brevo/settings/environment-variables

1. Ve a **Settings** → **Environment Variables**
2. Añade estas **6 variables** (una por una):

#### Variable 1:
- **Key**: `BREVO_API_KEY`
- **Value**: `[La API key que te proporcioné anteriormente]`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2:
- **Key**: `BREVO_TEMPLATE_ID`
- **Value**: `[El ID del paso 2]` ⬅️ **REEMPLAZA con el ID real**
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3:
- **Key**: `SENDER_EMAIL`
- **Value**: `info@geebeat.com`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 4:
- **Key**: `SOUNDCLOUD_USER_ID`
- **Value**: `1318247880`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 5:
- **Key**: `RECIPIENT_EMAILS`
- **Value**: `["tu@email.com"]` ⬅️ **REEMPLAZA con tu email real**
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

**Formato importante para múltiples emails:**
- 1 email: `["email@example.com"]`
- 2+ emails: `["email1@example.com","email2@example.com"]`
- **DEBE ser JSON válido** (con comillas dobles)

#### Variable 6:
- **Key**: `POSTGRES_URL`
- **Value**: ⬅️ **Ya debería existir automáticamente** (Vercel la crea al crear la DB)
- Si NO existe, cópiala desde: Storage → Postgres → Settings → Connection String

**🔴 DAME ESTE DATO:**
```
RECIPIENT_EMAILS = _________
```

---

## 🚀 Después de configurar las variables

Vercel **redesplegará automáticamente** el proyecto.

### Verificar deployment:
1. Ve a **Deployments** en Vercel
2. Espera a que el último deployment esté "✅ Ready"
3. Puede tardar 1-2 minutos

---

## ✅ TEST FINAL (2 min)

### Opción 1 - Test desde Vercel (Recomendado):

1. Ve a **Functions** en tu proyecto
2. Busca `check-soundcloud`
3. Click **Invoke** o **Test Function**
4. Ver resultado en logs

**Resultado esperado:**
- Si hay track nuevo (o primera vez): `{"success": true, "track": "nombre del track"}`
- Si no hay nuevo: `{"message": "No new tracks", ...}`

### Opción 2 - Test desde navegador:

Abre en tu navegador:
```
https://soundcloud-brevo.vercel.app/api/check-soundcloud
```

### Opción 3 - Test desde terminal:

```bash
curl https://soundcloud-brevo.vercel.app/api/check-soundcloud
```

---

## ✉️ Verificar Email

Si todo funcionó:
- Deberías recibir un email en la dirección configurada en `RECIPIENT_EMAILS`
- **Revisa spam/junk** si no lo ves en inbox
- El email tendrá el formato del template que creaste

---

## 🔍 Verificar Cron Job

1. Ve a **Settings** → **Cron Jobs** en Vercel
2. Deberías ver:
   - **Path**: `/api/check-soundcloud`
   - **Schedule**: `*/30 * * * *` (cada 30 minutos)
   - **Status**: Active

**Nota**: Los cron jobs solo funcionan en **Production**, no en preview.

---

## 📊 Verificar Base de Datos

Ve a Vercel → Storage → Postgres → Data → Query:

```sql
-- Ver tracks procesados
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC LIMIT 5;

-- Ver logs de ejecución
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 5;
```

Deberías ver al menos 1 registro en cada tabla después del test.

---

## 🆘 Troubleshooting

### "Database connection error"
- ✅ Verifica que `POSTGRES_URL` exista en las variables de entorno
- ✅ Verifica que las tablas estén creadas (paso 1)

### "Brevo API error"
- ✅ Verifica que `BREVO_API_KEY` esté correcta
- ✅ Verifica que `BREVO_TEMPLATE_ID` sea el ID correcto
- ✅ Verifica que `info@geebeat.com` esté verificado en Brevo

### No recibo email
- ✅ Revisa spam/junk
- ✅ Verifica formato de `RECIPIENT_EMAILS`: `["email@example.com"]`
- ✅ Ve a Brevo → Logs → Transactional para ver si se envió

### Cron no se ejecuta
- ✅ Debe estar en **Production** (no preview)
- ✅ Espera al menos 30 min después del deploy
- ✅ Ve a Settings → Cron Jobs para verificar

---

## 📝 Resumen de lo que NECESITO:

1. ✅ **Ejecutar SQL** en Vercel Postgres (archivo `sql/setup.sql`)
2. ✅ **Crear template** en Brevo y darme el **Template ID**
3. ✅ **Configurar 6 variables** en Vercel (especialmente `RECIPIENT_EMAILS`)
4. ✅ **Esperar deployment** (1-2 min)
5. ✅ **Hacer test** manual

---

## 🔐 Información Sensible

**⚠️ IMPORTANTE**: La `BREVO_API_KEY` que te proporcioné es sensible:

- Solo debe estar en Vercel (variables de entorno)
- **NUNCA** la subas a GitHub o la compartas públicamente
- La puedes encontrar en el mensaje anterior donde te la compartí

---

## 📞 Dame estos 2 datos cuando los tengas:

```
1. BREVO_TEMPLATE_ID = _________
2. RECIPIENT_EMAILS = _________
```

Cuando me los des, te ayudo a verificar que todo funcione correctamente! 🚀
