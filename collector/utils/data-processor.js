/**
 * Processa e normaliza dados coletados do Apify para formato do banco de dados
 */

/**
 * Processa dados do Instagram
 */
function processInstagramPost(item, keyword) {
  // Instagram Search Scraper retorna formato diferente
  // Tenta múltiplos campos possíveis

  // Parse timestamp de forma segura
  let createdAt = null;
  try {
    if (item.timestamp) {
      // Pode ser string ISO ou número Unix
      if (typeof item.timestamp === 'string') {
        const parsed = new Date(item.timestamp);
        if (!isNaN(parsed.getTime())) {
          createdAt = parsed;
        }
      } else if (!isNaN(item.timestamp)) {
        createdAt = new Date(item.timestamp * 1000);
      }
    } else if (item.taken_at && !isNaN(item.taken_at)) {
      createdAt = new Date(item.taken_at * 1000);
    } else if (item.timestampPostDate) {
      const parsed = new Date(item.timestampPostDate);
      if (!isNaN(parsed.getTime())) {
        createdAt = parsed;
      }
    }
  } catch (e) {
    // Se falhar, deixa null
  }

  return {
    platform: 'instagram',
    post_id: item.id || item.shortCode || item.pk || item.code,
    username: item.ownerUsername || item.username || item.owner?.username,
    user_id: item.ownerId || item.owner?.id || item.user?.pk,
    caption: item.caption || item.text || item.edge_media_to_caption?.edges?.[0]?.node?.text || '',
    hashtags: extractHashtags(item.caption || item.text || ''),
    keyword_matched: keyword,
    created_at: createdAt,
    likes_count: item.likesCount || item.like_count || item.edge_liked_by?.count || 0,
    comments_count: item.commentsCount || item.comment_count || item.edge_media_to_comment?.count || 0,
    shares_count: null, // Instagram não fornece shares públicos
    views_count: item.videoViewCount || item.video_view_count || item.play_count || null,
    post_url: item.url || item.link || (item.shortCode ? `https://www.instagram.com/p/${item.shortCode}/` : null),
    media_urls: item.displayUrl ? [item.displayUrl] : (item.image_versions2?.candidates?.[0]?.url ? [item.image_versions2.candidates[0].url] : []),
    media_type: item.type || item.media_type || (item.video_versions ? 'video' : 'photo'),
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

  return {
    platform: 'tiktok',
    post_id: item.id,
    username: item.authorMeta?.name || item.author,
    user_id: item.authorMeta?.id,
    caption: item.text || '',
    hashtags: item.hashtags || extractHashtags(item.text),
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
