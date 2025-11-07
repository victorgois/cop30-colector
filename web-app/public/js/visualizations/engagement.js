// Visualização de Engajamento usando D3.js

/**
 * Renderiza gráfico de engajamento para uma plataforma específica
 */
function renderEngagementForPlatform(data, metric, platform, containerId) {
  // Limpar visualização anterior
  d3.select(`#${containerId}`).html('');

  // Filtrar dados por plataforma
  const platformData = data.filter(d => d.platform === platform);

  if (!platformData || platformData.length === 0) {
    d3.select(`#${containerId}`).append('p')
      .style('text-align', 'center')
      .style('color', '#666')
      .style('padding', '20px')
      .text(`Nenhum dado de ${platform} disponível para exibir`);
    return;
  }

  // Limitar a 20 posts
  const limitedData = platformData.slice(0, 20);

  // Configurações (aumentado left margin para espaçamento do eixo Y)
  const margin = { top: 20, right: 30, bottom: 100, left: 80 };
  const containerElement = document.getElementById(containerId);
  const width = containerElement.clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Criar SVG
  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleBand()
    .domain(limitedData.map((d, i) => i))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(limitedData, d => +d[metric])])
    .nice()
    .range([height, 0]);

  // Eixos
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(i => `Post ${parseInt(i) + 1}`))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).tickFormat(d => {
      // Formatar números grandes
      if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
      if (d >= 1000) return (d / 1000).toFixed(1) + 'K';
      return d;
    }));

  // Cor baseada na plataforma (identidade visual: amarelo e preto)
  const barColor = platform === 'instagram' ? '#FDB813' : '#000000';

  // Barras
  svg.selectAll('.bar')
    .data(limitedData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('fill', barColor)
    .attr('x', (d, i) => x(i))
    .attr('y', d => y(+d[metric]))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(+d[metric]))
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.7);
      const metricLabel = getMetricLabel(metric);
      showTooltip(event, `
        <strong>@${d.username}</strong><br>
        ${metricLabel}: ${(+d[metric]).toLocaleString('pt-BR')}<br>
        Plataforma: ${d.platform}
      `);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      hideTooltip();
    })
    .on('click', function(event, d) {
      if (d.post_url) {
        window.open(d.post_url, '_blank');
      }
    });

  // Label do eixo Y (com espaçamento aumentado)
  const metricLabel = getMetricLabel(metric);
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left + 15)  // Aumentado espaçamento (era 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('fill', '#333')
    .text(metricLabel);
}

/**
 * Renderiza ambos os gráficos (Instagram e TikTok)
 */
function renderEngagement(data, metric) {
  // Renderizar Instagram
  renderEngagementForPlatform(data, metric, 'instagram', 'top-posts-instagram-chart');

  // Renderizar TikTok
  renderEngagementForPlatform(data, metric, 'tiktok', 'top-posts-tiktok-chart');
}

function getMetricLabel(metric) {
  const labels = {
    'likes_count': 'Curtidas',
    'comments_count': 'Comentários',
    'shares_count': 'Compartilhamentos',
    'views_count': 'Visualizações'
  };
  return labels[metric] || metric;
}

// Expor função globalmente
window.renderEngagement = renderEngagement;
