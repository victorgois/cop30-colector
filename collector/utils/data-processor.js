/**
 * Processa e normaliza dados coletados do Apify para formato do banco de dados
 */

/**
 * Processa dados do Instagram
 */
function processInstagramPost(item, keyword) {
  // Instagram Hashtag Scraper retorna formato padronizado
  // Campos principais: id, shortCode, caption, hashtags, timestamp, ownerUsername, etc.

  // Parse timestamp de forma segura
  let createdAt = null;
  try {
    if (item.timestamp) {
      // timestamp vem como string ISO ou número Unix
      if (typeof item.timestamp === 'string') {
        const parsed = new Date(item.timestamp);
        if (!isNaN(parsed.getTime())) {
          createdAt = parsed;
        }
      } else if (!isNaN(item.timestamp)) {
        createdAt = new Date(item.timestamp * 1000);
      }
    }
  } catch (e) {
    // Se falhar, deixa null
  }

  // Extrair hashtags: primeiro tenta usar o campo hashtags do scraper,
  // depois extrai do caption como fallback
  let hashtags = [];
  if (item.hashtags && Array.isArray(item.hashtags) && item.hashtags.length > 0) {
    hashtags = item.hashtags.map(tag => tag.toLowerCase());
  } else {
    hashtags = extractHashtags(item.caption || '');
  }

  // Determinar tipo de mídia
  let mediaType = 'photo'; // padrão
  if (item.type) {
    mediaType = item.type;
  } else if (item.productType === 'clips') {
    mediaType = 'video';
  } else if (item.displayUrl && item.displayUrl.includes('video')) {
    mediaType = 'video';
  }

  // Coletar URLs de mídia
  const mediaUrls = [];

  // Para vídeos, priorizar videoUrl sobre displayUrl (thumbnail)
  if (mediaType === 'video' && item.videoUrl) {
    mediaUrls.push(item.videoUrl);  // URL do vídeo completo
    if (item.displayUrl) {
      mediaUrls.push(item.displayUrl);  // Thumbnail como fallback
    }
  } else if (item.displayUrl) {
    mediaUrls.push(item.displayUrl);
  }

  // Se tiver posts filhos (carousel), adicionar também
  if (item.childPosts && Array.isArray(item.childPosts)) {
    item.childPosts.forEach(child => {
      // Para vídeos no carousel, também priorizar videoUrl
      if (child.type === 'video' && child.videoUrl) {
        mediaUrls.push(child.videoUrl);
      } else if (child.displayUrl) {
        mediaUrls.push(child.displayUrl);
      }
    });
  }

  return {
    platform: 'instagram',
    post_id: item.id || item.shortCode,
    username: item.ownerUsername,
    user_id: item.ownerId,
    caption: item.caption || '',
    hashtags: hashtags,
    keyword_matched: keyword,
    created_at: createdAt,
    likes_count: item.likesCount || 0,
    comments_count: item.commentsCount || 0,
    shares_count: null, // Instagram não fornece shares públicos
    views_count: null, // Instagram Hashtag Scraper não retorna views
    post_url: item.url || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : null),
    media_urls: mediaUrls,
    media_type: mediaType,
    raw_data: item
  };
}

/**
 * Processa dados do TikTok
 */
function processTikTokPost(item, keyword) {
  // Tenta pegar URL do vídeo ou thumbnail
  const mediaUrls = [];

  // Prioridade: coverUrl (sempre disponível) > videoUrl
  if (item.videoMeta?.coverUrl) {
    mediaUrls.push(item.videoMeta.coverUrl);
  }

  // Se houver videoUrl direto, adiciona também
  if (item.videoUrl) {
    mediaUrls.push(item.videoUrl);
  }

  // Processar hashtags do TikTok
  let hashtags = [];
  if (item.hashtags && Array.isArray(item.hashtags)) {
    // Hashtags vem como array de objetos: [{"name":"fyp"}, {"name":"viral"}]
    hashtags = item.hashtags
      .map(h => {
        if (typeof h === 'object' && h.name) {
          return h.name.toLowerCase();
        } else if (typeof h === 'string') {
          return h.toLowerCase();
        }
        return null;
      })
      .filter(h => h !== null);
  } else {
    // Fallback: extrair do texto
    hashtags = extractHashtags(item.text);
  }

  return {
    platform: 'tiktok',
    post_id: item.id,
    username: item.authorMeta?.name || item.author,
    user_id: item.authorMeta?.id,
    caption: item.text || '',
    hashtags: hashtags,
    keyword_matched: keyword,
    created_at: item.createTime ? new Date(item.createTime * 1000) : null,
    likes_count: item.diggCount || item.stats?.diggCount || 0,
    comments_count: item.commentCount || item.stats?.commentCount || 0,
    shares_count: item.shareCount || item.stats?.shareCount || 0,
    views_count: item.playCount || item.stats?.playCount || 0,
    post_url: item.webVideoUrl || `https://www.tiktok.com/@${item.authorMeta?.name || item.author}/video/${item.id}`,
    media_urls: mediaUrls,
    media_type: 'video',
    raw_data: item
  };
}

/**
 * Extrai hashtags de um texto
 */
function extractHashtags(text) {
  if (!text) return [];

  const hashtagRegex = /#[\w\u00C0-\u017F]+/g;
  const matches = text.match(hashtagRegex);

  if (!matches) return [];

  // Remove o # e retorna array único
  return [...new Set(matches.map(tag => tag.substring(1).toLowerCase()))];
}

/**
 * Valida se um post tem os campos mínimos necessários
 */
function isValidPost(post) {
  return post.post_id && post.username && post.platform;
}

/**
 * Processa um item de acordo com a plataforma
 */
function processPost(item, platform, keyword) {
  let post;

  try {
    if (platform === 'instagram') {
      post = processInstagramPost(item, keyword);
    } else if (platform === 'tiktok') {
      post = processTikTokPost(item, keyword);
    } else {
      throw new Error(`Plataforma não suportada: ${platform}`);
    }

    if (!isValidPost(post)) {
      console.warn('Post inválido (faltam campos obrigatórios):', post);
      return null;
    }

    return post;
  } catch (error) {
    console.error('Erro ao processar post:', error.message);
    return null;
  }
}

/**
 * Processa um lote de posts
 */
function processBatch(items, platform, keyword) {
  const processed = [];
  const errors = [];

  for (const item of items) {
    try {
      const post = processPost(item, platform, keyword);
      if (post) {
        processed.push(post);
      }
    } catch (error) {
      errors.push({
        item,
        error: error.message
      });
    }
  }

  return {
    processed,
    errors,
    total: items.length,
    success: processed.length,
    failed: errors.length
  };
}

module.exports = {
  processPost,
  processBatch,
  processInstagramPost,
  processTikTokPost,
  extractHashtags,
  isValidPost
};
