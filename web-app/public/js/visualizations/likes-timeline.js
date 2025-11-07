// Visualização de Timeline de Likes usando D3.js

function renderLikesTimeline(data, platform = null) {
  // Limpar visualização anterior
  d3.select('#likes-timeline-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#likes-timeline-chart').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum dado disponível para exibir');
    return;
  }

  // Processar dados
  data.forEach(d => {
    d.created_at = new Date(d.created_at);
    d.likes_count = +d.likes_count;
  });

  const margin = { top: 60, right: 30, bottom: 70, left: 80 };
  const width = document.getElementById('likes-timeline-chart').clientWidth - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

  // Criar controles de navegação
  const controls = d3.select('#likes-timeline-chart')
    .append('div')
    .attr('class', 'timeline-controls')
    .style('margin-bottom', '10px')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center')
    .style('flex-wrap', 'wrap');

  controls.append('span')
    .style('font-weight', '600')
    .style('color', '#333')
    .text('Navegação:');

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('← Mês Anterior')
    .on('click', () => panLeft());

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('Mês Seguinte →')
    .on('click', () => panRight());

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('↑ Mais Curtidos')
    .on('click', () => panUp());

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('↓ Menos Curtidos')
    .on('click', () => panDown());

  controls.append('button')
    .attr('class', 'zoom-btn')
    .text('↺ Resetar Visualização')
    .on('click', () => resetView());

  controls.append('span')
    .style('margin-left', 'auto')
    .style('color', '#666')
    .style('font-size', '12px')
    .html('💡 Use os controles ou scroll/arraste para navegar');

  // Criar SVG
  const baseSvg = d3.select('#likes-timeline-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

  const svg = baseSvg
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.created_at))
    .range([0, width]);

  // Usar escala logarítmica para melhor visualização quando há grande variação
  const maxLikes = d3.max(data, d => d.likes_count);
  const minLikes = d3.min(data.filter(d => d.likes_count > 0), d => d.likes_count) || 1;

  const y = d3.scaleLog()
    .domain([minLikes, maxLikes])
    .range([height, 0])
    .nice();

  // Criar escalas para zoom (cópias das escalas originais)
  const xZoom = x.copy();
  const yZoom = y.copy();

  // Container para elementos que sofrem zoom
  const zoomContainer = svg.append('g');

  // Cor por plataforma (identidade visual: amarelo e preto)
  const colorScale = d3.scaleOrdinal()
    .domain(['instagram', 'tiktok'])
    .range(['#000000', '#FDB813']); // Instagram = preto, TikTok = amarelo

  // Função para determinar formato de data baseado no range visível
  function getTimeFormat(domain) {
    const daysDiff = (domain[1] - domain[0]) / (1000 * 60 * 60 * 24);

    if (daysDiff <= 2) {
      // Menos de 2 dias: mostrar dia e hora
      return d3.timeFormat('%d/%m %Hh');
    } else if (daysDiff <= 60) {
      // Menos de 2 meses: mostrar dia/mês
      return d3.timeFormat('%d/%m');
    } else {
      // Mais de 2 meses: mostrar mês/ano (sempre mostrar meses, não anos)
      return d3.timeFormat('%m/%Y');
    }
  }

  const timeFormat = getTimeFormat(x.domain());

  // Eixos (criados antes do container de zoom)
  const xAxisG = svg.append('g')
    .attr('class', 'axis axis-x')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xZoom).tickFormat(timeFormat));

  xAxisG.append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Data de Postagem');

  const yAxisG = svg.append('g')
    .attr('class', 'axis axis-y')
    .call(d3.axisLeft(yZoom)
      .ticks(6)  // Reduzir para apenas 6 valores no eixo Y
      .tickFormat(d => {
        if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
        if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
        return d;
      })
    );

  yAxisG.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Quantidade de Likes (escala logarítmica)');

  // Clip path para não desenhar fora da área do gráfico
  svg.append('defs')
    .append('clipPath')
    .attr('id', 'likes-timeline-clip')
    .append('rect')
    .attr('width', width)
    .attr('height', height);

  zoomContainer.attr('clip-path', 'url(#likes-timeline-clip)');

  // Pontos (dentro do container de zoom)
  const dots = zoomContainer.selectAll('.likes-dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'likes-dot')
    .attr('cx', d => xZoom(d.created_at))
    .attr('cy', d => yZoom(d.likes_count))
    .attr('r', 4)
    .attr('fill', d => colorScale(d.platform))
    .attr('opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6).attr('opacity', 1);
      const created = d3.timeFormat('%d/%m/%Y')(d.created_at);
      showTooltip(event,
        `<strong>@${d.username}</strong><br>` +
        `Plataforma: ${d.platform}<br>` +
        `Data: ${created}<br>` +
        `Likes: ${d.likes_count.toLocaleString('pt-BR')}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4).attr('opacity', 0.6);
      hideTooltip();
    })
    .on('click', function(event, d) {
      if (d.post_url) {
        window.open(d.post_url, '_blank');
      }
    });

  // Legenda (se não houver filtro de plataforma)
  if (!platform) {
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 10)`);

    legend.append('rect')
      .attr('width', 110)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.9)')
      .attr('stroke', '#ddd')
      .attr('rx', 4);

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 15)
      .attr('r', 5)
      .attr('fill', colorScale('instagram'));

    legend.append('text')
      .attr('x', 20)
      .attr('y', 19)
      .style('font-size', '12px')
      .text('Instagram');

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 40)
      .attr('r', 5)
      .attr('fill', colorScale('tiktok'));

    legend.append('text')
      .attr('x', 20)
      .attr('y', 44)
      .style('font-size', '12px')
      .text('TikTok');
  }

  // Adicionar estatísticas
  const instagramData = data.filter(d => d.platform === 'instagram');
  const tiktokData = data.filter(d => d.platform === 'tiktok');

  const stats = svg.append('g')
    .attr('transform', `translate(10, 10)`);

  stats.append('rect')
    .attr('width', 200)
    .attr('height', 80)
    .attr('fill', 'rgba(255, 255, 255, 0.9)')
    .attr('stroke', '#ddd')
    .attr('rx', 4);

  stats.append('text')
    .attr('x', 10)
    .attr('y', 20)
    .style('font-size', '11px')
    .style('font-weight', '600')
    .text('Estatísticas:');

  if (instagramData.length > 0) {
    const maxInstagram = d3.max(instagramData, d => d.likes_count);
    stats.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .style('font-size', '10px')
      .html(`Instagram: ${maxInstagram.toLocaleString('pt-BR')} likes max`);
  }

  if (tiktokData.length > 0) {
    const maxTiktok = d3.max(tiktokData, d => d.likes_count);
    stats.append('text')
      .attr('x', 10)
      .attr('y', 60)
      .style('font-size', '10px')
      .html(`TikTok: ${maxTiktok.toLocaleString('pt-BR')} likes max`);
  }

  // Função para atualizar visualização com base no zoom
  function updateVisualization() {
    // Determinar formato de data baseado no domínio atual
    const currentFormat = getTimeFormat(xZoom.domain());

    // Atualizar eixos
    xAxisG.call(d3.axisBottom(xZoom).tickFormat(currentFormat));
    yAxisG.call(d3.axisLeft(yZoom)
      .ticks(6)
      .tickFormat(d => {
        if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
        if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
        return d;
      })
    );

    // Atualizar posição dos pontos
    dots
      .attr('cx', d => xZoom(d.created_at))
      .attr('cy', d => yZoom(d.likes_count));
  }

  // Variável para manter o transform atual
  let currentTransform = d3.zoomIdentity;

  // Comportamento de zoom (sem translateExtent para permitir movimento livre)
  const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .extent([[0, 0], [width, height]])
    .on('zoom', (event) => {
      currentTransform = event.transform;

      // Atualizar escalas com transformação
      xZoom.domain(currentTransform.rescaleX(x).domain());
      yZoom.domain(currentTransform.rescaleY(y).domain());

      updateVisualization();
    });

  baseSvg.call(zoom);

  // Funções de navegação usando transform
  function panLeft() {
    const moveAmount = width * 0.3; // Mover 30% da largura
    const newTransform = currentTransform.translate(moveAmount, 0);
    baseSvg.transition().duration(300).call(zoom.transform, newTransform);
  }

  function panRight() {
    const moveAmount = width * 0.3; // Mover 30% da largura
    const newTransform = currentTransform.translate(-moveAmount, 0);
    baseSvg.transition().duration(300).call(zoom.transform, newTransform);
  }

  function panUp() {
    const moveAmount = height * 0.3; // Mover 30% da altura
    const newTransform = currentTransform.translate(0, moveAmount);
    baseSvg.transition().duration(300).call(zoom.transform, newTransform);
  }

  function panDown() {
    const moveAmount = height * 0.3; // Mover 30% da altura
    const newTransform = currentTransform.translate(0, -moveAmount);
    baseSvg.transition().duration(300).call(zoom.transform, newTransform);
  }

  function resetView() {
    baseSvg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
  }

  // Configurar zoom inicial: focar no último mês e nos posts mais curtidos
  // Removido temporariamente - estava causando problemas com datas incorretas
  // A visualização começa mostrando todos os dados
}

// Expor função globalmente
window.renderLikesTimeline = renderLikesTimeline;
