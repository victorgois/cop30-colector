#!/usr/bin/env node
/**
 * Script para atualizar a view daily_timeline com filtro de ano 2025
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function updateView() {
  console.log('🔄 Atualizando view daily_timeline...\n');

  try {
    const query = `
      -- View para timeline diária (apenas posts de 2025)
      CREATE OR REPLACE VIEW daily_timeline AS
      SELECT
          DATE(created_at) as date,
          platform,
          keyword_matched,
          COUNT(*) as posts_count,
          SUM(likes_count) as total_likes,
          SUM(comments_count) as total_comments
      FROM posts
      WHERE created_at IS NOT NULL
        AND EXTRACT(YEAR FROM created_at) = 2025  -- Apenas posts de 2025
      GROUP BY DATE(created_at), platform, keyword_matched
      ORDER BY date DESC;
    `;

    await pool.query(query);
    console.log('✅ View daily_timeline atualizada com sucesso!');
    console.log('   Agora mostrando apenas posts de 2025\n');

    // Verificar dados
    const result = await pool.query('SELECT MIN(date) as oldest, MAX(date) as newest, COUNT(*) as total_days FROM daily_timeline');
    const stats = result.rows[0];

    console.log('📊 Estatísticas da timeline:');
    console.log(`   Data mais antiga: ${stats.oldest}`);
    console.log(`   Data mais recente: ${stats.newest}`);
    console.log(`   Total de dias: ${stats.total_days}`);

  } catch (error) {
    console.error('❌ Erro ao atualizar view:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

updateView();
