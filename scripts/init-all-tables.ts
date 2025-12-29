#!/usr/bin/env tsx

/**
 * Script para inicializar TODAS las tablas en la base de datos
 * Ejecuta las migraciones base en orden correcto
 */

import { config } from 'dotenv';
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cargar variables de entorno desde .env.local
config({ path: '.env.local' });

// Crear pool de conexiones con pg
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

interface MigrationResult {
  file: string;
  success: boolean;
  error?: string;
}

async function executeSQLFile(filePath: string): Promise<void> {
  const fullPath = join(process.cwd(), filePath);
  const content = readFileSync(fullPath, 'utf-8');

  // Dividir en statements individuales (separados por punto y coma)
  const statements = content
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (error: any) {
      // Ignorar errores comunes de "ya existe"
      if (
        error.message?.includes('already exists') ||
        error.message?.includes('duplicate') ||
        error.message?.includes('does not exist')
      ) {
        // Silenciar - es normal en re-ejecuciones
      } else {
        throw error;
      }
    }
  }
}

async function initAllTables() {
  console.log('🚀 Inicializando todas las tablas de la base de datos\n');

  // Verificar conexión
  console.log('📡 Verificando conexión a base de datos...');
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Conexión exitosa\n');
  } catch (error: any) {
    console.error('❌ Error de conexión:', error.message);
    console.error('\n💡 Verifica que POSTGRES_URL esté configurado en .env.local');
    await pool.end();
    process.exit(1);
  }

  // Migraciones base en orden de dependencias
  const migrations = [
    'sql/setup.sql',
    'sql/migration-contacts.sql',
    'sql/migration-email-events.sql',
    'sql/add-consent-history.sql',
    'sql/migration-email-templates.sql',
    'sql/migration-email-campaigns.sql',
    'sql/migration-contact-import.sql',
    'sql/migration-brevo-integration.sql',
    'sql/migration-download-gates.sql',
    'sql/migration-multi-tenant.sql',
    'sql/migration-spotify-tracks.sql',
    'sql/migration-subscription-system.sql',
    'sql/migration-stripe-architecture.sql',
  ];

  const results: MigrationResult[] = [];

  for (const migration of migrations) {
    try {
      console.log(`📄 Ejecutando: ${migration}...`);
      await executeSQLFile(migration);
      results.push({ file: migration, success: true });
      console.log(`✅ Completado: ${migration}\n`);
    } catch (error: any) {
      console.error(`❌ Error en ${migration}:`, error.message);
      results.push({ file: migration, success: false, error: error.message });
      // Continuar con las demás migraciones
    }
  }

  // Verificar tablas creadas
  console.log('\n📊 Verificando tablas creadas...\n');

  const tables = await pool.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);

  console.log(`✅ Total de tablas: ${tables.rows.length}\n`);
  console.log('📋 Tablas encontradas:');
  tables.rows.forEach((row: any) => {
    console.log(`   • ${row.table_name}`);
  });

  // Resumen de migraciones
  console.log('\n📈 Resumen de migraciones:');
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`   ✅ Exitosas: ${successful}`);
  console.log(`   ❌ Fallidas: ${failed}`);

  if (failed > 0) {
    console.log('\n⚠️  Migraciones con errores:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   • ${r.file}: ${r.error}`);
    });
  }

  console.log('\n✨ Proceso completado\n');

  // Cerrar conexión
  await pool.end();
}

initAllTables()
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error('❌ Error fatal:', error);
    await pool.end();
    process.exit(1);
  });
