-- Schema do Banco de Dados PostgreSQL
-- Projeto: Sistema de Coleta de Dados COP30

-- Tabela principal de posts
CREATE TABLE IF NOT EXISTS posts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL, -- 'instagram' ou 'tiktok'
    post_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    user_id VARCHAR(255),
    caption TEXT,
    hashtags TEXT[], -- Array de hashtags
    keyword_matched VARCHAR(100), -- Palavra-chave que gerou a coleta
    created_at TIMESTAMP,
    collected_at TIMESTAMP DEFAULT NOW(),

    -- Métricas de engajamento
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    views_count INTEGER,

    -- URLs e mídia
    post_url TEXT,
    media_urls TEXT[],
    media_type VARCHAR(20), -- 'photo', 'video', 'carousel'

    -- Dados adicionais (JSON para flexibilidade)
    raw_data JSONB,

    -- Constraint
    CONSTRAINT platform_check CHECK (platform IN ('instagram', 'tiktok'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_keyword ON posts(keyword_matched);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_collected_at ON posts(collected_at);

-- Tabela de usuários (para análises)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    display_name VARCHAR(255),
    followers_count INTEGER,
    following_count INTEGER,
    bio TEXT,
    profile_url TEXT,
    collected_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, user_id)
);

-- Índices para tabela de usuários
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabela de métricas de coleta
CREATE TABLE IF NOT EXISTS collection_logs (
    id SERIAL PRIMARY KEY,
    execution_date TIMESTAMP DEFAULT NOW(),
    platform VARCHAR(20),
    keyword VARCHAR(100),
    posts_collected INTEGER,
    execution_time_seconds INTEGER,
    status VARCHAR(50), -- 'success', 'partial', 'failed'
    error_message TEXT,
    apify_run_id VARCHAR(255)
);

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_execution_date ON collection_logs(execution_date);
CREATE INDEX IF NOT EXISTS idx_logs_platform ON collection_logs(platform);
CREATE INDEX IF NOT EXISTS idx_logs_status ON collection_logs(status);

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW stats_summary AS
SELECT
    platform,
    COUNT(*) as total_posts,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(likes_count) as avg_likes,
    AVG(comments_count) as avg_comments,
    AVG(shares_count) as avg_shares,
    MAX(collected_at) as last_collection
FROM posts
GROUP BY platform;

-- View para timeline diária (apenas posts de 2025)
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
  AND EXTRACT(YEAR FROM created_at) = 2025  -- Apenas posts de 2025
GROUP BY DATE(created_at), platform, keyword_matched
ORDER BY date DESC;

-- View para top hashtags
CREATE OR REPLACE VIEW top_hashtags AS
SELECT
    platform,
    UNNEST(hashtags) as hashtag,
    COUNT(*) as usage_count
FROM posts
WHERE hashtags IS NOT NULL
GROUP BY platform, hashtag
ORDER BY usage_count DESC;
