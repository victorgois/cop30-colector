const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkCollectionLogs() {
  try {
    // Verificar se a tabela existe
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'collection_logs'
      );
    `);
    
    console.log('Tabela collection_logs existe:', checkTable.rows[0].exists);
    
    if (checkTable.rows[0].exists) {
      // Contar registros
      const count = await pool.query('SELECT COUNT(*) FROM collection_logs;');
      console.log('Total de registros:', count.rows[0].count);
      
      // Mostrar últimos 10 registros
      const logs = await pool.query(`
        SELECT 
          id,
          execution_date,
          platform,
          keyword,
          posts_collected,
          execution_time_seconds,
          status
        FROM collection_logs
        ORDER BY execution_date DESC
        LIMIT 10;
      `);
      
      console.log('\n=== Últimos 10 Logs de Coleta ===');
      console.table(logs.rows);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Erro:', error);
    process.exit(1);
  }
}

checkCollectionLogs();
