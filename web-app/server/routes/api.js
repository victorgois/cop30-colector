const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const PostsQuery = require('../../../database/queries/posts');

// Configurar pool de conexão PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const postsQuery = new PostsQuery(pool);

// GET /api/posts - Lista posts com filtros
router.get('/posts', async (req, res) => {
  try {
    const { platform, keyword, start_date, end_date, limit } = req.query;

    const filters = {
      platform,
      keyword,
      start_date,
      end_date,
      limit: parseInt(limit) || 100
    };

    const posts = await postsQuery.getPosts(filters);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
});

// GET /api/stats - Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    const stats = await postsQuery.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro ao buscar estatísticas' });
  }
});

// GET /api/timeline - Dados para gráfico temporal
router.get('/timeline', async (req, res) => {
  try {
    const { granularity, platform } = req.query;
    const timeline = await postsQuery.getTimeline(granularity || 'day', platform);
    res.json(timeline);
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    res.status(500).json({ error: 'Erro ao buscar timeline' });
  }
});

// GET /api/hashtags - Top hashtags
router.get('/hashtags', async (req, res) => {
  try {
    const { limit, platform } = req.query;
    const hashtags = await postsQuery.getTopHashtags(parseInt(limit) || 50, platform);
    res.json(hashtags);
  } catch (error) {
    console.error('Erro ao buscar hashtags:', error);
    res.status(500).json({ error: 'Erro ao buscar hashtags' });
  }
});

// GET /api/top-posts - Posts com maior engajamento
router.get('/top-posts', async (req, res) => {
  try {
    const { metric, limit } = req.query;
    const topPosts = await postsQuery.getTopPosts(metric || 'likes_count', parseInt(limit) || 20);
    res.json(topPosts);
  } catch (error) {
    console.error('Erro ao buscar top posts:', error);
    res.status(500).json({ error: 'Erro ao buscar top posts' });
  }
});

// GET /api/users/influential - Usuários mais influentes
router.get('/users/influential', async (req, res) => {
  try {
    const { limit } = req.query;
    const query = `
      SELECT
        platform,
        username,
        user_id,
        followers_count,
        COUNT(*) as posts_count,
        SUM(likes_count) as total_likes,
        AVG(likes_count) as avg_likes
      FROM users u
      JOIN posts p ON u.user_id = p.user_id AND u.platform = p.platform
      WHERE followers_count IS NOT NULL
      GROUP BY u.platform, u.username, u.user_id, u.followers_count
      ORDER BY followers_count DESC, total_likes DESC
      LIMIT $1
    `;

    const result = await pool.query(query, [parseInt(limit) || 30]);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar usuários influentes:', error);
    res.status(500).json({ error: 'Erro ao buscar usuários influentes' });
  }
});

// GET /api/hashtag-network - Rede de co-ocorrências de hashtags
router.get('/hashtag-network', async (req, res) => {
  try {
    const { minCoOccurrence } = req.query;

    const links = await postsQuery.getHashtagNetwork(parseInt(minCoOccurrence) || 3);
    const nodes = await postsQuery.getHashtagStats(50);

    res.json({
      nodes: nodes.map(n => ({
        id: n.hashtag,
        name: n.hashtag,
        value: parseInt(n.usage_count),
        engagement: parseInt(n.total_engagement || 0),
        platforms: n.platforms
      })),
      links: links.map(l => ({
        source: l.source,
        target: l.target,
        value: parseInt(l.weight),
        platforms: l.platforms
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar rede de hashtags:', error);
    res.status(500).json({ error: 'Erro ao buscar rede de hashtags' });
  }
});

module.exports = router;
