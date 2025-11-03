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
 * Executa coleta de dados para uma plataforma com múltiplas hashtags
 */
async function collectData(platform, keywordsArray) {
  logger.info(`Iniciando coleta para ${platform} - ${keywordsArray.length} hashtags: ${keywordsArray.map(k => `#${k}`).join(', ')}`);

  try {
    const actorId = actors[platform];

    if (!actorId) {
      throw new Error(`Actor não configurado para plataforma: ${platform}`);
    }

    // Configuração específica por plataforma
    let input = {};

    if (platform === 'instagram') {
      input = {
        hashtags: keywordsArray,  // Array de hashtags sem o #
        resultsLimit: collection.maxPostsPerHashtag
      };
    } else if (platform === 'tiktok') {
      // TikTok Scraper (clockworks/tiktok-scraper) configuration
      input = {
        hashtags: keywordsArray.map(tag => `#${tag}`),  // TikTok precisa do # na hashtag
        resultsPerPage: collection.maxPostsPerHashtag,
        searchSection: '',  // '' = geral, '/video' = só vídeos, '/user' = só usuários
        shouldDownloadVideos: false,  // não baixar vídeos para economizar
        shouldDownloadCovers: false,  // não baixar thumbnails
        shouldDownloadSubtitles: false,  // não baixar legendas
        shouldDownloadSlideshowImages: false
      };
    }

    logger.info(`Executando actor ${actorId} com input:`, JSON.stringify(input, null, 2));

    // Executa o actor
    const run = await client.actor(actorId).call(input, {
      timeout: collection.timeout,
      memory: collection.memory
    });

    logger.info(`Coleta concluída: ${platform} - Run ID: ${run.id}`);

    // Busca os resultados
    const { items } = await client.dataset(run.defaultDatasetId).listItems();

    logger.info(`Itens retornados: ${items.length} para ${platform}`);

    let savedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const keywordStats = {};

    // Inicializa estatísticas por keyword
    keywordsArray.forEach(keyword => {
      keywordStats[keyword] = { saved: 0, duplicates: 0, errors: 0, total: 0 };
    });

    // Processa e salva cada item individualmente
    for (const item of items) {
      try {
        // Detecta qual keyword este post corresponde baseado nas hashtags
        const detectedKeyword = detectKeyword(item, keywordsArray, platform);

        if (!detectedKeyword) {
          logger.warn(`Post sem keyword detectada: ${item.id || item.shortCode}`);
          continue;
        }

        keywordStats[detectedKeyword].total++;

        // Processa o post
        const post = processPost(item, platform, detectedKeyword);

        if (!post) {
          keywordStats[detectedKeyword].errors++;
          errorCount++;
          continue;
        }

        // Salva no banco
        await postsQuery.insertPost(post);
        savedCount++;
        keywordStats[detectedKeyword].saved++;
        logger.debug(`Post salvo: ${post.post_id} - @${post.username} - #${detectedKeyword}`);

      } catch (error) {
        if (error.code === '23505') {
          // Código de erro do PostgreSQL para violação de constraint UNIQUE
          duplicateCount++;
          const detectedKeyword = detectKeyword(item, keywordsArray, platform);
          if (detectedKeyword) keywordStats[detectedKeyword].duplicates++;
          logger.debug(`Post duplicado: ${item.id || item.shortCode}`);
        } else {
          errorCount++;
          const detectedKeyword = detectKeyword(item, keywordsArray, platform);
          if (detectedKeyword) keywordStats[detectedKeyword].errors++;
          logger.error(`Erro ao salvar post ${item.id || item.shortCode}: ${error.message}`);
        }
      }
    }

    logger.info(`Salvamento concluído: ${savedCount} novos, ${duplicateCount} duplicados, ${errorCount} erros`);
    logger.info('Estatísticas por hashtag:', JSON.stringify(keywordStats, null, 2));

    return {
      platform,
      keywords: keywordsArray,
      count: items.length,
      runId: run.id,
      saved: savedCount,
      duplicates: duplicateCount,
      errors: errorCount,
      keywordStats
    };

  } catch (error) {
    logger.error(`Erro na coleta ${platform}: ${error.message}`, {
      error: error.stack
    });
    throw error;
  }
}

/**
 * Detecta qual keyword um post corresponde baseado nas hashtags
 */
function detectKeyword(item, keywordsArray, platform) {
  let itemHashtags = [];

  // Extrai hashtags do item baseado na plataforma
  if (platform === 'instagram') {
    if (item.hashtags && Array.isArray(item.hashtags)) {
      itemHashtags = item.hashtags.map(tag => tag.toLowerCase());
    } else if (item.caption) {
      itemHashtags = extractHashtags(item.caption);
    }
  } else if (platform === 'tiktok') {
    if (item.hashtags && Array.isArray(item.hashtags)) {
      itemHashtags = item.hashtags.map(h => {
        if (typeof h === 'object' && h.name) {
          return h.name.toLowerCase();
        } else if (typeof h === 'string') {
          return h.toLowerCase();
        }
        return null;
      }).filter(h => h !== null);
    } else if (item.text) {
      itemHashtags = extractHashtags(item.text);
    }
  }

  // Encontra a primeira keyword que corresponde
  for (const keyword of keywordsArray) {
    if (itemHashtags.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }

  // Se não encontrou, retorna a primeira keyword como fallback
  return keywordsArray[0];
}

/**
 * Extrai hashtags de um texto (movido de data-processor para uso aqui)
 */
function extractHashtags(text) {
  if (!text) return [];
  const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
}

/**
 * Processa um post (importado de data-processor)
 */
function processPost(item, platform, keyword) {
  const { processPost: processorProcessPost } = require('./utils/data-processor');
  return processorProcessPost(item, platform, keyword);
}

/**
 * Executa coleta para todas as palavras-chave e plataformas
 * OTIMIZADO: Executa apenas 1 vez por plataforma com todas as keywords
 */
async function runCollection() {
  logger.info('=== Iniciando ciclo de coleta ===');
  logger.info(`MODO OTIMIZADO: ${platforms.length} execuções (1 por plataforma) ao invés de ${platforms.length * keywords.length}`);

  const results = [];

  for (const platform of platforms) {
    try {
      logger.info(`\n--- Coletando ${platform} com todas as ${keywords.length} hashtags ---`);

      // OTIMIZAÇÃO: Passa TODAS as keywords de uma vez
      const result = await collectData(platform, keywords);
      results.push(result);

      logger.info(`✓ ${platform}: ${result.saved} novos, ${result.duplicates} duplicados, ${result.errors} erros`);

      // Pequeno delay entre plataformas (não mais entre keywords)
      if (platforms.indexOf(platform) < platforms.length - 1) {
        logger.info('Aguardando 5s antes da próxima plataforma...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

    } catch (error) {
      logger.error(`✗ Falha na coleta: ${platform} - ${error.message}`);
      results.push({
        platform,
        keywords,
        error: error.message,
        success: false
      });
    }
  }

  logger.info('\n=== Ciclo de coleta finalizado ===');
  logger.info(`Execuções do Apify: ${results.length} (economia de ${(platforms.length * keywords.length) - results.length} execuções)`);
  logger.info(`Sucesso: ${results.filter(r => !r.error).length}`);
  logger.info(`Falhas: ${results.filter(r => r.error).length}`);

  // Resumo detalhado
  const totalSaved = results.reduce((sum, r) => sum + (r.saved || 0), 0);
  const totalDuplicates = results.reduce((sum, r) => sum + (r.duplicates || 0), 0);
  const totalErrors = results.reduce((sum, r) => sum + (r.errors || 0), 0);

  logger.info(`\nResumo geral:`);
  logger.info(`  Posts novos: ${totalSaved}`);
  logger.info(`  Duplicados: ${totalDuplicates}`);
  logger.info(`  Erros: ${totalErrors}`);

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
