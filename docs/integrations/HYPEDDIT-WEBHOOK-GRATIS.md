# 🎯 Conectar Hypeddit Directamente (Sin Make.com)

Hypeddit NO permite webhooks personalizados directamente, pero hay **3 alternativas GRATIS** para conectar a tu API.

---

## ✅ Opción 1: Zapier (Plan Gratis - RECOMENDADO)

Zapier tiene plan gratuito con 100 tareas/mes (suficiente para empezar).

### Configuración en Zapier:

1. **Crear cuenta gratis**: [zapier.com](https://zapier.com)
2. **Create Zap**
3. **Trigger**:
   - App: **Hypeddit**
   - Event: **New Contact** (o similar)
   - Conectar tu cuenta de Hypeddit

4. **Action**:
   - App: **Webhooks by Zapier**
   - Event: **POST**
   - URL: `https://backstage-art.vercel.app/api/webhook/hypedit`
   - Payload Type: **JSON**
   - Headers:
     ```
     X-Webhook-Secret: tu_secreto_seguro_123
     Content-Type: application/json
     ```
   - Data:
     ```json
     {
       "email": {{email}},
       "name": {{name}},
       "source": "hypeddit"
     }
     ```

5. **Test & Turn On**

### Ventajas:
- ✅ 100 tareas/mes gratis (suficiente para empezar)
- ✅ Fácil de configurar
- ✅ Confiable

### Desventajas:
- ❌ Si superas 100 descargas/mes, necesitas plan pago ($20/mes)

---

## ✅ Opción 2: n8n (Self-Hosted - 100% GRATIS)

n8n es una alternativa open source a Zapier/Make que puedes hostear gratis en Vercel.

### Deploy n8n en Vercel (gratis):

1. **Fork el repo**: https://github.com/n8n-io/n8n
2. **Deploy en Vercel**:
   - Click "Deploy" en el README
   - Conectar con GitHub
   - Deploy automático

3. **Configurar workflow**:
   - Trigger: **Webhook** (URL pública que expondrá n8n)
   - Action: **HTTP Request** → Tu API

### Configuración en Hypeddit:

Hypeddit → Settings → Integrations → Webhook URL:
```
https://tu-n8n.vercel.app/webhook/hypeddit
```

### Ventajas:
- ✅ 100% gratis (sin límites)
- ✅ Open source
- ✅ Control total

### Desventajas:
- ❌ Requiere más setup inicial
- ❌ Tienes que mantener el servidor

---

## ✅ Opción 3: Pipedream (Plan Gratis)

Pipedream tiene un plan gratuito generoso con 10,000 invocaciones/mes.

### Configuración:

1. **Crear cuenta**: [pipedream.com](https://pipedream.com)
2. **New Workflow**
3. **Trigger**:
   - **Webhook** → Genera URL única
   - Copia la URL

4. **Step**:
   - **HTTP Request**
   - Method: POST
   - URL: `https://backstage-art.vercel.app/api/webhook/hypedit`
   - Headers:
     ```json
     {
       "X-Webhook-Secret": "tu_secreto_123",
       "Content-Type": "application/json"
     }
     ```
   - Body:
     ```json
     {
       "email": "{{steps.trigger.event.email}}",
       "name": "{{steps.trigger.event.name}}"
     }
     ```

5. **Deploy**

6. **Configurar en Hypeddit**:
   - Settings → Integrations → Webhook
   - Pegar URL de Pipedream

### Ventajas:
- ✅ 10,000 invocaciones/mes gratis
- ✅ Fácil de usar
- ✅ Más generoso que Zapier

### Desventajas:
- ❌ Menos conocido que Zapier

---

## ⚡ Opción 4: IFTTT (MÁS LIMITADO)

Según la [documentación de Hypeddit](https://hypeddit.zendesk.com/hc/en-us/articles/1500011443201-Connecting-Hypeddit-to-your-email-marketing-tool-e-g-Mailchimp-with-IFTTT), ellos recomiendan IFTTT.

### Configuración IFTTT:

1. **Crear cuenta gratis**: [ifttt.com](https://ifttt.com)
2. **Create Applet**
3. **If This (Trigger)**:
   - Hypeddit → New Contact

4. **Then That (Action)**:
   - Webhooks → Make a web request
   - URL: `https://backstage-art.vercel.app/api/webhook/hypedit`
   - Method: POST
   - Headers:
     ```
     X-Webhook-Secret: tu_secreto_123
     ```
   - Body:
     ```json
     {
       "email": "{{Email}}",
       "name": "{{Name}}"
     }
     ```

### Ventajas:
- ✅ Gratis
- ✅ Recomendado por Hypeddit

### Desventajas:
- ❌ **Puede tardar horas** en procesar (no es instantáneo)
- ❌ Menos confiable que Zapier/Pipedream
- ❌ Interfaz menos amigable

---

## 🏆 MI RECOMENDACIÓN

**Para empezar**:

1. **Pipedream** (10,000/mes gratis) - Mejor opción
2. **Zapier** (100/mes gratis) - Si conoces la herramienta
3. **IFTTT** (gratis pero lento) - Solo si no tienes otra opción

**Para escalar** (>10,000 contactos/mes):

- **n8n self-hosted** en Vercel → 100% gratis ilimitado

---

## 📊 Comparación de Costos

| Servicio | Plan Gratis | Límite Gratis | Plan Pago |
|----------|-------------|---------------|-----------|
| **Pipedream** | ✅ | 10,000/mes | $19/mes (100k) |
| **Zapier** | ✅ | 100/mes | $20/mes (750) |
| **IFTTT** | ✅ | Ilimitado* | $3.49/mes |
| **n8n (self-hosted)** | ✅ | Ilimitado | $0 |
| **Make.com** | ✅ | 1,000/mes | $9/mes (10k) |

*IFTTT es gratis pero muy lento (puede tardar horas)

---

## 🚀 Guía Rápida: Pipedream

### Paso 1: Setup en Pipedream

```bash
1. Ve a pipedream.com → Sign up
2. New Workflow
3. Trigger: HTTP / Webhook Requests
4. Copia la URL del webhook (ej: https://eoxxx.m.pipedream.net)
```

### Paso 2: Añadir HTTP Request Step

```javascript
// En Pipedream, añade un paso de código Node.js:
export default defineComponent({
  async run({ steps, $ }) {
    const response = await require("@pipedream/platform").axios($, {
      method: "POST",
      url: "https://backstage-art.vercel.app/api/webhook/hypedit",
      headers: {
        "X-Webhook-Secret": "tu_secreto_aqui_123",
        "Content-Type": "application/json"
      },
      data: {
        email: steps.trigger.event.body.email,
        name: steps.trigger.event.body.name,
        source: "hypeddit"
      }
    });

    return response;
  },
})
```

### Paso 3: Configurar en Hypeddit

```
Hypeddit Dashboard
→ Settings
→ Integrations
→ Webhook URL: https://eoxxx.m.pipedream.net
→ Save
```

### Paso 4: Test

Descarga algo en tu download gate de Hypeddit y verifica:

1. En Pipedream → Workflow history
2. En tu DB:
   ```sql
   SELECT * FROM contacts ORDER BY created_at DESC LIMIT 5;
   ```

---

## ❓ FAQ

### ¿Puedo conectar Hypeddit directamente sin intermediarios?

No. Hypeddit solo soporta:
- Mailchimp
- Webhooks genéricos via Zapier/IFTTT/Make/Pipedream

### ¿Cuál es más confiable?

1. Pipedream (mejor)
2. Zapier
3. Make.com
4. n8n (si sabes configurarlo)
5. IFTTT (muy lento)

### ¿Puedo eliminar Make.com?

Sí, reemplázalo con cualquiera de las opciones de arriba.

### ¿Qué pasa si supero el límite gratis?

- **Pipedream**: Actualiza a $19/mes (100k)
- **Zapier**: Actualiza a $20/mes (750)
- **n8n**: Self-host gratis (ilimitado)

---

## 🎯 Próximos Pasos

1. Elige una opción (recomiendo **Pipedream**)
2. Configura el workflow
3. Añade `HYPEDIT_WEBHOOK_SECRET` a tu `.env.local` y Vercel
4. Prueba con un download gate
5. Cancela Make.com si ya no lo necesitas

¿Necesitas ayuda configurando alguna de estas opciones?

---

Sources:
- [Connecting Hypeddit to email marketing tools with IFTTT](https://hypeddit.zendesk.com/hc/en-us/articles/1500011443201-Connecting-Hypeddit-to-your-email-marketing-tool-e-g-Mailchimp-with-IFTTT)
- [Create Download Gates – Hypeddit](https://hypeddit.zendesk.com/hc/en-us/articles/11803413280663-Create-Download-Gates)
- [Hypeddit Official Site](https://hypeddit.com/)
