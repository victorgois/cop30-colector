// Visualização de Nuvem de Hashtags usando D3.js

function renderHashtagCloud(data) {
  // Limpar visualização anterior
  d3.select('#hashtag-cloud').html('');

  if (!data || data.length === 0) {
    d3.select('#hashtag-cloud').append('p')
      .text('Nenhuma hashtag disponível para exibir');
    return;
  }

  // Configurações
  const width = document.getElementById('hashtag-cloud').clientWidth;
  const height = 400;

  // Criar SVG
  const svg = d3.select('#hashtag-cloud')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

  // Escala de tamanho de fonte baseada na frequência
  const maxCount = d3.max(data, d => +d.usage_count);
  const fontSize = d3.scaleLinear()
    .domain([1, maxCount])
    .range([12, 60]);

  // Escala de cores
  const color = d3.scaleOrdinal(d3.schemeCategory10);

  // Simular layout de nuvem (simplificado)
  // Para uma nuvem real, usar d3-cloud library
  const nodes = data.slice(0, 30).map((d, i) => ({
    ...d,
    x: Math.random() * (width - 100) + 50,
    y: Math.random() * (height - 50) + 25,
    size: fontSize(+d.usage_count)
  }));

  // Force simulation para evitar sobreposição
  const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-50))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.size / 2 + 5))
    .on('tick', ticked);

  // Renderizar hashtags
  const hashtags = svg.selectAll('.hashtag')
    .data(nodes)
    .enter()
    .append('text')
    .attr('class', 'hashtag')
    .style('font-size', d => `${d.size}px`)
    .style('fill', (d, i) => color(i))
    .style('font-weight', 'bold')
    .style('text-anchor', 'middle')
    .text(d => `#${d.hashtag}`)
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.7);
      showTooltip(event, `#${d.hashtag}<br>Usos: ${d.usage_count}`);
    })
    .on('mouseout', function() {
      d3.select(this).style('opacity', 1);
      hideTooltip();
    });

  function ticked() {
    hashtags
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  }
}

// Funções auxiliares de tooltip
function showTooltip(event, content) {
  let tooltip = d3.select('.tooltip');

  if (tooltip.empty()) {
    tooltip = d3.select('body')
      .append('div')
      .attr('class', 'tooltip');
  }

  tooltip
    .html(content)
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('show', true);
}

function hideTooltip() {
  d3.select('.tooltip').classed('show', false);
}

// Expor funções globalmente
window.renderHashtagCloud = renderHashtagCloud;
window.showTooltip = showTooltip;
window.hideTooltip = hideTooltip;
