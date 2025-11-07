// Visualização de Análise de Latência usando D3.js

function renderLatencyAnalysis(data, platform = null) {
  // Limpar visualizações anteriores
  d3.select('#latency-scatter-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#latency-scatter-chart').append('p')
      .text('Nenhum dado disponível para exibir');
    return;
  }

  // Processar dados
  data.forEach(d => {
    d.created_at = new Date(d.created_at);
    d.collected_at = new Date(d.collected_at);
    d.latency_minutes = +d.latency_minutes;
    d.latency_hours = +d.latency_hours;
  });

  // Filtrar valores negativos (se houver inconsistências)
  data = data.filter(d => d.latency_minutes >= 0);

  // Renderizar apenas o scatter plot
  renderLatencyScatter(data, platform);
}

// Scatter plot: created_at vs collected_at
function renderLatencyScatter(data, platform) {
  const margin = { top: 20, right: 30, bottom: 70, left: 70 };
  const width = document.getElementById('latency-scatter-chart').clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Criar SVG
  const svg = d3.select('#latency-scatter-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.created_at))
    .range([0, width]);

  const y = d3.scaleTime()
    .domain(d3.extent(data, d => d.collected_at))
    .range([height, 0]);

  // Cor por plataforma
  const colorScale = d3.scaleOrdinal()
    .domain(['instagram', 'tiktok'])
    .range(['#E4405F', '#000000']);

  // Eixos
  // Determinar o range de tempo para escolher o formato apropriado
  const timeRange = d3.extent(data, d => d.created_at);
  const yearsDiff = (timeRange[1] - timeRange[0]) / (1000 * 60 * 60 * 24 * 365);

  // Se o range for maior que 1 ano, mostrar anos; senão mostrar mês/ano
  const timeFormat = yearsDiff > 1 ? d3.timeFormat('%Y') : d3.timeFormat('%m/%Y');

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(timeFormat))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Data de Postagem (created_at)');

  svg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y).tickFormat(timeFormat))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -50)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Data de Coleta (collected_at)');

  // Linha diagonal (tempo real - created_at = collected_at)
  const minDate = d3.min(data, d => d.created_at);
  const maxDate = d3.max(data, d => d.collected_at);

  svg.append('line')
    .attr('x1', x(minDate))
    .attr('x2', x(maxDate))
    .attr('y1', y(minDate))
    .attr('y2', y(maxDate))
    .attr('stroke', '#cbd5e0')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '3,3');

  svg.append('text')
    .attr('x', width - 100)
    .attr('y', height - 10)
    .attr('fill', '#718096')
    .style('font-size', '11px')
    .text('Linha de tempo real');

  // Pontos
  svg.selectAll('.scatter-dot')
    .data(data)
    .enter()
    .append('circle')
    .attr('class', 'scatter-dot')
    .attr('cx', d => x(d.created_at))
    .attr('cy', d => y(d.collected_at))
    .attr('r', 3)
    .attr('fill', d => platform ? colorScale(d.platform) : (d.platform === 'instagram' ? '#FDB813' : '#000000'))
    .attr('opacity', 0.6)
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 5).attr('opacity', 1);
      const created = d3.timeFormat('%d/%m/%Y %H:%M')(d.created_at);
      const collected = d3.timeFormat('%d/%m/%Y %H:%M')(d.collected_at);
      const latency = d.latency_hours.toFixed(1);
      showTooltip(event,
        `Plataforma: ${d.platform}<br>` +
        `Postado: ${created}<br>` +
        `Coletado: ${collected}<br>` +
        `Latência: ${latency}h<br>` +
        `Usuário: @${d.username}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 3).attr('opacity', 0.6);
      hideTooltip();
    });

  // Legenda (se não houver filtro de plataforma)
  if (!platform) {
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 100}, 10)`);

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('r', 5)
      .attr('fill', colorScale('instagram'));

    legend.append('text')
      .attr('x', 10)
      .attr('y', 5)
      .style('font-size', '12px')
      .text('Instagram');

    legend.append('circle')
      .attr('cx', 0)
      .attr('cy', 20)
      .attr('r', 5)
      .attr('fill', colorScale('tiktok'));

    legend.append('text')
      .attr('x', 10)
      .attr('y', 25)
      .style('font-size', '12px')
      .text('TikTok');
  }
}

// Expor função globalmente
window.renderLatencyAnalysis = renderLatencyAnalysis;
