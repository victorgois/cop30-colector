# Opções para Manter Banco Supabase Ativo (Gratuito)

O Supabase pausa projetos inativos após **7 dias** no plano Free. Aqui estão as opções para evitar isso sem custos.

## Opção 1: Cron Job Local (Mac/Linux)

Se você tem um computador que fica ligado frequentemente:

### Setup Automático:
```bash
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

### Setup Manual:
```bash
crontab -e
```

Adicione esta linha:
```
0 */6 * * * cd /Users/victorgois/Repositories/cop30 && /usr/local/bin/node scripts/keep-database-alive.js >> logs/keep-alive.log 2>&1
```

**Prós:**
- ✅ Totalmente gratuito
- ✅ Você controla tudo
- ✅ Sem dependências externas

**Contras:**
- ❌ Requer computador ligado
- ❌ Não funciona se o Mac estiver desligado/dormindo

## Opção 2: GitHub Actions (RECOMENDADO)

Usar GitHub Actions para fazer ping automático - **100% gratuito!**

### 1. Criar workflow:

Crie o arquivo `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Supabase Database Alive

on:
  schedule:
    # Executa a cada 6 horas
    - cron: '0 */6 * * *'
  workflow_dispatch: # Permite execução manual

jobs:
  ping-database:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install pg dotenv

      - name: Ping database
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
        run: |
          node -e "
          require('dotenv').config();
          const { Pool } = require('pg');
          const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
          });

          (async () => {
            try {
              const result = await pool.query('SELECT NOW(), COUNT(*) FROM posts');
              console.log('✅ Database ping successful');
              console.log('Time:', result.rows[0].now);
              console.log('Posts:', result.rows[0].count);
              await pool.end();
            } catch (error) {
              console.error('❌ Error:', error.message);
              process.exit(1);
            }
          })();
          "
```

### 2. Configurar Secret:
1. Vá em **Settings** → **Secrets and variables** → **Actions**
2. Clique em **New repository secret**
3. Nome: `DATABASE_URL`
4. Valor: Sua connection string do Supabase
5. Clique em **Add secret**

### 3. Ativar Actions:
1. Vá na aba **Actions** do seu repositório
2. Habilite workflows se estiver desabilitado
3. O workflow rodará automaticamente a cada 6 horas

**Prós:**
- ✅ **100% gratuito** (GitHub Actions tem 2.000 min/mês grátis)
- ✅ Roda na nuvem (não depende do seu computador)
- ✅ Confiável e automático
- ✅ Logs disponíveis no GitHub
- ✅ Você gasta ~1 minuto/dia = ~30 min/mês (bem abaixo do limite)

**Contras:**
- Nenhum significativo!

## Opção 3: Render Cron Job (Free Tier)

O Render tem cron jobs gratuitos:

### 1. Criar arquivo para cron:
Já existe em `scripts/keep-database-alive.js`

### 2. No Render:
1. Crie um novo **Cron Job** (não Web Service)
2. Configure:
   - **Command**: `node scripts/keep-database-alive.js`
   - **Schedule**: `0 */6 * * *` (a cada 6 horas)
   - **Environment**: Adicione `DATABASE_URL`

**Prós:**
- ✅ Gratuito
- ✅ Simples de configurar
- ✅ Roda na nuvem

**Contras:**
- ⚠️ Limitado a 400 horas/mês no free tier (suficiente)
- ⚠️ Pode ter suspensões se ultrapassar o limite

## Opção 4: Railway Cron Job

Similar ao Render:

1. Deploy o projeto no Railway
2. Configure cron job
3. Adicione `DATABASE_URL` nas env vars

**Prós:**
- ✅ Gratuito ($5 de crédito/mês)
- ✅ Interface amigável

**Contras:**
- ⚠️ Créditos mensais limitados

## Opção 5: Serviços de Ping Externos

### UptimeRobot (https://uptimerobot.com)
- ✅ Gratuito
- ✅ Monitora até 50 endpoints
- ⚠️ Funciona apenas para endpoints HTTP (não para DB direto)

**Solução:** Criar um endpoint `/health` na sua aplicação que faça o ping no DB.

## Opção 6: Webhook + IFTTT/Zapier

- ⚠️ Mais complexo
- ⚠️ Limitações no plano gratuito

## Comparação Rápida

| Opção | Custo | Confiabilidade | Complexidade | Recomendação |
|-------|-------|---------------|--------------|--------------|
| **GitHub Actions** | ✅ Grátis | ⭐⭐⭐⭐⭐ | ⭐⭐ Fácil | **MELHOR** |
| Cron Local | ✅ Grátis | ⭐⭐ Depende | ⭐ Muito fácil | Se PC sempre ligado |
| Render Cron | ✅ Grátis | ⭐⭐⭐⭐ | ⭐⭐ Fácil | Boa alternativa |
| Railway | ✅ Grátis* | ⭐⭐⭐⭐ | ⭐⭐ Fácil | Boa alternativa |
| UptimeRobot | ✅ Grátis | ⭐⭐⭐ | ⭐⭐⭐ Média | Requer endpoint |

## Recomendação Final

Para seu caso (pós-coleta, banco ativo mas não em uso constante):

### **1ª Escolha: GitHub Actions**
- Totalmente gratuito
- Não depende de nada além do GitHub
- Fácil de configurar
- Logs disponíveis
- Muito confiável

### **2ª Escolha: Render Cron Job**
- Se você já usa Render
- Configuração simples

### **3ª Escolha: Cron Local**
- Se você tem um servidor/computador sempre ligado

## Setup Rápido - GitHub Actions

1. Criar arquivo `.github/workflows/keep-alive.yml` (veja acima)
2. Adicionar `DATABASE_URL` nos Secrets
3. Commit e push
4. Pronto! Rodará automaticamente

## Monitoramento

Para verificar se está funcionando:

```bash
# Última atividade no Supabase
# Vá em: Dashboard → Database → Table Editor → posts
# Verifique a data de criação/modificação
```

Ou consulte os logs:
- **GitHub Actions**: Aba Actions do repositório
- **Cron Local**: `tail -f logs/keep-alive.log`
- **Render**: Dashboard do cron job

## Notas Importantes

1. **Frequência mínima**: Ping a cada 6 dias (margem de segurança: a cada 6 horas)
2. **Custo de ping**: Praticamente zero (query simples: `SELECT NOW()`)
3. **Impacto no banco**: Mínimo (1 conexão, 1 query leve)
4. **Limites do Supabase Free**:
   - 500 MB storage
   - 2 GB bandwidth/mês
   - Pausamento após 7 dias de inatividade
   - Pings simples não afetam esses limites

## Troubleshooting

### Database ainda está pausando
- Verifique se o cron está rodando nos logs
- Confirme que `DATABASE_URL` está correta
- Veja última execução do workflow/cron

### Erro de conexão
- Verifique SSL: `ssl: { rejectUnauthorized: false }`
- Confirme que a senha está correta
- Teste manualmente: `npm run db:test`

---

**Recomendação:** Use GitHub Actions - é a solução mais confiável e 100% gratuita!
