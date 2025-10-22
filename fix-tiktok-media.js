#!/usr/bin/env node
/**
 * Script para corrigir media_urls de posts do TikTok
 */

require('dotenv').config();
const pool = require('./database/connection');

async function fixTikTokMedia() {
  console.log('=== Corrigindo media_urls do TikTok ===\n');

  try {
    // Buscar posts do TikTok com media_urls vazio
    const result = await pool.query(`
      SELECT id, post_id, username, media_urls, raw_data
      FROM posts
      WHERE platform = 'tiktok'
    `);

    console.log(`Total de posts TikTok encontrados: ${result.rows.length}\n`);

    let updated = 0;
    let skipped = 0;

    for (const post of result.rows) {
      try {
        const coverUrl = post.raw_data?.videoMeta?.coverUrl;

        if (!coverUrl) {
          console.log(`⚠️  Post ${post.post_id} não tem coverUrl no raw_data`);
          skipped++;
          continue;
        }

        // Atualizar media_urls
        await pool.query(
          `UPDATE posts SET media_urls = $1 WHERE id = $2`,
          [[coverUrl], post.id]
        );

        console.log(`✅ Atualizado: ${post.username} (${post.post_id})`);
        updated++;
      } catch (err) {
        console.error(`❌ Erro ao processar post ${post.post_id}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n=== Resumo ===`);
    console.log(`Posts atualizados: ${updated}`);
    console.log(`Posts ignorados: ${skipped}`);
    console.log(`\n✅ Concluído!`);

  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

fixTikTokMedia();
