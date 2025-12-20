#!/usr/bin/env node

/**
 * Script de Backup usando Node.js puro (sem precisar de pg_dump)
 *
 * Exporta os dados das tabelas para arquivos SQL
 *
 * Uso:
 *   node database/backup-nodejs.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Criar diretório de backups se não existir
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Diretório de backups criado: ${backupDir}`);
}

const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const backupFile = `backup-nodejs-${timestamp}.sql`;
const backupPath = path.join(backupDir, backupFile);

async function exportTable(tableName, fileStream) {
  console.log(`  📊 Exportando tabela: ${tableName}...`);

  // Obter estrutura da tabela
  const schemaQuery = `
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position;
  `;

  const schemaResult = await pool.query(schemaQuery, [tableName]);

  if (schemaResult.rows.length === 0) {
    console.log(`    ⚠️  Tabela ${tableName} não encontrada`);
    return;
  }

  // Obter dados
  const dataResult = await pool.query(`SELECT * FROM ${tableName}`);

  fileStream.write(`\n-- ============================================\n`);
  fileStream.write(`-- Tabela: ${tableName}\n`);
  fileStream.write(`-- Registros: ${dataResult.rows.length}\n`);
  fileStream.write(`-- ============================================\n\n`);

  if (dataResult.rows.length === 0) {
    fileStream.write(`-- Nenhum registro para exportar\n\n`);
    console.log(`    ℹ️  0 registros`);
    return;
  }

  // Gerar INSERT statements
  const columns = schemaResult.rows.map(r => r.column_name);
  const columnsList = columns.map(c => `"${c}"`).join(', ');

  // Agrupar em batches de 100 registros
  const batchSize = 100;
  for (let i = 0; i < dataResult.rows.length; i += batchSize) {
    const batch = dataResult.rows.slice(i, i + batchSize);

    const values = batch.map(row => {
      const vals = columns.map(col => {
        const val = row[col];

        if (val === null) return 'NULL';
        if (typeof val === 'number') return val;
        if (typeof val === 'boolean') return val;
        if (Array.isArray(val)) {
          // Arrays PostgreSQL
          const arrayVals = val.map(v => {
            if (v === null) return 'NULL';
            return `'${String(v).replace(/'/g, "''")}'`;
          });
          return `ARRAY[${arrayVals.join(', ')}]`;
        }
        if (typeof val === 'object') {
          // JSON/JSONB
          return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
        }
        if (val instanceof Date) {
          return `'${val.toISOString()}'`;
        }

        // String - escape single quotes
        return `'${String(val).replace(/'/g, "''")}'`;
      });

      return `  (${vals.join(', ')})`;
    }).join(',\n');

    fileStream.write(`INSERT INTO ${tableName} (${columnsList})\nVALUES\n${values};\n\n`);
  }

  console.log(`    ✓ ${dataResult.rows.length} registros exportados`);
}

async function exportViews(fileStream) {
  console.log(`  👁️  Exportando views...`);

  const viewsQuery = `
    SELECT table_name, view_definition
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name IN ('stats_summary', 'daily_timeline', 'top_hashtags')
    ORDER BY table_name;
  `;

  const result = await pool.query(viewsQuery);

  fileStream.write(`\n-- ============================================\n`);
  fileStream.write(`-- Views\n`);
  fileStream.write(`-- ============================================\n\n`);

  for (const view of result.rows) {
    fileStream.write(`-- View: ${view.table_name}\n`);
    fileStream.write(`CREATE OR REPLACE VIEW ${view.table_name} AS\n`);
    fileStream.write(`${view.view_definition};\n\n`);
  }

  console.log(`    ✓ ${result.rows.length} views exportadas`);
}

async function exportRLSPolicies(fileStream) {
  console.log(`  🔒 Exportando políticas RLS...`);

  const policiesQuery = `
    SELECT
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('posts', 'users', 'collection_logs')
    ORDER BY tablename, policyname;
  `;

  const result = await pool.query(policiesQuery);

  fileStream.write(`\n-- ============================================\n`);
  fileStream.write(`-- Políticas RLS\n`);
  fileStream.write(`-- ============================================\n\n`);

  if (result.rows.length === 0) {
    fileStream.write(`-- Nenhuma política RLS configurada\n\n`);
    console.log(`    ℹ️  Nenhuma política encontrada`);
  } else {
    for (const policy of result.rows) {
      fileStream.write(`-- Política: ${policy.policyname} na tabela ${policy.tablename}\n`);
      fileStream.write(`CREATE POLICY "${policy.policyname}"\n`);
      fileStream.write(`  ON ${policy.tablename}\n`);
      fileStream.write(`  FOR ${policy.cmd}\n`);
      if (policy.qual) {
        fileStream.write(`  USING (${policy.qual})\n`);
      }
      if (policy.with_check) {
        fileStream.write(`  WITH CHECK (${policy.with_check})\n`);
      }
      fileStream.write(`;\n\n`);
    }
    console.log(`    ✓ ${result.rows.length} políticas exportadas`);
  }
}

async function makeBackup() {
  console.log('🔄 Iniciando backup do banco de dados...');
  console.log(`📁 Destino: ${backupFile}\n`);

  const fileStream = fs.createWriteStream(backupPath);

  // Cabeçalho
  fileStream.write(`-- ============================================\n`);
  fileStream.write(`-- Backup do Banco de Dados - COP30\n`);
  fileStream.write(`-- Data: ${new Date().toLocaleString('pt-BR')}\n`);
  fileStream.write(`-- ============================================\n\n`);

  try {
    // Exportar tabelas
    console.log('📊 Exportando dados das tabelas:');
    await exportTable('posts', fileStream);
    await exportTable('users', fileStream);
    await exportTable('collection_logs', fileStream);

    // Exportar views
    await exportViews(fileStream);

    // Exportar políticas RLS
    await exportRLSPolicies(fileStream);

    fileStream.end();

    // Aguardar o stream finalizar
    await new Promise((resolve) => fileStream.on('finish', resolve));

    // Verificar arquivo criado
    const stats = fs.statSync(backupPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('\n✅ Backup concluído com sucesso!');
    console.log(`📦 Tamanho: ${fileSizeMB} MB (${fileSizeKB} KB)`);
    console.log(`📍 Localização: ${backupPath}`);

    // Listar backups recentes
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
      .slice(0, 5);

    if (backups.length > 0) {
      console.log('\n📋 Últimos 5 backups:');
      backups.forEach((file, index) => {
        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        const sizeKB = (fileStats.size / 1024).toFixed(2);
        const sizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
        const date = new Date(fileStats.mtime).toLocaleString('pt-BR');
        console.log(`  ${index + 1}. ${file}`);
        console.log(`     ${sizeMB} MB - ${date}`);
      });
    }

    console.log('\n💡 Para restaurar este backup:');
    console.log(`   psql "$DATABASE_URL" < "${backupPath}"`);
    console.log('   ou execute manualmente no Supabase SQL Editor');

  } catch (error) {
    console.error('❌ Erro ao fazer backup:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

makeBackup().catch(err => {
  console.error('❌ Falha no backup:', err);
  process.exit(1);
});
