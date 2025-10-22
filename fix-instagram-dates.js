#!/usr/bin/env node
/**
 * Atualiza os created_at dos posts do Instagram usando o campo timestamp do raw_data
 */

require('dotenv').config();
const pool = require('./database/connection');

async function fixInstagramDates() {
  console.log('=== Atualizando datas dos posts do Instagram ===\n');

  try {
    // Buscar posts do Instagram sem data
    const result = await pool.query(`
      SELECT id, raw_data
      FROM posts
      WHERE platform = 'instagram' AND created_at IS NULL
      LIMIT 20000
    `);

    console.log(`Posts encontrados: ${result.rows.length}`);

    let updated = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        const rawData = row.raw_data;
        let createdAt = null;

        // Tentar extrair timestamp
        if (rawData.timestamp) {
          if (typeof rawData.timestamp === 'string') {
            const parsed = new Date(rawData.timestamp);
            if (!isNaN(parsed.getTime())) {
              createdAt = parsed;
            }
          } else if (!isNaN(rawData.timestamp)) {
            createdAt = new Date(rawData.timestamp * 1000);
          }
        }

        if (createdAt) {
          await pool.query(
            'UPDATE posts SET created_at = $1 WHERE id = $2',
            [createdAt, row.id]
          );
          updated++;

          if (updated % 500 === 0) {
            console.log(`Progresso: ${updated}/${result.rows.length}`);
          }
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        console.error(`Erro no post ${row.id}:`, error.message);
      }
    }

    console.log(`\n✅ Atualização concluída!`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Failed: ${failed}`);

    // Verificar resultado
    const checkResult = await pool.query(`
      SELECT platform, COUNT(*) as total, COUNT(created_at) as with_date
      FROM posts
      GROUP BY platform
    `);

    console.log(`\n📊 Resultado final:`);
    console.table(checkResult.rows);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixInstagramDates();
