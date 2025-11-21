#!/usr/bin/env node
/**
 * Script para manter o banco Supabase ativo
 * Executa queries simples periodicamente para evitar pausamento por inatividade
 *
 * Supabase pausa projetos inativos após 7 dias no plano Free.
 * Este script evita isso fazendo pings regulares ao banco.
 */

require('dotenv').config();
const pool = require('../database/connection');
const cron = require('node-cron');

async function pingDatabase() {
  try {
    const start = Date.now();
    const result = await pool.query('SELECT NOW(), COUNT(*) as total_posts FROM posts');
    const duration = Date.now() - start;

    const now = result.rows[0].now;
    const totalPosts = result.rows[0].total_posts;

    console.log(`[${new Date().toISOString()}] ✅ Database ping successful`);
    console.log(`  Server time: ${now}`);
    console.log(`  Total posts: ${totalPosts}`);
    console.log(`  Response time: ${duration}ms\n`);

    return true;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Database ping failed:`, error.message);
    return false;
  }
}

// Executar ping imediato ao iniciar
console.log('🔄 Iniciando serviço de keep-alive do banco de dados...\n');
pingDatabase();

// Agendar ping a cada 6 horas (4x por dia)
// Isso garante que o banco nunca fique inativo por 7 dias
cron.schedule('0 */6 * * *', async () => {
  console.log('⏰ Executando ping agendado...');
  await pingDatabase();
});

console.log('⏰ Cron job configurado: ping a cada 6 horas');
console.log('📅 Próximas execuções: 00:00, 06:00, 12:00, 18:00');
console.log('💡 Mantenha este script rodando em segundo plano ou use um serviço como cron/systemd\n');

// Manter o processo rodando
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando serviço de keep-alive...');
  pool.end().then(() => {
    console.log('✅ Conexão com banco fechada');
    process.exit(0);
  });
});
