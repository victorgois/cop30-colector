// Script principal da aplicação

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Carregar estatísticas iniciais
    console.log('[Main] Carregando estatísticas...');
    await loadDashboardStats();
    console.log('[Main] ✓ Estatísticas carregadas');

    // Carregar visualizações
    console.log('[Main] Carregando histórico de coletas...');
    await loadCollectionHistory();
    console.log('[Main] ✓ Histórico de coletas carregado');

    console.log('[Main] Carregando timeline...');
    await loadTimeline();
    console.log('[Main] ✓ Timeline carregada');

    console.log('[Main] Carregando análise de latência...');
/*     await loadLatencyAnalysis();
    console.log('[Main] ✓ Análise de latência carregada'); */

    console.log('[Main] Carregando timeline de likes...');
    await loadLikesTimeline();
    console.log('[Main] ✓ Timeline de likes carregada');

    console.log('[Main] Carregando nuvem de hashtags...');
    await loadHashtagCloud();
    console.log('[Main] ✓ Nuvem de hashtags carregada');

    console.log('[Main] Carregando rede de hashtags...');
    await loadHashtagNetwork();
    console.log('[Main] ✓ Rede de hashtags carregada');

/*     console.log('[Main] Carregando top posts...');
    await loadTopPosts();
    console.log('[Main] ✓ Top posts carregados'); */

    // Carregar análises da Fase 1
    console.log('[Main] Carregando análise de influenciadores...');
    await loadInfluencers();
    console.log('[Main] ✓ Análise de influenciadores carregada');

    console.log('[Main] Carregando comparativo de plataformas...');
    await loadPlatformComparison();
    console.log('[Main] ✓ Comparativo de plataformas carregado');

    console.log('[Main] Carregando análise de performance...');
    await loadContentPerformance();
    console.log('[Main] ✓ Análise de performance carregada');

    // Carregar análises da Fase 2
    console.log('[Main] Carregando heatmap temporal...');
    await loadTemporalHeatmap();
    console.log('[Main] ✓ Heatmap temporal carregado');

    console.log('[Main] Carregando dashboard de hashtags...');
    await loadHashtagDashboard();
    console.log('[Main] ✓ Dashboard de hashtags carregado');

    console.log('[Main] Carregando análise de narrativas...');
    await loadNarrativeAnalysis();
    console.log('[Main] ✓ Análise de narrativas carregada');

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
  document.getElementById('last-collection').textContent = formatDate(lastCollection);

  // Preencher métricas Instagram
  document.getElementById('instagram-posts').textContent =
    (instagramStats.total_posts || 0).toLocaleString('pt-BR');
  document.getElementById('instagram-users').textContent =
    (instagramStats.unique_users || 0).toLocaleString('pt-BR');
  document.getElementById('instagram-comments').textContent =
    Math.round(instagramStats.avg_comments || 0).toLocaleString('pt-BR');

  // Preencher métricas TikTok
  document.getElementById('tiktok-posts').textContent =
    (tiktokStats.total_posts || 0).toLocaleString('pt-BR');
  document.getElementById('tiktok-users').textContent =
    (tiktokStats.unique_users || 0).toLocaleString('pt-BR');
  document.getElementById('tiktok-comments').textContent =
    Math.round(tiktokStats.avg_comments || 0).toLocaleString('pt-BR');
}

