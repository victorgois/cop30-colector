#!/usr/bin/env node

/**
 * Script de Backup Automático do Banco de Dados
 *
 * Faz backup usando pg_dump diretamente via connection string do Supabase
 * Não requer acesso ao dashboard do Supabase
 *
 * Uso:
 *   node database/backup.js
 *   node database/backup.js --full  (inclui dados + schema)
 *   node database/backup.js --schema-only  (apenas schema)
 */

require('dotenv').config();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Criar diretório de backups se não existir
const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`📁 Diretório de backups criado: ${backupDir}`);
}

// Gerar nome do arquivo com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const args = process.argv.slice(2);

let backupType = 'full';
let backupFile = `backup-full-${timestamp}.sql`;

if (args.includes('--schema-only')) {
  backupType = 'schema';
  backupFile = `backup-schema-${timestamp}.sql`;
} else if (args.includes('--data-only')) {
  backupType = 'data';
  backupFile = `backup-data-${timestamp}.sql`;
}

const backupPath = path.join(backupDir, backupFile);

// Verificar se DATABASE_URL está configurada
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não está configurada no arquivo .env');
  process.exit(1);
}

// Construir comando pg_dump
let pgDumpCommand = `pg_dump "${process.env.DATABASE_URL}"`;

if (backupType === 'schema') {
  pgDumpCommand += ' --schema-only';
} else if (backupType === 'data') {
  pgDumpCommand += ' --data-only';
}

// Incluir apenas as tabelas e views do projeto
pgDumpCommand += ' -t posts -t users -t collection_logs';

// Adicionar redirecionamento para arquivo
pgDumpCommand += ` > "${backupPath}"`;

console.log('🔄 Iniciando backup do banco de dados...');
console.log(`📝 Tipo: ${backupType}`);
console.log(`📁 Destino: ${backupFile}`);

// Executar pg_dump
exec(pgDumpCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Erro ao fazer backup:', error.message);

    // Verificar se pg_dump está instalado
    if (error.message.includes('pg_dump') && error.message.includes('not found')) {
      console.error('\n⚠️  O comando pg_dump não foi encontrado.');
      console.error('Para instalar o PostgreSQL client:');
      console.error('  - macOS: brew install postgresql');
      console.error('  - Ubuntu: sudo apt-get install postgresql-client');
      console.error('  - Windows: https://www.postgresql.org/download/windows/');
    }

    process.exit(1);
  }

  if (stderr) {
    console.warn('⚠️  Avisos:', stderr);
  }

  // Verificar se o arquivo foi criado e tem conteúdo
  if (fs.existsSync(backupPath)) {
    const stats = fs.statSync(backupPath);
    const fileSizeKB = (stats.size / 1024).toFixed(2);

    console.log('✅ Backup concluído com sucesso!');
    console.log(`📦 Tamanho: ${fileSizeKB} KB`);
    console.log(`📍 Localização: ${backupPath}`);

    // Listar todos os backups
    const backups = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup-'))
      .sort()
      .reverse()
      .slice(0, 5);

    if (backups.length > 0) {
      console.log('\n📋 Últimos 5 backups:');
      backups.forEach((file, index) => {
        const filePath = path.join(backupDir, file);
        const fileStats = fs.statSync(filePath);
        const sizeKB = (fileStats.size / 1024).toFixed(2);
        const date = new Date(fileStats.mtime).toLocaleString('pt-BR');
        console.log(`  ${index + 1}. ${file} (${sizeKB} KB) - ${date}`);
      });
    }

    // Informações sobre restauração
    console.log('\n💡 Para restaurar este backup:');
    console.log(`   psql "$DATABASE_URL" < "${backupPath}"`);

  } else {
    console.error('❌ Erro: Arquivo de backup não foi criado');
    process.exit(1);
  }
});
