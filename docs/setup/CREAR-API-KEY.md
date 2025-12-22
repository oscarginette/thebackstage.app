# 🔑 Cómo Crear una API Key Estándar de Brevo

## ❌ Problema Actual

Tu API key actual es de tipo **MCP** (Model Context Protocol), que:
- ❌ NO puede enviar emails transaccionales
- ❌ NO puede leer listas de contactos
- ✅ Solo sirve para integraciones MCP

**Error actual**: `401 Unauthorized` al intentar enviar emails

---

## ✅ Solución: Crear API Key Estándar

### Paso 1: Ir a Configuración de API Keys

Abre esta URL:
```
https://app.brevo.com/settings/keys/api
```

### Paso 2: Crear Nueva API Key

1. Click en **"Create a new API key"**
   - ⚠️ **NO** clicks en "MCP Server API key"
   - ⚠️ Asegúrate de usar el botón normal "Create a new API key"

2. **Nombre**: `SoundCloud Automation`

3. **Permisos** - Selecciona estos:
   - ✅ **Contacts** → Read
   - ✅ **Lists** → Read
   - ✅ **Email Campaigns** → Read/Send
   - ✅ **Transactional Emails** → Send

4. Click **"Generate"**

### Paso 3: Copiar la Nueva API Key

1. Brevo mostrará la key **UNA SOLA VEZ**
2. Cópiala completa (empezará con `xkeysib-...`)
3. Guárdala en un lugar seguro

### Paso 4: Actualizar en el Proyecto

**Opción A - Local (.env.local)**:
```bash
# Edita .env.local
BREVO_API_KEY=xkeysib-TU_NUEVA_KEY_AQUI
```

**Opción B - Vercel (Producción)**:
1. Ve a https://vercel.com/oscarginette/soundcloud-brevo/settings/environment-variables
2. Busca `BREVO_API_KEY`
3. Click en los 3 puntos → "Edit"
4. Pega la nueva key
5. Save

### Paso 5: Reiniciar Servidor

**Local**:
```bash
# Mata el servidor actual
pkill -f "next dev"

# Inicia de nuevo
npm run dev
```

**Vercel**:
- Se redesplegará automáticamente al cambiar la variable

### Paso 6: Probar

Abre el dashboard y click en "🚀 Probar Ahora":
```
http://localhost:3002/dashboard
```

Deberías recibir un email a `info@geebeat.com` con el track más reciente.

---

## 🎯 Resultado Esperado

Con la nueva API key:
- ✅ Se podrán enviar emails transaccionales
- ✅ Se podrán leer listas de contactos dinámicamente
- ✅ El dashboard mostrará todas las listas reales de Brevo
- ✅ Podrás enviar a múltiples listas

---

## 📸 Captura Visual

Cuando estés en https://app.brevo.com/settings/keys/api verás:

```
┌─────────────────────────────────────────┐
│  API Keys                               │
├─────────────────────────────────────────┤
│                                         │
│  [ Create a new API key ]  ← Click aquí│
│                                         │
│  [ MCP Server API key ]   ← NO esto    │
│                                         │
└─────────────────────────────────────────┘
```

---

## ⚠️ Nota Importante

**NO elimines la API key MCP** todavía. Primero crea la nueva, prueba que funcione, y luego puedes eliminar la MCP si quieres.

---

## 🚀 Una Vez Creada la Key

1. Actualiza `.env.local` con la nueva key
2. Reinicia el servidor: `pkill -f "next dev" && npm run dev`
3. Abre http://localhost:3002/dashboard
4. Click en "🚀 Probar Ahora"
5. Revisa tu email en `info@geebeat.com`

**Deberías recibir un email con el último track de SoundCloud!** 🎵
