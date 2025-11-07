// Visualização de Timeline usando D3.js

function renderTimeline(data) {
  // Limpar visualização anterior
  d3.select('#timeline-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#timeline-chart').append('p')
      .text('Nenhum dado disponível para exibir');
    return;
  }

  // Configurações
  const margin = { top: 20, right: 30, bottom: 50, left: 60 };
  const width = document.getElementById('timeline-chart').clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Processar dados
  // A API retorna datas em formato ISO (YYYY-MM-DDTHH:MM:SS.sssZ)
  data.forEach(d => {
    d.date = new Date(d.date);
    d.posts_count = +d.posts_count;
  });

  // Agregar por data
  const dataByDate = d3.rollup(
    data,
    v => d3.sum(v, d => d.posts_count),
    d => d.date
  );

  const aggregatedData = Array.from(dataByDate, ([date, posts_count]) => ({ date, posts_count }))
    .sort((a, b) => a.date - b.date);

  // Criar SVG
  const svg = d3.select('#timeline-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleTime()
    .domain(d3.extent(aggregatedData, d => d.date))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(aggregatedData, d => d.posts_count)])
    .nice()
    .range([height, 0]);

  // Eixos com formatação inteligente
  // Para meses anteriores a novembro: mostrar nome do mês
  // Para novembro: mostrar dias
  const xAxis = d3.axisBottom(x)
    .tickFormat(d => {
      const date = new Date(d);
      const month = date.getMonth(); // 0 = Janeiro, 10 = Novembro
      const year = date.getFullYear();

      // Se for novembro de 2025, mostrar dia
      if (month === 10 && year === 2025) {
        return date.getDate();
      }

      // Caso contrário, mostrar nome do mês abreviado
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                          'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return monthNames[month];
    });

  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(xAxis);

  svg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y));

  // Linha
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.posts_count))
    .curve(d3.curveMonotoneX);

  svg.append('path')
    .datum(aggregatedData)
    .attr('class', 'line')
    .attr('d', line);

  // Pontos
  svg.selectAll('.dot')
    .data(aggregatedData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.date))
    .attr('cy', d => y(d.posts_count))
    .attr('r', 4)
    .attr('fill', '#FDB813')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('r', 6);
      showTooltip(event, `Data: ${d3.timeFormat('%d/%m/%Y')(d.date)}<br>Posts: ${d.posts_count}`);
    })
    .on('mouseout', function() {
      d3.select(this).attr('r', 4);
      hideTooltip();
    });

  // Labels dos eixos
  svg.append('text')
    .attr('transform', `translate(${width / 2},${height + 40})`)
    .style('text-anchor', 'middle')
    .text('Data');

  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 0 - margin.left)
    .attr('x', 0 - (height / 2))
    .attr('dy', '1em')
    .style('text-anchor', 'middle')
    .text('Número de Posts');
}

// Expor função globalmente
window.renderTimeline = renderTimeline;
