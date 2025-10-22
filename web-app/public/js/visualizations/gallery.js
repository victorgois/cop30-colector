// Componente de galeria de imagens e vídeos

let galleryState = {
  posts: [],
  displayedCount: 0,
  batchSize: 12,
  filters: {
    platform: '',
    mediaType: ''
  }
};

/**
 * Renderiza a galeria de posts com mídia
 */
function renderGallery(posts) {
  const container = document.getElementById('gallery-grid');

  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="no-data">Nenhuma mídia disponível</p>';
    document.getElementById('load-more-gallery').style.display = 'none';
    return;
  }

  // Filtra posts que têm mídia
  const postsWithMedia = posts.filter(post =>
    post.media_urls &&
    post.media_urls.length > 0 &&
    post.media_urls[0] !== null &&
    post.media_urls[0] !== ''
  );

  if (postsWithMedia.length === 0) {
    container.innerHTML = '<p class="no-data">Nenhuma mídia disponível para os filtros selecionados</p>';
    document.getElementById('load-more-gallery').style.display = 'none';
    return;
  }

  // Limpa container
  container.innerHTML = '';

  // Pega o próximo lote para exibir
  const endIndex = Math.min(galleryState.displayedCount + galleryState.batchSize, postsWithMedia.length);
  const postsToDisplay = postsWithMedia.slice(0, endIndex);

  // Renderiza cada item
  postsToDisplay.forEach(post => {
    const item = createGalleryItem(post);
    container.appendChild(item);
  });

  // Atualiza estado
  galleryState.displayedCount = endIndex;

  // Mostra/esconde botão "Carregar Mais"
  const loadMoreBtn = document.getElementById('load-more-gallery');
  if (endIndex >= postsWithMedia.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'block';
  }
}

/**
 * Cria um item da galeria
 */
function createGalleryItem(post) {
  const item = document.createElement('div');
  item.className = 'gallery-item';
  item.dataset.postId = post.post_id;

  const mediaUrl = post.media_urls[0];
  // Normaliza comparação de tipo (Video, video, etc)
  const mediaTypeLower = post.media_type ? post.media_type.toLowerCase() : '';
  const isVideo = mediaTypeLower === 'video';

  // Container de mídia
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'gallery-media';

  if (isVideo) {
    // Para TikTok, mostra a thumbnail (cover)
    // A URL do vídeo real está em post_url
    if (post.platform === 'tiktok') {
      const img = document.createElement('img');
      img.src = mediaUrl;
      img.alt = post.caption ? post.caption.substring(0, 100) : 'TikTok Video';
      img.loading = 'lazy';

      // Tratamento de erro de carregamento
      img.onerror = function() {
        this.src = createPlaceholderImage('TikTok Video', '🎵');
      };

      // Ícone de vídeo
      const videoIcon = document.createElement('div');
      videoIcon.className = 'video-icon';
      videoIcon.innerHTML = '▶';
      mediaContainer.appendChild(videoIcon);

      mediaContainer.appendChild(img);
    } else {
      // Instagram vídeo
      const video = document.createElement('video');
      video.src = mediaUrl;
      video.controls = false;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;

      // Play on hover
      item.addEventListener('mouseenter', () => video.play());
      item.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
      });

      // Ícone de vídeo
      const videoIcon = document.createElement('div');
      videoIcon.className = 'video-icon';
      videoIcon.innerHTML = '▶';
      mediaContainer.appendChild(videoIcon);

      mediaContainer.appendChild(video);
    }
  } else {
    // Para Instagram, sempre usa o fallback card devido a CORS
    if (post.platform === 'instagram') {
      const fallbackCard = createInstagramFallbackCard(post);
      mediaContainer.appendChild(fallbackCard);
    } else {
      const img = document.createElement('img');
      img.src = mediaUrl;
      img.alt = post.caption ? post.caption.substring(0, 100) : 'Post';
      img.loading = 'lazy';

      // Tratamento de erro de carregamento
      img.onerror = function() {
        this.src = createPlaceholderImage('Imagem indisponível', '🖼️');
      };

      mediaContainer.appendChild(img);
    }
  }

  item.appendChild(mediaContainer);

  // Overlay com informações
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';

  const info = document.createElement('div');
  info.className = 'gallery-info';

  // Username e platform
  const userInfo = document.createElement('div');
  userInfo.className = 'gallery-user';

  const platformIcon = post.platform === 'instagram' ? '📷' : '🎵';
  userInfo.innerHTML = `
    <span class="platform-badge">${platformIcon} ${post.platform}</span>
    <span class="username">@${post.username}</span>
  `;
  info.appendChild(userInfo);

  // Estatísticas
  const stats = document.createElement('div');
  stats.className = 'gallery-stats';

  const likes = post.likes_count || 0;
  const comments = post.comments_count || 0;
  const views = post.views_count || 0;

  stats.innerHTML = `
    <span>❤️ ${formatNumber(likes)}</span>
    <span>💬 ${formatNumber(comments)}</span>
    ${views > 0 ? `<span>👁️ ${formatNumber(views)}</span>` : ''}
  `;
  info.appendChild(stats);

  // Caption (truncada)
  if (post.caption) {
    const caption = document.createElement('p');
    caption.className = 'gallery-caption';
    caption.textContent = post.caption.substring(0, 100) + (post.caption.length > 100 ? '...' : '');
    info.appendChild(caption);
  }

  // Link para o post
  if (post.post_url) {
    const link = document.createElement('a');

    // Para TikTok, remove parâmetros da query string para evitar popup de login
    if (post.platform === 'tiktok') {
      const cleanUrl = post.post_url.split('?')[0];
      link.href = cleanUrl;
    } else {
      link.href = post.post_url;
    }

    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'gallery-link';
    link.textContent = 'Ver post original';
    info.appendChild(link);
  }

  overlay.appendChild(info);
  item.appendChild(overlay);

  return item;
}

