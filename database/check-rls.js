#!/usr/bin/env node

/**
 * Script para verificar o estado atual do RLS nas tabelas
 * e testar a conexão com o banco
 */

require('dotenv').config();
const { Pool } = require('pg');

const isCloudDB = process.env.DATABASE_URL && (
  process.env.DATABASE_URL.includes('supabase.co') ||
  process.env.DATABASE_URL.includes('supabase.com')
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDB ? { rejectUnauthorized: false } : false
});

async function checkRLS() {
  console.log('🔍 Verificando estado do RLS...\n');

  try {
    // 1. Verificar estado do RLS nas tabelas
    console.log('📋 Estado do RLS nas tabelas:');
    const rlsQuery = `
      SELECT
        schemaname,
        tablename,
        rowsecurity as rls_enabled
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('posts', 'users', 'collection_logs')
      ORDER BY tablename;
    `;

    const rlsResult = await pool.query(rlsQuery);

    if (rlsResult.rows.length === 0) {
      console.log('❌ Nenhuma tabela encontrada! Verifique se o schema foi criado.');
      process.exit(1);
    }

    rlsResult.rows.forEach(row => {
      const status = row.rls_enabled ? '🔒 ATIVADO' : '🔓 DESATIVADO';
      console.log(`  ${row.tablename}: ${status}`);
    });

    // 2. Verificar políticas RLS existentes
    console.log('\n📜 Políticas RLS existentes:');
    const policiesQuery = `
      SELECT
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename IN ('posts', 'users', 'collection_logs')
      ORDER BY tablename, policyname;
    `;

    const policiesResult = await pool.query(policiesQuery);

    if (policiesResult.rows.length === 0) {
      console.log('  ⚠️  Nenhuma política encontrada');
    } else {
      policiesResult.rows.forEach(policy => {
        console.log(`\n  Tabela: ${policy.tablename}`);
        console.log(`  Nome: ${policy.policyname}`);
        console.log(`  Comando: ${policy.cmd}`);
        console.log(`  Permissivo: ${policy.permissive}`);
        console.log(`  Roles: ${policy.roles}`);
      });
    }

    // 3. Verificar views
    console.log('\n👁️  Views existentes:');
    const viewsQuery = `
      SELECT
        table_name,
        view_definition
      FROM information_schema.views
      WHERE table_schema = 'public'
        AND table_name IN ('stats_summary', 'daily_timeline', 'top_hashtags')
      ORDER BY table_name;
    `;

    const viewsResult = await pool.query(viewsQuery);

    if (viewsResult.rows.length === 0) {
      console.log('  ⚠️  Nenhuma view encontrada');
    } else {
      viewsResult.rows.forEach(view => {
        console.log(`  ✓ ${view.table_name}`);
      });
    }

    // 4. Testar consulta básica
    console.log('\n🧪 Testando consultas básicas:');

    try {
      const postsResult = await pool.query('SELECT COUNT(*) FROM posts');
      console.log(`  ✓ posts: ${postsResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ posts: ${err.message}`);
    }

    try {
      const usersResult = await pool.query('SELECT COUNT(*) FROM users');
      console.log(`  ✓ users: ${usersResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ users: ${err.message}`);
    }

    try {
      const logsResult = await pool.query('SELECT COUNT(*) FROM collection_logs');
      console.log(`  ✓ collection_logs: ${logsResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ collection_logs: ${err.message}`);
    }

    // 5. Testar views
    console.log('\n🧪 Testando views:');

    try {
      const statsResult = await pool.query('SELECT COUNT(*) FROM stats_summary');
      console.log(`  ✓ stats_summary: ${statsResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ stats_summary: ${err.message}`);
    }

    try {
      const timelineResult = await pool.query('SELECT COUNT(*) FROM daily_timeline');
      console.log(`  ✓ daily_timeline: ${timelineResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ daily_timeline: ${err.message}`);
    }

    try {
      const hashtagsResult = await pool.query('SELECT COUNT(*) FROM top_hashtags');
      console.log(`  ✓ top_hashtags: ${hashtagsResult.rows[0].count} registros`);
    } catch (err) {
      console.log(`  ❌ top_hashtags: ${err.message}`);
    }

    console.log('\n✅ Verificação concluída!');

    // Diagnóstico
    console.log('\n🔬 Diagnóstico:');
    const hasRLS = rlsResult.rows.some(row => row.rls_enabled);
    const hasPolicies = policiesResult.rows.length > 0;

    if (hasRLS && !hasPolicies) {
      console.log('  ⚠️  PROBLEMA DETECTADO: RLS está ativado mas não há políticas!');
      console.log('      Isso faz com que todas as consultas retornem vazias.');
      console.log('      Execute o script de correção de segurança para resolver.');
    } else if (!hasRLS) {
      console.log('  ⚠️  RLS está desativado. Execute o script de correção de segurança.');
    } else if (hasRLS && hasPolicies) {
      console.log('  ✓ RLS está ativado e políticas estão configuradas.');
    }

  } catch (error) {
    console.error('❌ Erro ao verificar RLS:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkRLS();
