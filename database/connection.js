require('dotenv').config();
const { Pool } = require('pg');

// Detectar se é Render ou outro serviço que requer SSL
const isRenderDB = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('render.com');

// Criar pool de conexões PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.NODE_ENV === 'production' || isRenderDB)
    ? { rejectUnauthorized: false }
    : false
});

// Evento de erro
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Testar conexão
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = pool;