// Carregar histórico de coletas
async function loadCollectionHistory() {
  try {
    const data = await apiClient.getCollectionHistory(50);

    if (window.renderCollectionHistory) {
      window.renderCollectionHistory(data);
    } else {
      console.warn('[CollectionHistory] renderCollectionHistory não está disponível');
    }
  } catch (error) {
    console.error('[CollectionHistory] Erro:', error);
    throw new Error(`CollectionHistory: ${error.message}`);
  }
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

// Carregar análise de latência
async function loadLatencyAnalysis() {
  try {
    const platform = document.getElementById('latency-platform-filter')?.value || null;
    const data = await apiClient.getLatencyAnalysis(platform);

    if (window.renderLatencyAnalysis) {
      window.renderLatencyAnalysis(data, platform);
    } else {
      console.warn('[LatencyAnalysis] renderLatencyAnalysis não está disponível');
    }
  } catch (error) {
    console.error('[LatencyAnalysis] Erro:', error);
    throw new Error(`LatencyAnalysis: ${error.message}`);
  }
}

// Carregar timeline de likes
async function loadLikesTimeline() {
  try {
    const platform = document.getElementById('likes-platform-filter')?.value || null;
    const data = await apiClient.getLikesTimeline(platform);

    if (window.renderLikesTimeline) {
      window.renderLikesTimeline(data, platform);
    } else {
      console.warn('[LikesTimeline] renderLikesTimeline não está disponível');
    }
  } catch (error) {
    console.error('[LikesTimeline] Erro:', error);
    throw new Error(`LikesTimeline: ${error.message}`);
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

// Carregar análise de influenciadores
async function loadInfluencers() {
  try {
    const data = await apiClient.getInfluencers(20);

    if (window.renderInfluencers) {
      window.renderInfluencers(data);
    } else {
      console.warn('[Influencers] renderInfluencers não está disponível');
    }
  } catch (error) {
    console.error('[Influencers] Erro:', error);
    throw new Error(`Influencers: ${error.message}`);
  }
}

// Carregar comparativo de plataformas
async function loadPlatformComparison() {
  try {
    const data = await apiClient.getPlatformComparison();

    if (window.renderPlatformComparison) {
      window.renderPlatformComparison(data);
    } else {
      console.warn('[PlatformComparison] renderPlatformComparison não está disponível');
    }
  } catch (error) {
    console.error('[PlatformComparison] Erro:', error);
    throw new Error(`PlatformComparison: ${error.message}`);
  }
}

// Carregar análise de performance de conteúdo
async function loadContentPerformance() {
  try {
    const data = await apiClient.getContentPerformance();

    if (window.renderContentPerformance) {
      window.renderContentPerformance(data);
    } else {
      console.warn('[ContentPerformance] renderContentPerformance não está disponível');
    }
  } catch (error) {
    console.error('[ContentPerformance] Erro:', error);
    throw new Error(`ContentPerformance: ${error.message}`);
  }
}

// Carregar heatmap de atividade temporal
async function loadTemporalHeatmap() {
  try {
    const platform = null; // Pode adicionar filtro depois se necessário
    const data = await apiClient.getTemporalActivity(platform);

    if (window.renderTemporalHeatmap) {
      window.renderTemporalHeatmap(data);
    } else {
      console.warn('[TemporalHeatmap] renderTemporalHeatmap não está disponível');
    }
  } catch (error) {
    console.error('[TemporalHeatmap] Erro:', error);
    throw new Error(`TemporalHeatmap: ${error.message}`);
  }
}

// Carregar dashboard de hashtags
async function loadHashtagDashboard() {
  try {
    if (window.renderHashtagDashboard) {
      await window.renderHashtagDashboard();
    } else {
      console.warn('[HashtagDashboard] renderHashtagDashboard não está disponível');
    }
  } catch (error) {
    console.error('[HashtagDashboard] Erro:', error);
    throw new Error(`HashtagDashboard: ${error.message}`);
  }
}

// Carregar análise de narrativas
async function loadNarrativeAnalysis() {
  try {
    if (window.renderNarrativeAnalysis) {
      await window.renderNarrativeAnalysis();
    } else {
      console.warn('[NarrativeAnalysis] renderNarrativeAnalysis não está disponível');
    }
  } catch (error) {
    console.error('[NarrativeAnalysis] Erro:', error);
    throw new Error(`NarrativeAnalysis: ${error.message}`);
  }
}

// Configurar filtros
function setupFilters() {
  const platformFilter = document.getElementById('platform-filter');
  const metricFilter = document.getElementById('metric-filter');
  const latencyPlatformFilter = document.getElementById('latency-platform-filter');
  const likesPlatformFilter = document.getElementById('likes-platform-filter');

  if (platformFilter) {
    platformFilter.addEventListener('change', loadTimeline);
  }

  if (metricFilter) {
    metricFilter.addEventListener('change', loadTopPosts);
  }

  if (latencyPlatformFilter) {
    latencyPlatformFilter.addEventListener('change', loadLatencyAnalysis);
  }

  if (likesPlatformFilter) {
    likesPlatformFilter.addEventListener('change', loadLikesTimeline);
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

// Sistema de expandir/recolher seções
function initSectionToggles() {
  const toggleButtons = document.querySelectorAll('.toggle-section');

  toggleButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.stopPropagation(); // Evitar propagação para o h2

      const targetId = button.getAttribute('data-target');
      const content = document.getElementById(targetId);

      if (!content) return;

      // Toggle classes
      button.classList.toggle('collapsed');
      content.classList.toggle('collapsed');

      // Atualizar ícone
      if (button.classList.contains('collapsed')) {
        button.textContent = '▶';
        button.setAttribute('aria-label', 'Expandir seção');
      } else {
        button.textContent = '▼';
        button.setAttribute('aria-label', 'Recolher seção');
      }
    });
  });

  // Também permitir clicar no h2 inteiro para toggle
  const sectionHeaders = document.querySelectorAll('section h2');

  sectionHeaders.forEach(header => {
    header.addEventListener('click', (e) => {
      // Apenas acionar se não clicou diretamente no botão
      if (e.target.classList.contains('toggle-section')) return;

      const button = header.querySelector('.toggle-section');
      if (button) {
        button.click();
      }
    });
  });
}

// Inicializar toggles quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  initSectionToggles();
});
