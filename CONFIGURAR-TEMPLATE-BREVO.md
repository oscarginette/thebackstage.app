# 🎨 Cómo Configurar las Variables en la Plantilla de Brevo

## ✅ Estado Actual

Ya recibiste el email, pero aparece **vacío** o sin los datos del track porque:

- ✅ El código YA envía las variables correctamente
- ❌ La plantilla de Brevo NO tiene configuradas esas variables

## 📋 Variables que Envía el Sistema

El código envía automáticamente estas 3 variables:

```javascript
{
  TRACK_NAME: "Kamiel, Gee Beat - Love Songs",
  TRACK_URL: "https://soundcloud.com/...",
  COVER_IMAGE: "https://i1.sndcdn.com/..."
}
```

**Ubicación en código**:
- `app/api/send-track/route.ts:91-95`
- `app/api/check-soundcloud/route.ts:78-81`

---

## 🎯 Cómo Configurar la Plantilla (Template ID: 3)

### Paso 1: Abrir el Editor de Plantilla

1. Ve a: https://app.brevo.com/camp/lists/template
2. Busca tu plantilla **ID: 3** (probablemente se llama algo como "New Track Notification")
3. Click en **"Edit"** o **"Editar"**

### Paso 2: Insertar Variables en el HTML

En el editor de Brevo, usa estas variables en tu HTML:

#### Opción A: Drag & Drop Editor

Si usas el editor visual de Brevo:

1. **Título del Track**:
   - Agrega un bloque de texto
   - Click en "Insert personalization" o "{{ }}"
   - Escribe: `{{ params.TRACK_NAME }}`

2. **URL del Track (Botón)**:
   - Agrega un botón
   - En el campo URL del botón, escribe: `{{ params.TRACK_URL }}`
   - Texto del botón: "Escuchar en SoundCloud" o similar

3. **Imagen de Portada**:
   - Agrega un bloque de imagen
   - En el campo URL de la imagen, escribe: `{{ params.COVER_IMAGE }}`

#### Opción B: Editor HTML

Si editas el HTML directamente:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Nuevo Track en SoundCloud</title>
</head>
<body>
  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">

    <!-- Portada del Track -->
    <div style="text-align: center; margin-bottom: 20px;">
      <img src="{{ params.COVER_IMAGE }}"
           alt="Cover"
           style="max-width: 100%; height: auto; border-radius: 8px;">
    </div>

    <!-- Título -->
    <h1 style="color: #333; text-align: center;">
      🎵 Nuevo Track Publicado
    </h1>

    <!-- Nombre del Track -->
    <h2 style="color: #FF5500; text-align: center;">
      {{ params.TRACK_NAME }}
    </h2>

    <!-- Botón de Escuchar -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{ params.TRACK_URL }}"
         style="background-color: #FF5500;
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;">
        🎧 Escuchar en SoundCloud
      </a>
    </div>

    <!-- Footer -->
    <p style="color: #999; text-align: center; font-size: 12px; margin-top: 40px;">
      Este email fue enviado automáticamente porque publicaste un nuevo track.
    </p>

  </div>
</body>
</html>
```

### Paso 3: Vista Previa (Preview)

Antes de guardar, usa la función **"Preview"** de Brevo:

1. Click en "Preview" o "Vista previa"
2. En el campo de test params, pega:
   ```json
   {
     "TRACK_NAME": "Test Track - Artist Name",
     "TRACK_URL": "https://soundcloud.com/test",
     "COVER_IMAGE": "https://i1.sndcdn.com/artworks-test.jpg"
   }
   ```
3. Verifica que las variables se reemplacen correctamente

### Paso 4: Guardar la Plantilla

1. Click en **"Save"** o **"Guardar"**
2. Asegúrate de que el Template ID sigue siendo **3**

---

## 🧪 Probar el Sistema Completo

Una vez guardada la plantilla:

### 1. Desde el Dashboard

```bash
# Abre el dashboard
open http://localhost:3002/dashboard
```

Click en **"🚀 Probar Ahora"**

### 2. Desde la API Directamente

```bash
curl -X POST http://localhost:3002/api/send-track \
  -H "Content-Type: application/json" \
  -d '{
    "trackId": "test-123",
    "title": "Test Track - Artist Name",
    "url": "https://soundcloud.com/geebeat/test-track",
    "coverImage": "https://i1.sndcdn.com/artworks-test.jpg",
    "publishedAt": "2025-12-21T00:00:00Z",
    "listIds": [5]
  }'
