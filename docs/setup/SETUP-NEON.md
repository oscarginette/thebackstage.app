# Configuración de Base de Datos Neon

Base de datos PostgreSQL en Neon configurada correctamente para SoundCloud → Brevo Automation.

## Estado: ✅ Completado

### Tablas Creadas

1. **soundcloud_tracks** - Guarda los tracks ya procesados
   - Previene envíos duplicados
   - Almacena información del track (título, URL, cover image, etc.)

2. **app_config** - Configuración de la aplicación
   - Guarda las listas de Brevo seleccionadas
   - Solo tiene un registro (ID=1)

3. **execution_logs** - Historial de ejecuciones
   - Registra cada vez que se envía un email
   - Guarda métricas: duración, emails enviados, errores, etc.

### Vista Creada

- **execution_history** - Vista que combina tracks con logs para mostrar el historial

## Conexión

La conexión ya está configurada en `.env.local`:

```
POSTGRES_URL=postgresql://neondb_owner:npg_2jWgwzHe4nZo@ep-wandering-river-ag3kh8ec-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## Variables de Entorno para Vercel

Cuando despliegues en Vercel, añade esta variable de entorno:

```
POSTGRES_URL=postgresql://neondb_owner:npg_2jWgwzHe4nZo@ep-wandering-river-ag3kh8ec-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
```

## Funcionalidades Habilitadas

Con la base de datos configurada, ahora tienes:

✅ **Prevención de duplicados** - No se enviará el mismo track dos veces
✅ **Historial de envíos** - Ver qué tracks has enviado y cuándo
✅ **Badge "Enviado"** - Marca visual en tracks ya procesados
✅ **Logs de ejecución** - Métricas de cada ejecución del cron
✅ **Persistencia de configuración** - Las listas seleccionadas se guardan en la DB

## Probar la Conexión

Para verificar que todo funciona:

1. Inicia el servidor: `npm run dev`
2. Abre http://localhost:3000/dashboard
3. Configura las listas de Brevo
4. Haz clic en "Guardar" - esto guardará en la DB
5. Haz clic en "Mostrar Tracks" - verás todas las canciones
6. Envía un track de prueba - se guardará en la DB

## Consultas Útiles

Ver tracks enviados:
```sql
SELECT * FROM soundcloud_tracks ORDER BY created_at DESC;
```

Ver configuración actual:
```sql
SELECT * FROM app_config;
```

Ver historial de ejecuciones:
```sql
SELECT * FROM execution_logs ORDER BY executed_at DESC LIMIT 10;
```

Ver historial completo (con detalles de tracks):
```sql
SELECT * FROM execution_history;
```

## Resetear Base de Datos

Si necesitas empezar de cero:

```sql
TRUNCATE soundcloud_tracks, execution_logs RESTART IDENTITY;
UPDATE app_config SET brevo_list_ids = '[]'::jsonb WHERE id = 1;
```

## Notas de Seguridad

⚠️ **IMPORTANTE**: No compartas tu `POSTGRES_URL` públicamente. Ya está en `.env.local` que está en `.gitignore`.

Para colaboradores, usa `.env.example` como plantilla y que cada uno configure su propia conexión.
