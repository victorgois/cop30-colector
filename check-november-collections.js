const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkNovemberCollections() {
  try {
    // Verificar coletas por dia em novembro
    const query = `
      SELECT 
        DATE(collected_at) as collection_date,
        platform,
        COUNT(*) as posts_count,
        MIN(collected_at) as first_collection,
        MAX(collected_at) as last_collection
      FROM posts
      WHERE collected_at >= '2025-11-01' 
        AND collected_at < '2025-12-01'
      GROUP BY DATE(collected_at), platform
      ORDER BY collection_date DESC, platform;
    `;

    console.log('=== Coletas em Novembro 2025 ===\n');
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('❌ Nenhuma coleta encontrada em novembro de 2025');
    } else {
      console.table(result.rows);
    }

    // Verificar se há posts criados nos dias 01-03 mas coletados depois
    const checkPostsQuery = `
      SELECT 
        DATE(created_at) as post_date,
        DATE(collected_at) as collection_date,
        platform,
        COUNT(*) as count
      FROM posts
      WHERE created_at >= '2025-11-01' 
        AND created_at < '2025-11-04'
      GROUP BY DATE(created_at), DATE(collected_at), platform
      ORDER BY post_date, collection_date, platform;
    `;

    console.log('\n=== Posts criados em 01-03/11 (independente de quando foram coletados) ===\n');
    const postsResult = await pool.query(checkPostsQuery);
    
    if (postsResult.rows.length === 0) {
      console.log('❌ Nenhum post com data de criação entre 01-03/11');
    } else {
      console.table(postsResult.rows);
    }

    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkNovemberCollections();
