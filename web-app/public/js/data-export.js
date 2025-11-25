// Funcionalidade de exportação de dados

function initDataExport() {
  const exportCsvBtn = document.getElementById('export-csv');
  const exportJsonBtn = document.getElementById('export-json');
  const exportFullBtn = document.getElementById('export-full');

  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => exportData('csv', false));
  }

  if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => exportData('json', false));
  }

  if (exportFullBtn) {
    exportFullBtn.addEventListener('click', () => exportData('csv', true));
  }
}

async function exportData(format, fullExport = false) {
  const statusDiv = document.getElementById('export-status');

  try {
    // Mostrar status
    statusDiv.style.display = 'block';
    statusDiv.innerHTML = '<p style="margin: 0; color: #666;">Preparando download...</p>';

    let data = [];

    if (fullExport) {
      // Para exportação completa, buscar em lotes para evitar sobrecarga
      statusDiv.innerHTML = '<p style="margin: 0; color: #666;">Baixando dados em lotes...</p>';

      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        try {
          console.log(`Buscando lote: offset=${offset}, limit=${batchSize}`);
          const batch = await apiClient.getPosts({ limit: batchSize, offset: offset });
          console.log(`Lote recebido: ${batch ? batch.length : 0} posts`);

          // Se não há dados ou array vazio, parar
          if (!batch || batch.length === 0) {
            console.log('Nenhum dado retornado, finalizando...');
            hasMore = false;
            break;
          }

          data = data.concat(batch);
          offset += batchSize;

          // Atualizar progresso
          statusDiv.innerHTML = `<p style="margin: 0; color: #666;">Baixados ${data.length} posts...</p>`;

          // Se retornou menos que o batch size, não há mais dados
          if (batch.length < batchSize) {
            console.log(`Último lote: ${batch.length} posts (menos que ${batchSize})`);
            hasMore = false;
          }
        } catch (error) {
          console.error('Erro ao buscar lote:', error);
          hasMore = false;
          // Se já temos dados, continue com o que foi baixado
          if (data.length === 0) {
            throw error; // Se não temos nenhum dado, propague o erro
          }
        }
      }

      console.log(`Download completo: ${data.length} posts no total`);
    } else {
      // Para exportação com filtros, usar o método normal
      const filters = {
        platform: document.getElementById('export-platform').value,
        start_date: document.getElementById('export-date-from').value,
        end_date: document.getElementById('export-date-to').value,
        keyword: document.getElementById('export-keyword').value,
        limit: document.getElementById('export-limit').value
      };

      // Remover filtros vazios
      Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
      });

      data = await apiClient.getPosts(filters);
    }

    if (!data || data.length === 0) {
      statusDiv.innerHTML = '<p style="margin: 0; color: #ff6b6b;">Nenhum dado encontrado com os filtros selecionados.</p>';
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
      return;
    }

    // Converter e baixar
    if (format === 'csv') {
      downloadCSV(data, fullExport);
    } else if (format === 'json') {
      downloadJSON(data);
    }

    // Mostrar sucesso
    statusDiv.innerHTML = `<p style="margin: 0; color: #4caf50;">Download iniciado! ${data.length} registros exportados.</p>`;
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);

  } catch (error) {
    console.error('Erro ao exportar dados:', error);
    statusDiv.innerHTML = '<p style="margin: 0; color: #ff6b6b;">Erro ao exportar dados. Tente novamente.</p>';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

function downloadCSV(data, fullExport) {
  // Definir colunas principais
  const columns = [
    'platform',
    'post_id',
    'username',
    'user_id',
    'caption',
    'likes_count',
    'comments_count',
    'views_count',
    'shares_count',
    'media_type',
    'media_url',
    'post_url',
    'created_at',
    'collected_at',
    'hashtags',
    'keyword_matched'
  ];

  // Criar cabeçalho
  let csv = columns.join(',') + '\n';

  // Adicionar linhas
  data.forEach(row => {
    const values = columns.map(col => {
      let value = row[col];

      // Tratar valores especiais
      if (value === null || value === undefined) {
        return '';
      }

      // Converter arrays para string
      if (Array.isArray(value)) {
        value = value.join(';');
      }

      // Escapar aspas e adicionar aspas ao redor do valor
      value = String(value).replace(/"/g, '""');
      return `"${value}"`;
    });

    csv += values.join(',') + '\n';
  });

  // Criar blob e baixar
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const filename = fullExport
    ? `cop30_dados_completos_${getDateString()}.csv`
    : `cop30_dados_filtrados_${getDateString()}.csv`;

  downloadFile(blob, filename);
}

function downloadJSON(data) {
  // Criar JSON formatado
  const json = JSON.stringify(data, null, 2);

  // Criar blob e baixar
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const filename = `cop30_dados_${getDateString()}.json`;

  downloadFile(blob, filename);
}

function downloadFile(blob, filename) {
  // Criar link temporário para download
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Limpar URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

function getDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  return `${year}${month}${day}_${hours}${minutes}`;
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', initDataExport);
