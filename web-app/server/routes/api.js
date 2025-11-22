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

// Configuração de conexão simplificada
const getPoolConfig = async () => {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL não configurada');
  }

  console.log('📝 Usando DATABASE_URL do Supabase Pooler');

  return {
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  };
};

// Pool será inicializado de forma lazy (na primeira consulta)
let pool = null;
let poolPromise = null;

async function getPool() {
  if (pool) return pool;

  if (!poolPromise) {
    poolPromise = (async () => {
      const config = await getPoolConfig();

      // Log detalhado da connection string para debug
      if (config.connectionString) {
        const masked = config.connectionString.replace(/:([^@]+)@/, ':***@');
        console.log('🔧 Connection String:', masked);

        // Extrair e mostrar o hostname
        const match = config.connectionString.match(/@([^:]+):(\d+)/);
        if (match) {
          console.log('🌐 Hostname extraído:', match[1]);
          console.log('🔌 Porta:', match[2]);
        }
      }

      pool = new Pool(config);
      return pool;
    })();
  }

  return poolPromise;
}

// PostsQuery será inicializado junto com o pool
let postsQuery = null;

async function getPostsQuery() {
  if (postsQuery) return postsQuery;

  const poolInstance = await getPool();
  postsQuery = new PostsQuery(poolInstance);
  return postsQuery;
}

// GET /api/debug - Debug connection string
router.get('/debug', async (req, res) => {
  const dbUrl = process.env.DATABASE_URL || 'not set';

  // Mascarar senha para segurança
  const maskedUrl = dbUrl.replace(/:([^@]+)@/, ':***@');

  res.json({
    database_url_set: !!process.env.DATABASE_URL,
    database_url_length: dbUrl.length,
    database_url_preview: maskedUrl,
    node_env: process.env.NODE_ENV,
    is_cloud_db: isCloudDB,
    ssl_enabled: (process.env.NODE_ENV === 'production' || isCloudDB),
    pg_individual_vars: {
      PGHOST: process.env.PGHOST || 'not set',
      PGPORT: process.env.PGPORT || 'not set',
      PGDATABASE: process.env.PGDATABASE || 'not set',
      PGUSER: process.env.PGUSER || 'not set',
      PGPASSWORD: process.env.PGPASSWORD ? '***set***' : 'not set'
    },
    pool_config_type: process.env.PGHOST ? 'individual_vars' : 'connection_string'
  });
});

// GET /api/health - Health check e teste de conexão
router.get('/health', async (req, res) => {
  // Extrair host da connection string de forma segura
  let dbHost = 'unknown';
  if (process.env.DATABASE_URL) {
    const match = process.env.DATABASE_URL.match(/@([^:\/]+)/);
    dbHost = match ? match[1] : 'parse error';
  }

  try {
    // Usar o pool principal que já resolve para IPv4
    const poolInstance = await getPool();
    const result = await poolInstance.query('SELECT NOW() as time, COUNT(*) as post_count FROM posts');

    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].time,
      posts: result.rows[0].post_count,
      database_url_configured: !!process.env.DATABASE_URL,
      database_host: dbHost
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      stack: error.stack,
      code: error.code,
      database_url_configured: !!process.env.DATABASE_URL,
      database_host: dbHost
    });
  }
});

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

    const query = await getPostsQuery();
    const posts = await query.getPosts(filters);
    res.json(posts);
  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({ error: 'Erro ao buscar posts' });
  }
});

// GET /api/stats - Estatísticas gerais
router.get('/stats', async (req, res) => {
  try {
    console.log('[API] Buscando estatísticas...');
    console.log('[API] DATABASE_URL configurada:', !!process.env.DATABASE_URL);
    const query = await getPostsQuery();
    const stats = await query.getStats();
    console.log('[API] Estatísticas encontradas:', stats.length, 'registros');
    res.json(stats);
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: 'Erro ao buscar estatísticas',
      details: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// GET /api/timeline - Dados para gráfico temporal
router.get('/timeline', async (req, res) => {
  try {
    const { granularity, platform } = req.query;
    const query = await getPostsQuery();
    const timeline = await query.getTimeline(granularity || 'day', platform);
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
    const query = await getPostsQuery();
    const hashtags = await query.getTopHashtags(parseInt(limit) || 50, platform);
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
    const query = await getPostsQuery();
    const topPosts = await query.getTopPosts(metric || 'likes_count', parseInt(limit) || 20);
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

    const poolInstance = await getPool();
    const result = await poolInstance.query(query, [parseInt(limit) || 30]);
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
    const query = await getPostsQuery();

    const links = await query.getHashtagNetwork(parseInt(minCoOccurrence) || 3);
    const nodes = await query.getHashtagStats(50);

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
    const query = await getPostsQuery();
    const data = await query.getLatencyAnalysis(platform);
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
    const query = await getPostsQuery();
    const data = await query.getCollectionHistory(parseInt(limit) || 50);
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
    const query = await getPostsQuery();
    const data = await query.getLikesTimeline(platform);
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

    const poolInstance = await getPool();
    await poolInstance.query(query);

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
    const query = await getPostsQuery();
    const data = await query.getTopInfluencers(limit ? parseInt(limit) : 20);
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar influenciadores:', error);
    res.status(500).json({ error: 'Erro ao buscar influenciadores' });
  }
});

// GET /api/platform-comparison - Comparativo entre plataformas
router.get('/platform-comparison', async (req, res) => {
  try {
    const query = await getPostsQuery();
    const data = await query.getPlatformComparison();
    res.json(data);
  } catch (error) {
    console.error('Erro ao buscar comparativo de plataformas:', error);
    res.status(500).json({ error: 'Erro ao buscar comparativo de plataformas' });
  }
});

// GET /api/content-performance - Análise de performance de conteúdo
router.get('/content-performance', async (req, res) => {
  try {
    const query = await getPostsQuery();
    const data = await query.getContentPerformance();
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
    const query = await getPostsQuery();
    const data = await query.getEngagementDistribution(platform);
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
    const query = await getPostsQuery();
    const data = await query.getTemporalActivity(platform);
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
    const query = await getPostsQuery();
    const data = await query.getHashtagEvolution(hashtagArray, platform);
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
    const query = await getPostsQuery();
    const data = await query.getEmergingHashtags(limit ? parseInt(limit) : 20);
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
    const query = await getPostsQuery();
    const data = await query.getNarrativeAnalysis(platform);
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
    const query = await getPostsQuery();
    const data = await query.getTopWords(limit ? parseInt(limit) : 50, platform);
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

    const poolInstance = await getPool();

    // Verificar se já foi inicializado
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'posts'
      ) as exists;
    `;

    const checkResult = await poolInstance.query(checkQuery);

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
    await poolInstance.query(schema);

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