/**
 * Cria um card fallback para posts do Instagram com URL expirada
 */
function createInstagramFallbackCard(post) {
  const card = document.createElement('div');
  card.className = 'instagram-fallback-card';
  card.style.cssText = `
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    padding: 20px;
    text-align: center;
  `;

  // Ícone baseado no tipo de mídia
  const icon = document.createElement('div');
  icon.style.fontSize = '48px';
  const mediaTypeLower = post.media_type ? post.media_type.toLowerCase() : '';
  if (mediaTypeLower === 'video') {
    icon.textContent = '🎥';
  } else if (mediaTypeLower === 'sidecar') {
    icon.textContent = '🖼️📸'; // Carrossel
  } else {
    icon.textContent = '📷';
  }

  // Badge do tipo de mídia
  const typeBadge = document.createElement('div');
  typeBadge.style.cssText = 'font-size: 10px; margin-top: 8px; background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px;';
  if (mediaTypeLower === 'video') {
    typeBadge.textContent = 'Vídeo';
  } else if (mediaTypeLower === 'sidecar') {
    typeBadge.textContent = 'Carrossel';
  } else {
    typeBadge.textContent = 'Foto';
  }

  const title = document.createElement('div');
  title.style.cssText = 'font-size: 14px; margin-top: 10px; font-weight: 600;';
  title.textContent = '@' + post.username;

  const caption = document.createElement('div');
  caption.style.cssText = 'font-size: 12px; margin-top: 8px; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;';
  caption.textContent = post.caption ? post.caption.substring(0, 100) + '...' : 'Post do Instagram';

  const stats = document.createElement('div');
  stats.style.cssText = 'font-size: 11px; margin-top: 12px; display: flex; gap: 12px; justify-content: center;';
  stats.innerHTML = `
    <span>❤️ ${formatNumber(post.likes_count || 0)}</span>
    <span>💬 ${formatNumber(post.comments_count || 0)}</span>
  `;

  const message = document.createElement('div');
  message.style.cssText = 'font-size: 10px; margin-top: 12px; opacity: 0.7; font-style: italic;';
  message.textContent = 'Clique para ver no Instagram';

  card.appendChild(icon);
  card.appendChild(typeBadge);
  card.appendChild(title);
  card.appendChild(caption);
  card.appendChild(stats);
  card.appendChild(message);

  return card;
}

/**
 * Cria uma imagem placeholder SVG
 */
function createPlaceholderImage(message, icon = '🖼️') {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
      <rect fill="#f0f0f0" width="400" height="400"/>
      <text fill="#999" font-size="60" x="50%" y="40%" text-anchor="middle" dominant-baseline="middle">${icon}</text>
      <text fill="#999" font-size="16" x="50%" y="60%" text-anchor="middle" dominant-baseline="middle">${message}</text>
    </svg>
  `;
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/**
 * Formata números para exibição
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Carrega posts para a galeria
 */
async function loadGalleryPosts() {
  try {
    const params = new URLSearchParams();
    params.append('limit', '200'); // Pega mais posts para ter mais mídia

    if (galleryState.filters.platform) {
      params.append('platform', galleryState.filters.platform);
    }

    const posts = await apiClient.getPosts(params);

    // Filtra por tipo de mídia se necessário
    let filteredPosts = posts;
    if (galleryState.filters.mediaType) {
      filteredPosts = posts.filter(post => {
        const mediaType = post.media_type ? post.media_type.toLowerCase() : '';
        const filterType = galleryState.filters.mediaType.toLowerCase();

        // Normaliza tipos: 'image' -> 'photo', 'sidecar' -> 'photo' (carrossel de fotos)
        const normalizedMediaType = mediaType === 'image' || mediaType === 'sidecar' ? 'photo' : mediaType;
        const normalizedFilterType = filterType === 'image' ? 'photo' : filterType;

        return normalizedMediaType === normalizedFilterType;
      });
    }

    galleryState.posts = filteredPosts;
    galleryState.displayedCount = 0;

    renderGallery(filteredPosts);
  } catch (error) {
    console.error('Erro ao carregar posts para galeria:', error);
    document.getElementById('gallery-grid').innerHTML =
      '<p class="error">Erro ao carregar galeria. Tente novamente.</p>';
  }
}

/**
 * Carrega mais itens na galeria
 */
function loadMoreGallery() {
  renderGallery(galleryState.posts);
}

/**
 * Inicializa a galeria
 */
function initGallery() {
  // Event listeners para filtros
  document.getElementById('gallery-platform-filter')?.addEventListener('change', (e) => {
    galleryState.filters.platform = e.target.value;
    loadGalleryPosts();
  });

  document.getElementById('gallery-media-type-filter')?.addEventListener('change', (e) => {
    galleryState.filters.mediaType = e.target.value;
    loadGalleryPosts();
  });

  // Event listener para botão "Carregar Mais"
  document.getElementById('load-more-gallery')?.addEventListener('click', loadMoreGallery);

  // Carrega posts iniciais
  loadGalleryPosts();
}

// Expor funções globalmente
window.initGallery = initGallery;
window.loadGalleryPosts = loadGalleryPosts;
