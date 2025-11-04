// Script principal da aplicação

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carregar estatísticas iniciais
    console.log('[Main] Carregando estatísticas...');
    await loadDashboardStats();
    console.log('[Main] ✓ Estatísticas carregadas');

    // Carregar visualizações
    console.log('[Main] Carregando timeline...');
    await loadTimeline();
    console.log('[Main] ✓ Timeline carregada');

    console.log('[Main] Carregando nuvem de hashtags...');
    await loadHashtagCloud();
    console.log('[Main] ✓ Nuvem de hashtags carregada');

    console.log('[Main] Carregando rede de hashtags...');
    await loadHashtagNetwork();
    console.log('[Main] ✓ Rede de hashtags carregada');

    console.log('[Main] Carregando top posts...');
    await loadTopPosts();
    console.log('[Main] ✓ Top posts carregados');

    // Inicializar galeria
    if (window.initGallery) {
      console.log('[Main] Inicializando galeria...');
      window.initGallery();
      console.log('[Main] ✓ Galeria inicializada');
    }

    // Configurar event listeners para filtros
    setupFilters();
    console.log('[Main] ✅ Dashboard carregado com sucesso!');
  } catch (error) {
    console.error('[Main] ❌ Erro ao carregar dados:', error);
    console.error('[Main] Stack trace:', error.stack);
    showError(`Erro ao carregar dados: ${error.message}. Por favor, verifique o console (F12) para mais detalhes.`);
  }
});

// Carregar estatísticas do dashboard
async function loadDashboardStats() {
  const stats = await apiClient.getStats();

  if (stats.length === 0) {
    document.getElementById('total-posts').textContent = '0';
    document.getElementById('total-users').textContent = '0';
    document.getElementById('total-avg-likes').textContent = '0';
    document.getElementById('last-collection').textContent = 'Nenhuma coleta';
    return;
  }

  // Separar estatísticas por plataforma
  const instagramStats = stats.find(s => s.platform === 'instagram') || {};
  const tiktokStats = stats.find(s => s.platform === 'tiktok') || {};

  // Métricas Totais
  const totalPosts = stats.reduce((sum, stat) => sum + parseInt(stat.total_posts || 0), 0);
  const totalUsers = stats.reduce((sum, stat) => sum + parseInt(stat.unique_users || 0), 0);
  const totalAvgLikes = stats.reduce((sum, stat) => sum + parseFloat(stat.avg_likes || 0), 0) / stats.length;

  // Encontrar última coleta
  const lastCollection = stats.reduce((latest, stat) => {
    const date = new Date(stat.last_collection);
    return date > latest ? date : latest;
  }, new Date(0));

  // Preencher métricas totais
  document.getElementById('total-posts').textContent = totalPosts.toLocaleString('pt-BR');
  document.getElementById('total-users').textContent = totalUsers.toLocaleString('pt-BR');
  document.getElementById('total-avg-likes').textContent = Math.round(totalAvgLikes).toLocaleString('pt-BR');
  document.getElementById('last-collection').textContent = formatDate(lastCollection);

  // Preencher métricas Instagram
  document.getElementById('instagram-posts').textContent =
    (instagramStats.total_posts || 0).toLocaleString('pt-BR');
  document.getElementById('instagram-users').textContent =
    (instagramStats.unique_users || 0).toLocaleString('pt-BR');
  document.getElementById('instagram-likes').textContent =
    Math.round(instagramStats.avg_likes || 0).toLocaleString('pt-BR');
  document.getElementById('instagram-comments').textContent =
    Math.round(instagramStats.avg_comments || 0).toLocaleString('pt-BR');

  // Preencher métricas TikTok
  document.getElementById('tiktok-posts').textContent =
    (tiktokStats.total_posts || 0).toLocaleString('pt-BR');
  document.getElementById('tiktok-users').textContent =
    (tiktokStats.unique_users || 0).toLocaleString('pt-BR');
  document.getElementById('tiktok-likes').textContent =
    Math.round(tiktokStats.avg_likes || 0).toLocaleString('pt-BR');
  document.getElementById('tiktok-comments').textContent =
    Math.round(tiktokStats.avg_comments || 0).toLocaleString('pt-BR');
}

// Carregar timeline
async function loadTimeline() {
  try {
    const platform = document.getElementById('platform-filter')?.value || null;
    const data = await apiClient.getTimeline('day', platform);

    if (window.renderTimeline) {
      window.renderTimeline(data);
    } else {
      console.warn('[Timeline] renderTimeline não está disponível');
    }
  } catch (error) {
    console.error('[Timeline] Erro:', error);
    throw new Error(`Timeline: ${error.message}`);
  }
}

// Carregar nuvem de hashtags
async function loadHashtagCloud() {
  try {
    const data = await apiClient.getHashtags(50);

    if (window.renderHashtagCloud) {
      window.renderHashtagCloud(data);
    } else {
      console.warn('[HashtagCloud] renderHashtagCloud não está disponível');
    }
  } catch (error) {
    console.error('[HashtagCloud] Erro:', error);
    throw new Error(`HashtagCloud: ${error.message}`);
  }
}

// Carregar rede de hashtags
async function loadHashtagNetwork() {
  try {
    const data = await apiClient.getHashtagNetwork(3);

    if (window.renderHashtagNetwork) {
      window.renderHashtagNetwork(data);
    } else {
      console.warn('[HashtagNetwork] renderHashtagNetwork não está disponível');
    }
  } catch (error) {
    console.error('[HashtagNetwork] Erro:', error);
    throw new Error(`HashtagNetwork: ${error.message}`);
  }
}

// Carregar top posts
async function loadTopPosts() {
  try {
    const metric = document.getElementById('metric-filter')?.value || 'likes_count';
    // Buscar 40 posts para ter 20 de cada plataforma
    const data = await apiClient.getTopPosts(metric, 40);

    if (window.renderEngagement) {
      window.renderEngagement(data, metric);
    } else {
      console.warn('[TopPosts] renderEngagement não está disponível');
    }
  } catch (error) {
    console.error('[TopPosts] Erro:', error);
    throw new Error(`TopPosts: ${error.message}`);
  }
}

// Configurar filtros
function setupFilters() {
  const platformFilter = document.getElementById('platform-filter');
  const metricFilter = document.getElementById('metric-filter');

  if (platformFilter) {
    platformFilter.addEventListener('change', loadTimeline);
  }

  if (metricFilter) {
    metricFilter.addEventListener('change', loadTopPosts);
  }
}

// Utilitários
function formatDate(date) {
  if (!date || isNaN(date.getTime())) return 'Nenhuma coleta';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function showError(message) {
  // Implementar exibição de erro (pode ser um toast ou modal)
  console.error(message);
  alert(message);
}
