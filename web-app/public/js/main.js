// Script principal da aplicação

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carregar estatísticas iniciais
    await loadDashboardStats();

    // Carregar visualizações
    await loadTimeline();
    await loadHashtagCloud();
    await loadTopPosts();

    // Configurar event listeners para filtros
    setupFilters();
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    showError('Erro ao carregar dados. Por favor, tente novamente.');
  }
});

// Carregar estatísticas do dashboard
async function loadDashboardStats() {
  const stats = await apiClient.getStats();

  if (stats.length === 0) {
    document.getElementById('total-posts').textContent = '0';
    document.getElementById('unique-users').textContent = '0';
    document.getElementById('avg-likes').textContent = '0';
    document.getElementById('last-collection').textContent = 'Nenhuma coleta';
    return;
  }

  // Agregar estatísticas de todas as plataformas
  const totalPosts = stats.reduce((sum, stat) => sum + parseInt(stat.total_posts || 0), 0);
  const uniqueUsers = stats.reduce((sum, stat) => sum + parseInt(stat.unique_users || 0), 0);
  const avgLikes = stats.reduce((sum, stat) => sum + parseFloat(stat.avg_likes || 0), 0) / stats.length;

  // Encontrar última coleta
  const lastCollection = stats.reduce((latest, stat) => {
    const date = new Date(stat.last_collection);
    return date > latest ? date : latest;
  }, new Date(0));

  document.getElementById('total-posts').textContent = totalPosts.toLocaleString('pt-BR');
  document.getElementById('unique-users').textContent = uniqueUsers.toLocaleString('pt-BR');
  document.getElementById('avg-likes').textContent = Math.round(avgLikes).toLocaleString('pt-BR');
  document.getElementById('last-collection').textContent = formatDate(lastCollection);
}

// Carregar timeline
async function loadTimeline() {
  const platform = document.getElementById('platform-filter')?.value || null;
  const data = await apiClient.getTimeline('day', platform);

  if (window.renderTimeline) {
    window.renderTimeline(data);
  }
}

// Carregar nuvem de hashtags
async function loadHashtagCloud() {
  const data = await apiClient.getHashtags(50);

  if (window.renderHashtagCloud) {
    window.renderHashtagCloud(data);
  }
}

// Carregar top posts
async function loadTopPosts() {
  const metric = document.getElementById('metric-filter')?.value || 'likes_count';
  const data = await apiClient.getTopPosts(metric, 20);

  if (window.renderEngagement) {
    window.renderEngagement(data, metric);
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
