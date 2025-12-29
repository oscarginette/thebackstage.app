#!/usr/bin/env tsx

/**
 * Script para agregar campos de plataformas musicales a la tabla users
 * Ejecuta la migración: sql/migration-add-music-platform-fields.sql
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

async function runMigration() {
  try {
    console.log('🚀 Starting migration: Add Music Platform Fields...\n');

    // Leer archivo de migración
    const migrationPath = join(process.cwd(), 'sql/migration-add-music-platform-fields.sql');
    const migrationSql = readFileSync(migrationPath, 'utf-8');

    // Dividir en statements individuales
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Found ${statements.length} SQL statements\n`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await pool.query(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error: any) {
        // Ignorar errores de "ya existe"
        if (
          error.message?.includes('already exists') ||
          error.message?.includes('duplicate')
        ) {
          console.log(`⚠️  Statement ${i + 1}/${statements.length} already applied (skipping)`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n✅ Migration completed successfully!\n');

    // Verificar que las columnas existen
    const result = await pool.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'users'
      AND column_name IN ('soundcloud_id', 'soundcloud_permalink', 'spotify_id')
      ORDER BY column_name
    `);

    console.log('📊 Verification - Columns added:');
    console.table(result.rows);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
