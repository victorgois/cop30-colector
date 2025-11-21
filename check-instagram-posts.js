const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkPosts() {
  try {
    // Estatísticas gerais por plataforma
    const statsQuery = `
      SELECT
        platform,
        COUNT(*) as total,
        COUNT(CASE WHEN likes_count > 0 THEN 1 END) as with_likes,
        COUNT(CASE WHEN comments_count > 0 THEN 1 END) as with_comments,
        MAX(likes_count) as max_likes,
        MAX(comments_count) as max_comments
      FROM posts
      GROUP BY platform;
    `;

    console.log('=== Estatísticas por Plataforma ===');
    const stats = await pool.query(statsQuery);
    console.table(stats.rows);

    // Top 5 posts do Instagram por likes
    const instagramTopLikes = `
      SELECT username, likes_count, comments_count, created_at
      FROM posts
      WHERE platform = 'instagram' AND likes_count IS NOT NULL
      ORDER BY likes_count DESC
      LIMIT 5;
    `;

    console.log('\n=== Top 5 Instagram por Likes ===');
    const topLikes = await pool.query(instagramTopLikes);
    console.table(topLikes.rows);

    // Top 5 posts do Instagram por comentários
    const instagramTopComments = `
      SELECT username, comments_count, likes_count, created_at
      FROM posts
      WHERE platform = 'instagram' AND comments_count IS NOT NULL
      ORDER BY comments_count DESC
      LIMIT 5;
    `;

    console.log('\n=== Top 5 Instagram por Comentários ===');
    const topComments = await pool.query(instagramTopComments);
    console.table(topComments.rows);

    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkPosts();