```

### 3. Verificar el Email

Revisa tu email en `info@geebeat.com`. Deberías ver:

- ✅ Portada del track (imagen)
- ✅ Título del track
- ✅ Botón "Escuchar en SoundCloud" funcionando
- ✅ Diseño responsive y profesional

---

## 📝 Ejemplo de Plantilla Minimalista

Si quieres algo súper simple:

```html
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

  <img src="{{ params.COVER_IMAGE }}" style="width: 100%; border-radius: 8px;">

  <h2 style="text-align: center; color: #FF5500;">
    {{ params.TRACK_NAME }}
  </h2>

  <div style="text-align: center;">
    <a href="{{ params.TRACK_URL }}"
       style="background: #FF5500;
              color: white;
              padding: 12px 24px;
              text-decoration: none;
              border-radius: 4px;">
      Escuchar
    </a>
  </div>

</body>
</html>
```

---

## 🎨 Ejemplo de Plantilla Profesional

Si quieres algo más elaborado:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 20px;">

        <!-- Container Principal -->
        <table width="600" cellpadding="0" cellspacing="0" border="0"
               style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">

          <!-- Header con gradiente -->
          <tr>
            <td style="background: linear-gradient(135deg, #FF5500 0%, #FF8833 100%);
                       padding: 30px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">
                🎵 Nuevo Track Disponible
              </h1>
            </td>
          </tr>

          <!-- Cover Image -->
          <tr>
            <td style="padding: 0;">
              <img src="{{ params.COVER_IMAGE }}"
                   alt="Track Cover"
                   width="600"
                   style="display: block; width: 100%; max-width: 600px; height: auto;">
            </td>
          </tr>

          <!-- Track Info -->
          <tr>
            <td style="padding: 30px 40px;">

              <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px; text-align: center;">
                {{ params.TRACK_NAME }}
              </h2>

              <p style="color: #666666; font-size: 16px; line-height: 1.6; text-align: center; margin: 0 0 30px 0;">
                ¡Ya está disponible para escuchar! Click en el botón para reproducir en SoundCloud.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="{{ params.TRACK_URL }}"
                       style="display: inline-block;
                              background-color: #FF5500;
                              color: #ffffff;
                              padding: 16px 40px;
                              text-decoration: none;
                              border-radius: 30px;
                              font-size: 18px;
                              font-weight: bold;
                              box-shadow: 0 4px 6px rgba(255,85,0,0.3);">
                      🎧 Escuchar Ahora
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9;
                       padding: 20px 40px;
                       text-align: center;
                       border-top: 1px solid #eeeeee;">
              <p style="color: #999999; font-size: 12px; margin: 0; line-height: 1.6;">
                Recibiste este email porque te suscribiste a notificaciones de nuevos tracks.<br>
                <a href="#" style="color: #FF5500; text-decoration: none;">Gestionar preferencias</a>
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
```

---

## ⚠️ Importante: Sintaxis de Variables en Brevo

Brevo usa la sintaxis **Jinja2** para variables:

```
✅ CORRECTO:   {{ params.TRACK_NAME }}
❌ INCORRECTO: {TRACK_NAME}
❌ INCORRECTO: {{TRACK_NAME}}
❌ INCORRECTO: %TRACK_NAME%
```

**Nota**: Siempre debe ser `{{ params.NOMBRE_VARIABLE }}`

---

## 🔍 Debugging

Si las variables NO aparecen en el email:

### 1. Verificar que Brevo recibe las variables

Ve a: https://app.brevo.com/transactional/history

- Click en el último email enviado
- En "Details" → "Template data" deberías ver:
  ```json
  {
    "TRACK_NAME": "...",
    "TRACK_URL": "...",
    "COVER_IMAGE": "..."
  }
  ```

### 2. Verificar sintaxis en la plantilla

- Abre el editor de la plantilla
- Busca las variables `{{ params.XXX }}`
- Asegúrate de que estén escritas exactamente así

### 3. Test desde Brevo

- En el editor de plantilla, usa "Preview"
- Pasa valores de prueba
- Verifica que se sustituyan

---

## 📊 Resultado Final Esperado

Cuando todo esté configurado correctamente:

1. **Se publica un track en SoundCloud**
2. **Sistema detecta el nuevo track** (cron o manual)
3. **Email se envía con**:
   - ✅ Portada del track visible
   - ✅ Título del track correcto
   - ✅ Botón funcionando → redirige a SoundCloud
4. **Track se guarda en DB** para no enviar duplicados
5. **Log de ejecución** registrado

---

## 🚀 Próximos Pasos

1. **Editar Template ID 3** en Brevo
2. **Agregar las 3 variables** con sintaxis `{{ params.XXX }}`
3. **Guardar plantilla**
4. **Probar desde dashboard** → `http://localhost:3002/dashboard`
5. **Verificar email** → `info@geebeat.com`

---

**¡Con esto, los emails se verán profesionales y con toda la info del track!** 🎵
