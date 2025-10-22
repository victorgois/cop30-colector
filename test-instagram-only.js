#!/usr/bin/env node
/**
 * Teste rápido apenas do Instagram com 1 hashtag
 */

require('dotenv').config();
const { ApifyClient } = require('apify-client');
const winston = require('winston');
const pool = require('./database/connection');
const PostsQuery = require('./database/queries/posts');
const { processBatch } = require('./collector/utils/data-processor');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.simple()
  ),
  transports: [new winston.transports.Console()]
});

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN
});

const postsQuery = new PostsQuery(pool);

async function testInstagramCollection() {
  logger.info('=== Teste de Coleta Instagram ===');

  const platform = 'instagram';
  const keyword = 'COP30';

  try {
    logger.info(`Iniciando coleta: ${platform} - #${keyword}`);

    const input = {
      search: `#${keyword}`,
      resultsLimit: 50,  // Limitar para teste
      searchType: 'hashtag',
      addParentData: false
    };

    // Executa o actor
    const run = await client.actor('apify/instagram-search-scraper').call(input, {
      timeout: 120000,
      memory: 4096
    });

    logger.info(`Run ID: ${run.id}`);

    // Busca os resultados
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    logger.info(`Itens retornados: ${items.length}`);

    // Extrair posts dos resultados aninhados (ESTA É A PARTE CHAVE!)
    let posts = [];
    if (items.length > 0 && items[0].topPosts) {
      for (const hashtag of items) {
        if (hashtag.topPosts) posts.push(...hashtag.topPosts);
        if (hashtag.latestPosts) posts.push(...hashtag.latestPosts);
      }
      logger.info(`Posts extraídos: ${posts.length} de ${items.length} hashtags`);
    } else {
      logger.warn('Formato inesperado, usando items diretamente');
      posts = items;
    }

    if (posts.length === 0) {
      logger.error('Nenhum post encontrado!');
      process.exit(1);
    }

    // Mostra exemplo de post
    logger.info('Exemplo de post extraído:');
    console.log(JSON.stringify(posts[0], null, 2).substring(0, 300) + '...\n');

    // Processa os dados
    const processResult = processBatch(posts, platform, keyword);
    logger.info(`Posts processados: ${processResult.success}/${processResult.total} (${processResult.failed} erros)`);

    if (processResult.success === 0) {
      logger.error('Nenhum post foi processado com sucesso!');
      logger.info('Primeiro post processado:', processResult.processed[0] || 'nenhum');
      process.exit(1);
    }

    // Salva no banco
    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    for (const post of processResult.processed) {
      try {
        await postsQuery.insertPost(post);
        savedCount++;
        logger.info(`✓ Post salvo: ${post.post_id} - @${post.username}`);
      } catch (error) {
        if (error.code === '23505') {
          duplicateCount++;
        } else {
          errorCount++;
          logger.error(`Erro ao salvar: ${error.message}`);
        }
      }
    }

    logger.info('=== RESULTADO ===');
    logger.info(`Posts salvos: ${savedCount}`);
    logger.info(`Duplicados: ${duplicateCount}`);
    logger.info(`Erros: ${errorCount}`);

    if (savedCount > 0) {
      logger.info('✅ INSTAGRAM FUNCIONANDO!');
    } else {
      logger.error('❌ Nenhum post foi salvo');
    }

  } catch (error) {
    logger.error('Erro:', error.message);
    logger.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testInstagramCollection();
