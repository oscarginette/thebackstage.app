# 🚀 Guía de Configuración: Sistema Propio con Resend

Esta guía te muestra cómo configurar tu sistema completo de emails con Resend, eliminando la dependencia de Brevo.

## 📋 Resumen del Sistema

- **Base de datos propia**: Postgres (Neon/Vercel) para gestionar contactos
- **Emails**: Resend en lugar de Brevo
- **Webhook Hypedit**: Captura automática de contactos desde descargas
- **Unsubscribe**: Sistema propio con tokens únicos
- **Tracking**: Logs de emails enviados y estadísticas

---

## 1️⃣ Migración de Base de Datos

### Ejecutar el SQL de migración

Accede a tu dashboard de Neon o Vercel Postgres y ejecuta:

```bash
# En tu terminal, conectado a tu DB
psql $POSTGRES_URL -f sql/migration-contacts.sql
```

O copia el contenido de `sql/migration-contacts.sql` y ejecútalo en el SQL Editor de Neon.

### Verificar las tablas creadas

```sql
-- Verificar que existen las nuevas tablas
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('contacts', 'email_logs');

-- Ver estadísticas (debería mostrar 0 al inicio)
SELECT * FROM subscription_stats;
```

---

## 2️⃣ Configurar Resend

### Crear cuenta y obtener API Key

