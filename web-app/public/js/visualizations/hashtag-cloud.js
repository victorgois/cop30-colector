// Visualização de Nuvem de Hashtags usando D3.js com Zoom

let hashtagCloudState = {
  currentZoom: 1,
  minZoom: 0.5,
  maxZoom: 3
};

function renderHashtagCloud(data) {
  // Limpar visualização anterior
  d3.select('#hashtag-cloud').html('');

  if (!data || data.length === 0) {
    d3.select('#hashtag-cloud').append('p')
      .text('Nenhuma hashtag disponível para exibir');
    return;
  }

  // Configurações
  const container = document.getElementById('hashtag-cloud');
  const width = container.clientWidth;
  const height = 700; // Aumentado ainda mais para melhor espaçamento

  // Criar controles de zoom
  const controls = d3.select('#hashtag-cloud')
    .append('div')
    .attr('class', 'hashtag-cloud-controls')
    .style('margin-bottom', '10px')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center');

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('🔍 Zoom In')
    .on('click', () => zoomIn(zoom, svg));

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('🔍 Zoom Out')
    .on('click', () => zoomOut(zoom, svg));

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('↺ Resetar')
    .on('click', () => resetZoom(zoom, svg));

  controls.append('span')
    .attr('class', 'zoom-info')
    .style('margin-left', 'auto')
    .style('color', '#666')
    .style('font-size', '12px')
    .html('💡 Use scroll do mouse para zoom | Arraste para mover');

  // Adicionar legenda de tamanho
  const legend = d3.select('#hashtag-cloud')
    .append('div')
    .attr('class', 'hashtag-legend')
    .style('margin-bottom', '10px')
    .style('padding', '10px')
    .style('background', '#f8f9fa')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('align-items', 'center')
    .style('gap', '20px')
    .style('font-size', '12px')
    .style('color', '#666');

  legend.append('span')
    .text('Tamanho indica importância:')
    .style('font-weight', '600');

  legend.append('span')
    .style('font-size', '10px')
    .style('color', '#999')
    .text('Menos usada');

  legend.append('span')
    .style('font-size', '16px')
    .style('color', '#FDB813')
    .style('font-weight', 'bold')
    .text('Mediana');

  legend.append('span')
    .style('font-size', '28px')
    .style('color', '#FFC94D')
    .style('font-weight', 'bold')
    .text('Mais usada');

  // Criar SVG com zoom e pan
  const svg = d3.select('#hashtag-cloud')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('background', '#fafafa');

  // Criar grupo para zoom/pan
  const g = svg.append('g');

  // Configurar zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([hashtagCloudState.minZoom, hashtagCloudState.maxZoom])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      hashtagCloudState.currentZoom = event.transform.k;
    });

  svg.call(zoom);

  // Escala de tamanho de fonte baseada na frequência (escala logarítmica para melhor distribuição)
  const maxCount = d3.max(data, d => +d.usage_count);
  const minCount = d3.min(data, d => +d.usage_count);

  // Usar escala logarítmica para melhor diferenciação visual
  const fontSize = d3.scaleSqrt()
    .domain([minCount, maxCount])
    .range([14, 64]); // Range maior para melhor hierarquia visual

  // Escala de cores (identidade visual: variações de amarelo, preto e cinza)
  const color = d3.scaleOrdinal()
    .range(['#FDB813', '#000000', '#FFC94D', '#333333', '#FFD966', '#1a1a1a', '#FFEB99', '#4d4d4d', '#FFE066', '#666666']);

  // Pegar top 50 hashtags para evitar sobrecarga visual
  const topHashtags = data.slice(0, 50);

  // Ordenar por contagem (maiores primeiro) para melhor layout
  topHashtags.sort((a, b) => +b.usage_count - +a.usage_count);

  // Criar layout em espiral com espaçamento proporcional ao tamanho
  const nodes = topHashtags.map((d, i) => {
    const size = fontSize(+d.usage_count);
    const rank = i + 1; // Ranking baseado na contagem

    // Layout em espiral com espaçamento baseado no tamanho
    // Hashtags maiores (mais importantes) ficam mais no centro
    const angle = i * 0.8; // Mais espaçamento angular
    const radius = Math.sqrt(rank) * 50 + size; // Raio proporcional ao ranking e tamanho

    return {
      ...d,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      size: size,
      rank: rank
    };
  });

  // Force simulation com forças mais fortes para evitar sobreposição
  const simulation = d3.forceSimulation(nodes)
    .force('charge', d3.forceManyBody().strength(-80)) // Repulsão mais forte
    .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
    .force('collision', d3.forceCollide().radius(d => {
      // Raio de colisão proporcional ao tamanho da fonte
      const textWidth = d.hashtag.length * d.size * 0.6; // Estimativa da largura do texto
      return Math.max(textWidth / 2, d.size) + 10; // Padding de 10px
    }).strength(1))
    .force('x', d3.forceX(width / 2).strength(0.02))
    .force('y', d3.forceY(height / 2).strength(0.02))
    .alphaDecay(0.01) // Simulação mais lenta para melhor convergência
    .velocityDecay(0.3)
    .on('tick', ticked);

  // Renderizar hashtags
  const hashtags = g.selectAll('.hashtag')
    .data(nodes)
    .enter()
    .append('text')
    .attr('class', 'hashtag')
    .style('font-size', d => `${d.size}px`)
    .style('fill', (d, i) => color(i))
    .style('font-weight', 'bold')
    .style('text-anchor', 'middle')
    .style('cursor', 'pointer')
    .text(d => `#${d.hashtag}`)
    .on('mouseover', function(event, d) {
      d3.select(this)
        .style('opacity', 0.7)
        .style('text-decoration', 'underline');
      showTooltip(event, `#${d.hashtag}<br>Usos: ${d.usage_count.toLocaleString('pt-BR')}`);
    })
    .on('mouseout', function() {
      d3.select(this)
        .style('opacity', 1)
        .style('text-decoration', 'none');
      hideTooltip();
    });

  function ticked() {
    hashtags
      .attr('x', d => d.x)
      .attr('y', d => d.y);
  }

  // Aguardar simulação terminar e ajustar zoom inicial
  simulation.on('end', () => {
    // Calcular bounding box de todas as hashtags
    const bounds = g.node().getBBox();

    // Calcular escala para caber tudo
    const scale = Math.min(
      width / (bounds.width + 100),
      height / (bounds.height + 100),
      1
    );

    // Centralizar
    const translate = [
      (width - bounds.width * scale) / 2 - bounds.x * scale,
      (height - bounds.height * scale) / 2 - bounds.y * scale
    ];

    // Aplicar transformação inicial
    svg.call(zoom.transform, d3.zoomIdentity
      .translate(translate[0], translate[1])
      .scale(scale));
  });
}

// Funções de zoom
function zoomIn(zoomBehavior, svg) {
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
}

function zoomOut(zoomBehavior, svg) {
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
}

function resetZoom(zoomBehavior, svg) {
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
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
