# 🚀 Migración a Postmark (30 minutos)

## Costo: $10/mes (10K emails) vs $25/mes Brevo

**Ahorro anual**: $180

---

## Paso 1: Crear Cuenta Postmark (5 min)

1. https://postmarkapp.com/
2. Sign up gratis
3. Crear "Server" (proyecto)
4. Copiar API key

---

## Paso 2: Verificar Dominio (10 min)

1. Settings → Sender Signatures
2. Add Domain: `geebeat.com`
3. Copiar DNS records:

```
DKIM Record:
Host: 20230101._domainkey.geebeat.com
Value: [valor que te da Postmark]

Return-Path:
Host: pm-bounces.geebeat.com
Value: pm.mtasv.net
```

4. Añadir en tu DNS provider (Cloudflare, Namecheap, etc.)
5. Wait 10-30 min → Verify en Postmark

---

## Paso 3: Crear Template (5 min)

1. Templates → Add Template
2. Name: "Nueva Canción SoundCloud"
3. Subject: `🎵 Nueva canción: {{track_name}}`
4. HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cover { width: 100%; max-width: 400px; border-radius: 8px; }
    .button { display: inline-block; background: #ff5500; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <h1 style="color: #ff5500;">🎵 Nueva Canción en SoundCloud</h1>

  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <img src="{{cover_image}}" alt="Cover" class="cover">
    <h2 style="margin-top: 15px;">{{track_name}}</h2>
  </div>

  <a href="{{track_url}}" class="button">🎧 Escuchar Ahora</a>

  <p style="color: #666; font-size: 12px; margin-top: 40px;">
    Recibiste este email porque estás suscrito a las notificaciones de Gee Beat.
    <a href="{{unsubscribe_url}}">Cancelar suscripción</a>
  </p>
</body>
</html>
```

5. Save → Copiar Template ID

---

## Paso 4: Instalar Dependencia (1 min)

```bash
npm install postmark
```

---

## Paso 5: Actualizar Código (10 min)

### Archivo: `app/api/check-soundcloud/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';
import Parser from 'rss-parser';
import * as postmark from 'postmark';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  try {
    // 1. Parsear RSS de SoundCloud
    const parser = new Parser();
    const rssUrl = `https://feeds.soundcloud.com/users/soundcloud:users:${process.env.SOUNDCLOUD_USER_ID}/sounds.rss`;
    const feed = await parser.parseURL(rssUrl);

    if (!feed.items || feed.items.length === 0) {
      return NextResponse.json({ message: 'No tracks found in feed' });
    }

    const latestTrack = feed.items[0];

    // 2. Verificar si ya existe en DB
    const trackId = latestTrack.guid || latestTrack.link;

    if (!trackId) {
      throw new Error('Track ID not found in RSS feed');
    }

    const existing = await sql`
      SELECT * FROM soundcloud_tracks WHERE track_id = ${trackId}
    `;

    if (existing.rows.length > 0) {
      return NextResponse.json({
        message: 'No new tracks',
        lastTrack: latestTrack.title
      });
    }

    // 3. Obtener contactos de la lista configurada
    const configResult = await sql`
      SELECT brevo_list_ids FROM app_config WHERE id = 1
    `;

    let listIds: number[] = [];
    if (configResult.rows.length > 0 && configResult.rows[0].brevo_list_ids) {
      const rawListIds = configResult.rows[0].brevo_list_ids;
      listIds = Array.isArray(rawListIds) ? rawListIds : JSON.parse(rawListIds);
    }

    if (listIds.length === 0) {
      throw new Error('No lists configured');
    }

    // 4. Obtener emails de la lista
    // NOTA: Necesitas tener los emails en tu DB, Postmark no gestiona listas
    const contacts = await sql`
      SELECT email FROM contacts WHERE list_id = ANY(${listIds})
    `;

    if (contacts.rows.length === 0) {
      throw new Error('No contacts in selected lists');
    }

    // 5. Enviar emails via Postmark
    const client = new postmark.ServerClient(process.env.POSTMARK_API_KEY!);

    const emailPromises = contacts.rows.map(contact =>
      client.sendEmailWithTemplate({
        From: `Gee Beat <${process.env.SENDER_EMAIL}>`,
        To: contact.email,
        TemplateId: Number(process.env.POSTMARK_TEMPLATE_ID),
        TemplateModel: {
          track_name: latestTrack.title || 'Sin título',
          track_url: latestTrack.link || '',
          cover_image: latestTrack.itunes?.image || latestTrack.enclosure?.url || '',
          unsubscribe_url: `https://yourdomain.com/unsubscribe?email=${contact.email}`
        }
      })
    );

    const results = await Promise.all(emailPromises);

    // 6. Guardar en DB
    const publishedDate = latestTrack.pubDate
      ? new Date(latestTrack.pubDate).toISOString()
      : new Date().toISOString();

    await sql`
      INSERT INTO soundcloud_tracks (track_id, title, url, published_at)
      VALUES (
        ${trackId},
        ${latestTrack.title || 'Sin título'},
        ${latestTrack.link || ''},
        ${publishedDate}
      )
    `;

    // 7. Log de ejecución
    await sql`
      INSERT INTO execution_logs (new_tracks, emails_sent, duration_ms)
      VALUES (1, ${results.length}, ${Date.now() - startTime})
    `;

    return NextResponse.json({
      success: true,
      track: latestTrack.title,
      emailsSent: results.length,
      messageIds: results.map(r => r.MessageID)
    });

  } catch (error: any) {
    console.error('Error in check-soundcloud:', error);

    try {
      await sql`
        INSERT INTO execution_logs (error, duration_ms)
        VALUES (${error.message}, ${Date.now() - startTime})
      `;
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

---

## Paso 6: Crear Tabla de Contacts (NUEVO)

```sql
-- En Neon PostgreSQL
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  list_id INTEGER NOT NULL,
  subscribed BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  unsubscribed_at TIMESTAMP
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_list_id ON contacts(list_id);

-- Insertar tus contactos existentes de Brevo
-- Opción 1: Export CSV de Brevo e importar
-- Opción 2: Manualmente para pruebas
INSERT INTO contacts (email, name, list_id) VALUES
  ('tu@email.com', 'Tu Nombre', 5);
```

---

## Paso 7: Variables de Entorno

Actualiza `.env.local`:

```env
# Comentar/remover Brevo
# BREVO_API_KEY=...
# BREVO_TEMPLATE_ID=3

# Añadir Postmark
POSTMARK_API_KEY=tu_api_key_aqui
POSTMARK_TEMPLATE_ID=123456

# Mantener el resto
SENDER_EMAIL=info@geebeat.com
SOUNDCLOUD_USER_ID=1318247880
POSTGRES_URL=postgresql://...
```

---

## Paso 8: Probar

```bash
# Reiniciar servidor
pkill -f "next dev" && npm run dev

# Probar endpoint
curl http://localhost:3000/api/check-soundcloud
```

---

## ✅ Ventajas de Postmark sobre Brevo

1. **$15/mes más barato** ($10 vs $25)
2. **Mejor deliverability** (98%+ inbox rate)
3. **API más simple** (menos código)
4. **Analytics mejores** (dashboard más claro)
5. **Soporte premium** (responden en minutos)

## ⚠️ Desventajas

1. **No tiene gestión de listas** - Debes usar tu DB
2. **Solo transactional** - No sirve para newsletters marketing
3. **Necesitas crear tabla contacts** - Más setup inicial

---

## 🔄 Importar Contactos de Brevo

### Opción 1: Export CSV

1. Brevo → Contacts → Lists
2. Select tu lista
3. Export → CSV
4. Upload a tu DB:

```javascript
// scripts/import-contacts.js
const csv = require('csv-parser');
const fs = require('fs');

fs.createReadStream('brevo-contacts.csv')
  .pipe(csv())
  .on('data', async (row) => {
    await sql`
      INSERT INTO contacts (email, name, list_id)
      VALUES (${row.email}, ${row.name || ''}, 5)
      ON CONFLICT (email) DO NOTHING
    `;
  });
```

### Opción 2: API de Brevo

```javascript
// Una sola vez: export contacts via Brevo API
const brevo = require('@getbrevo/brevo');
const api = new brevo.ContactsApi();
api.setApiKey(brevo.ContactsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const lists = await api.getContactsFromList(5, { limit: 1000 });
for (const contact of lists.body.contacts) {
  await sql`
    INSERT INTO contacts (email, name, list_id)
    VALUES (${contact.email}, ${contact.attributes?.FIRSTNAME || ''}, 5)
    ON CONFLICT (email) DO NOTHING
  `;
}
```

---

## 📊 Tracking & Analytics

Postmark dashboard te da automáticamente:

- ✅ Emails sent
- ✅ Delivery rate
- ✅ Open rate (con pixel tracking)
- ✅ Click rate (con link tracking)
- ✅ Bounce rate
- ✅ Spam complaints

No necesitas construir nada!

---

## 🎯 Resumen

**Tiempo total**: 30-45 minutos
**Ahorro**: $180/año
**Deliverability**: Mejor que Brevo
**Código**: Más simple y limpio

¿Migramos ahora? 🚀
