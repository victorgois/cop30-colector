// Visualização de Dashboard Avançado de Hashtags

async function renderHashtagDashboard() {
  const container = d3.select('#hashtag-dashboard-chart');
  container.html('');

  // Criar seções
  await renderEmergingHashtags();
  await renderHashtagEvolution();
}

async function renderEmergingHashtags() {
  const section = d3.select('#hashtag-dashboard-chart')
    .append('div')
    .attr('class', 'hashtag-section')
    .style('margin-bottom', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Hashtags Emergentes');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Hashtags com maior crescimento nos últimos 7 dias comparado ao período anterior');

  try {
    const data = await apiClient.getEmergingHashtags(20);

    if (!data || data.length === 0) {
      section.append('p')
        .style('text-align', 'center')
        .style('padding', '20px')
        .text('Nenhum dado disponível');
      return;
    }

    const margin = { top: 20, right: 30, bottom: 60, left: 150 };
    const width = document.getElementById('hashtag-dashboard-chart').clientWidth - margin.left - margin.right;
    const height = Math.max(500, data.length * 35) - margin.top - margin.bottom;

    const svg = section
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => parseFloat(d.growth_rate))])
      .range([0, width]);

    const y = d3.scaleBand()
      .domain(data.map(d => d.hashtag))
      .range([0, height])
      .padding(0.2);

    // Eixos
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d => `${d}%`))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 45)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Taxa de Crescimento (%)');

    svg.append('g')
      .call(d3.axisLeft(y).tickFormat(d => `#${d}`));

    // Barras
    svg.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => y(d.hashtag))
      .attr('width', d => x(parseFloat(d.growth_rate)))
      .attr('height', y.bandwidth())
      .attr('fill', '#FDB813')
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('opacity', 1);
        showTooltip(event,
          `<strong>#${d.hashtag}</strong><br>` +
          `Uso recente: ${parseInt(d.recent_count).toLocaleString('pt-BR')}<br>` +
          `Uso anterior: ${parseInt(d.previous_count).toLocaleString('pt-BR')}<br>` +
          `Crescimento: ${parseFloat(d.growth_rate).toFixed(1)}%`
        );
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.8);
        hideTooltip();
      })
      .on('click', async function(event, d) {
        // Ao clicar, mostrar evolução dessa hashtag
        await renderHashtagEvolution([d.hashtag]);
      });

  } catch (error) {
    console.error('Erro ao renderizar hashtags emergentes:', error);
    section.append('p')
      .style('color', 'red')
      .style('text-align', 'center')
      .text('Erro ao carregar dados');
  }
}

async function renderHashtagEvolution(initialHashtags = null) {
  const section = d3.select('#hashtag-dashboard-chart')
    .append('div')
    .attr('class', 'hashtag-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Evolução Temporal de Hashtags');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Acompanhe o uso de hashtags ao longo do tempo (separadas por vírgula)');

  // Input para seleção de hashtags
  const inputDiv = section.append('div')
    .style('margin-bottom', '20px')
    .style('display', 'flex')
    .style('gap', '10px')
    .style('align-items', 'center');

  const input = inputDiv.append('input')
    .attr('type', 'text')
    .attr('id', 'hashtag-evolution-input')
    .attr('placeholder', 'Ex: cop30, amazonia, clima')
    .style('flex', '1')
    .style('padding', '10px')
    .style('border', '1px solid #ddd')
    .style('border-radius', '4px')
    .style('font-size', '14px');

  if (initialHashtags) {
    input.property('value', initialHashtags.join(', '));
  }

  const button = inputDiv.append('button')
    .text('Visualizar')
    .style('padding', '10px 20px')
    .style('background', 'linear-gradient(135deg, #FDB813 0%, #FFC94D 100%)')
    .style('color', '#000')
    .style('border', 'none')
    .style('border-radius', '4px')
    .style('font-weight', '600')
    .style('cursor', 'pointer')
    .on('click', loadHashtagEvolutionData);

  const chartDiv = section.append('div')
    .attr('id', 'hashtag-evolution-chart');

  // Carregar dados iniciais se fornecidos
  if (initialHashtags) {
    await loadHashtagEvolutionData();
  } else {
    chartDiv.append('p')
      .style('text-align', 'center')
      .style('padding', '40px')
      .style('color', '#999')
      .text('Digite hashtags acima e clique em "Visualizar"');
  }

  async function loadHashtagEvolutionData() {
    const inputValue = document.getElementById('hashtag-evolution-input').value.trim();
    if (!inputValue) {
      alert('Digite ao menos uma hashtag');
      return;
    }

    const hashtags = inputValue.split(',').map(h => h.trim().replace('#', ''));

    try {
      const data = await apiClient.getHashtagEvolution(hashtags);

      if (!data || data.length === 0) {
        d3.select('#hashtag-evolution-chart').html('')
          .append('p')
          .style('text-align', 'center')
          .style('padding', '20px')
          .text('Nenhum dado encontrado para essas hashtags');
        return;
      }

      renderEvolutionChart(data, hashtags);
    } catch (error) {
      console.error('Erro ao buscar evolução de hashtags:', error);
      d3.select('#hashtag-evolution-chart').html('')
        .append('p')
        .style('color', 'red')
        .style('text-align', 'center')
        .text('Erro ao carregar dados');
    }
  }
}

