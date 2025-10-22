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
  }
};
