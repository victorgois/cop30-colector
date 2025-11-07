// Visualização de Top Influenciadores

function renderInfluencers(data) {
  // Limpar visualização anterior
  d3.select('#influencers-chart').html('');

  if (!data || data.length === 0) {
    d3.select('#influencers-chart').append('p')
      .style('text-align', 'center')
      .style('padding', '20px')
      .text('Nenhum dado disponível');
    return;
  }

  // Pegar top 20
  const topData = data.slice(0, 20);

  const margin = { top: 20, right: 30, bottom: 120, left: 200 };
  const width = document.getElementById('influencers-chart').clientWidth - margin.left - margin.right;
  const height = Math.max(500, topData.length * 30) - margin.top - margin.bottom;

  // Criar SVG
  const svg = d3.select('#influencers-chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Escalas
  const x = d3.scaleLinear()
    .domain([0, d3.max(topData, d => parseInt(d.total_engagement))])
    .range([0, width]);

  const y = d3.scaleBand()
    .domain(topData.map(d => `@${d.username} (${d.platform})`))
    .range([0, height])
    .padding(0.2);

  // Cores por plataforma
  const colorScale = d3.scaleOrdinal()
    .domain(['instagram', 'tiktok'])
    .range(['#000000', '#FDB813']);

  // Eixos
  svg.append('g')
    .attr('class', 'axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => {
      if (d >= 1000000) return (d / 1000000).toFixed(1) + 'M';
      if (d >= 1000) return (d / 1000).toFixed(0) + 'K';
      return d;
    }))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Engajamento Total (Likes + Comentários)');

  svg.append('g')
    .attr('class', 'axis')
    .call(d3.axisLeft(y));

  // Barras
  svg.selectAll('.bar')
    .data(topData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', 0)
    .attr('y', d => y(`@${d.username} (${d.platform})`))
    .attr('width', d => x(parseInt(d.total_engagement)))
    .attr('height', y.bandwidth())
    .attr('fill', d => colorScale(d.platform))
    .attr('opacity', 0.8)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(event,
        `<strong>@${d.username}</strong> (${d.platform})<br>` +
        `Posts: ${d.post_count}<br>` +
        `Total Likes: ${parseInt(d.total_likes).toLocaleString('pt-BR')}<br>` +
        `Total Comentários: ${parseInt(d.total_comments).toLocaleString('pt-BR')}<br>` +
        `Engajamento Total: ${parseInt(d.total_engagement).toLocaleString('pt-BR')}<br>` +
        `Média de Likes: ${parseInt(d.avg_likes).toLocaleString('pt-BR')}<br>` +
        `Média de Comentários: ${parseInt(d.avg_comments).toLocaleString('pt-BR')}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8);
      hideTooltip();
    });

  // Labels de valores
  svg.selectAll('.label')
    .data(topData)
    .enter()
    .append('text')
    .attr('class', 'label')
    .attr('x', d => x(parseInt(d.total_engagement)) + 5)
    .attr('y', d => y(`@${d.username} (${d.platform})`) + y.bandwidth() / 2)
    .attr('dy', '0.35em')
    .style('font-size', '11px')
    .style('fill', '#333')
    .text(d => {
      const eng = parseInt(d.total_engagement);
      if (eng >= 1000000) return (eng / 1000000).toFixed(1) + 'M';
      if (eng >= 1000) return (eng / 1000).toFixed(0) + 'K';
      return eng;
    });

  // Legenda
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 150}, -10)`);

  legend.append('rect')
    .attr('width', 140)
    .attr('height', 60)
    .attr('fill', 'rgba(255, 255, 255, 0.9)')
    .attr('stroke', '#ddd')
    .attr('rx', 4);

  legend.append('rect')
    .attr('x', 10)
    .attr('y', 15)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', colorScale('instagram'));

  legend.append('text')
    .attr('x', 30)
    .attr('y', 27)
    .style('font-size', '12px')
    .text('Instagram');

  legend.append('rect')
    .attr('x', 10)
    .attr('y', 35)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', colorScale('tiktok'));

  legend.append('text')
    .attr('x', 30)
    .attr('y', 47)
    .style('font-size', '12px')
    .text('TikTok');
}

// Expor função globalmente
window.renderInfluencers = renderInfluencers;