function renderEvolutionChart(data, hashtags) {
  d3.select('#hashtag-evolution-chart').html('');

  const margin = { top: 20, right: 120, bottom: 60, left: 80 };
  const width = document.getElementById('hashtag-dashboard-chart').clientWidth - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svg = d3.select('#hashtag-evolution-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Processar dados por hashtag
  const dataByHashtag = d3.group(data, d => d.hashtag);

  // Escalas
  const x = d3.scaleTime()
    .domain(d3.extent(data, d => new Date(d.date)))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => parseInt(d.usage_count))])
    .range([height, 0])
    .nice();

  const colorScale = d3.scaleOrdinal()
    .domain(hashtags)
    .range(['#FDB813', '#000000', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3']);

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(6))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Data');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Posts');

  // Linha para cada hashtag
  const line = d3.line()
    .x(d => x(new Date(d.date)))
    .y(d => y(parseInt(d.usage_count)))
    .curve(d3.curveMonotoneX);

  dataByHashtag.forEach((values, hashtag) => {
    // Linha
    svg.append('path')
      .datum(values)
      .attr('fill', 'none')
      .attr('stroke', colorScale(hashtag))
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Pontos
    svg.selectAll(`.dot-${hashtag}`)
      .data(values)
      .enter()
      .append('circle')
      .attr('class', `dot-${hashtag}`)
      .attr('cx', d => x(new Date(d.date)))
      .attr('cy', d => y(parseInt(d.usage_count)))
      .attr('r', 4)
      .attr('fill', colorScale(hashtag))
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6);
        showTooltip(event,
          `<strong>#${d.hashtag}</strong><br>` +
          `Data: ${new Date(d.date).toLocaleDateString('pt-BR')}<br>` +
          `Posts: ${parseInt(d.usage_count).toLocaleString('pt-BR')}<br>` +
          `Engajamento (likes+comentários): ${parseInt(d.total_engagement || 0).toLocaleString('pt-BR')}`
        );
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 4);
        hideTooltip();
      });
  });

  // Legenda
  const legend = svg.append('g')
    .attr('transform', `translate(${width + 20}, 0)`);

  hashtags.forEach((hashtag, i) => {
    const legendRow = legend.append('g')
      .attr('transform', `translate(0, ${i * 25})`);

    legendRow.append('rect')
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', colorScale(hashtag));

    legendRow.append('text')
      .attr('x', 24)
      .attr('y', 13)
      .attr('fill', 'currentColor')
      .style('font-size', '12px')
      .text(`#${hashtag}`);
  });
}

// Expor função globalmente
window.renderHashtagDashboard = renderHashtagDashboard;