1. Ve a [resend.com](https://resend.com)
2. Sign up / Login
3. Ve a **API Keys**
4. Crea una nueva API Key
5. **Copia la key** (empieza con `re_`)

### Verificar dominio en Resend

1. Ve a **Domains** en Resend
2. Add Domain: `geebeat.com`
3. Añade los registros DNS que te proporcione Resend:

```
Tipo: TXT
Host: _resend
Value: [valor que te da Resend]
```

4. Espera 10-30 minutos y verifica

### Añadir variables de entorno

Actualiza tu `.env.local`:

```env
# Resend
RESEND_API_KEY=re_tu_api_key_aqui

# Sender (debe estar verificado en Resend)
SENDER_EMAIL=info@geebeat.com

# Base URL de tu app (para links de unsubscribe)
NEXT_PUBLIC_APP_URL=https://backstage-art.vercel.app

# Database (ya debería existir)
POSTGRES_URL=postgresql://...
```

**Importante**: También añade estas variables en **Vercel Dashboard** → Project Settings → Environment Variables

---

## 3️⃣ Configurar Webhook de Hypedit

### Opción A: Webhook directo desde Hypedit

Si Hypedit permite configurar webhooks directamente:

1. URL: `https://backstage-art.vercel.app/api/webhook/hypedit`
2. Method: `POST`
3. Headers:
   ```
   X-Webhook-Secret: tu_secreto_super_seguro_aqui
   Content-Type: application/json
   ```
4. Body (ejemplo):
   ```json
   {
     "email": "{{user_email}}",
     "name": "{{user_name}}",
     "track": "{{track_name}}",
     "country": "{{user_country}}"
   }
   ```

### Opción B: Usando Make.com

1. En Hypedit, configura que envíe datos a Make.com (si ya lo tienes)
2. En Make.com, crea un nuevo escenario:
   - **Trigger**: Webhook de Hypedit (o lo que uses actualmente)
   - **Action**: HTTP Request
     - URL: `https://backstage-art.vercel.app/api/webhook/hypedit`
     - Method: `POST`
     - Headers:
       ```json
       {
         "X-Webhook-Secret": "tu_secreto_super_seguro_aqui",
         "Content-Type": "application/json"
       }
       ```
     - Body:
       ```json
       {
         "email": "{{email}}",
         "name": "{{name}}",
         "track": "{{track}}",
         "country": "{{country}}"
       }
       ```

### Probar el webhook

```bash
# Desde tu terminal
curl -X POST https://backstage-art.vercel.app/api/webhook/hypedit \
  -H "X-Webhook-Secret: tu_secreto_super_seguro_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "track": "My Awesome Track",
    "country": "Spain"
  }'
```

Deberías recibir:
```json
{
  "success": true,
  "message": "Contact added/updated successfully",
  "contact_id": 1,
  "email": "test@example.com",
  "subscribed": true
}
```

---

## 4️⃣ Migrar Contactos de Brevo

### Exportar contactos desde Brevo

1. Ve a Brevo → **Contacts** → **Lists**
2. Selecciona tu lista
3. Click en **Export** → CSV
4. Descarga el archivo

### Importar a tu base de datos

Opción 1: **Manualmente** (si son pocos contactos)

```sql
INSERT INTO contacts (email, name, source, subscribed) VALUES
  ('email1@example.com', 'Nombre 1', 'brevo_import', true),
  ('email2@example.com', 'Nombre 2', 'brevo_import', true),
  ('email3@example.com', 'Nombre 3', 'brevo_import', true);
```

Opción 2: **Script de importación** (si son muchos)

Crea `scripts/import-brevo-contacts.js`:

```javascript
const { sql } = require('@vercel/postgres');
const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('brevo-contacts.csv')
  .pipe(csv())
  .on('data', (row) => results.push(row))
  .on('end', async () => {
    console.log(`Importando ${results.length} contactos...`);

    for (const row of results) {
      try {
        await sql`
          INSERT INTO contacts (email, name, source, subscribed)
          VALUES (
            ${row.EMAIL.toLowerCase()},
            ${row.FIRSTNAME || row.NAME || null},
            'brevo_import',
            true
          )
          ON CONFLICT (email) DO NOTHING
        `;
        console.log(`✓ ${row.EMAIL}`);
      } catch (err) {
        console.error(`✗ Error con ${row.EMAIL}:`, err.message);
      }
    }

    console.log('Importación completada');
  });
```

Ejecutar:
```bash
npm install csv-parser
node scripts/import-brevo-contacts.js
```

---

## 5️⃣ Probar el Sistema Completo

### 1. Añadir un contacto de prueba

```bash
curl -X POST https://backstage-art.vercel.app/api/webhook/hypedit \
  -H "X-Webhook-Secret: tu_secreto_super_seguro_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu@email.com",
    "name": "Tu Nombre"
  }'
```

### 2. Verificar en la base de datos

```sql
SELECT * FROM contacts WHERE email = 'tu@email.com';
```

### 3. Enviar un email de prueba

Desde tu dashboard o API:

```bash
curl -X POST https://backstage-art.vercel.app/api/send-track \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "test-123",
    "title": "Test Track",
    "url": "https://soundcloud.com/test",
    "coverImage": "https://example.com/cover.jpg"
  }'
```

### 4. Probar unsubscribe

1. Revisa el email que recibiste
2. Click en "Unsubscribe"
3. Deberías ver la página de confirmación
4. Verificar en DB:

```sql
SELECT email, subscribed, unsubscribed_at
FROM contacts
WHERE email = 'tu@email.com';
```

---

## 6️⃣ Limpiar Referencias a Brevo

Una vez que todo funcione, puedes remover Brevo:

### Remover dependencia

```bash
npm uninstall @getbrevo/brevo
```

### Actualizar .env

Comentar o remover:
```env
# BREVO_API_KEY=...
# BREVO_TEMPLATE_ID=...
```

### Remover archivos obsoletos (opcional)

```bash
rm app/api/brevo-lists/route.ts
```

---

## 📊 Ver Estadísticas

### Contactos suscritos

```sql
SELECT * FROM subscription_stats;
```

### Emails enviados por track

```sql
SELECT
  st.title,
  COUNT(el.id) as emails_sent,
  COUNT(el.id) FILTER (WHERE el.status = 'sent') as successful,
  COUNT(el.id) FILTER (WHERE el.status = 'failed') as failed
FROM soundcloud_tracks st
LEFT JOIN email_logs el ON st.track_id = el.track_id
GROUP BY st.id, st.title
ORDER BY st.created_at DESC;
```

### Últimos emails enviados

```sql
SELECT
  c.email,
  st.title,
  el.sent_at,
  el.status
FROM email_logs el
JOIN contacts c ON el.contact_id = c.id
JOIN soundcloud_tracks st ON el.track_id = st.track_id
ORDER BY el.sent_at DESC
LIMIT 50;
```

---

## ✅ Checklist Final

- [ ] Base de datos migrada (`contacts`, `email_logs` creadas)
- [ ] Resend configurado con dominio verificado
- [ ] Variables de entorno añadidas (local y Vercel)
- [ ] Webhook de Hypedit configurado y probado
- [ ] Contactos de Brevo importados
- [ ] Email de prueba enviado exitosamente
- [ ] Unsubscribe probado y funcionando
- [ ] Brevo desinstalado y limpiado

---

## 💰 Costos

### Resend Pricing
- **Free**: 3,000 emails/mes
- **Pro**: $20/mes - 50,000 emails

### Comparación con Brevo
- **Brevo**: $25/mes - 10,000 emails
- **Resend**: $0 (si envías <3,000) o $20 (si envías <50,000)

**Ahorro**: $25-60/mes ($300-720/año)

---

## 🆘 Troubleshooting

### "No hay contactos suscritos"
- Ejecuta `SELECT * FROM contacts WHERE subscribed = true`
- Importa contactos de Brevo o añade contactos de prueba

### Emails no se envían
- Verifica `RESEND_API_KEY` en Vercel
- Verifica que el dominio esté verificado en Resend
- Revisa logs: `SELECT * FROM email_logs WHERE status = 'failed'`

### "relation contacts does not exist"
- Ejecuta la migración: `sql/migration-contacts.sql`
- Verifica: `\dt` en psql para ver las tablas

---

## 🎯 Próximos Pasos Opcionales

1. **Dashboard de contactos**: Crear página admin para ver/gestionar contactos
2. **Analytics**: Dashboard con gráficos de emails enviados
3. **Segmentación**: Filtrar contactos por país, track descargado, etc.
4. **A/B Testing**: Probar diferentes subject lines
5. **Doble opt-in**: Enviar email de confirmación antes de suscribir

¿Necesitas ayuda con algo? ¡Pregunta!
