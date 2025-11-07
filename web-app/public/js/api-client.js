// Cliente API para comunicação com o backend

const API_BASE_URL = window.location.origin + '/api';

const apiClient = {
  // Buscar posts
  async getPosts(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${API_BASE_URL}/posts?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar posts');
    return response.json();
  },

  // Buscar estatísticas
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/stats`);
    if (!response.ok) throw new Error('Erro ao buscar estatísticas');
    return response.json();
  },

  // Buscar timeline
  async getTimeline(granularity = 'day', platform = null) {
    const params = new URLSearchParams({ granularity });
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/timeline?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar timeline');
    return response.json();
  },

  // Buscar hashtags
  async getHashtags(limit = 50, platform = null) {
    const params = new URLSearchParams({ limit });
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/hashtags?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar hashtags');
    return response.json();
  },

  // Buscar top posts
  async getTopPosts(metric = 'likes_count', limit = 20) {
    const params = new URLSearchParams({ metric, limit });
    const response = await fetch(`${API_BASE_URL}/top-posts?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar top posts');
    return response.json();
  },

  // Buscar usuários influentes
  async getInfluentialUsers(limit = 30) {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE_URL}/users/influential?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar usuários influentes');
    return response.json();
  },

  // Buscar rede de hashtags
  async getHashtagNetwork(minCoOccurrence = 3) {
    const params = new URLSearchParams({ minCoOccurrence });
    const response = await fetch(`${API_BASE_URL}/hashtag-network?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar rede de hashtags');
    return response.json();
  },

  // Buscar análise de latência
  async getLatencyAnalysis(platform = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/latency-analysis?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar análise de latência');
    return response.json();
  },

  // Buscar histórico de coletas
  async getCollectionHistory(limit = 50) {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE_URL}/collection-history?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar histórico de coletas');
    return response.json();
  },

  // Buscar timeline de likes
  async getLikesTimeline(platform = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/likes-timeline?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar timeline de likes');
    return response.json();
  },

  // Buscar top influenciadores
  async getInfluencers(limit = 20) {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE_URL}/influencers?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar influenciadores');
    return response.json();
  },

  // Buscar comparativo entre plataformas
  async getPlatformComparison() {
    const response = await fetch(`${API_BASE_URL}/platform-comparison`);
    if (!response.ok) throw new Error('Erro ao buscar comparativo de plataformas');
    return response.json();
  },

  // Buscar análise de performance de conteúdo
  async getContentPerformance() {
    const response = await fetch(`${API_BASE_URL}/content-performance`);
    if (!response.ok) throw new Error('Erro ao buscar performance de conteúdo');
    return response.json();
  },

  // Buscar distribuição de engajamento
  async getEngagementDistribution(platform = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/engagement-distribution?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar distribuição de engajamento');
    return response.json();
  },

  // Buscar atividade temporal (heatmap)
  async getTemporalActivity(platform = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/temporal-activity?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar atividade temporal');
    return response.json();
  },

  // Buscar evolução de hashtags
  async getHashtagEvolution(hashtags, platform = null) {
    const params = new URLSearchParams();
    params.append('hashtags', hashtags.join(','));
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/hashtag-evolution?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar evolução de hashtags');
    return response.json();
  },

  // Buscar hashtags emergentes
  async getEmergingHashtags(limit = 20) {
    const params = new URLSearchParams({ limit });
    const response = await fetch(`${API_BASE_URL}/emerging-hashtags?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar hashtags emergentes');
    return response.json();
  },

  // Buscar análise de narrativas
  async getNarrativeAnalysis(platform = null) {
    const params = new URLSearchParams();
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/narrative-analysis?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar análise de narrativas');
    return response.json();
  },

  // Buscar palavras mais usadas
  async getTopWords(limit = 50, platform = null) {
    const params = new URLSearchParams({ limit });
    if (platform) params.append('platform', platform);

    const response = await fetch(`${API_BASE_URL}/top-words?${params}`);
    if (!response.ok) throw new Error('Erro ao buscar palavras mais usadas');
    return response.json();
  }
};
