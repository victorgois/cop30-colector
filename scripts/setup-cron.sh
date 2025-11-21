#!/bin/bash
# Script para configurar cron job que mantém o banco Supabase ativo
# Execute: chmod +x scripts/setup-cron.sh && ./scripts/setup-cron.sh

echo "🔧 Configurando cron job para keep-alive do banco de dados..."
echo ""

# Obter diretório do projeto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Criar comando cron
CRON_CMD="0 */6 * * * cd $PROJECT_DIR && /usr/local/bin/node scripts/keep-database-alive.js >> logs/keep-alive.log 2>&1"

# Criar diretório de logs se não existir
mkdir -p "$PROJECT_DIR/logs"

# Verificar se já existe um cron job similar
if crontab -l 2>/dev/null | grep -q "keep-database-alive"; then
  echo "⚠️  Já existe um cron job configurado para keep-alive"
  echo "Removendo cron job antigo..."
  crontab -l | grep -v "keep-database-alive" | crontab -
fi

# Adicionar novo cron job
(crontab -l 2>/dev/null; echo "$CRON_CMD") | crontab -

echo "✅ Cron job configurado com sucesso!"
echo ""
echo "📋 Configuração:"
echo "   Frequência: A cada 6 horas (00:00, 06:00, 12:00, 18:00)"
echo "   Script: $PROJECT_DIR/scripts/keep-database-alive.js"
echo "   Logs: $PROJECT_DIR/logs/keep-alive.log"
echo ""
echo "📝 Para verificar: crontab -l"
echo "📝 Para ver logs: tail -f $PROJECT_DIR/logs/keep-alive.log"
echo "📝 Para remover: crontab -e (e delete a linha com keep-database-alive)"
echo ""
