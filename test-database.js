#!/usr/bin/env node
/**
 * Script de teste da conexão com banco de dados
 */

require('dotenv').config();
const pool = require('./database/connection');
const PostsQuery = require('./database/queries/posts');

async function testDatabase() {
  console.log('=== Teste de Conexão com Banco de Dados ===\n');

  try {
    // Teste 1: Conexão básica
    console.log('1️⃣  Testando conexão básica...');
    const timeResult = await pool.query('SELECT NOW()');
    console.log('✅ Conexão estabelecida:', timeResult.rows[0].now);

    // Teste 2: Verificar tabelas
    console.log('\n2️⃣  Verificando tabelas...');
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const tables = tablesResult.rows.map(r => r.table_name);
    const expectedTables = ['posts', 'users', 'collection_logs'];

    console.log('Tabelas encontradas:', tables.join(', '));

    for (const table of expectedTables) {
      if (tables.includes(table)) {
        console.log(`✅ Tabela '${table}' existe`);
      } else {
        console.log(`❌ Tabela '${table}' não encontrada`);
      }
    }

    // Teste 3: Verificar views
    console.log('\n3️⃣  Verificando views...');
    const viewsResult = await pool.query(`
      SELECT table_name
      FROM information_schema.views
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const views = viewsResult.rows.map(r => r.table_name);
    console.log('Views encontradas:', views.join(', ') || 'nenhuma');

    // Teste 4: Contar registros
    console.log('\n4️⃣  Contando registros...');
    const postsCount = await pool.query('SELECT COUNT(*) FROM posts');
    const usersCount = await pool.query('SELECT COUNT(*) FROM users');
    const logsCount = await pool.query('SELECT COUNT(*) FROM collection_logs');

    console.log(`📊 Posts: ${postsCount.rows[0].count}`);
    console.log(`👥 Users: ${usersCount.rows[0].count}`);
    console.log(`📝 Logs: ${logsCount.rows[0].count}`);

    // Teste 5: Testar PostsQuery
    console.log('\n5️⃣  Testando queries...');
    const postsQuery = new PostsQuery(pool);

    const stats = await postsQuery.getStats();
    console.log('✅ getStats() funcionando');

    if (stats.length > 0) {
      console.log('Estatísticas:', stats);
    }

    // Teste 6: Inserir post de teste
    console.log('\n6️⃣  Testando inserção de post...');
    const testPost = {
      platform: 'instagram',
      post_id: `test_${Date.now()}`,
      username: 'test_user',
      user_id: '123456',
      caption: 'Post de teste #COP30',
      hashtags: ['COP30', 'teste'],
      keyword_matched: 'COP30',
      created_at: new Date(),
      likes_count: 10,
      comments_count: 2,
      shares_count: 1,
      views_count: 100,
      post_url: 'https://instagram.com/p/test',
      media_urls: ['https://example.com/image.jpg'],
      media_type: 'photo',
      raw_data: { test: true }
    };

    const inserted = await postsQuery.insertPost(testPost);
    console.log('✅ Post de teste inserido com ID:', inserted.id);

    // Verificar se foi inserido
    const posts = await postsQuery.getPosts({ limit: 1 });
    console.log('✅ Post recuperado:', posts[0]?.username);

    // Deletar post de teste
    await pool.query('DELETE FROM posts WHERE post_id = $1', [testPost.post_id]);
    console.log('✅ Post de teste deletado');

    console.log('\n✅ Todos os testes passaram!');
    console.log('\n🎉 Banco de dados está configurado corretamente!\n');

  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
    console.error('\nDetalhes:', error);
    console.log('\n💡 Dicas:');
    console.log('1. Verifique se DATABASE_URL está configurado no .env');
    console.log('2. Verifique se o PostgreSQL está rodando');
    console.log('3. Execute o schema: psql DATABASE_URL < database/schema.sql');
    console.log('\nVeja o guia completo em: SETUP-DATABASE.md\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar teste
testDatabase();
