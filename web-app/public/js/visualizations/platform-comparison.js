// Visualização de Comparativo entre Plataformas

function renderPlatformComparison(data) {
  // Limpar visualização anterior
  d3.select('#platform-comparison-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#platform-comparison-chart').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum dado disponível');
    return;
  }

  const container = document.getElementById('platform-comparison-chart');
  const containerWidth = container.clientWidth;

  // Preparar dados
  const instagram = data.find(d => d.platform === 'instagram') || {};
  const tiktok = data.find(d => d.platform === 'tiktok') || {};

  // Criar estrutura de cards comparativos
  const html = `
    <div class="comparison-grid">
      <!-- Card Instagram -->
      <div class="comparison-card comparison-card-instagram">
        <h3><span class="platform-icon">📷</span> Instagram</h3>
        <div class="comparison-stats">
          <div class="stat-item">
            <span class="stat-label">Total de Posts</span>
            <span class="stat-value">${parseInt(instagram.total_posts || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Usuários Únicos</span>
            <span class="stat-value">${parseInt(instagram.unique_users || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Likes</span>
            <span class="stat-value">${parseInt(instagram.total_likes || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Comentários</span>
            <span class="stat-value">${parseInt(instagram.total_comments || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Likes/Post</span>
            <span class="stat-value">${parseInt(instagram.avg_likes || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Comentários/Post</span>
            <span class="stat-value">${parseInt(instagram.avg_comments || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Posts com Vídeo</span>
            <span class="stat-value">${parseInt(instagram.video_count || 0).toLocaleString('pt-BR')} (${Math.round((instagram.video_count || 0) / (instagram.total_posts || 1) * 100)}%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Posts com Foto</span>
            <span class="stat-value">${parseInt(instagram.photo_count || 0).toLocaleString('pt-BR')} (${Math.round((instagram.photo_count || 0) / (instagram.total_posts || 1) * 100)}%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Hashtags/Post</span>
            <span class="stat-value">${parseFloat(instagram.avg_hashtags_per_post || 0).toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Comprimento Médio Caption</span>
            <span class="stat-value">${parseInt(instagram.avg_caption_length || 0)} caracteres</span>
          </div>
        </div>
      </div>

      <!-- Card TikTok -->
      <div class="comparison-card comparison-card-tiktok">
        <h3><span class="platform-icon">🎵</span> TikTok</h3>
        <div class="comparison-stats">
          <div class="stat-item">
            <span class="stat-label">Total de Posts</span>
            <span class="stat-value">${parseInt(tiktok.total_posts || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Usuários Únicos</span>
            <span class="stat-value">${parseInt(tiktok.unique_users || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Likes</span>
            <span class="stat-value">${parseInt(tiktok.total_likes || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Total de Comentários</span>
            <span class="stat-value">${parseInt(tiktok.total_comments || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Likes/Post</span>
            <span class="stat-value">${parseInt(tiktok.avg_likes || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Comentários/Post</span>
            <span class="stat-value">${parseInt(tiktok.avg_comments || 0).toLocaleString('pt-BR')}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Posts com Vídeo</span>
            <span class="stat-value">${parseInt(tiktok.video_count || 0).toLocaleString('pt-BR')} (${Math.round((tiktok.video_count || 0) / (tiktok.total_posts || 1) * 100)}%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Posts com Foto</span>
            <span class="stat-value">${parseInt(tiktok.photo_count || 0).toLocaleString('pt-BR')} (${Math.round((tiktok.photo_count || 0) / (tiktok.total_posts || 1) * 100)}%)</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Média de Hashtags/Post</span>
            <span class="stat-value">${parseFloat(tiktok.avg_hashtags_per_post || 0).toFixed(1)}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Comprimento Médio Caption</span>
            <span class="stat-value">${parseInt(tiktok.avg_caption_length || 0)} caracteres</span>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

// Expor função globalmente
window.renderPlatformComparison = renderPlatformComparison;
