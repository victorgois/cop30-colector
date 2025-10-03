// Visualização de Engajamento usando D3.js

function renderEngagement(data, metric) {
  // Limpar visualização anterior
  d3.select('#top-posts-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#top-posts-chart').append('p')
      .text('Nenhum dado disponível para exibir');
    return;
  }

  // Configurações
  const margin = { top: 20, right: 30, bottom: 100, left: 60 };
  const width = document.getElementById('top-posts-chart').clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Criar SVG
  const svg = d3.select('#top-posts-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleBand()
    .domain(data.map((d, i) => i))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => +d[metric])])
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
    .call(d3.axisLeft(y));

  // Barras
  svg.selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d, i) => x(i))
    .attr('y', d => y(+d[metric]))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(+d[metric]))
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.7);
      const metricLabel = getMetricLabel(metric);
      showTooltip(event, `
        <strong>@${d.username}</strong><br>
        ${metricLabel}: ${(+d[metric]).toLocaleString('pt-BR')}<br>
        Platform: ${d.platform}
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

  // Label do eixo Y
  const metricLabel = getMetricLabel(metric);
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text(metricLabel);
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
