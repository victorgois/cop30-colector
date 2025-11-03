#!/usr/bin/env node
/**
 * Script de diagnóstico para verificar estatísticas do banco de dados
 * Útil para identificar problemas de sincronização entre ambiente local e produção
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkDatabaseStats() {
  console.log('🔍 Verificando estatísticas do banco de dados...\n');
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 DATABASE_URL: ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@')}\n`);

  try {
    // 1. Total de posts por plataforma
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 POSTS POR PLATAFORMA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const platformStats = await pool.query(`
      SELECT
        platform,
        COUNT(*) as total_posts,
        COUNT(DISTINCT user_id) as unique_users,
        MIN(created_at) as oldest_post,
        MAX(created_at) as newest_post,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        SUM(shares_count) as total_shares
      FROM posts
      GROUP BY platform
      ORDER BY total_posts DESC
    `);

    if (platformStats.rows.length === 0) {
      console.log('⚠️  Nenhum post encontrado no banco de dados!\n');
    } else {
      platformStats.rows.forEach(row => {
        console.log(`\n${row.platform.toUpperCase()}:`);
        console.log(`  Posts: ${row.total_posts}`);
        console.log(`  Usuários únicos: ${row.unique_users}`);
        console.log(`  Post mais antigo: ${row.oldest_post}`);
        console.log(`  Post mais recente: ${row.newest_post}`);
        console.log(`  Total de likes: ${row.total_likes || 0}`);
        console.log(`  Total de comentários: ${row.total_comments || 0}`);
        console.log(`  Total de compartilhamentos: ${row.total_shares || 0}`);
      });
    }

    // 2. Posts por keyword
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  POSTS POR KEYWORD');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const keywordStats = await pool.query(`
      SELECT
        keyword_matched,
        platform,
        COUNT(*) as count
      FROM posts
      GROUP BY keyword_matched, platform
      ORDER BY count DESC
    `);

    if (keywordStats.rows.length === 0) {
      console.log('⚠️  Nenhuma keyword encontrada!\n');
    } else {
      const grouped = {};
      keywordStats.rows.forEach(row => {
        if (!grouped[row.keyword_matched]) {
          grouped[row.keyword_matched] = { total: 0, platforms: {} };
        }
        grouped[row.keyword_matched].total += parseInt(row.count);
        grouped[row.keyword_matched].platforms[row.platform] = parseInt(row.count);
      });

      Object.entries(grouped).forEach(([keyword, data]) => {
        console.log(`\n#${keyword}: ${data.total} posts`);
        Object.entries(data.platforms).forEach(([platform, count]) => {
          console.log(`  ${platform}: ${count}`);
        });
      });
    }

    // 3. Posts por data (últimos 7 dias)
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 POSTS DOS ÚLTIMOS 7 DIAS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const recentPosts = await pool.query(`
      SELECT
        DATE(created_at) as date,
        platform,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at), platform
      ORDER BY date DESC, platform
    `);

    if (recentPosts.rows.length === 0) {
      console.log('⚠️  Nenhum post dos últimos 7 dias!\n');
    } else {
      recentPosts.rows.forEach(row => {
        console.log(`${row.date.toISOString().split('T')[0]} - ${row.platform}: ${row.count} posts`);
      });
    }

    // 4. Últimas coletas registradas
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 ÚLTIMAS COLETAS (collection_logs)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const logs = await pool.query(`
      SELECT
        execution_date,
        platform,
        keyword,
        posts_collected,
        execution_time_seconds,
        status,
        error_message,
        apify_run_id
      FROM collection_logs
      ORDER BY execution_date DESC
      LIMIT 10
    `);

    if (logs.rows.length === 0) {
      console.log('⚠️  Nenhum log de coleta encontrado!\n');
    } else {
      logs.rows.forEach(row => {
        console.log(`\n${row.execution_date.toISOString()}`);
        console.log(`  Plataforma: ${row.platform}`);
        console.log(`  Keyword: ${row.keyword || 'N/A'}`);
        console.log(`  Posts coletados: ${row.posts_collected || 0}`);
        console.log(`  Tempo de execução: ${row.execution_time_seconds || 0}s`);
        console.log(`  Status: ${row.status}`);
        if (row.error_message) {
          console.log(`  Erro: ${row.error_message}`);
        }
        if (row.apify_run_id) {
          console.log(`  Run ID: ${row.apify_run_id}`);
        }
      });
    }

    // 5. Verificar se existem posts sem dados de engajamento
    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  POSTS COM DADOS INCOMPLETOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const incomplete = await pool.query(`
      SELECT
        platform,
        COUNT(*) as count
      FROM posts
      WHERE likes_count IS NULL OR likes_count = 0
      GROUP BY platform
    `);

    if (incomplete.rows.length === 0) {
      console.log('✅ Todos os posts têm dados de engajamento!\n');
    } else {
      incomplete.rows.forEach(row => {
        console.log(`${row.platform}: ${row.count} posts sem likes`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Diagnóstico concluído!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Erro ao verificar estatísticas:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

checkDatabaseStats();
