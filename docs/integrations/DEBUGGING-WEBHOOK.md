# 🔍 Debugging: ¿Por qué no se recogen los suscriptores?

## Checklist de verificación

### 1. ✅ Verificar que el webhook está activo

Prueba el endpoint manualmente:

```bash
curl https://tu-dominio.vercel.app/api/webhook/hypedit
```

**Respuesta esperada:**
```json
{
  "status": "active",
  "endpoint": "/api/webhook/hypedit",
  "method": "POST",
  ...
}
```

---

### 2. ✅ Verificar variable de entorno

En tu proyecto de Vercel:

1. Ve a: **Settings → Environment Variables**
2. Verifica que existe: `HYPEDIT_WEBHOOK_SECRET`
3. Si no existe, créala con el mismo secreto que usas en Make.com

---

### 3. ✅ Probar el webhook manualmente

```bash
curl -X POST https://tu-dominio.vercel.app/api/webhook/hypedit \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: TU_SECRETO_AQUI" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

**Respuesta esperada (éxito):**
```json
{
  "success": true,
  "message": "Contact added/updated successfully",
  "contact_id": 123,
  "email": "test@example.com",
  "subscribed": true
}
```

**Error común (secreto incorrecto):**
```json
{
  "error": "Unauthorized"
}
```

---

### 4. ✅ Verificar configuración en Make.com

En tu escenario de Make.com:

**HTTP Module debe tener:**
- **URL**: `https://tu-dominio.vercel.app/api/webhook/hypedit`
- **Method**: `POST`
- **Headers**:
  ```
  X-Webhook-Secret: [tu secreto]
  Content-Type: application/json
  ```
- **Body** (JSON):
  ```json
  {
    "email": "{{email}}",
    "name": "{{name}}",
    "track": "{{track}}",
    "country": "{{country}}"
  }
  ```

---

### 5. ✅ Verificar logs de Make.com

1. Abre tu escenario en Make.com
2. Haz click en **History** (arriba a la derecha)
3. Verifica:
   - ¿Se está ejecutando el escenario?
   - ¿Hay errores en el HTTP request?
   - ¿Qué respuesta está recibiendo?

**Errores comunes:**
- `401 Unauthorized` → El secreto no coincide
- `400 Bad Request` → Email inválido o faltante
- `500 Internal Server Error` → Error en la base de datos

---

### 6. ✅ Verificar logs en Vercel

1. Ve a: `https://vercel.com/tu-usuario/soundcloud-brevo`
2. Click en **Logs**
3. Filtra por: `/api/webhook/hypedit`
4. Busca:
   - Requests POST recientes
   - Errores en los logs
   - Respuestas 401 (secreto incorrecto)

---

### 7. ✅ Verificar base de datos

**Opción A: Desde Vercel Dashboard**

1. Ve a: **Storage → Postgres → Data**
2. Ejecuta:
   ```sql
   SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10;
   ```

**Opción B: Desde tu terminal**

```bash
# Necesitas tener configurado POSTGRES_URL en .env.local
npm run db:query -- "SELECT * FROM contacts ORDER BY created_at DESC LIMIT 10;"
```

**Opción C: Desde la API**

```bash
curl https://tu-dominio.vercel.app/api/contacts | jq '.contacts[:5]'
```

---

## 🚨 Problemas comunes y soluciones

### Problema 1: "Unauthorized (401)"

**Causa:** El secreto en Make.com no coincide con `HYPEDIT_WEBHOOK_SECRET`

**Solución:**
1. Ve a Vercel → Settings → Environment Variables
2. Copia el valor de `HYPEDIT_WEBHOOK_SECRET`
3. Actualiza el header `X-Webhook-Secret` en Make.com con ese mismo valor

---

### Problema 2: "El escenario no se ejecuta"

**Causa:** El trigger de Hypeddit no está configurado correctamente

**Solución:**
1. En Make.com, verifica que el trigger está conectado a Hypeddit
2. Haz un test descargando algo desde tu download gate
3. Verifica en Make.com → History si se ejecutó

---

### Problema 3: "Error 500 en la API"

**Causa:** Problema con la base de datos

**Solución:**
1. Verifica que `POSTGRES_URL` está configurada en Vercel
2. Revisa los logs de Vercel para ver el error específico
3. Verifica que la tabla `contacts` existe:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'contacts';
   ```

---

### Problema 4: "El email no aparece en la DB"

**Posibles causas:**

1. **El contacto ya existe y está desuscrito**
   - El webhook respeta el estado de `unsubscribed`
   - Verifica: `SELECT * FROM contacts WHERE email = 'email@ejemplo.com';`

2. **Email inválido**
   - El webhook valida que el email contenga "@"
   - Verifica en Make.com qué email está enviando

3. **El request nunca llegó a la API**
   - Revisa logs de Make.com
   - Revisa logs de Vercel

---

## 🧪 Script de diagnóstico completo

Ejecuta este script para un diagnóstico completo:

```bash
#!/bin/bash

echo "🔍 DIAGNÓSTICO COMPLETO DEL WEBHOOK"
echo "==================================="
echo ""

# 1. Verificar que el endpoint está activo
echo "1️⃣ Verificando endpoint..."
curl -s https://tu-dominio.vercel.app/api/webhook/hypedit | jq .
echo ""

# 2. Probar con datos de prueba
echo "2️⃣ Enviando datos de prueba..."
curl -X POST https://tu-dominio.vercel.app/api/webhook/hypedit \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: TU_SECRETO" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "name": "Test User"
  }' | jq .
echo ""

# 3. Verificar últimos contactos
echo "3️⃣ Últimos contactos en DB..."
curl -s https://tu-dominio.vercel.app/api/contacts | jq '{
  total: .stats.total_contacts,
  activos: .stats.active_subscribers,
  ultimos_7_dias: .stats.new_last_7_days,
  ultimos_5_contactos: .contacts[:5] | map({email, created_at})
}'
echo ""

echo "✅ Diagnóstico completado"
```

**Guarda esto como:** `scripts/diagnose-webhook.sh`

---

## 📊 Consultas SQL útiles

```sql
-- Contactos de las últimas 24 horas
SELECT email, name, source, created_at
FROM contacts
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Contactos por source
SELECT source, COUNT(*) as total
FROM contacts
GROUP BY source;

-- Contactos desuscritos
SELECT email, unsubscribed_at
FROM contacts
WHERE subscribed = false
ORDER BY unsubscribed_at DESC;

-- Duplicados (si existen)
SELECT email, COUNT(*) as veces
FROM contacts
GROUP BY email
HAVING COUNT(*) > 1;
```

---

## 🎯 Pasos siguientes

Si después de esta verificación no encuentras los contactos:

1. **Revisa los logs de Make.com** → History
2. **Revisa los logs de Vercel** → Logs del proyecto
3. **Ejecuta el script de diagnóstico**
4. **Verifica la configuración del secreto**
5. **Prueba manualmente con curl**

¿En qué punto del proceso te encuentras? ¿Tienes acceso a los logs de Make.com?
