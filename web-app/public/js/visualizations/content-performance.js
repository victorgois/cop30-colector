// Visualização de Análise de Performance de Conteúdo

function renderContentPerformance(data) {
  // Limpar visualização anterior
  d3.select('#content-performance-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#content-performance-chart').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum dado disponível');
    return;
  }

  const container = document.getElementById('content-performance-chart');

  // Criar seção com histograma de distribuição de engajamento
  //renderEngagementHistogram(data);

  // Criar scatter plot: hashtags vs engajamento
  renderHashtagsVsEngagement(data);

  // Criar scatter plot: comprimento de caption vs engajamento (comentários/likes ratio)
  renderDiscussionPosts(data);
}

function renderEngagementHistogram(data) {
  const section = d3.select('#content-performance-chart')
    .append('div')
    .attr('class', 'performance-section');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Distribuição de Engajamento Total');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Histograma mostrando como o engajamento está distribuído entre os posts');

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = document.getElementById('content-performance-chart').clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = section
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Preparar dados
  const engagementData = data.map(d => parseInt(d.total_engagement));

  // Criar bins para histograma
  const x = d3.scaleLinear()
    .domain([0, d3.max(engagementData)])
    .range([0, width]);

  const histogram = d3.histogram()
    .domain(x.domain())
    .thresholds(x.ticks(30));

  const bins = histogram(engagementData);

  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([height, 0]);

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
      if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
      return d;
    }))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Engajamento Total (Likes + Comentários)');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Quantidade de Posts');

  // Barras
  svg.selectAll('rect')
    .data(bins)
    .enter()
    .append('rect')
    .attr('x', 1)
    .attr('transform', d => `translate(${x(d.x0)},${y(d.length)})`)
    .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
    .attr('height', d => height - y(d.length))
    .attr('fill', '#FDB813')
    .attr('opacity', 0.7)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(event,
        `<strong>Range:</strong> ${Math.round(d.x0).toLocaleString('pt-BR')} - ${Math.round(d.x1).toLocaleString('pt-BR')}<br>` +
        `<strong>Posts:</strong> ${d.length}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.7);
      hideTooltip();
    });
}

function renderHashtagsVsEngagement(data) {
  const section = d3.select('#content-performance-chart')
    .append('div')
    .attr('class', 'performance-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Número de Hashtags vs Engajamento');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Correlação entre quantidade de hashtags usadas e engajamento total (likes + comentários)');

  // Adicionar filtro de plataforma
  const filterDiv = section.append('div')
    .attr('class', 'filters')
    .style('margin-bottom', '15px');

  filterDiv.append('label')
    .attr('for', 'hashtag-engagement-platform-filter')
    .text('Plataforma: ')
    .style('margin-right', '10px');

  const platformFilter = filterDiv.append('select')
    .attr('id', 'hashtag-engagement-platform-filter')
    .style('padding', '5px')
    .style('border-radius', '4px')
    .style('border', '1px solid #ddd');

  platformFilter.append('option').attr('value', '').text('Todas as plataformas');
  platformFilter.append('option').attr('value', 'instagram').text('Instagram');
  platformFilter.append('option').attr('value', 'tiktok').text('TikTok');

  const chartDiv = section.append('div').attr('id', 'hashtag-engagement-chart');

  // Função para renderizar o gráfico
  function updateChart(filteredData, selectedPlatform) {
    chartDiv.html('');

    if (!filteredData || filteredData.length === 0) {
      chartDiv.append('p')
        .style('text-align', 'center')
        .style('padding', '20px')
        .style('color', '#666')
        .text('Nenhum dado disponível para o filtro selecionado');
      return;
    }

    const margin = { top: 20, right: 30, bottom: 60, left: 90 };
    const width = document.getElementById('content-performance-chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = chartDiv
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escalas
    const x = d3.scaleLinear()
      .domain([0, d3.max(filteredData, d => d.hashtag_count)])
      .range([0, width])
      .nice();

    const y = d3.scaleLog()
      .domain([1, d3.max(filteredData, d => Math.max(1, parseInt(d.total_engagement)))])
      .range([height, 0])
      .nice();

    const colorScale = d3.scaleOrdinal()
      .domain(['instagram', 'tiktok'])
      .range(['#000000', '#FDB813']);

    // Definir número de ticks baseado na plataforma selecionada
    // Instagram tem valores menores e precisa de menos ticks
    const numTicks = selectedPlatform === 'instagram' ? 4 : 6;

    // Eixos - Reduzir número de ticks no eixo Y para evitar sobreposição
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 45)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Número de Hashtags');

    svg.append('g')
      .call(d3.axisLeft(y)
        .ticks(numTicks) // Ajustar número de ticks baseado na plataforma
        .tickFormat(d => {
          if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
          if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
          return d;
        }))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -70)
      .attr('x', -height / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .text('Engajamento (Likes + Comentários)');

    // Pontos
    svg.selectAll('.dot')
      .data(filteredData)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.hashtag_count))
      .attr('cy', d => y(Math.max(1, parseInt(d.total_engagement))))
      .attr('r', 3)
      .attr('fill', d => colorScale(d.platform))
      .attr('opacity', 0.5)
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 5).attr('opacity', 1);
        showTooltip(event,
          `<strong>@${d.username}</strong><br>` +
          `Plataforma: ${d.platform}<br>` +
          `Hashtags: ${d.hashtag_count}<br>` +
          `Engajamento: ${parseInt(d.total_engagement).toLocaleString('pt-BR')}`
        );
      })
      .on('mouseout', function() {
        d3.select(this).attr('r', 3).attr('opacity', 0.5);
        hideTooltip();
      });
  }

  // Renderizar inicialmente com todos os dados
  updateChart(data, '');

  // Evento de mudança no filtro
  platformFilter.on('change', function() {
    const selectedPlatform = this.value;
    const filteredData = selectedPlatform ?
      data.filter(d => d.platform === selectedPlatform) :
      data;
    updateChart(filteredData, selectedPlatform);
  });
}

function renderDiscussionPosts(data) {
  const section = d3.select('#content-performance-chart')
    .append('div')
    .attr('class', 'performance-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Posts que Geram Mais Discussão');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Top 20 posts com maior razão comentários/likes (posts que geram debate)');

  // Ordenar por razão comentários/likes
  const topDiscussion = [...data]
    .filter(d => d.comments_to_likes_ratio > 0)
    .sort((a, b) => b.comments_to_likes_ratio - a.comments_to_likes_ratio)
    .slice(0, 20);

  const margin = { top: 20, right: 30, bottom: 60, left: 200 };
  const width = document.getElementById('content-performance-chart').clientWidth - margin.left - margin.right;
  const height = Math.max(500, topDiscussion.length * 30) - margin.top - margin.bottom;

  const svg = section
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleLinear()
    .domain([0, d3.max(topDiscussion, d => parseFloat(d.comments_to_likes_ratio))])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(topDiscussion.map(d => `@${d.username} (${d.platform})`))
    .range([0, height])
    .padding(0.2);

  const colorScale = d3.scaleOrdinal()
    .domain(['instagram', 'tiktok'])
    .range(['#000000', '#FDB813']);

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Razão Comentários/Likes (%)');

  svg.append('g')
    .call(d3.axisLeft(y));

  // Barras
  svg.selectAll('.bar')
    .data(topDiscussion)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(`@${d.username} (${d.platform})`))
    .attr('width', d => x(parseFloat(d.comments_to_likes_ratio)))
    .attr('height', y.bandwidth())
    .attr('fill', d => colorScale(d.platform))
    .attr('opacity', 0.8)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      const caption = d.caption ? d.caption.substring(0, 100) + '...' : 'Sem caption';
      showTooltip(event,
        `<strong>@${d.username}</strong> (${d.platform})<br>` +
        `Likes: ${parseInt(d.likes_count).toLocaleString('pt-BR')}<br>` +
        `Comentários: ${parseInt(d.comments_count).toLocaleString('pt-BR')}<br>` +
        `Razão: ${parseFloat(d.comments_to_likes_ratio).toFixed(2)}%<br>` +
        `Caption: ${caption}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8);
      hideTooltip();
    })
    .on('click', function(event, d) {
      if (d.post_url) {
        window.open(d.post_url, '_blank');
      }
    });
}

// Expor função globalmente
window.renderContentPerformance = renderContentPerformance;
