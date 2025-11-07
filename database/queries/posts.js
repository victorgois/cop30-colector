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

    // Buscar top posts de cada plataforma separadamente
    // Isso garante que teremos posts de ambas as plataformas
    const query = `
      (
        SELECT * FROM posts
        WHERE platform = 'instagram' AND ${metric} IS NOT NULL AND ${metric} > 0
        ORDER BY ${metric} DESC
        LIMIT $1
      )
      UNION ALL
      (
        SELECT * FROM posts
        WHERE platform = 'tiktok' AND ${metric} IS NOT NULL AND ${metric} > 0
        ORDER BY ${metric} DESC
        LIMIT $1
      )
      ORDER BY ${metric} DESC
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

  // Buscar co-ocorrências de hashtags (hashtags que aparecem juntas)
  async getHashtagNetwork(minCoOccurrence = 3) {
    const query = `
      WITH hashtag_pairs AS (
        SELECT
          h1.hashtag as source,
          h2.hashtag as target,
          COUNT(*) as co_occurrence,
          ARRAY_AGG(DISTINCT p.platform) as platforms
        FROM posts p,
        LATERAL unnest(p.hashtags) h1(hashtag),
        LATERAL unnest(p.hashtags) h2(hashtag)
        WHERE h1.hashtag < h2.hashtag  -- Evita duplicatas (A-B e B-A)
        AND array_length(p.hashtags, 1) > 1  -- Posts com mais de 1 hashtag
        GROUP BY h1.hashtag, h2.hashtag
        HAVING COUNT(*) >= $1  -- Mínimo de co-ocorrências
      )
      SELECT
        source,
        target,
        co_occurrence as weight,
        platforms
      FROM hashtag_pairs
      ORDER BY co_occurrence DESC
      LIMIT 100;
    `;

    const result = await this.pool.query(query, [minCoOccurrence]);
    return result.rows;
  }

  // Buscar estatísticas de hashtags individuais para o grafo
  async getHashtagStats(limit = 50) {
    const query = `
      SELECT
        hashtag,
        SUM(usage_count::bigint) as usage_count,
        ARRAY_AGG(DISTINCT platform) as platforms,
        SUM(usage_count::bigint) as total_engagement
      FROM top_hashtags
      GROUP BY hashtag
      HAVING SUM(usage_count::bigint) >= 3
      ORDER BY SUM(usage_count::bigint) DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Análise de latência entre created_at e collected_at
  async getLatencyAnalysis(platform = null) {
    const query = `
      SELECT
        post_id,
        platform,
        created_at,
        collected_at,
        EXTRACT(EPOCH FROM (collected_at - created_at)) / 60 as latency_minutes,
        EXTRACT(EPOCH FROM (collected_at - created_at)) / 3600 as latency_hours,
        DATE(created_at) as post_date,
        DATE(collected_at) as collection_date,
        username,
        likes_count
      FROM posts
      WHERE created_at IS NOT NULL
        AND collected_at IS NOT NULL
        ${platform ? 'AND platform = $1' : ''}
      ORDER BY created_at DESC
    `;

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Histórico de coletas agrupado por sessão de coleta
  async getCollectionHistory(limit = 50) {
    const query = `
      SELECT
        DATE_TRUNC('hour', collected_at) as collection_time,
        platform,
        COUNT(*) as posts_collected,
        MIN(collected_at) as start_time,
        MAX(collected_at) as end_time,
        COUNT(DISTINCT keyword_matched) as keywords_count,
        ARRAY_AGG(DISTINCT keyword_matched) as keywords
      FROM posts
      WHERE collected_at IS NOT NULL
      GROUP BY DATE_TRUNC('hour', collected_at), platform
      ORDER BY collection_time DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Timeline de likes: quantidade de likes por data de postagem
  async getLikesTimeline(platform = null) {
    const query = `
      SELECT
        post_id,
        platform,
        created_at,
        likes_count,
        username,
        post_url
      FROM posts
      WHERE created_at IS NOT NULL
        AND likes_count IS NOT NULL
        AND likes_count > 0
        ${platform ? 'AND platform = $1' : ''}
      ORDER BY created_at DESC
    `;

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Top influenciadores por engajamento total
  async getTopInfluencers(limit = 20) {
    const query = `
      SELECT
        username,
        platform,
        COUNT(*) as post_count,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        SUM(views_count) as total_views,
        SUM(likes_count + comments_count) as total_engagement,
        ROUND(AVG(likes_count)) as avg_likes,
        ROUND(AVG(comments_count)) as avg_comments,
        MAX(created_at) as last_post_date
      FROM posts
      WHERE username IS NOT NULL
      GROUP BY username, platform
      ORDER BY total_engagement DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Comparativo entre plataformas
  async getPlatformComparison() {
    const query = `
      SELECT
        platform,
        COUNT(*) as total_posts,
        COUNT(DISTINCT username) as unique_users,
        ROUND(AVG(likes_count)) as avg_likes,
        ROUND(AVG(comments_count)) as avg_comments,
        ROUND(AVG(views_count)) as avg_views,
        MAX(likes_count) as max_likes,
        MAX(comments_count) as max_comments,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        -- Distribuição por tipo de mídia
        COUNT(CASE WHEN media_type ILIKE '%video%' THEN 1 END) as video_count,
        COUNT(CASE WHEN media_type ILIKE '%image%' OR media_type ILIKE '%photo%' OR media_type ILIKE '%sidecar%' THEN 1 END) as photo_count,
        -- Uso de hashtags
        ROUND(AVG(CASE WHEN hashtags IS NOT NULL THEN array_length(hashtags, 1) ELSE 0 END), 1) as avg_hashtags_per_post,
        -- Comprimento de caption
        ROUND(AVG(LENGTH(caption))) as avg_caption_length
      FROM posts
      WHERE platform IS NOT NULL
      GROUP BY platform
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  // Análise de performance de conteúdo
  async getContentPerformance() {
    const query = `
      SELECT
        post_id,
        platform,
        username,
        created_at,
        likes_count,
        comments_count,
        views_count,
        media_type,
        post_url,
        caption,
        hashtags,
        (likes_count + comments_count) as total_engagement,
        -- Razão comentários/likes (posts que geram discussão)
        CASE
          WHEN likes_count > 0 THEN ROUND((comments_count::numeric / likes_count::numeric) * 100, 2)
          ELSE 0
        END as comments_to_likes_ratio,
        -- Número de hashtags
        CASE
          WHEN hashtags IS NOT NULL THEN array_length(hashtags, 1)
          ELSE 0
        END as hashtag_count
      FROM posts
      WHERE likes_count IS NOT NULL
        AND comments_count IS NOT NULL
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query);
    return result.rows;
  }

  // Distribuição de engajamento (para histograma)
  async getEngagementDistribution(platform = null) {
    const query = `
      SELECT
        likes_count,
        comments_count,
        (likes_count + comments_count) as total_engagement,
        platform
      FROM posts
      WHERE likes_count IS NOT NULL
        AND comments_count IS NOT NULL
        ${platform ? 'AND platform = $1' : ''}
    `;

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Análise temporal de atividade (heatmap: dia da semana × hora do dia)
  async getTemporalActivity(platform = null) {
    const query = `
      SELECT
        EXTRACT(DOW FROM created_at) as day_of_week,
        EXTRACT(HOUR FROM created_at) as hour_of_day,
        COUNT(*) as post_count,
        ROUND(AVG(likes_count)) as avg_likes,
        ROUND(AVG(comments_count)) as avg_comments,
        platform
      FROM posts
      WHERE created_at IS NOT NULL
        ${platform ? 'AND platform = $1' : ''}
      GROUP BY day_of_week, hour_of_day, platform
      ORDER BY day_of_week, hour_of_day
    `;

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Evolução temporal de hashtags específicas
  async getHashtagEvolution(hashtags, platform = null) {
    const query = `
      SELECT
        DATE(created_at) as date,
        hashtag,
        COUNT(*) as usage_count,
        SUM(likes_count) as total_likes,
        SUM(comments_count) as total_comments,
        platform
      FROM posts,
      UNNEST(hashtags) as hashtag
      WHERE created_at IS NOT NULL
        AND hashtags IS NOT NULL
        AND hashtag = ANY($1)
        ${platform ? 'AND platform = $2' : ''}
      GROUP BY date, hashtag, platform
      ORDER BY date DESC
    `;

    const result = platform
      ? await this.pool.query(query, [hashtags, platform])
      : await this.pool.query(query, [hashtags]);

    return result.rows;
  }

  // Hashtags emergentes (crescimento recente)
  async getEmergingHashtags(limit = 20) {
    const query = `
      WITH recent_hashtags AS (
        SELECT
          hashtag,
          platform,
          COUNT(*) as recent_count,
          SUM(likes_count + comments_count) as recent_engagement
        FROM posts,
        UNNEST(hashtags) as hashtag
        WHERE created_at >= NOW() - INTERVAL '7 days'
          AND hashtags IS NOT NULL
        GROUP BY hashtag, platform
      ),
      older_hashtags AS (
        SELECT
          hashtag,
          platform,
          COUNT(*) as older_count
        FROM posts,
        UNNEST(hashtags) as hashtag
        WHERE created_at >= NOW() - INTERVAL '14 days'
          AND created_at < NOW() - INTERVAL '7 days'
          AND hashtags IS NOT NULL
        GROUP BY hashtag, platform
      )
      SELECT
        r.hashtag,
        r.platform,
        r.recent_count,
        r.recent_engagement,
        COALESCE(o.older_count, 0) as older_count,
        CASE
          WHEN COALESCE(o.older_count, 0) = 0 THEN 100
          ELSE ROUND(((r.recent_count::numeric - o.older_count::numeric) / o.older_count::numeric) * 100, 2)
        END as growth_rate
      FROM recent_hashtags r
      LEFT JOIN older_hashtags o ON r.hashtag = o.hashtag AND r.platform = o.platform
      WHERE r.recent_count >= 3
      ORDER BY growth_rate DESC, recent_engagement DESC
      LIMIT $1
    `;

    const result = await this.pool.query(query, [limit]);
    return result.rows;
  }

  // Análise de narrativas e discurso
  async getNarrativeAnalysis(platform = null) {
    const query = `
      SELECT
        post_id,
        platform,
        caption,
        LENGTH(caption) as caption_length,
        created_at,
        likes_count,
        comments_count,
        hashtags,
        -- Contar emojis (caracteres não-ASCII)
        LENGTH(caption) - LENGTH(REGEXP_REPLACE(caption, '[^[:ascii:]]', '', 'g')) as emoji_count,
        -- Contar menções (@)
        (LENGTH(caption) - LENGTH(REPLACE(caption, '@', ''))) as mention_count
      FROM posts
      WHERE caption IS NOT NULL
        AND caption != ''
        ${platform ? 'AND platform = $1' : ''}
      ORDER BY created_at DESC
    `;

    const result = platform
      ? await this.pool.query(query, [platform])
      : await this.pool.query(query);

    return result.rows;
  }

  // Palavras mais usadas nas captions (excluindo hashtags)
  async getTopWords(limit = 50, platform = null) {
    const query = `
      WITH words AS (
        SELECT
          LOWER(word) as word,
          COUNT(*) as word_count,
          platform
        FROM posts,
        LATERAL UNNEST(
          string_to_array(
            REGEXP_REPLACE(
              REGEXP_REPLACE(caption, '#\\S+', '', 'g'),  -- Remove hashtags
              '[^a-zA-ZÀ-ÿ\\s]', '', 'g'                   -- Remove pontuação
            ),
            ' '
          )
        ) as word
        WHERE caption IS NOT NULL
          AND LENGTH(word) >= 4  -- Palavras com 4+ letras
          ${platform ? 'AND platform = $1' : ''}
        GROUP BY word, platform
      )
      SELECT word, platform, word_count
      FROM words
      WHERE word NOT IN ('para', 'que', 'com', 'uma', 'mais', 'sobre', 'essa', 'esse', 'pela', 'pelo', 'como', 'muito', 'todos', 'todas', 'seus', 'suas')
      ORDER BY word_count DESC
      LIMIT $${platform ? '2' : '1'}
    `;

    const result = platform
      ? await this.pool.query(query, [platform, limit])
      : await this.pool.query(query, [limit]);

    return result.rows;
  }
}

module.exports = PostsQuery;
