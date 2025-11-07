// Visualização de Histórico de Coletas

function renderCollectionHistory(data) {
  // Limpar visualização anterior
  d3.select('#collection-history-table').html('');

  if (!data || data.length === 0) {
    d3.select('#collection-history-table').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum histórico de coleta disponível');
    return;
  }

  // Criar container da tabela
  const container = d3.select('#collection-history-table')
    .append('div')
    .attr('class', 'table-container')
    .style('overflow-x', 'auto')
    .style('border-radius', '8px')
    .style('border', '1px solid #ddd');

  // Criar tabela
  const table = container.append('table')
    .attr('class', 'history-table')
    .style('width', '100%')
    .style('border-collapse', 'collapse')
    .style('background', 'white');

  // Cabeçalho
  const thead = table.append('thead');
  const headerRow = thead.append('tr')
    .style('background', 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)')
    .style('color', '#FDB813');

  headerRow.append('th')
    .style('padding', '12px')
    .style('text-align', 'left')
    .style('border-bottom', '2px solid #FDB813')
    .text('Data e Hora');

  headerRow.append('th')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('border-bottom', '2px solid #FDB813')
    .text('Plataforma');

  headerRow.append('th')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('border-bottom', '2px solid #FDB813')
    .text('Posts Coletados');

  headerRow.append('th')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('border-bottom', '2px solid #FDB813')
    .text('Keywords');

  headerRow.append('th')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('border-bottom', '2px solid #FDB813')
    .text('Duração');

  // Corpo da tabela
  const tbody = table.append('tbody');

  // Adicionar linhas
  const rows = tbody.selectAll('tr')
    .data(data)
    .enter()
    .append('tr')
    .style('border-bottom', '1px solid #f0f0f0')
    .style('transition', 'background-color 0.2s')
    .on('mouseover', function() {
      d3.select(this).style('background-color', '#fffbf0');
    })
    .on('mouseout', function() {
      d3.select(this).style('background-color', 'white');
    });

  // Coluna: Data e Hora
  rows.append('td')
    .style('padding', '12px')
    .style('font-weight', '500')
    .html(d => {
      const date = new Date(d.collection_time);
      return formatDateTime(date);
    });

  // Coluna: Plataforma
  rows.append('td')
    .style('padding', '12px')
    .style('text-align', 'center')
    .append('span')
    .attr('class', 'platform-badge')
    .style('display', 'inline-block')
    .style('padding', '4px 12px')
    .style('border-radius', '12px')
    .style('font-size', '12px')
    .style('font-weight', '600')
    .style('background', d => d.platform === 'instagram' ? '#FDB813' : '#000000')
    .style('color', d => d.platform === 'instagram' ? '#000000' : '#FDB813')
    .text(d => d.platform === 'instagram' ? 'Instagram' : 'TikTok');

  // Coluna: Posts Coletados
  rows.append('td')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('font-weight', 'bold')
    .style('color', '#000000')
    .text(d => parseInt(d.posts_collected).toLocaleString('pt-BR'));

  // Coluna: Keywords
  const keywordCells = rows.append('td')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('font-size', '12px');

  keywordCells.each(function(d) {
    const cell = d3.select(this);

    if (!d.keywords || d.keywords.length === 0) {
      cell.text('-');
      return;
    }

    // Limitar a 3 keywords visíveis
    const visibleKeywords = d.keywords.slice(0, 3);
    const remaining = d.keywords.length - 3;

    // Adicionar keywords visíveis
    visibleKeywords.forEach(k => {
      cell.append('span')
        .style('background', '#f0f0f0')
        .style('padding', '2px 8px')
        .style('border-radius', '4px')
        .style('margin', '2px')
        .style('display', 'inline-block')
        .text(k);
    });

    // Adicionar contador com tooltip se houver mais keywords
    if (remaining > 0) {
      const remainingKeywords = d.keywords.slice(3);

      cell.append('span')
        .style('color', '#666')
        .style('margin-left', '4px')
        .style('cursor', 'help')
        .style('text-decoration', 'underline')
        .style('text-decoration-style', 'dotted')
        .text(` +${remaining}`)
        .on('mouseover', function(event) {
          showTooltip(event, `
            <strong>Keywords adicionais:</strong><br>
            ${remainingKeywords.map(k => `• ${k}`).join('<br>')}
          `);
        })
        .on('mouseout', function() {
          hideTooltip();
        });
    }
  });

  // Coluna: Duração
  rows.append('td')
    .style('padding', '12px')
    .style('text-align', 'center')
    .style('color', '#666')
    .style('font-size', '12px')
    .text(d => {
      if (!d.start_time || !d.end_time) return '-';

      const start = new Date(d.start_time);
      const end = new Date(d.end_time);
      const diffMs = end - start;
      const diffSec = Math.round(diffMs / 1000);

      if (diffSec < 60) return `${diffSec}s`;

      const minutes = Math.floor(diffSec / 60);
      const seconds = diffSec % 60;
      return `${minutes}m ${seconds}s`;
    });

  // Adicionar resumo no final
  const summary = container.append('div')
    .attr('class', 'history-summary')
    .style('padding', '12px')
    .style('background', '#f8f9fa')
    .style('border-top', '2px solid #FDB813')
    .style('display', 'flex')
    .style('justify-content', 'space-around')
    .style('flex-wrap', 'wrap')
    .style('gap', '10px');

  // Calcular totais
  const totalPosts = d3.sum(data, d => parseInt(d.posts_collected));
  const instagramData = data.filter(d => d.platform === 'instagram');
  const tiktokData = data.filter(d => d.platform === 'tiktok');
  const instagramPosts = d3.sum(instagramData, d => parseInt(d.posts_collected));
  const tiktokPosts = d3.sum(tiktokData, d => parseInt(d.posts_collected));

  summary.append('div')
    .style('text-align', 'center')
    .html(`
      <div style="font-size: 12px; color: #666;">Total de Posts</div>
      <div style="font-size: 24px; font-weight: bold; color: #000000;">${totalPosts.toLocaleString('pt-BR')}</div>
    `);

  summary.append('div')
    .style('text-align', 'center')
    .html(`
      <div style="font-size: 12px; color: #666;">Instagram</div>
      <div style="font-size: 24px; font-weight: bold; color: #FDB813;">${instagramPosts.toLocaleString('pt-BR')}</div>
    `);

  summary.append('div')
    .style('text-align', 'center')
    .html(`
      <div style="font-size: 12px; color: #666;">TikTok</div>
      <div style="font-size: 24px; font-weight: bold; color: #000000;">${tiktokPosts.toLocaleString('pt-BR')}</div>
    `);

  summary.append('div')
    .style('text-align', 'center')
    .html(`
      <div style="font-size: 12px; color: #666;">Sessões de Coleta</div>
      <div style="font-size: 24px; font-weight: bold; color: #000000;">${data.length}</div>
    `);
}

function formatDateTime(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `
    <div style="font-weight: 600; color: #000000;">${day}/${month}/${year}</div>
    <div style="font-size: 12px; color: #666;">${hours}:${minutes}</div>
  `;
}

// Expor função globalmente
window.renderCollectionHistory = renderCollectionHistory;
