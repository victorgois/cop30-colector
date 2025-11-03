require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

module.exports = {
  // Configuração de autenticação
  apiToken: process.env.APIFY_API_TOKEN,

  // Actors utilizados
  actors: {
    instagram: 'apify/instagram-hashtag-scraper',  // Scraper de hashtags do Instagram
    tiktok: 'clockworks/tiktok-scraper'
  },

  // Configurações de coleta
  collection: {
    // Limite de posts por hashtag
    // TESTE MANUAL: 9 hashtags × 15 posts = ~135 posts/plataforma/coleta (~$2 total)
    // PRODUÇÃO: Use 30 posts para coletas automáticas (~$4 total)
    maxPostsPerHashtag: 15,

    // Horários de coleta (2x por dia: 6h e 18h)
    schedule: {
      morning: '0 6 * * *',  // 6h da manhã
      evening: '0 18 * * *'  // 6h da tarde
    },

    // Timeout para cada execução (em milissegundos)
    // Aumentado para acomodar coleta de múltiplas hashtags em batch
    timeout: 900000, // 15 minutos (antes 10 minutos)

    // Memória alocada para cada Actor (em MB)
    memory: 4096
  },

  // Configurações específicas por plataforma
  instagram: {
    resultsLimit: 15,
    searchType: 'hashtag',
    // Adicionar outras configurações específicas do Instagram Scraper
  },

  tiktok: {
    resultsLimit: 15,
    searchType: 'hashtag',
    // Adicionar outras configurações específicas do TikTok Scraper
  }
};
