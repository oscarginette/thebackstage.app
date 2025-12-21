# Manual: Replicar Sistema para Otro DJ

Guía paso a paso para configurar este sistema de email marketing automatizado para otro DJ/artista de SoundCloud.

## Requisitos Previos

- [ ] Cuenta de SoundCloud del artista
- [ ] Cuenta de Resend (gratis hasta 3,000 emails/mes)
- [ ] Cuenta de Vercel (gratis)
- [ ] Cuenta de Neon Database (gratis hasta 500MB)
- [ ] Cuenta de GitHub

---

## Paso 1: Obtener ID de Usuario de SoundCloud

### Opción A: Desde la URL del perfil
1. Ir al perfil de SoundCloud del artista
2. Abrir DevTools (F12)
3. En la consola, pegar:
   ```javascript
   document.querySelector('meta[property="twitter:app:url:iphone"]').content.match(/\d+/)[0]
   ```
4. Copiar el número que aparece

### Opción B: Usando la API
1. Ir a: `https://soundcloud.com/nombre-del-artista`
2. Inspeccionar el código fuente (Ctrl+U)
3. Buscar `soundcloud://users:` seguido de números
4. Copiar esos números

**Ejemplo**: Para `https://soundcloud.com/gee_beat` → ID: `1318247880`

---

## Paso 2: Fork del Repositorio

1. Hacer fork de este repositorio en GitHub
2. Clonar el fork localmente:
   ```bash
   git clone https://github.com/TU-USUARIO/soundcloud-brevo.git
   cd soundcloud-brevo
   ```

3. Instalar dependencias:
   ```bash
   npm install
   ```

---

## Paso 3: Configurar Base de Datos (Neon)

