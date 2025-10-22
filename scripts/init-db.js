#!/usr/bin/env node
/**
 * Script de inicialização do banco de dados para produção
 * Executa o schema.sql no PostgreSQL do Render
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Conectando ao banco de dados...');

    // Ler o arquivo schema.sql
    const schemaPath = path.join(__dirname, '../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('🔄 Executando schema...');
    await pool.query(schema);

    console.log('✅ Banco de dados inicializado com sucesso!');
    console.log('📊 Tabelas criadas: posts, users, collection_logs');
    console.log('📊 Views criadas: stats_summary, daily_timeline, top_hashtags');

  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  initDatabase();
}

module.exports = initDatabase;
