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
    // Limite de posts por hashtag (400-800 conforme limitação técnica)
    maxPostsPerHashtag: 500,

    // Horários de coleta (2x por dia: 6h e 18h)
    schedule: {
      morning: '0 6 * * *',  // 6h da manhã
      evening: '0 18 * * *'  // 6h da tarde
    },

    // Timeout para cada execução (em milissegundos)
    timeout: 600000, // 10 minutos

    // Memória alocada para cada Actor (em MB)
    memory: 4096
  },

  // Configurações específicas por plataforma
  instagram: {
    resultsLimit: 500,
    searchType: 'hashtag',
    // Adicionar outras configurações específicas do Instagram Scraper
  },

  tiktok: {
    resultsLimit: 500,
    searchType: 'hashtag',
    // Adicionar outras configurações específicas do TikTok Scraper
  }
};
