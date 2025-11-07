// Visualização de Análise de Narrativas

async function renderNarrativeAnalysis() {
  const container = d3.select('#narrative-analysis-chart');
  container.html('');

  try {
    const [narrativeData, topWords] = await Promise.all([
      apiClient.getNarrativeAnalysis(),
      apiClient.getTopWords(100)
    ]);

    // Criar seções
    renderWordCloud(topWords);
    renderCaptionAnalysis(narrativeData);
    renderEmojiAnalysis(narrativeData);
    renderMentionAnalysis(narrativeData);
  } catch (error) {
    console.error('Erro ao carregar análise de narrativas:', error);
    container.append('p')
      .style('color', 'red')
      .style('text-align', 'center')
      .text('Erro ao carregar dados');
  }
}

function renderWordCloud(data) {
  if (!data || data.length === 0) return;

  const section = d3.select('#narrative-analysis-chart')
    .append('div')
    .attr('class', 'narrative-section')
    .style('margin-bottom', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Nuvem de Palavras');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Palavras mais frequentes nas captions (stopwords removidas)');

  const width = document.getElementById('narrative-analysis-chart').clientWidth;
  const height = 400;

  // Criar escala de tamanho
  const maxCount = d3.max(data, d => parseInt(d.word_count));
  const minCount = d3.min(data, d => parseInt(d.word_count));

  const sizeScale = d3.scaleLinear()
    .domain([minCount, maxCount])
    .range([14, 60]);

  const colorScale = d3.scaleOrdinal()
    .domain(data.map(d => d.word))
    .range(['#FDB813', '#000000', '#FFC94D', '#333333', '#FFD700', '#666666', '#FFA500', '#999999']);

  const cloudDiv = section.append('div')
    .attr('id', 'word-cloud-container')
    .style('position', 'relative')
    .style('width', `${width}px`)
    .style('height', `${height}px`)
    .style('background', '#f9f9f9')
    .style('border', '1px solid #ddd')
    .style('border-radius', '8px')
    .style('overflow', 'hidden');

  // Posicionamento simples baseado em grid
  const wordsToShow = data.slice(0, 50);
  const cols = 10;
  const rows = Math.ceil(wordsToShow.length / cols);
  const cellWidth = width / cols;
  const cellHeight = height / rows;

  wordsToShow.forEach((d, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = col * cellWidth + cellWidth / 2 + (Math.random() - 0.5) * 20;
    const y = row * cellHeight + cellHeight / 2 + (Math.random() - 0.5) * 20;
    const fontSize = sizeScale(parseInt(d.word_count));
    const rotation = Math.random() > 0.7 ? -45 : 0;

    cloudDiv.append('span')
      .text(d.word)
      .style('position', 'absolute')
      .style('left', `${x}px`)
      .style('top', `${y}px`)
      .style('transform', `translate(-50%, -50%) rotate(${rotation}deg)`)
      .style('font-size', `${fontSize}px`)
      .style('font-weight', '600')
      .style('color', colorScale(d.word))
      .style('cursor', 'pointer')
      .style('user-select', 'none')
      .style('white-space', 'nowrap')
      .on('mouseover', function(event) {
        d3.select(this).style('opacity', '0.7');
        showTooltip(event,
          `<strong>${d.word}</strong><br>` +
          `Menções: ${parseInt(d.word_count).toLocaleString('pt-BR')}<br>` +
          `Posts: ${parseInt(d.post_count).toLocaleString('pt-BR')}`
        );
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', '1');
        hideTooltip();
      });
  });
}

