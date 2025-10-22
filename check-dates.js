#!/usr/bin/env node
/**
 * Script para verificar datas dos posts no banco de dados
 */

require('dotenv').config();
const pool = require('./database/connection');

async function checkDates() {
  console.log('=== Verificando Datas dos Posts ===\n');

  try {
    // Verificar posts com datas
    const result = await pool.query(`
      SELECT
        post_id,
        platform,
        username,
        created_at,
        raw_data->>'timestamp' as raw_timestamp,
        raw_data->>'taken_at' as raw_taken_at,
        raw_data->>'createTime' as raw_createTime,
        raw_data->>'timestampPostDate' as raw_timestampPostDate
      FROM posts
      ORDER BY created_at DESC NULLS LAST
      LIMIT 10
    `);

    console.log(`Total de posts analisados: ${result.rows.length}\n`);

    result.rows.forEach((post, i) => {
      console.log(`\n--- Post ${i + 1} (${post.platform}) ---`);
      console.log(`Post ID: ${post.post_id}`);
      console.log(`Username: ${post.username}`);
      console.log(`created_at (DB): ${post.created_at}`);
      console.log(`raw_timestamp: ${post.raw_timestamp}`);
      console.log(`raw_taken_at: ${post.raw_taken_at}`);
      console.log(`raw_createTime: ${post.raw_createTime}`);
      console.log(`raw_timestampPostDate: ${post.raw_timestampPostDate}`);

      if (post.created_at) {
        const date = new Date(post.created_at);
        console.log(`Data formatada: ${date.toLocaleString('pt-BR')}`);
        console.log(`Timestamp: ${date.getTime()}`);
      }
    });

    // Verificar posts com created_at NULL
    const nullDatesResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM posts
      WHERE created_at IS NULL
    `);

    console.log(`\n\n=== Resumo ===`);
    console.log(`Posts com created_at NULL: ${nullDatesResult.rows[0].count}`);

    // Verificar range de datas
    const rangeResult = await pool.query(`
      SELECT
        MIN(created_at) as oldest,
        MAX(created_at) as newest,
        COUNT(*) as total_with_dates
      FROM posts
      WHERE created_at IS NOT NULL
    `);

    if (rangeResult.rows[0].total_with_dates > 0) {
      console.log(`Posts com datas válidas: ${rangeResult.rows[0].total_with_dates}`);
      console.log(`Data mais antiga: ${rangeResult.rows[0].oldest}`);
      console.log(`Data mais recente: ${rangeResult.rows[0].newest}`);
    }

    // Verificar timeline
    console.log(`\n\n=== Timeline ===`);
    const timelineResult = await pool.query(`
      SELECT * FROM daily_timeline
      ORDER BY date DESC
      LIMIT 5
    `);

    timelineResult.rows.forEach(row => {
      console.log(`Data: ${row.date} | Platform: ${row.platform} | Posts: ${row.posts_count}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkDates();
