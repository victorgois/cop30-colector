#!/usr/bin/env node

/**
 * Script para aplicar correções de segurança no banco de dados
 *
 * 1. Faz backup automático antes de aplicar
 * 2. Aplica as correções de segurança
 * 3. Verifica se tudo funcionou
 *
 * Uso:
 *   node database/apply-security-fixes.js
 *   node database/apply-security-fixes.js --skip-backup  (pula backup)
 */

require('dotenv').config();
const { Pool } = require('pg');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const skipBackup = args.includes('--skip-backup');

const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

// Função para fazer backup
function makeBackup() {
  return new Promise((resolve, reject) => {
    console.log('📦 Fazendo backup antes de aplicar correções...');

    const backupScript = path.join(__dirname, 'backup-nodejs.js');
    exec(`node "${backupScript}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erro ao fazer backup:', error.message);
        reject(error);
        return;
      }

      console.log(stdout);
      resolve();
    });
  });
}

// Função para aplicar as correções
async function applySecurityFixes() {
  console.log('\n🔒 Aplicando correções de segurança...\n');

  try {
    // Ler o arquivo SQL de correções
    const fixesPath = path.join(__dirname, 'fix_security_issues.sql');

    if (!fs.existsSync(fixesPath)) {
      throw new Error(`Arquivo ${fixesPath} não encontrado!`);
    }

    const sql = fs.readFileSync(fixesPath, 'utf8');

    console.log('📝 Executando SQL...');

    // Executar o SQL
    await pool.query(sql);

    console.log('✅ Correções aplicadas com sucesso!\n');

    // Verificar o resultado
    console.log('🔍 Verificando resultado...\n');

    // Verificar RLS
    const rlsCheck = await pool.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('posts', 'users', 'collection_logs')
      ORDER BY tablename;
    `);

    console.log('📋 Estado do RLS:');
    rlsCheck.rows.forEach(row => {
      const status = row.rowsecurity ? '✓ ATIVADO' : '✗ DESATIVADO';
      console.log(`  ${row.tablename}: ${status}`);
    });

    // Verificar políticas
    const policiesCheck = await pool.query(`
      SELECT tablename, COUNT(*) as policy_count
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('posts', 'users', 'collection_logs')
      GROUP BY tablename
      ORDER BY tablename;
    `);

    console.log('\n📜 Políticas RLS:');
    policiesCheck.rows.forEach(row => {
      console.log(`  ${row.tablename}: ${row.policy_count} políticas`);
    });

    // Verificar views
    const viewsCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('stats_summary', 'daily_timeline', 'top_hashtags')
      ORDER BY table_name;
    `);

    console.log('\n👁️  Views recriadas:');
    viewsCheck.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Testar consultas
    console.log('\n🧪 Testando consultas:');

    const postsCount = await pool.query('SELECT COUNT(*) FROM posts');
    console.log(`  ✓ posts: ${postsCount.rows[0].count} registros acessíveis`);

    const statsCount = await pool.query('SELECT COUNT(*) FROM stats_summary');
    console.log(`  ✓ stats_summary: ${statsCount.rows[0].count} registros acessíveis`);

    console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
    console.log('\n💡 Próximos passos:');
    console.log('  1. Teste a aplicação web para verificar se os dados carregam');
    console.log('  2. Execute o linter do Supabase para confirmar que os erros foram resolvidos');
    console.log('  3. Se necessário, o backup está em database/backups/');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar correções:', error.message);
    console.error('\n⚠️  O banco não foi modificado ou foi parcialmente modificado.');
    console.error('💡 Você pode restaurar o backup se necessário:');
    console.error('   psql "$DATABASE_URL" < database/backups/[nome-do-backup].sql');
    throw error;
  }
}

async function main() {
  try {
    console.log('🔐 Iniciando aplicação de correções de segurança...\n');

    // Fazer backup (se não foi pulado)
    if (!skipBackup) {
      await makeBackup();
    } else {
      console.log('⚠️  Backup pulado (--skip-backup especificado)\n');
    }

    // Aplicar correções
    await applySecurityFixes();

  } catch (error) {
    console.error('\n❌ Falha na operação:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
