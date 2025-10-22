#!/usr/bin/env node
/**
 * Script de teste específico para Instagram
 */

require('dotenv').config();
const { ApifyClient } = require('apify-client');
const { processBatch } = require('./collector/utils/data-processor');

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN
});

async function testInstagram() {
  console.log('=== Teste de Coleta Instagram ===\n');

  try {
    const keyword = 'COP30';
    console.log(`Testando hashtag: #${keyword}`);
    console.log('Actor: apify/instagram-search-scraper\n');

    const input = {
      search: `#${keyword}`,
      resultsLimit: 10,  // Apenas 10 para teste
      searchType: 'hashtag',
      addParentData: false
    };

    console.log('Executando Actor...');
    const run = await client.actor('apify/instagram-search-scraper').call(input, {
      timeout: 120000,
      memory: 4096
    });

    console.log(`✅ Run ID: ${run.id}`);
    console.log('Status:', run.status);

    // Busca resultados
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    console.log(`\n📊 Posts retornados: ${items.length}`);

    if (items.length === 0) {
      console.log('\n⚠️  Nenhum post retornado.');
      console.log('Isso pode indicar que:');
      console.log('  - A hashtag não tem posts públicos recentes');
      console.log('  - O Actor precisa de configuração adicional');
      console.log('  - Rate limit foi atingido\n');
      return;
    }

    // Mostra o primeiro item para debug
    console.log('\n🔍 Exemplo de item retornado:');
    console.log(JSON.stringify(items[0], null, 2).substring(0, 500) + '...\n');

    // Processa os dados
    console.log('Processando dados...');
    const result = processBatch(items, 'instagram', keyword);

    console.log(`\n✅ Processamento concluído:`);
    console.log(`   Total: ${result.total}`);
    console.log(`   Sucesso: ${result.success}`);
    console.log(`   Falhas: ${result.failed}`);

    if (result.success > 0) {
      console.log('\n✅ Instagram funcionando!');
      console.log('\nExemplo de post processado:');
      const sample = result.processed[0];
      console.log(`  Username: @${sample.username}`);
      console.log(`  Post ID: ${sample.post_id}`);
      console.log(`  Likes: ${sample.likes_count}`);
      console.log(`  Caption: ${sample.caption?.substring(0, 50)}...`);
    } else {
      console.log('\n❌ Nenhum post foi processado com sucesso');
      console.log('\nErros:', result.errors);
    }

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    console.error('\nDetalhes:', error);
  }
}

testInstagram();
