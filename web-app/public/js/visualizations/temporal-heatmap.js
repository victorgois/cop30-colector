// Visualização de Heatmap de Atividade Temporal

function renderTemporalHeatmap(data) {
  // Limpar visualização anterior
  d3.select('#temporal-heatmap-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#temporal-heatmap-chart').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum dado disponível');
    return;
  }

  const margin = { top: 60, right: 30, bottom: 80, left: 100 };
  const cellWidth = 40;
  const cellHeight = 30;
  const width = cellWidth * 24; // 24 horas
  const height = cellHeight * 7; // 7 dias da semana

  // Criar SVG
  const svg = d3.select('#temporal-heatmap-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Mapear dias da semana
  const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  // Criar matriz de dados
  const matrix = Array.from({length: 7}, () => Array(24).fill(0));

  data.forEach(d => {
    const day = parseInt(d.day_of_week);
    const hour = parseInt(d.hour_of_day);
    matrix[day][hour] = parseInt(d.post_count);
  });

  // Escalas
  const maxPosts = d3.max(data, d => parseInt(d.post_count));

  const colorScale = d3.scaleSequential()
    .domain([0, maxPosts])
    .interpolator(d3.interpolateYlOrRd);

  // Criar células do heatmap
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const value = matrix[day][hour];

      svg.append('rect')
        .attr('x', hour * cellWidth)
        .attr('y', day * cellHeight)
        .attr('width', cellWidth - 1)
        .attr('height', cellHeight - 1)
        .attr('fill', value > 0 ? colorScale(value) : '#f0f0f0')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('stroke', '#000').attr('stroke-width', 2);
          const postData = data.find(d => parseInt(d.day_of_week) === day && parseInt(d.hour_of_day) === hour);
          if (postData) {
            showTooltip(event,
              `<strong>${dayNames[day]}, ${hour}h</strong><br>` +
              `Posts: ${value}<br>` +
              `Média de Likes: ${parseInt(postData.avg_likes || 0).toLocaleString('pt-BR')}<br>` +
              `Média de Comentários: ${parseInt(postData.avg_comments || 0).toLocaleString('pt-BR')}`
            );
          }
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1);
          hideTooltip();
        });
    }
  }

  // Eixo X (horas)
  const hours = Array.from({length: 24}, (_, i) => i);
  const xScale = d3.scaleBand()
    .domain(hours)
    .range([0, width]);

  svg.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => `${d}h`))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');

  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height + 60)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .style('font-weight', '600')
    .text('Hora do Dia');

  // Eixo Y (dias da semana)
  const yScale = d3.scaleBand()
    .domain(dayNames)
    .range([0, height]);

  svg.append('g')
    .call(d3.axisLeft(yScale));

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -80)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .style('font-weight', '600')
    .text('Dia da Semana');

  // Legenda de cores
  const legendWidth = 300;
  const legendHeight = 15;

  const legendSvg = svg.append('g')
    .attr('transform', `translate(${(width - legendWidth) / 2}, -40)`);

  // Gradiente para legenda
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'heatmap-gradient');

  gradient.selectAll('stop')
    .data(d3.range(0, 1.1, 0.1))
    .enter()
    .append('stop')
    .attr('offset', d => `${d * 100}%`)
    .attr('stop-color', d => colorScale(d * maxPosts));

  legendSvg.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .style('fill', 'url(#heatmap-gradient)');

  // Escala da legenda
  const legendScale = d3.scaleLinear()
    .domain([0, maxPosts])
    .range([0, legendWidth]);

  legendSvg.append('g')
    .attr('transform', `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(5))
    .append('text')
    .attr('x', legendWidth / 2)
    .attr('y', 30)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .style('font-size', '12px')
    .text('Número de Posts');
}

// Expor função globalmente
window.renderTemporalHeatmap = renderTemporalHeatmap;
