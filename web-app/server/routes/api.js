const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const PostsQuery = require('../../../database/queries/posts');
const fs = require('fs');
const path = require('path');

// Configurar pool de conexão PostgreSQL
// Detectar se é um serviço de cloud que requer SSL (Render, Supabase, etc)
const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('render.com') ||
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isCloudDB)
    ? { rejectUnauthorized: false }
    : false
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

// GET /api/latency-analysis - Análise de latência entre created_at e collected_at
router.get('/latency-analysis', async (req, res) => {
  try {
    const { platform } = req.query;
    const data = await postsQuery.getLatencyAnalysis(platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar análise de latência:', error);
    res.status(500).json({ error: 'Erro ao buscar análise de latência' });
  }
});

// GET /api/collection-history - Histórico de coletas
router.get('/collection-history', async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await postsQuery.getCollectionHistory(parseInt(limit) || 50);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar histórico de coletas:', error);
    res.status(500).json({ error: 'Erro ao buscar histórico de coletas' });
  }
});

// GET /api/likes-timeline - Timeline de likes por data de postagem
router.get('/likes-timeline', async (req, res) => {
  try {
    const { platform } = req.query;
    const data = await postsQuery.getLikesTimeline(platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar timeline de likes:', error);
    res.status(500).json({ error: 'Erro ao buscar timeline de likes' });
  }
});

// GET /api/update-timeline - Atualizar view para mostrar apenas 2025
router.get('/update-timeline', async (req, res) => {
  try {
    console.log('🔄 Atualizando view daily_timeline...');

    const query = `
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
        AND EXTRACT(YEAR FROM created_at) = 2025
      GROUP BY DATE(created_at), platform, keyword_matched
      ORDER BY date DESC;
    `;

    await pool.query(query);

    console.log('✅ View daily_timeline atualizada!');

    res.json({
      status: 'success',
      message: '✅ View daily_timeline atualizada para mostrar apenas posts de 2025!',
      note: 'Faça hard refresh (Ctrl+Shift+R) no navegador para ver as mudanças.'
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar view:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao atualizar view',
      error: error.message
    });
  }
});

// GET /api/influencers - Top influenciadores por engajamento
router.get('/influencers', async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await postsQuery.getTopInfluencers(limit ? parseInt(limit) : 20);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar influenciadores:', error);
    res.status(500).json({ error: 'Erro ao buscar influenciadores' });
  }
});

// GET /api/platform-comparison - Comparativo entre plataformas
router.get('/platform-comparison', async (req, res) => {
  try {
    const data = await postsQuery.getPlatformComparison();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar comparativo de plataformas:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo de plataformas' });
  }
});

// GET /api/content-performance - Análise de performance de conteúdo
router.get('/content-performance', async (req, res) => {
  try {
    const data = await postsQuery.getContentPerformance();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar performance de conteúdo:', error);
    res.status(500).json({ error: 'Erro ao buscar performance de conteúdo' });
  }
});

// GET /api/engagement-distribution - Distribuição de engajamento
router.get('/engagement-distribution', async (req, res) => {
  try {
    const { platform } = req.query;
    const data = await postsQuery.getEngagementDistribution(platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar distribuição de engajamento:', error);
    res.status(500).json({ error: 'Erro ao buscar distribuição de engajamento' });
  }
});

// GET /api/temporal-activity - Análise temporal de atividade (heatmap)
router.get('/temporal-activity', async (req, res) => {
  try {
    const { platform } = req.query;
    const data = await postsQuery.getTemporalActivity(platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar atividade temporal:', error);
    res.status(500).json({ error: 'Erro ao buscar atividade temporal' });
  }
});

// GET /api/hashtag-evolution - Evolução temporal de hashtags
router.get('/hashtag-evolution', async (req, res) => {
  try {
    const { hashtags, platform } = req.query;
    if (!hashtags) {
      return res.status(400).json({ error: 'Parâmetro hashtags é obrigatório' });
    }
    const hashtagArray = hashtags.split(',').map(h => h.trim().toLowerCase().replace('#', ''));
    const data = await postsQuery.getHashtagEvolution(hashtagArray, platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar evolução de hashtags:', error);
    res.status(500).json({ error: 'Erro ao buscar evolução de hashtags' });
  }
});

// GET /api/emerging-hashtags - Hashtags emergentes
router.get('/emerging-hashtags', async (req, res) => {
  try {
    const { limit } = req.query;
    const data = await postsQuery.getEmergingHashtags(limit ? parseInt(limit) : 20);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar hashtags emergentes:', error);
    res.status(500).json({ error: 'Erro ao buscar hashtags emergentes' });
  }
});

// GET /api/narrative-analysis - Análise de narrativas e discurso
router.get('/narrative-analysis', async (req, res) => {
  try {
    const { platform } = req.query;
    const data = await postsQuery.getNarrativeAnalysis(platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar análise de narrativas:', error);
    res.status(500).json({ error: 'Erro ao buscar análise de narrativas' });
  }
});

// GET /api/top-words - Palavras mais usadas nas captions
router.get('/top-words', async (req, res) => {
  try {
    const { limit, platform } = req.query;
    const data = await postsQuery.getTopWords(limit ? parseInt(limit) : 50, platform);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar palavras mais usadas:', error);
    res.status(500).json({ error: 'Erro ao buscar palavras mais usadas' });
  }
});

// GET /api/setup - Inicializar banco de dados (executar UMA vez após deploy)
router.get('/setup', async (req, res) => {
  try {
    console.log('🔄 Iniciando setup do banco de dados...');

    // Verificar se já foi inicializado
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'posts'
      ) as exists;
    `;

    const checkResult = await pool.query(checkQuery);

    if (checkResult.rows[0].exists) {
      return res.json({
        status: 'already_initialized',
        message: '✅ Banco de dados já foi inicializado anteriormente.',
        tables: ['posts', 'users', 'collection_logs'],
        views: ['stats_summary', 'daily_timeline', 'top_hashtags']
      });
    }

    // Ler e executar o schema.sql
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📄 Executando schema.sql...');
    await pool.query(schema);

    console.log('✅ Banco de dados inicializado com sucesso!');

    res.json({
      status: 'success',
      message: '✅ Banco de dados inicializado com sucesso!',
      created: {
        tables: ['posts', 'users', 'collection_logs'],
        views: ['stats_summary', 'daily_timeline', 'top_hashtags'],
        indexes: ['idx_posts_platform', 'idx_posts_created_at', 'idx_posts_keyword', 'idx_posts_hashtags']
      },
      next_steps: [
        'Banco de dados está pronto!',
        'Você pode começar a usar a aplicação',
        'Execute o collector para popular com dados'
      ]
    });

  } catch (error) {
    console.error('❌ Erro ao inicializar banco:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao inicializar banco de dados',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
