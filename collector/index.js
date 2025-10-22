require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { ApifyClient } = require('apify-client');
const winston = require('winston');
const cron = require('node-cron');
const { keywords, platforms } = require('./config/keywords');
const { apiToken, actors, collection } = require('./config/apify');
const pool = require('../database/connection');
const PostsQuery = require('../database/queries/posts');
const { processBatch } = require('./utils/data-processor');

// Inicializa a query de posts
const postsQuery = new PostsQuery(pool);

// Configuração do logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/collector.log' }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});

// Inicializa o cliente Apify
const client = new ApifyClient({
  token: apiToken
});

/**
 * Executa coleta de dados para uma plataforma e hashtag específicas
 */
async function collectData(platform, keyword) {
  logger.info(`Iniciando coleta para ${platform} - hashtag: #${keyword}`);

  try {
    const actorId = actors[platform];

    if (!actorId) {
      throw new Error(`Actor não configurado para plataforma: ${platform}`);
    }

    // Configuração específica por plataforma
    let input = {};

    if (platform === 'instagram') {
      input = {
        hashtags: [keyword],  // Array de hashtags sem o #
        resultsLimit: collection.maxPostsPerHashtag
      };
    } else if (platform === 'tiktok') {
      input = {
        hashtags: [keyword],
        resultsLimit: collection.maxPostsPerHashtag,
        searchType: 'hashtag',
        // Adicionar outras configurações do TikTok Scraper
      };
    }

    // Executa o actor
    const run = await client.actor(actorId).call(input, {
      timeout: collection.timeout,
      memory: collection.memory
    });

    logger.info(`Coleta concluída: ${platform} - #${keyword} - Run ID: ${run.id}`);

    // Busca os resultados
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    logger.info(`Itens retornados: ${items.length} para ${platform} - #${keyword}`);

    // Processa e salva os dados no banco
    const processResult = processBatch(items, platform, keyword);
    logger.info(`Posts processados: ${processResult.success}/${processResult.total} (${processResult.failed} erros)`);

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;

    // Salva cada post no banco de dados
    for (const post of processResult.processed) {
      try {
        await postsQuery.insertPost(post);
        savedCount++;
        logger.debug(`Post salvo: ${post.post_id} - @${post.username}`);
      } catch (error) {
        if (error.code === '23505') {
          // Código de erro do PostgreSQL para violação de constraint UNIQUE
          duplicateCount++;
          logger.debug(`Post duplicado: ${post.post_id}`);
        } else {
          errorCount++;
          logger.error(`Erro ao salvar post ${post.post_id}: ${error.message}`);
        }
      }
    }

    logger.info(`Salvamento concluído: ${savedCount} novos, ${duplicateCount} duplicados, ${errorCount} erros`);

    return {
      platform,
      keyword,
      count: items.length,
      runId: run.id,
      saved: savedCount,
      duplicates: duplicateCount,
      errors: errorCount
    };

  } catch (error) {
    logger.error(`Erro na coleta ${platform} - #${keyword}: ${error.message}`, {
      error: error.stack
    });
    throw error;
  }
}

/**
 * Executa coleta para todas as palavras-chave e plataformas
 */
async function runCollection() {
  logger.info('=== Iniciando ciclo de coleta ===');

  const results = [];

  for (const platform of platforms) {
    for (const keyword of keywords) {
      try {
        const result = await collectData(platform, keyword);
        results.push(result);

        // Aguarda um pouco entre requisições para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 5000));

      } catch (error) {
        logger.error(`Falha na coleta: ${platform} - ${keyword}`);
        results.push({
          platform,
          keyword,
          error: error.message,
          success: false
        });
      }
    }
  }

  logger.info('=== Ciclo de coleta finalizado ===');
  logger.info(`Total de coletas: ${results.length}`);
  logger.info(`Sucesso: ${results.filter(r => !r.error).length}`);
  logger.info(`Falhas: ${results.filter(r => r.error).length}`);

  return results;
}

/**
 * Inicializa o sistema de coleta
 */
async function initialize() {
  logger.info('=== Sistema de Coleta COP30 ===');
  logger.info('Inicializando...');

  // Verifica se o token do Apify está configurado
  if (!apiToken) {
    logger.error('APIFY_API_TOKEN não configurado no arquivo .env');
    process.exit(1);
  }

  logger.info('Token Apify: Configurado ✓');
  logger.info(`Plataformas: ${platforms.join(', ')}`);
  logger.info(`Palavras-chave: ${keywords.join(', ')}`);

  // Verifica se a coleta automática está habilitada
  const autoCollectEnabled = process.env.AUTO_COLLECT_ENABLED === 'true';

  if (autoCollectEnabled) {
    logger.info('Coleta automática: HABILITADA');
    logger.info(`Horários: ${collection.schedule.morning} (manhã) e ${collection.schedule.evening} (tarde)`);

    // Agenda coletas automáticas
    cron.schedule(collection.schedule.morning, () => {
      logger.info('Executando coleta agendada (manhã)');
      runCollection().catch(err => logger.error('Erro na coleta agendada:', err));
    });

    cron.schedule(collection.schedule.evening, () => {
      logger.info('Executando coleta agendada (tarde)');
      runCollection().catch(err => logger.error('Erro na coleta agendada:', err));
    });

    logger.info('Sistema pronto. Aguardando horários programados...');

  } else {
    logger.info('Coleta automática: DESABILITADA');
    logger.info('Executando coleta única...');

    try {
      await runCollection();
      logger.info('Coleta única concluída com sucesso!');
      process.exit(0);
    } catch (error) {
      logger.error('Erro na coleta única:', error);
      process.exit(1);
    }
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Inicializa o sistema
initialize();
