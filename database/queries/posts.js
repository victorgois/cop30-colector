const { Pool } = require('pg');

class PostsQuery {
  constructor(pool) {
    this.pool = pool;
  }

  // Inserir novo post
  async insertPost(postData) {
    const query = `
      INSERT INTO posts (
        platform, post_id, username, user_id, caption, hashtags,
        keyword_matched, created_at, likes_count, comments_count,
        shares_count, views_count, post_url, media_urls, media_type, raw_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (post_id) DO UPDATE SET
        likes_count = EXCLUDED.likes_count,
        comments_count = EXCLUDED.comments_count,
        shares_count = EXCLUDED.shares_count,
        views_count = EXCLUDED.views_count
      RETURNING id;
    `;

    const values = [
      postData.platform,
      postData.post_id,
      postData.username,
      postData.user_id,
      postData.caption,
      postData.hashtags,
      postData.keyword_matched,
      postData.created_at,
      postData.likes_count,
      postData.comments_count,
      postData.shares_count,
      postData.views_count,
      postData.post_url,
      postData.media_urls,
      postData.media_type,
      postData.raw_data
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Buscar posts com filtros
  async getPosts(filters = {}) {
    let query = 'SELECT * FROM posts WHERE 1=1';
    const values = [];
    let paramCount = 1;

    if (filters.platform) {
      query += ` AND platform = $${paramCount}`;
      values.push(filters.platform);
      paramCount++;
    }

    if (filters.keyword) {
      query += ` AND keyword_matched = $${paramCount}`;
      values.push(filters.keyword);
      paramCount++;
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramCount}`;
      values.push(filters.start_date);
      paramCount++;
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramCount}`;
      values.push(filters.end_date);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT ${filters.limit || 100}`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Buscar estatísticas gerais
  async getStats() {
    const query = 'SELECT * FROM stats_summary';
    const result = await this.pool.query(query);
    return result.rows;
  }

  // Buscar dados para timeline
  async getTimeline(granularity = 'day', platform = null) {
    const query = platform
      ? 'SELECT * FROM daily_timeline WHERE platform = $1 ORDER BY date DESC'
      : 'SELECT * FROM daily_timeline ORDER BY date DESC';

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Top hashtags
  async getTopHashtags(limit = 50, platform = null) {
    const query = platform
      ? 'SELECT * FROM top_hashtags WHERE platform = $1 LIMIT $2'
      : 'SELECT * FROM top_hashtags LIMIT $1';

    const result = platform
      ? await this.pool.query(query, [platform, limit])
      : await this.pool.query(query, [limit]);

    return result.rows;
  }

  // Top posts por métrica
  async getTopPosts(metric = 'likes_count', limit = 20) {
    const validMetrics = ['likes_count', 'comments_count', 'shares_count', 'views_count'];
    if (!validMetrics.includes(metric)) {
      throw new Error('Invalid metric');
    }

    const query = `
      SELECT * FROM posts
      WHERE ${metric} IS NOT NULL
      ORDER BY ${metric} DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Verificar se post já existe
  async postExists(postId) {
    const query = 'SELECT id FROM posts WHERE post_id = $1';
    const result = await this.pool.query(query, [postId]);
    return result.rows.length > 0;
  }
}

module.exports = PostsQuery;