function renderCaptionAnalysis(data) {
  if (!data || data.length === 0) return;

  const section = d3.select('#narrative-analysis-chart')
    .append('div')
    .attr('class', 'narrative-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Análise de Captions');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Distribuição do comprimento das captions por plataforma');

  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = document.getElementById('narrative-analysis-chart').clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = section
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Criar bins de comprimento
  const lengthBins = [
    { label: '0-50', min: 0, max: 50 },
    { label: '51-100', min: 51, max: 100 },
    { label: '101-200', min: 101, max: 200 },
    { label: '201-500', min: 201, max: 500 },
    { label: '500+', min: 501, max: Infinity }
  ];

  const binnedData = lengthBins.map(bin => {
    const posts = data.filter(d =>
      d.caption_length >= bin.min && d.caption_length <= bin.max
    );
    return {
      label: bin.label,
      count: posts.length,
      avgEngagement: posts.length > 0
        ? d3.mean(posts, p => parseInt(p.total_engagement))
        : 0
    };
  });

  // Escalas
  const x = d3.scaleBand()
    .domain(binnedData.map(d => d.label))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(binnedData, d => d.count)])
    .range([height, 0])
    .nice();

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Comprimento da Caption (caracteres)');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Posts');

  // Barras
  svg.selectAll('.bar')
    .data(binnedData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.label))
    .attr('y', d => y(d.count))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.count))
    .attr('fill', '#FDB813')
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(event,
        `<strong>${d.label} caracteres</strong><br>` +
        `Posts: ${d.count.toLocaleString('pt-BR')}<br>` +
        `Eng. médio: ${Math.round(d.avgEngagement).toLocaleString('pt-BR')}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8);
      hideTooltip();
    });
}

function renderEmojiAnalysis(data) {
  if (!data || data.length === 0) return;

  const section = d3.select('#narrative-analysis-chart')
    .append('div')
    .attr('class', 'narrative-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Uso de Emojis');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Análise do uso de emojis nas captions');

  // Estatísticas de emojis
  const withEmojis = data.filter(d => d.emoji_count > 0).length;
  const withoutEmojis = data.filter(d => d.emoji_count === 0).length;
  const avgEmojis = d3.mean(data, d => d.emoji_count);
  const maxEmojis = d3.max(data, d => d.emoji_count);

  const statsDiv = section.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
    .style('gap', '20px')
    .style('margin-bottom', '20px');

  const stats = [
    { label: 'Posts com Emojis', value: withEmojis, total: data.length },
    { label: 'Posts sem Emojis', value: withoutEmojis, total: data.length },
    { label: 'Média de Emojis', value: avgEmojis.toFixed(1), suffix: 'emojis/post' },
    { label: 'Máximo de Emojis', value: maxEmojis, suffix: 'emojis' }
  ];

  stats.forEach(stat => {
    const card = statsDiv.append('div')
      .style('background', '#f9f9f9')
      .style('border', '2px solid #FDB813')
      .style('border-radius', '8px')
      .style('padding', '20px')
      .style('text-align', 'center');

    card.append('div')
      .style('font-size', '14px')
      .style('color', '#666')
      .style('margin-bottom', '8px')
      .text(stat.label);

    card.append('div')
      .style('font-size', '28px')
      .style('font-weight', '700')
      .style('color', '#000')
      .text(stat.value);

    if (stat.suffix) {
      card.append('div')
        .style('font-size', '12px')
        .style('color', '#999')
        .text(stat.suffix);
    }

    if (stat.total) {
      card.append('div')
        .style('font-size', '12px')
        .style('color', '#999')
        .style('margin-top', '4px')
        .text(`${((stat.value / stat.total) * 100).toFixed(1)}% do total`);
    }
  });

  // Distribuição de quantidade de emojis
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = document.getElementById('narrative-analysis-chart').clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = section
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Agrupar por quantidade de emojis
  const emojiGroups = d3.rollup(
    data,
    v => v.length,
    d => Math.min(d.emoji_count, 10) // Agrupar 10+ juntos
  );

  const emojiData = Array.from(emojiGroups, ([count, posts]) => ({
    count: count === 10 ? '10+' : count.toString(),
    posts
  })).sort((a, b) => {
    const aVal = a.count === '10+' ? 10 : parseInt(a.count);
    const bVal = b.count === '10+' ? 10 : parseInt(b.count);
    return aVal - bVal;
  });

  // Escalas
  const x = d3.scaleBand()
    .domain(emojiData.map(d => d.count))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(emojiData, d => d.posts)])
    .range([height, 0])
    .nice();

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Emojis por Post');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Posts');

  // Barras
  svg.selectAll('.bar')
    .data(emojiData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.count))
    .attr('y', d => y(d.posts))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.posts))
    .attr('fill', '#000000')
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(event,
        `<strong>${d.count} emojis</strong><br>` +
        `Posts: ${d.posts.toLocaleString('pt-BR')}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8);
      hideTooltip();
    });
}

