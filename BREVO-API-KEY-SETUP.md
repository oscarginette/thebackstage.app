# Configuración de API Key de Brevo

## Problema Actual

La API key actual (`BREVO_API_KEY`) solo tiene permisos para:
- ✅ Enviar emails transaccionales (funciona)
- ❌ Leer listas de contactos (error 401)

## Solución: Generar Nueva API Key

### Paso 1: Acceder a Brevo

1. Ve a https://app.brevo.com/
2. Inicia sesión con tu cuenta
3. Ve a **Settings** (Configuración) → **API Keys**

### Paso 2: Crear Nueva API Key

1. Haz clic en **"Create a new API key"**
2. Dale un nombre descriptivo, por ejemplo: `SoundCloud Automation - Full Access`

### Paso 3: Configurar Permisos

Asegúrate de que la API key tenga estos permisos marcados:

**Necesarios para la aplicación:**
- ✅ **Contacts** (Leer y escribir listas de contactos)
  - Get all your contacts
  - Get contact lists
  - Create/Update/Delete contacts

- ✅ **Transactional Emails** (Enviar emails)
  - Send transactional emails
  - Get transactional email templates

**Opcionales (recomendados):**
- ✅ **Templates** (Para ver plantillas)
- ✅ **Account** (Para información de cuenta)

### Paso 4: Guardar la API Key

1. Copia la API key generada (solo la podrás ver una vez)
2. Actualiza tu archivo `.env.local`:

```bash
BREVO_API_KEY=tu_nueva_api_key_aquí
```

3. Actualiza en Vercel:
   - Ve a tu proyecto en Vercel
   - Settings → Environment Variables
   - Edita `BREVO_API_KEY` y pega la nueva key
   - Haz redeploy del proyecto

### Paso 5: Verificar

1. Reinicia el servidor local: `npm run dev`
2. Ve a http://localhost:3002/dashboard
3. Deberías ver las listas reales de Brevo con los números correctos de suscriptores

## Verificar Permisos de API Key Actual

Para ver qué permisos tiene tu API key actual:

1. Ve a Brevo → Settings → API Keys
2. Busca la key que estás usando
3. Click en "Edit" o "View permissions"
4. Verifica que tenga acceso a **Contacts**

## Troubleshooting

### Error 401: Unauthorized
- La API key no tiene permisos de lectura de contactos
- Genera una nueva key con los permisos correctos

### Error 403: Forbidden
- La cuenta de Brevo puede tener restricciones
- Verifica tu plan de Brevo (puede requerir plan de pago para ciertos permisos)

### Las listas aparecen vacías
- Verifica que tengas listas creadas en Brevo
- Ve a Brevo → Contacts → Lists para confirmar

## Información Adicional

- **API Key antigua**: Solo tiene permisos de transactional emails
- **API Key nueva**: Debe tener permisos de Contacts + Transactional emails
- **Seguridad**: Nunca compartas tu API key en commits o públicamente
- **Rotación**: Se recomienda rotar las API keys cada 3-6 meses

## Contacto con Soporte

Si tienes problemas:
- Soporte de Brevo: https://help.brevo.com/
- Documentación de API: https://developers.brevo.com/
