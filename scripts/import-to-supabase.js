#!/usr/bin/env node
/**
 * Script para importar dados para o Supabase
 * Usa o backup gerado pelo export-from-render.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function importToSupabase(backupFile) {
  console.log('🔄 Iniciando importação para Supabase...\n');

  // Verificar se DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ Erro: DATABASE_URL não configurada no .env');
    console.error('   Configure a connection string do Supabase antes de continuar.\n');
    process.exit(1);
  }

  // Verificar se é conexão Supabase
  if (!process.env.DATABASE_URL.includes('supabase')) {
    console.log('⚠️  ATENÇÃO: A DATABASE_URL não parece ser do Supabase.');
    const answer = await askQuestion('   Deseja continuar mesmo assim? (s/N): ');
    if (answer.toLowerCase() !== 's') {
      console.log('Operação cancelada.');
      process.exit(0);
    }
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Testar conexão
    console.log('🔄 Testando conexão com Supabase...');
    await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao Supabase!\n');

    // Verificar se o schema já foi criado
    console.log('🔄 Verificando schema...');
    const schemaCheck = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('posts', 'users', 'collection_logs')
    `);

    if (schemaCheck.rows.length === 0) {
      console.log('📋 Schema não encontrado. Criando tabelas...\n');

      // Executar schema.sql
      const schemaPath = path.join(__dirname, '../database/schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);

      console.log('✅ Schema criado com sucesso!\n');
    } else {
      console.log(`✅ Schema encontrado (${schemaCheck.rows.length}/3 tabelas)\n`);
    }

    // Determinar arquivo de backup
    let backupFileToUse = backupFile;

    if (!backupFileToUse) {
      // Procurar o backup JSON mais recente
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        console.error('❌ Erro: Diretório de backups não encontrado.');
        console.error('   Execute primeiro: npm run db:export\n');
        process.exit(1);
      }

      const backups = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.json'))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.error('❌ Erro: Nenhum arquivo de backup JSON encontrado.');
        console.error('   Execute primeiro: npm run db:export\n');
        process.exit(1);
      }

      backupFileToUse = path.join(backupDir, backups[0]);
      console.log('📁 Usando backup JSON mais recente:', backups[0], '\n');
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(backupFileToUse)) {
      console.error('❌ Erro: Arquivo de backup não encontrado:', backupFileToUse);
      process.exit(1);
    }

    // Verificar se já existem dados
    const dataCheck = await pool.query('SELECT COUNT(*) FROM posts');
    const existingPosts = parseInt(dataCheck.rows[0].count);

    if (existingPosts > 0) {
      console.log(`⚠️  ATENÇÃO: Já existem ${existingPosts} posts no banco!\n`);
      const answer = await askQuestion('   Deseja limpar os dados existentes? (s/N): ');

      if (answer.toLowerCase() === 's') {
        console.log('\n🔄 Limpando dados existentes...');
        await pool.query('TRUNCATE posts, users, collection_logs RESTART IDENTITY CASCADE');
        console.log('✅ Dados limpos!\n');
      } else {
        console.log('⚠️  Os dados serão importados junto com os existentes.');
        console.log('   Podem ocorrer conflitos de chave primária.\n');
      }
    }

    // Ler e importar dados do JSON
    console.log('🔄 Importando dados...\n');
    const jsonContent = fs.readFileSync(backupFileToUse, 'utf8');
    const data = JSON.parse(jsonContent);

    let imported = 0;

    // Importar posts
    if (data.posts && data.posts.length > 0) {
      console.log(`📝 Importando ${data.posts.length} posts...`);
      for (const post of data.posts) {
        try {
          await pool.query(
            `INSERT INTO posts (id, platform, post_id, username, user_id, caption, hashtags, keyword_matched,
             created_at, collected_at, likes_count, comments_count, shares_count, views_count,
             post_url, media_urls, media_type, raw_data)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
            [
              post.id, post.platform, post.post_id, post.username, post.user_id, post.caption,
              post.hashtags, post.keyword_matched, post.created_at, post.collected_at,
              post.likes_count, post.comments_count, post.shares_count, post.views_count,
              post.post_url, post.media_urls, post.media_type, post.raw_data
            ]
          );
          imported++;
          if (imported % 50 === 0) {
            process.stdout.write(`\r   Importados: ${imported}/${data.posts.length} posts`);
          }
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            continue;
          }
          console.error('\n❌ Erro ao importar post:', error.message);
          throw error;
        }
      }
      console.log(`\r   Importados: ${imported}/${data.posts.length} posts`);
    }

    // Importar users
    if (data.users && data.users.length > 0) {
      console.log(`\n👤 Importando ${data.users.length} usuários...`);
      let importedUsers = 0;
      for (const user of data.users) {
        try {
          await pool.query(
            `INSERT INTO users (id, platform, user_id, username, display_name, followers_count,
             following_count, bio, profile_url, collected_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              user.id, user.platform, user.user_id, user.username, user.display_name,
              user.followers_count, user.following_count, user.bio, user.profile_url, user.collected_at
            ]
          );
          importedUsers++;
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            continue;
          }
          console.error('\n❌ Erro ao importar usuário:', error.message);
          throw error;
        }
      }
      console.log(`   Importados: ${importedUsers}/${data.users.length} usuários`);
    }

    // Importar collection_logs
    if (data.collection_logs && data.collection_logs.length > 0) {
      console.log(`\n📈 Importando ${data.collection_logs.length} logs...`);
      let importedLogs = 0;
      for (const log of data.collection_logs) {
        try {
          await pool.query(
            `INSERT INTO collection_logs (id, execution_date, platform, keyword, posts_collected,
             execution_time_seconds, status, error_message, apify_run_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              log.id, log.execution_date, log.platform, log.keyword, log.posts_collected,
              log.execution_time_seconds, log.status, log.error_message, log.apify_run_id
            ]
          );
          importedLogs++;
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            continue;
          }
          console.error('\n❌ Erro ao importar log:', error.message);
          throw error;
        }
      }
      console.log(`   Importados: ${importedLogs}/${data.collection_logs.length} logs`);
    }

    // Atualizar sequences
    console.log('\n🔄 Atualizando sequences...');
    if (data.posts && data.posts.length > 0) {
      const maxPostId = Math.max(...data.posts.map(p => p.id));
      await pool.query(`SELECT setval('posts_id_seq', $1, true)`, [maxPostId]);
    }
    if (data.users && data.users.length > 0) {
      const maxUserId = Math.max(...data.users.map(u => u.id));
      await pool.query(`SELECT setval('users_id_seq', $1, true)`, [maxUserId]);
    }
    if (data.collection_logs && data.collection_logs.length > 0) {
      const maxLogId = Math.max(...data.collection_logs.map(l => l.id));
      await pool.query(`SELECT setval('collection_logs_id_seq', $1, true)`, [maxLogId]);
    }

    console.log('✅ Sequences atualizadas!\n');

    // Verificar dados importados
    console.log('📊 Verificando dados importados...\n');
    const counts = await Promise.all([
      pool.query('SELECT COUNT(*) FROM posts'),
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM collection_logs')
    ]);

    console.log('Registros importados:');
    console.log(`  📝 Posts: ${counts[0].rows[0].count}`);
    console.log(`  👤 Usuários: ${counts[1].rows[0].count}`);
    console.log(`  📈 Logs de coleta: ${counts[2].rows[0].count}\n`);

    console.log('✅ Importação concluída com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Verifique se os dados estão corretos no Supabase Dashboard');
    console.log('   2. Teste a aplicação com a nova conexão');
    console.log('   3. Atualize as variáveis de ambiente em produção\n');

  } catch (error) {
    console.error('❌ Erro ao importar dados:', error.message);
    console.error('\nDetalhes:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

// Executar se chamado diretamente
if (require.main === module) {
  const backupFile = process.argv[2];
  importToSupabase(backupFile);
}

module.exports = importToSupabase;