function renderMentionAnalysis(data) {
  if (!data || data.length === 0) return;

  const section = d3.select('#narrative-analysis-chart')
    .append('div')
    .attr('class', 'narrative-section')
    .style('margin-top', '40px');

  section.append('h4')
    .style('margin-bottom', '15px')
    .text('Uso de Menções (@)');

  section.append('p')
    .style('color', '#666')
    .style('font-size', '14px')
    .style('margin-bottom', '15px')
    .text('Análise do uso de menções nas captions');

  // Estatísticas de menções
  const withMentions = data.filter(d => d.mention_count > 0).length;
  const withoutMentions = data.filter(d => d.mention_count === 0).length;
  const avgMentions = d3.mean(data, d => d.mention_count);
  const maxMentions = d3.max(data, d => d.mention_count);

  const statsDiv = section.append('div')
    .style('display', 'grid')
    .style('grid-template-columns', 'repeat(auto-fit, minmax(200px, 1fr))')
    .style('gap', '20px')
    .style('margin-bottom', '20px');

  const stats = [
    { label: 'Posts com Menções', value: withMentions, total: data.length },
    { label: 'Posts sem Menções', value: withoutMentions, total: data.length },
    { label: 'Média de Menções', value: avgMentions.toFixed(1), suffix: 'menções/post' },
    { label: 'Máximo de Menções', value: maxMentions, suffix: 'menções' }
  ];

  stats.forEach(stat => {
    const card = statsDiv.append('div')
      .style('background', '#f9f9f9')
      .style('border', '2px solid #000')
      .style('border-radius', '8px')
      .style('padding', '20px')
      .style('text-align', 'center');

    card.append('div')
      .style('font-size', '14px')
      .style('color', '#666')
      .style('margin-bottom', '8px')
      .text(stat.label);

    card.append('div')
      .style('font-size', '28px')
      .style('font-weight', '700')
      .style('color', '#000')
      .text(stat.value);

    if (stat.suffix) {
      card.append('div')
        .style('font-size', '12px')
        .style('color', '#999')
        .text(stat.suffix);
    }

    if (stat.total) {
      card.append('div')
        .style('font-size', '12px')
        .style('color', '#999')
        .style('margin-top', '4px')
        .text(`${((stat.value / stat.total) * 100).toFixed(1)}% do total`);
    }
  });

  // Distribuição de quantidade de menções
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const width = document.getElementById('narrative-analysis-chart').clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = section
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Agrupar por quantidade de menções
  const mentionGroups = d3.rollup(
    data,
    v => v.length,
    d => Math.min(d.mention_count, 10) // Agrupar 10+ juntos
  );

  const mentionData = Array.from(mentionGroups, ([count, posts]) => ({
    count: count === 10 ? '10+' : count.toString(),
    posts
  })).sort((a, b) => {
    const aVal = a.count === '10+' ? 10 : parseInt(a.count);
    const bVal = b.count === '10+' ? 10 : parseInt(b.count);
    return aVal - bVal;
  });

  // Escalas
  const x = d3.scaleBand()
    .domain(mentionData.map(d => d.count))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(mentionData, d => d.posts)])
    .range([height, 0])
    .nice();

  // Eixos
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Menções por Post');

  svg.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -height / 2)
    .attr('fill', 'currentColor')
    .style('text-anchor', 'middle')
    .text('Número de Posts');

  // Barras
  svg.selectAll('.bar')
    .data(mentionData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.count))
    .attr('y', d => y(d.posts))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.posts))
    .attr('fill', '#FDB813')
    .attr('opacity', 0.8)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('opacity', 1);
      showTooltip(event,
        `<strong>${d.count} menções</strong><br>` +
        `Posts: ${d.posts.toLocaleString('pt-BR')}`
      );
    })
    .on('mouseout', function() {
      d3.select(this).attr('opacity', 0.8);
      hideTooltip();
    });
}

// Expor função globalmente
window.renderNarrativeAnalysis = renderNarrativeAnalysis;
