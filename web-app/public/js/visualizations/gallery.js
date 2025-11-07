// Componente de galeria de imagens e vídeos

let galleryState = {
  posts: [],
  allPosts: [], // Armazena todos os posts carregados
  displayedCount: 0,
  batchSize: 12,
  filters: {
    platform: '',
    mediaType: '',
    sortBy: 'date-desc',
    hashtag: '',
    minLikes: '',
    dateFrom: '',
    dateTo: ''
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
  const thumbnailUrl = post.media_urls[1] || mediaUrl; // Fallback para primeira URL se não tiver segunda

  // Normaliza comparação de tipo (Video, video, etc)
  const mediaTypeLower = post.media_type ? post.media_type.toLowerCase() : '';
  const isVideo = mediaTypeLower === 'video';

  // Container de mídia
  const mediaContainer = document.createElement('div');
  mediaContainer.className = 'gallery-media';

  if (isVideo) {
    if (post.platform === 'tiktok') {
      // Para TikTok, mostra a thumbnail (cover)
      // A URL do vídeo real está em post_url
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
      // Instagram vídeo - com fallback para caso URL esteja expirada
      const hasValidVideoUrl = mediaUrl && (mediaUrl.includes('/o1/v/t2/') || mediaUrl.includes('video'));

      if (hasValidVideoUrl) {
        // Renderizar elemento <video> se tiver URL válida
        const video = document.createElement('video');
        video.src = mediaUrl;
        video.controls = false;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'metadata';

        // Usar thumbnail como poster
        if (thumbnailUrl && thumbnailUrl !== mediaUrl) {
          video.poster = thumbnailUrl;
        }

        // Play on hover
        item.addEventListener('mouseenter', () => {
          video.play().catch(err => console.log('Erro ao reproduzir:', err));
        });
        item.addEventListener('mouseleave', () => {
          video.pause();
          video.currentTime = 0;
        });

        // Fallback se vídeo não carregar
        video.onerror = function() {
          console.log('Erro ao carregar vídeo, usando fallback card');
          mediaContainer.innerHTML = '';
          const fallbackCard = createInstagramFallbackCard(post);
          mediaContainer.appendChild(fallbackCard);
        };

        // Ícone de vídeo
        const videoIcon = document.createElement('div');
        videoIcon.className = 'video-icon';
        videoIcon.innerHTML = '▶';
        mediaContainer.appendChild(videoIcon);

        mediaContainer.appendChild(video);
      } else {
        // URL expirada ou inválida - usar fallback card
        const fallbackCard = createInstagramFallbackCard(post);
        mediaContainer.appendChild(fallbackCard);
      }
    }
  } else {
    // Imagens
    if (post.platform === 'instagram') {
      // Para Instagram, usa fallback card (URLs expiram)
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
    background: black;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: white;
    padding: 20px;
    text-align: center;
  `;



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
 * Aplica todos os filtros aos posts
 */
function applyFilters(posts) {
  let filtered = [...posts];

  // Filtro de plataforma
  if (galleryState.filters.platform) {
    filtered = filtered.filter(post => post.platform === galleryState.filters.platform);
  }

  // Filtro de tipo de mídia
  if (galleryState.filters.mediaType) {
    filtered = filtered.filter(post => {
      const mediaType = post.media_type ? post.media_type.toLowerCase() : '';
      const filterType = galleryState.filters.mediaType.toLowerCase();
      const normalizedMediaType = (mediaType === 'image' || mediaType === 'sidecar') ? 'photo' : mediaType;
      const normalizedFilterType = filterType === 'image' ? 'photo' : filterType;
      return normalizedMediaType === normalizedFilterType;
    });
  }

  // Filtro de hashtag
  if (galleryState.filters.hashtag) {
    const hashtags = galleryState.filters.hashtag
      .toLowerCase()
      .split(',')
      .map(tag => tag.trim().replace('#', ''))
      .filter(tag => tag.length > 0);

    if (hashtags.length > 0) {
      filtered = filtered.filter(post => {
        if (!post.hashtags || !Array.isArray(post.hashtags)) return false;
        const postHashtags = post.hashtags.map(h => h.toLowerCase());
        return hashtags.some(tag => postHashtags.includes(tag));
      });
    }
  }

  // Filtro de mínimo de curtidas
  if (galleryState.filters.minLikes && galleryState.filters.minLikes !== '') {
    const minLikes = parseInt(galleryState.filters.minLikes);
    filtered = filtered.filter(post => (post.likes_count || 0) >= minLikes);
  }

  // Filtro de data inicial
  if (galleryState.filters.dateFrom) {
    const dateFrom = new Date(galleryState.filters.dateFrom);
    filtered = filtered.filter(post => {
      if (!post.created_at) return false;
      const postDate = new Date(post.created_at);
      return postDate >= dateFrom;
    });
  }

  // Filtro de data final
  if (galleryState.filters.dateTo) {
    const dateTo = new Date(galleryState.filters.dateTo);
    dateTo.setHours(23, 59, 59, 999); // Incluir o dia inteiro
    filtered = filtered.filter(post => {
      if (!post.created_at) return false;
      const postDate = new Date(post.created_at);
      return postDate <= dateTo;
    });
  }

  return filtered;
}

/**
 * Ordena os posts de acordo com o filtro selecionado
 */
function sortPosts(posts) {
  const sorted = [...posts];

  switch (galleryState.filters.sortBy) {
    case 'date-desc':
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'date-asc':
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'likes-desc':
      sorted.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      break;
    case 'likes-asc':
      sorted.sort((a, b) => (a.likes_count || 0) - (b.likes_count || 0));
      break;
    case 'comments-desc':
      sorted.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
      break;
    case 'views-desc':
      sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      break;
    default:
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  return sorted;
}

/**
 * Atualiza o contador de resultados
 */
function updateResultsCount(count) {
  const counter = document.getElementById('gallery-results-count');
  if (counter) {
    counter.textContent = count === 1 ? '1 resultado encontrado' : `${count} resultados encontrados`;
  }
}

/**
 * Carrega posts para a galeria
 */
async function loadGalleryPosts() {
  try {
    const params = new URLSearchParams();
    params.append('limit', '500'); // Aumentar limite para ter mais dados para filtrar

    const posts = await apiClient.getPosts(params);

    console.log(`[Gallery] ${posts.length} posts carregados da API`);

    // Armazenar todos os posts
    galleryState.allPosts = posts;

    // Aplicar filtros e ordenação
    let filteredPosts = applyFilters(posts);
    filteredPosts = sortPosts(filteredPosts);

    console.log(`[Gallery] ${filteredPosts.length} posts após filtros`);

    galleryState.posts = filteredPosts;
    galleryState.displayedCount = 0;

    // Atualizar contador de resultados
    updateResultsCount(filteredPosts.length);

    renderGallery(filteredPosts);
  } catch (error) {
    console.error('Erro ao carregar posts para galeria:', error);
    document.getElementById('gallery-grid').innerHTML =
      '<p class="error">Erro ao carregar galeria. Tente novamente.</p>';
  }
}

/**
 * Reaplica filtros aos posts já carregados (mais rápido que recarregar da API)
 */
function reapplyFilters() {
  let filteredPosts = applyFilters(galleryState.allPosts);
  filteredPosts = sortPosts(filteredPosts);

  console.log(`[Gallery] ${filteredPosts.length} posts após filtros`);

  galleryState.posts = filteredPosts;
  galleryState.displayedCount = 0;

  updateResultsCount(filteredPosts.length);
  renderGallery(filteredPosts);
}

/**
 * Carrega mais itens na galeria
 */
function loadMoreGallery() {
  renderGallery(galleryState.posts);
}

/**
 * Limpa todos os filtros
 */
function clearFilters() {
  // Resetar estado dos filtros
  galleryState.filters = {
    platform: '',
    mediaType: '',
    sortBy: 'date-desc',
    hashtag: '',
    minLikes: '',
    dateFrom: '',
    dateTo: ''
  };

  // Resetar valores dos inputs
  document.getElementById('gallery-platform-filter').value = '';
  document.getElementById('gallery-media-type-filter').value = '';
  document.getElementById('gallery-sort-filter').value = 'date-desc';
  document.getElementById('gallery-hashtag-filter').value = '';
  document.getElementById('gallery-min-likes').value = '';
  document.getElementById('gallery-date-from').value = '';
  document.getElementById('gallery-date-to').value = '';

  // Reaplicar filtros (vazio = mostrar tudo)
  reapplyFilters();
}

/**
 * Inicializa a galeria
 */
function initGallery() {
  // Event listeners para filtros básicos
  document.getElementById('gallery-platform-filter')?.addEventListener('change', (e) => {
    galleryState.filters.platform = e.target.value;
    reapplyFilters();
  });

  document.getElementById('gallery-media-type-filter')?.addEventListener('change', (e) => {
    galleryState.filters.mediaType = e.target.value;
    reapplyFilters();
  });

  document.getElementById('gallery-sort-filter')?.addEventListener('change', (e) => {
    galleryState.filters.sortBy = e.target.value;
    reapplyFilters();
  });

  // Event listener para hashtag com debounce
  let hashtagTimeout;
  document.getElementById('gallery-hashtag-filter')?.addEventListener('input', (e) => {
    clearTimeout(hashtagTimeout);
    hashtagTimeout = setTimeout(() => {
      galleryState.filters.hashtag = e.target.value;
      reapplyFilters();
    }, 500); // Aguarda 500ms após parar de digitar
  });

  // Event listener para mínimo de curtidas
  let likesTimeout;
  document.getElementById('gallery-min-likes')?.addEventListener('input', (e) => {
    clearTimeout(likesTimeout);
    likesTimeout = setTimeout(() => {
      galleryState.filters.minLikes = e.target.value;
      reapplyFilters();
    }, 500);
  });

  // Event listeners para datas
  document.getElementById('gallery-date-from')?.addEventListener('change', (e) => {
    galleryState.filters.dateFrom = e.target.value;
    reapplyFilters();
  });

  document.getElementById('gallery-date-to')?.addEventListener('change', (e) => {
    galleryState.filters.dateTo = e.target.value;
    reapplyFilters();
  });

  // Event listener para botão de limpar filtros
  document.getElementById('gallery-clear-filters')?.addEventListener('click', clearFilters);

  // Event listener para botão "Carregar Mais"
  document.getElementById('load-more-gallery')?.addEventListener('click', loadMoreGallery);

  // Carrega posts iniciais
  loadGalleryPosts();
}

// Expor funções globalmente
window.initGallery = initGallery;
window.loadGalleryPosts = loadGalleryPosts;
