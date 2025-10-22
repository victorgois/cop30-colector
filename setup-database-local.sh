#!/bin/bash
# Script de configuração do banco de dados PostgreSQL local
# Projeto COP30

echo "=== Configuração do Banco de Dados PostgreSQL ==="
echo ""

# Verificar se Homebrew está instalado
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew não está instalado."
    echo "Instale em: https://brew.sh"
    exit 1
fi

echo "✅ Homebrew detectado"

# Instalar PostgreSQL
echo ""
echo "Instalando PostgreSQL 15..."
brew install postgresql@15

# Adicionar ao PATH
echo ""
echo "Configurando PATH..."
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Iniciar serviço
echo ""
echo "Iniciando serviço PostgreSQL..."
brew services start postgresql@15

# Aguardar serviço iniciar
echo "Aguardando serviço iniciar..."
sleep 5

# Criar banco de dados
echo ""
echo "Criando banco de dados 'cop30_db'..."
createdb cop30_db

# Executar schema
echo ""
echo "Executando schema SQL..."
psql cop30_db < database/schema.sql

echo ""
echo "✅ Banco de dados configurado com sucesso!"
echo ""
echo "Configuração do .env:"
echo "DATABASE_URL=postgresql://$(whoami)@localhost:5432/cop30_db"
echo ""
echo "Comandos úteis:"
echo "  - Conectar ao banco: psql cop30_db"
echo "  - Parar PostgreSQL: brew services stop postgresql@15"
echo "  - Iniciar PostgreSQL: brew services start postgresql@15"
