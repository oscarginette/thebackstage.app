-- Backstage Database Schema
-- Base de datos: PostgreSQL (Neon)

-- Tabla para guardar tracks de SoundCloud ya procesados
CREATE TABLE IF NOT EXISTS soundcloud_tracks (
  id SERIAL PRIMARY KEY,
  track_id VARCHAR(500) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(1000) NOT NULL,
  published_at TIMESTAMP NOT NULL,
  cover_image VARCHAR(1000),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas rápidas por track_id
CREATE INDEX IF NOT EXISTS idx_soundcloud_tracks_track_id ON soundcloud_tracks(track_id);

-- Tabla para configuración de la app
CREATE TABLE IF NOT EXISTS app_config (
  id INTEGER PRIMARY KEY DEFAULT 1,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Insertar registro inicial de configuración si no existe
INSERT INTO app_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Tabla para logs de ejecución
CREATE TABLE IF NOT EXISTS execution_logs (
  id SERIAL PRIMARY KEY,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  new_tracks INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  duration_ms INTEGER,
  error TEXT,
  track_id VARCHAR(500),
  track_title VARCHAR(500)
);

-- Índice para ordenar logs por fecha
CREATE INDEX IF NOT EXISTS idx_execution_logs_executed_at ON execution_logs(executed_at DESC);

-- Vista para obtener el historial de ejecuciones con detalles de tracks
CREATE OR REPLACE VIEW execution_history AS
SELECT
  st.track_id,
  st.title,
  st.url,
  st.published_at,
  el.executed_at,
  el.emails_sent,
  el.duration_ms,
  st.cover_image,
  st.description
FROM soundcloud_tracks st
LEFT JOIN execution_logs el ON st.track_id = el.track_id
WHERE el.new_tracks > 0
ORDER BY el.executed_at DESC
LIMIT 50;