1. Crear cuenta en [Neon](https://neon.tech)
2. Crear nuevo proyecto: `nombre-dj-emails`
3. Copiar el **Connection String** que aparece
4. Ejecutar las migraciones SQL:

### Migración 1: Tablas principales
```sql
-- Copiar y ejecutar todo el contenido de: sql/migration-contacts.sql
```

### Migración 2: Email tracking
```sql
-- Copiar y ejecutar todo el contenido de: sql/migration-email-tracking.sql
```

---

## Paso 4: Configurar Resend

1. Crear cuenta en [Resend](https://resend.com)
2. Verificar dominio (opcional pero recomendado):
   - Ir a **Domains** → **Add Domain**
   - Seguir instrucciones para agregar DNS records
   - O usar dominio compartido de Resend: `onboarding@resend.dev`

3. Obtener API Key:
   - Ir a **API Keys** → **Create API Key**
   - Copiar la key (empieza con `re_...`)

4. Habilitar tracking:
   - Ir a **Settings** → **Tracking**
   - Activar **Open Tracking** ✅
   - Activar **Click Tracking** ✅

5. Configurar webhook:
   - Ir a **Webhooks** → **Add Endpoint**
   - URL: `https://TU-PROYECTO.vercel.app/api/webhooks/resend`
   - Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`
   - Copiar el **Signing Secret** (empieza con `whsec_...`)

---

## Paso 5: Personalizar Branding

### Logo del artista
1. Subir logo horizontal (formato PNG transparente, ~800x200px) a GitHub:
   - En el repo, crear archivo en: `public/NOMBRE_ARTISTA_LOGO.png`
   - Commit y push

2. Obtener URL del logo:
   ```
   https://raw.githubusercontent.com/TU-USUARIO/TU-REPO/main/public/NOMBRE_ARTISTA_LOGO.png
   ```

3. Actualizar template de email en `emails/new-track.tsx`:
   ```typescript
   // Línea 33
   const logoUrl = 'https://raw.githubusercontent.com/TU-USUARIO/TU-REPO/main/public/NOMBRE_ARTISTA_LOGO.png';
   ```

### Personalizar contenido
1. Actualizar nombre del artista en `emails/new-track.tsx`:
   ```typescript
   // Línea 41
   const signatureLines = (customContent?.signature || 'Much love,\nNOMBRE_ARTISTA').split('\n');
   ```

2. Actualizar subject por defecto en `components/dashboard/EmailPreviewModal.tsx`:
   ```typescript
   // Línea 26
   const [subject, setSubject] = useState('New music from NOMBRE_ARTISTA');
   ```

3. Actualizar links sociales en `emails/new-track.tsx` (líneas 113-124):
   ```typescript
   <Link href="https://www.artista.com">artista.com</Link>
   <Link href="https://instagram.com/artista">Instagram</Link>
   <Link href="https://artista.bandcamp.com">Bandcamp</Link>
   ```

---

## Paso 6: Configurar Variables de Entorno

### Archivo `.env.local` (desarrollo)
```env
# Database
POSTGRES_URL="postgresql://usuario:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# SoundCloud
SOUNDCLOUD_USER_ID="ID_DEL_ARTISTA"

# Resend
RESEND_API_KEY="re_..."
SENDER_EMAIL="artista@tudominio.com"  # o usa onboarding@resend.dev
RESEND_WEBHOOK_SECRET="whsec_..."

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Webhooks (opcional - si usas Hypeddit)
HYPEDIT_WEBHOOK_SECRET="webhook_secret_2024"
```

### En Vercel (producción)
1. Ir al proyecto en Vercel
2. **Settings** → **Environment Variables**
3. Agregar cada variable de arriba con su valor
4. Cambiar `NEXT_PUBLIC_APP_URL` a tu URL de producción

---

## Paso 7: Importar Contactos Existentes (Opcional)

Si el artista ya tiene una lista de emails:

### Opción A: CSV Upload
1. Preparar CSV con formato:
   ```csv
   email,name,source
   fan1@email.com,John Doe,import
   fan2@email.com,Jane Smith,import
   ```

2. Crear endpoint temporal en `app/api/import-contacts/route.ts`:
   ```typescript
   import { sql } from '@vercel/postgres';
   import { NextResponse } from 'next/server';

   export async function POST(request: Request) {
     const { contacts } = await request.json();

     for (const contact of contacts) {
       await sql`
         INSERT INTO contacts (email, name, source, subscribed)
         VALUES (${contact.email}, ${contact.name}, ${contact.source}, true)
         ON CONFLICT (email) DO NOTHING
       `;
     }

     return NextResponse.json({ success: true });
   }
   ```

### Opción B: SQL Directo
```sql
INSERT INTO contacts (email, name, source, subscribed)
VALUES
  ('fan1@email.com', 'John Doe', 'import', true),
  ('fan2@email.com', 'Jane Smith', 'import', true)
ON CONFLICT (email) DO NOTHING;
```

---

## Paso 8: Deploy a Vercel

1. Conectar GitHub a Vercel:
   - Ir a [Vercel](https://vercel.com)
   - **Add New** → **Project**
   - Importar el repositorio fork

2. Configurar proyecto:
   - Framework: **Next.js**
   - Root Directory: `./`
   - Environment Variables: (agregar todas las del paso 6)

3. Deploy:
   - Click **Deploy**
   - Esperar ~2 minutos

4. Obtener URL final:
   - Ejemplo: `https://nombre-artista-emails.vercel.app`
   - Actualizar `NEXT_PUBLIC_APP_URL` en Vercel con esta URL

5. Redeploy para aplicar cambios:
   - **Deployments** → **...** → **Redeploy**

---

## Paso 9: Configurar Webhook de Hypeddit (Opcional)

Si el artista usa Hypeddit para capturar emails:

1. Configurar Make.com o Zapier:
   - Trigger: **Hypeddit New Download**
   - Action: **HTTP POST**
   - URL: `https://TU-PROYECTO.vercel.app/api/webhook/hypedit`
   - Headers: `x-webhook-secret: TU_SECRET`
   - Body:
     ```json
     {
       "email": "{{email}}",
       "name": "{{name}}",
       "track": "{{track_title}}",
       "country": "{{country}}"
     }
     ```

---

## Paso 10: Testing

1. Probar localmente:
   ```bash
   npm run dev
   ```
   - Abrir `http://localhost:3000/dashboard`
   - Click en "Ver Todos" para cargar tracks
   - Click en "Enviar Campaña" en un track
   - Verificar preview del email
   - ⚠️ **NO** enviar email real (consumirá créditos)

2. Probar en producción:
   - Ir a `https://TU-PROYECTO.vercel.app/dashboard`
   - Verificar que cargue tracks correctamente
   - Probar preview de email

3. Test de email real:
   - Agregar solo TU email a la DB:
     ```sql
     INSERT INTO contacts (email, name, source, subscribed)
     VALUES ('tu-email@test.com', 'Test', 'test', true);
     ```
   - Enviar campaña de prueba
   - Verificar:
     - ✅ Email recibido
     - ✅ Imágenes cargan
     - ✅ Links funcionan
     - ✅ Unsubscribe funciona

---

## Paso 11: Customización Avanzada (Opcional)

### Cambiar colores del dashboard
Archivo: `app/dashboard/page.tsx` y componentes en `components/dashboard/`

Buscar y reemplazar colores:
- `#FF5500` → Color principal del artista
- `#1c1c1c` → Color de texto
- `#FDFCF8` → Color de fondo

### Cambiar estilo del email
Archivo: `emails/new-track.tsx`

Buscar los objetos de estilo al final del archivo:
```typescript
const button = {
  backgroundColor: '#000000',  // Color del botón
  color: '#ffffff',
  // ...
};
```

---

## Mantenimiento Regular

### Semanal
- [ ] Revisar dashboard para nuevos tracks
- [ ] Verificar que emails se entreguen correctamente

### Mensual
- [ ] Revisar Analytics en Resend
- [ ] Limpiar contactos no comprometidos (opcional)
- [ ] Verificar tasa de apertura/clicks

### Cuando hay nuevo track
1. Automático: Sistema detecta nuevo track en SoundCloud
2. Manual: Ir al dashboard → Click "Enviar Campaña"
3. Editar contenido si es necesario
4. Confirmar y enviar

---

## Troubleshooting Común

### Problema: No aparecen tracks
**Solución**:
- Verificar `SOUNDCLOUD_USER_ID` en variables de entorno
- Probar RSS feed manualmente: `https://feeds.soundcloud.com/users/soundcloud:users:ID/sounds.rss`

### Problema: Emails no se envían
**Solución**:
- Verificar `RESEND_API_KEY` está configurada
- Verificar `SENDER_EMAIL` está verificado en Resend
- Revisar logs en Vercel

### Problema: Tracking no funciona
**Solución**:
- Verificar webhook configurado en Resend
- Verificar `RESEND_WEBHOOK_SECRET` coincide
- Revisar logs del webhook en Resend Dashboard

### Problema: Error de base de datos
**Solución**:
- Verificar `POSTGRES_URL` está configurada
- Verificar migraciones ejecutadas correctamente
- Revisar logs en Neon Dashboard

---

## Costos Estimados

| Servicio | Plan Gratis | Límite | Costo Pro |
|----------|-------------|--------|-----------|
| Resend | ✅ | 3,000 emails/mes | $20/mes (50k emails) |
| Vercel | ✅ | 100GB bandwidth | $20/mes (1TB) |
| Neon | ✅ | 500MB storage | $19/mes (10GB) |
| GitHub | ✅ | Repos ilimitados | - |

**Total**: $0/mes para artistas pequeños (< 3k fans)

---

## Seguridad

1. **NUNCA** commitear `.env.local` al repositorio
2. Rotar secrets cada 6 meses
3. Usar diferentes secrets para cada ambiente (dev/prod)
4. Habilitar autenticación en dashboard (próxima feature)

---

## Recursos Adicionales

- [Documentación de Resend](https://resend.com/docs)
- [Documentación de Vercel](https://vercel.com/docs)
- [Documentación de Neon](https://neon.tech/docs)
- [React Email Examples](https://react.email/examples)

---

## Soporte

Si tienes problemas:
1. Revisar logs en Vercel
2. Revisar logs en Resend
3. Consultar este manual
4. Revisar issues en GitHub

---

**Tiempo estimado de configuración**: 30-45 minutos

**Listo para producción**: ✅
