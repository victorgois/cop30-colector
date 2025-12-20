-- Migração para corrigir problemas de segurança detectados pelo Supabase Linter
-- Data: 2025-12-17

-- ============================================================
-- 1. CORRIGIR VIEWS COM SECURITY DEFINER
-- ============================================================
-- As views serão recriadas sem SECURITY DEFINER, usando o comportamento
-- padrão SECURITY INVOKER (executa com permissões do usuário que consulta)

-- View para estatísticas rápidas
DROP VIEW IF EXISTS stats_summary;
CREATE VIEW stats_summary
WITH (security_invoker = true) AS
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
DROP VIEW IF EXISTS daily_timeline;
CREATE VIEW daily_timeline
WITH (security_invoker = true) AS
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
DROP VIEW IF EXISTS top_hashtags;
CREATE VIEW top_hashtags
WITH (security_invoker = true) AS
SELECT
    platform,
    UNNEST(hashtags) as hashtag,
    COUNT(*) as usage_count
FROM posts
WHERE hashtags IS NOT NULL
GROUP BY platform, hashtag
ORDER BY usage_count DESC;

-- ============================================================
-- 2. HABILITAR RLS NAS TABELAS
-- ============================================================

-- Tabela: posts
-- Leitura pública, escrita apenas para authenticated users
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para todos (anônimos e autenticados)
CREATE POLICY "Allow public read access on posts"
    ON posts
    FOR SELECT
    USING (true);

-- Política: Permitir INSERT apenas para authenticated users
CREATE POLICY "Allow authenticated insert on posts"
    ON posts
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir UPDATE apenas para authenticated users
CREATE POLICY "Allow authenticated update on posts"
    ON posts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir DELETE apenas para authenticated users
CREATE POLICY "Allow authenticated delete on posts"
    ON posts
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Tabela: users
-- Leitura pública, escrita apenas para authenticated users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para todos
CREATE POLICY "Allow public read access on users"
    ON users
    FOR SELECT
    USING (true);

-- Política: Permitir INSERT apenas para authenticated users
CREATE POLICY "Allow authenticated insert on users"
    ON users
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir UPDATE apenas para authenticated users
CREATE POLICY "Allow authenticated update on users"
    ON users
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir DELETE apenas para authenticated users
CREATE POLICY "Allow authenticated delete on users"
    ON users
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Tabela: collection_logs
-- Leitura pública, escrita apenas para authenticated users
ALTER TABLE collection_logs ENABLE ROW LEVEL SECURITY;

-- Política: Permitir SELECT para todos
CREATE POLICY "Allow public read access on collection_logs"
    ON collection_logs
    FOR SELECT
    USING (true);

-- Política: Permitir INSERT apenas para authenticated users
CREATE POLICY "Allow authenticated insert on collection_logs"
    ON collection_logs
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir UPDATE apenas para authenticated users
CREATE POLICY "Allow authenticated update on collection_logs"
    ON collection_logs
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Política: Permitir DELETE apenas para authenticated users
CREATE POLICY "Allow authenticated delete on collection_logs"
    ON collection_logs
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- Para verificar se as políticas foram criadas corretamente:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public';
