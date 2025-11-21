#!/usr/bin/env node
/**
 * Script para exportar dados do banco Render
 * Cria backup completo antes da migração para Supabase
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Função para escapar strings SQL
function escapeSQLString(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str)
    .replace(/\\/g, '\\\\')  // Escape backslashes primeiro
    .replace(/'/g, "''")      // Escape aspas simples
    .replace(/\n/g, '\\n')    // Escape quebras de linha
    .replace(/\r/g, '\\r')    // Escape retorno de carro
    .replace(/\t/g, '\\t')    // Escape tabs
    + "'";
}

async function exportDatabase() {
  console.log('🔄 Iniciando exportação do banco de dados Render...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Criar diretório de backup
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `render-backup-${timestamp}.sql`);

    console.log('📊 Verificando dados no banco...\n');

    // Contar registros
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) FROM posts'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM collection_logs')
    ]);

    const stats = {
      posts: parseInt(counts[0].rows[0].count),
      users: parseInt(counts[1].rows[0].count),
      collection_logs: parseInt(counts[2].rows[0].count)
    };

    console.log('Registros encontrados:');
    console.log(`  📝 Posts: ${stats.posts}`);
    console.log(`  👤 Usuários: ${stats.users}`);
    console.log(`  📈 Logs de coleta: ${stats.collection_logs}\n`);

    if (stats.posts === 0 && stats.users === 0 && stats.collection_logs === 0) {
      console.log('⚠️  Banco de dados está vazio. Nada para exportar.');
      return;
    }

    console.log('🔄 Exportando dados...\n');

    // Buscar todos os dados
    const [posts, users, logs] = await Promise.all([
      pool.query('SELECT * FROM posts ORDER BY id'),
      pool.query('SELECT * FROM users ORDER BY id'),
      pool.query('SELECT * FROM collection_logs ORDER BY id')
    ]);

    // Criar arquivo SQL com INSERT statements
    let sqlContent = '-- Backup do banco de dados Render\n';
    sqlContent += `-- Data: ${new Date().toISOString()}\n`;
    sqlContent += `-- Posts: ${stats.posts} | Users: ${stats.users} | Logs: ${stats.collection_logs}\n\n`;

    // Desabilitar triggers temporariamente
    sqlContent += '-- Desabilitar constraints temporariamente\n';
    sqlContent += 'SET session_replication_role = replica;\n\n';

    // Exportar posts
    if (posts.rows.length > 0) {
      sqlContent += '-- Inserir posts\n';
      for (const post of posts.rows) {
        const values = [
          post.id,
          escapeSQLString(post.platform),
          escapeSQLString(post.post_id),
          post.username ? escapeSQLString(post.username) : 'NULL',
          post.user_id ? escapeSQLString(post.user_id) : 'NULL',
          post.caption ? escapeSQLString(post.caption) : 'NULL',
          post.hashtags && post.hashtags.length > 0 ? `ARRAY[${post.hashtags.map(h => escapeSQLString(h)).join(',')}]::text[]` : 'ARRAY[]::text[]',
          post.keyword_matched ? escapeSQLString(post.keyword_matched) : 'NULL',
          post.created_at ? escapeSQLString(post.created_at.toISOString()) : 'NULL',
          post.collected_at ? escapeSQLString(post.collected_at.toISOString()) : 'NULL',
          post.likes_count || 'NULL',
          post.comments_count || 'NULL',
          post.shares_count || 'NULL',
          post.views_count || 'NULL',
          post.post_url ? escapeSQLString(post.post_url) : 'NULL',
          post.media_urls && post.media_urls.length > 0 ? `ARRAY[${post.media_urls.map(u => escapeSQLString(u)).join(',')}]::text[]` : 'ARRAY[]::text[]',
          post.media_type ? escapeSQLString(post.media_type) : 'NULL',
          post.raw_data ? `'${JSON.stringify(post.raw_data).replace(/'/g, "''")}'::jsonb` : 'NULL'
        ];

        sqlContent += `INSERT INTO posts (id, platform, post_id, username, user_id, caption, hashtags, keyword_matched, created_at, collected_at, likes_count, comments_count, shares_count, views_count, post_url, media_urls, media_type, raw_data) VALUES (${values.join(', ')});\n`;
      }
      sqlContent += '\n';
    }

    // Exportar users
    if (users.rows.length > 0) {
      sqlContent += '-- Inserir usuários\n';
      for (const user of users.rows) {
        const values = [
          user.id,
          escapeSQLString(user.platform),
          escapeSQLString(user.user_id),
          user.username ? escapeSQLString(user.username) : 'NULL',
          user.display_name ? escapeSQLString(user.display_name) : 'NULL',
          user.followers_count || 'NULL',
          user.following_count || 'NULL',
          user.bio ? escapeSQLString(user.bio) : 'NULL',
          user.profile_url ? escapeSQLString(user.profile_url) : 'NULL',
          user.collected_at ? escapeSQLString(user.collected_at.toISOString()) : 'NULL'
        ];

        sqlContent += `INSERT INTO users (id, platform, user_id, username, display_name, followers_count, following_count, bio, profile_url, collected_at) VALUES (${values.join(', ')});\n`;
      }
      sqlContent += '\n';
    }

    // Exportar collection_logs
    if (logs.rows.length > 0) {
      sqlContent += '-- Inserir logs de coleta\n';
      for (const log of logs.rows) {
        const values = [
          log.id,
          log.execution_date ? escapeSQLString(log.execution_date.toISOString()) : 'NULL',
          log.platform ? escapeSQLString(log.platform) : 'NULL',
          log.keyword ? escapeSQLString(log.keyword) : 'NULL',
          log.posts_collected || 'NULL',
          log.execution_time_seconds || 'NULL',
          log.status ? escapeSQLString(log.status) : 'NULL',
          log.error_message ? escapeSQLString(log.error_message) : 'NULL',
          log.apify_run_id ? escapeSQLString(log.apify_run_id) : 'NULL'
        ];

        sqlContent += `INSERT INTO collection_logs (id, execution_date, platform, keyword, posts_collected, execution_time_seconds, status, error_message, apify_run_id) VALUES (${values.join(', ')});\n`;
      }
      sqlContent += '\n';
    }

    // Atualizar sequences
    sqlContent += '-- Atualizar sequences\n';
    if (posts.rows.length > 0) {
      const maxPostId = Math.max(...posts.rows.map(p => p.id));
      sqlContent += `SELECT setval('posts_id_seq', ${maxPostId}, true);\n`;
    }
    if (users.rows.length > 0) {
      const maxUserId = Math.max(...users.rows.map(u => u.id));
      sqlContent += `SELECT setval('users_id_seq', ${maxUserId}, true);\n`;
    }
    if (logs.rows.length > 0) {
      const maxLogId = Math.max(...logs.rows.map(l => l.id));
      sqlContent += `SELECT setval('collection_logs_id_seq', ${maxLogId}, true);\n`;
    }

    // Reabilitar constraints
    sqlContent += '\n-- Reabilitar constraints\n';
    sqlContent += 'SET session_replication_role = DEFAULT;\n';

    // Salvar arquivo
    fs.writeFileSync(backupFile, sqlContent);

    console.log('✅ Exportação concluída!\n');
    console.log('📁 Arquivo de backup criado:');
    console.log(`   ${backupFile}\n`);
    console.log('💾 Tamanho do arquivo:', (fs.statSync(backupFile).size / 1024).toFixed(2), 'KB\n');
    console.log('⚠️  IMPORTANTE: Guarde este arquivo em local seguro!');
    console.log('   Você precisará dele para importar no Supabase.\n');

    // Criar também um backup JSON para facilitar
    const jsonBackupFile = path.join(backupDir, `render-backup-${timestamp}.json`);
    const jsonData = {
      exported_at: new Date().toISOString(),
      stats,
      posts: posts.rows,
      users: users.rows,
      collection_logs: logs.rows
    };
    fs.writeFileSync(jsonBackupFile, JSON.stringify(jsonData, null, 2));
    console.log('📄 Backup JSON criado também:');
    console.log(`   ${jsonBackupFile}\n`);

  } catch (error) {
    console.error('❌ Erro ao exportar dados:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  exportDatabase();
}

module.exports = exportDatabase;
