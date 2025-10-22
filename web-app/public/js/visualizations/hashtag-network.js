// Visualização de Rede de Hashtags usando D3.js Force Graph

let networkState = {
  currentZoom: 1,
  minZoom: 0.3,
  maxZoom: 4,
  simulation: null
};

function renderHashtagNetwork(data) {
  // Limpar visualização anterior
  d3.select('#hashtag-network').html('');

  if (!data || !data.nodes || data.nodes.length === 0) {
    d3.select('#hashtag-network').append('p')
      .text('Nenhuma conexão de hashtags disponível');
    return;
  }

  // Configurações
  const container = document.getElementById('hashtag-network');
  const width = container.clientWidth;
  const height = 700;

  // Criar controles
  const controls = d3.select('#hashtag-network')
    .append('div')
    .attr('class', 'network-controls')
    .style('margin-bottom', '10px')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center')
    .style('flex-wrap', 'wrap');

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('🔍 Zoom In')
    .on('click', () => zoomInNetwork(zoom, svg));

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('🔍 Zoom Out')
    .on('click', () => zoomOutNetwork(zoom, svg));

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('↺ Resetar')
    .on('click', () => resetNetworkZoom(zoom, svg));

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('▶️ Reiniciar Animação')
    .on('click', () => restartSimulation());

  controls.append('span')
    .style('margin-left', 'auto')
    .style('color', '#666')
    .style('font-size', '12px')
    .html('💡 Arraste nós | Scroll = Zoom | <strong>Espessura da linha = Força da conexão</strong>');

  // Legenda
  const legend = d3.select('#hashtag-network')
    .append('div')
    .attr('class', 'network-legend')
    .style('margin-bottom', '10px')
    .style('padding', '10px')
    .style('background', '#f8f9fa')
    .style('border-radius', '4px')
    .style('display', 'flex')
    .style('gap', '20px')
    .style('align-items', 'center')
    .style('flex-wrap', 'wrap')
    .style('font-size', '12px');

  legend.append('span')
    .style('font-weight', '600')
    .text('📊 Visualização:');

  legend.append('span')
    .html('🔵 <strong>Nó</strong> = Hashtag (tamanho = popularidade)');

  legend.append('span')
    .html('━━ <strong>Linha</strong> = Hashtags usadas juntas (espessura = frequência)');

  // SVG
  const svg = d3.select('#hashtag-network')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('background', '#fafafa');

  const g = svg.append('g');

  // Zoom
  const zoom = d3.zoom()
    .scaleExtent([networkState.minZoom, networkState.maxZoom])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
      networkState.currentZoom = event.transform.k;
    });

  svg.call(zoom);

  // Preparar dados
  const nodes = data.nodes.map(d => ({ ...d }));

  // Criar conjunto de IDs de nós válidos
  const nodeIds = new Set(nodes.map(n => n.id));

  // Filtrar links para incluir apenas aqueles com ambos os nós presentes
  const links = data.links
    .filter(l => nodeIds.has(l.source) && nodeIds.has(l.target))
    .map(d => ({ ...d }));

  console.log(`[HashtagNetwork] ${nodes.length} nós, ${links.length} links válidos (de ${data.links.length} originais)`);

  // Escalas
  const maxNodeValue = d3.max(nodes, d => d.value) || 1;
  const minNodeValue = d3.min(nodes, d => d.value) || 1;

  const nodeScale = d3.scaleSqrt()
    .domain([minNodeValue, maxNodeValue])
    .range([6, 30]);

  const maxLinkValue = d3.max(links, d => d.value) || 1;

  const linkScale = d3.scaleLinear()
    .domain([1, maxLinkValue])
    .range([1, 8]);

  const linkOpacityScale = d3.scaleLinear()
    .domain([1, maxLinkValue])
    .range([0.2, 0.8]);

  // Cores por plataforma dominante
  const colorScale = d3.scaleOrdinal()
    .domain(['instagram', 'tiktok', 'both'])
    .range(['#E1306C', '#00f2ea', '#667eea']);

  // Determinar cor do nó baseado em plataformas
  nodes.forEach(node => {
    if (node.platforms && node.platforms.length > 0) {
      if (node.platforms.includes('instagram') && node.platforms.includes('tiktok')) {
        node.color = colorScale('both');
      } else if (node.platforms.includes('instagram')) {
        node.color = colorScale('instagram');
      } else {
        node.color = colorScale('tiktok');
      }
    } else {
      node.color = '#999';
    }
  });

  // Force simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id(d => d.id)
      .distance(d => 100 - (d.value * 3)) // Conexões fortes ficam mais próximas
      .strength(d => d.value / maxLinkValue))
    .force('charge', d3.forceManyBody()
      .strength(-300)
      .distanceMax(400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide()
      .radius(d => nodeScale(d.value) + 5))
    .alphaDecay(0.02);

  networkState.simulation = simulation;

  // Links
  const link = g.append('g')
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', '#999')
    .attr('stroke-width', d => linkScale(d.value))
    .attr('stroke-opacity', d => linkOpacityScale(d.value));

  // Nodes
  const node = g.append('g')
    .selectAll('g')
    .data(nodes)
    .enter()
    .append('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended));

  node.append('circle')
    .attr('r', d => nodeScale(d.value))
    .attr('fill', d => d.color)
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  node.append('text')
    .text(d => `#${d.name}`)
    .attr('x', 0)
    .attr('y', d => nodeScale(d.value) + 15)
    .attr('text-anchor', 'middle')
    .style('font-size', d => Math.max(10, Math.min(14, nodeScale(d.value) / 2)) + 'px')
    .style('fill', '#333')
    .style('font-weight', '600')
    .style('pointer-events', 'none')
    .style('user-select', 'none');

  // Hover effects
  node.on('mouseover', function(event, d) {
    // Highlight conexões
    link.style('stroke', l =>
      l.source.id === d.id || l.target.id === d.id ? '#667eea' : '#999'
    )
    .style('stroke-opacity', l =>
      l.source.id === d.id || l.target.id === d.id ? 0.8 : 0.1
    );

    d3.select(this).select('circle')
      .attr('stroke-width', 4)
      .attr('stroke', '#667eea');

    // Tooltip
    showTooltip(event, `
      <strong>#${d.name}</strong><br>
      Usos: ${d.value.toLocaleString('pt-BR')}<br>
      Plataformas: ${d.platforms ? d.platforms.join(', ') : 'N/A'}
    `);
  })
  .on('mouseout', function() {
    link.style('stroke', '#999')
      .style('stroke-opacity', d => linkOpacityScale(d.value));

    d3.select(this).select('circle')
      .attr('stroke-width', 2)
      .attr('stroke', '#fff');

    hideTooltip();
  });

  // Tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);

    node.attr('transform', d => `translate(${d.x},${d.y})`);
  });

  // Drag functions
  function dragstarted(event, d) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  }

  function dragged(event, d) {
    d.fx = event.x;
    d.fy = event.y;
  }

  function dragended(event, d) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
  }

  function restartSimulation() {
    simulation.alpha(1).restart();
  }
}

// Zoom functions
function zoomInNetwork(zoomBehavior, svg) {
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 1.3);
}

function zoomOutNetwork(zoomBehavior, svg) {
  svg.transition().duration(300).call(zoomBehavior.scaleBy, 0.7);
}

function resetNetworkZoom(zoomBehavior, svg) {
  svg.transition().duration(500).call(zoomBehavior.transform, d3.zoomIdentity);
}

// Expor globalmente
window.renderHashtagNetwork = renderHashtagNetwork;
