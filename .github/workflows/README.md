# GitHub Actions Workflows

Este diretório contém os workflows automatizados do GitHub Actions para o projeto COP30 Data Collector.

## Workflows Disponíveis

### 1. Automated Data Collection (`data-collection.yml`)

Workflow responsável por executar a coleta automática de dados das redes sociais (Instagram e TikTok) usando Apify.

#### Agendamento

O workflow executa automaticamente nos seguintes horários (horário de Brasília - BRT):

- **9:00 AM** - Coleta da manhã
- **6:00 PM** - Coleta da tarde

> **Nota**: Os horários no cron estão em UTC. Para BRT (UTC-3), os horários são:
> - 12:00 UTC = 9:00 AM BRT
> - 21:00 UTC = 6:00 PM BRT

#### Execução Manual

Você pode executar o workflow manualmente a qualquer momento:

1. Acesse a aba **Actions** no repositório
2. Selecione o workflow **Automated Data Collection**
3. Clique em **Run workflow**
4. Escolha o nível de log desejado (opcional)
5. Clique em **Run workflow** para confirmar

#### Secrets Necessários

Para que o workflow funcione corretamente, você precisa configurar os seguintes secrets no GitHub:

1. **`DATABASE_URL`**
   - Descrição: String de conexão com o banco de dados PostgreSQL
   - Formato: `postgresql://usuario:senha@host:porta/database`
   - Exemplo: `postgresql://user:pass@db.render.com:5432/cop30_db`

2. **`APIFY_API_TOKEN`**
   - Descrição: Token de autenticação da API do Apify
   - Como obter: https://console.apify.com/account/integrations
   - Formato: String do token (ex: `apify_api_xxx...`)

#### Como Configurar os Secrets

1. Acesse seu repositório no GitHub
2. Vá em **Settings** > **Secrets and variables** > **Actions**
3. Clique em **New repository secret**
4. Adicione cada secret:
   - Nome: `DATABASE_URL`
   - Valor: Sua string de conexão do banco
   - Clique em **Add secret**
5. Repita para `APIFY_API_TOKEN`

#### Logs e Monitoramento

- Os logs da coleta são automaticamente salvos como artifacts
- Você pode baixar os logs em **Actions** > workflow executado > **Artifacts**
- Os logs são mantidos por 7 dias
- Logs incluem:
  - `collector.log` - Log geral da coleta
  - `error.log` - Apenas erros

#### Recursos do Workflow

- **Timeout**: 30 minutos (para evitar execução indefinida)
- **Node.js**: Versão 18 (LTS)
- **Cache**: Dependências npm são cacheadas para execução mais rápida
- **Notificação**: Falhas são notificadas no histórico do workflow

#### Troubleshooting

**O workflow não está executando nos horários agendados**
- Verifique se o repositório não está inativo (GitHub pode desabilitar workflows em repos inativos)
- Confirme que o workflow está habilitado em Settings > Actions

**Erro de autenticação no banco de dados**
- Verifique se o secret `DATABASE_URL` está configurado corretamente
- Confirme que o banco de dados aceita conexões externas
- Verifique as credenciais e o host

**Erro com Apify**
- Verifique se o secret `APIFY_API_TOKEN` está configurado
- Confirme que o token é válido e não expirou
- Verifique se você tem créditos disponíveis no Apify

**Timeout do workflow**
- Se a coleta está demorando mais de 30 minutos, ajuste o `timeout-minutes` no workflow
- Considere otimizar o número de posts coletados por hashtag

#### Variáveis de Ambiente

O workflow configura automaticamente:

| Variável | Valor | Descrição |
|----------|-------|-----------|
| `DATABASE_URL` | Secret | String de conexão do banco |
| `APIFY_API_TOKEN` | Secret | Token da API Apify |
| `AUTO_COLLECT_ENABLED` | `false` | Executa coleta única (não fica em modo daemon) |
| `LOG_LEVEL` | `info` ou input | Nível de detalhamento dos logs |
| `NODE_ENV` | `production` | Ambiente de execução |

## Manutenção

### Ajustar Horários de Coleta

Para alterar os horários de coleta automática, edite o arquivo `data-collection.yml`:

```yaml
schedule:
  - cron: '0 12 * * *'  # Manhã: altere aqui
  - cron: '0 21 * * *'  # Tarde: altere aqui
```

Use [crontab.guru](https://crontab.guru) para gerar expressões cron.

### Adicionar Novos Workflows

Para criar um novo workflow:

1. Crie um arquivo `.yml` neste diretório
2. Defina o trigger (schedule, push, pull_request, etc)
3. Configure os jobs e steps necessários
4. Commit e push para o repositório

### Desabilitar Coleta Automática

Se você quiser desabilitar temporariamente a coleta automática sem deletar o workflow:

1. Acesse **Settings** > **Actions** > **General**
2. Em **Workflow permissions**, desabilite o workflow específico

Ou comente as linhas de `schedule` no arquivo do workflow.

## Segurança

- **Nunca** commite secrets diretamente no código
- Use sempre GitHub Secrets para informações sensíveis
- Revise regularmente os logs para detectar atividades suspeitas
- Mantenha o token do Apify seguro e renove periodicamente

## Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions)
- [Apify API Documentation](https://docs.apify.com/api/v2)
