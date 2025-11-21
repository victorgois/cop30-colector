# Guia de Migração: Render → Supabase

Este guia detalha o processo de migração do banco de dados PostgreSQL do Render para o Supabase.

## Por que migrar?

- O Render está prestes a deletar o banco de dados (prazo: 4 dias)
- Supabase oferece tier gratuito generoso
- Mesma tecnologia (PostgreSQL) = migração simples
- Zero mudanças no código da aplicação

## Pré-requisitos

- Conta no Supabase (criar em https://supabase.com)
- Acesso ao banco Render atual (com dados)
- Node.js instalado localmente

## Passo a Passo

### 1. Exportar dados do Render (URGENTE!)

Execute o script de exportação **antes que o banco seja deletado**:

```bash
npm run db:export
```

Este comando irá:
- Conectar ao banco do Render
- Extrair todos os dados (posts, users, collection_logs)
- Criar backup em formato SQL e JSON
- Salvar em `/backups/render-backup-[timestamp].sql`

**IMPORTANTE:** Guarde este arquivo em local seguro! Você precisará dele.

### 2. Criar projeto no Supabase

1. Acesse https://supabase.com
2. Clique em "New Project"
3. Escolha:
   - Nome do projeto: `cop30-database` (ou outro nome)
   - Database Password: Crie uma senha forte e ANOTE
   - Region: South America (São Paulo) - para menor latência
   - Pricing Plan: Free

4. Aguarde ~2 minutos até o projeto estar pronto

### 3. Obter Connection String do Supabase

1. No dashboard do Supabase, vá em "Settings" → "Database"
2. Role até "Connection String"
3. Selecione "URI" (não "Transaction" ou "Session")
4. Copie a string que começa com `postgresql://postgres:[YOUR-PASSWORD]@...`
5. Substitua `[YOUR-PASSWORD]` pela senha que você criou no passo 2

A string deve ficar assim:
```
postgresql://postgres:SuaSenhaAqui@db.abcdefghijk.supabase.co:5432/postgres
```

### 4. Configurar variável de ambiente local

Atualize seu arquivo `.env` local:

```bash
# Substitua pela connection string do Supabase
DATABASE_URL=postgresql://postgres:SuaSenhaAqui@db.abcdefghijk.supabase.co:5432/postgres
```

### 5. Importar dados para o Supabase

Execute o script de importação:

```bash
npm run db:import
```

Este comando irá:
- Conectar ao Supabase
- Criar as tabelas (se não existirem)
- Importar todos os dados do backup
- Validar a importação

**Atenção:** O script vai perguntar se você quer limpar dados existentes. Responda `s` (sim) na primeira importação.

### 6. Verificar importação

1. Abaixe o dashboard do Supabase
2. Vá em "Table Editor"
3. Verifique se as tabelas foram criadas:
   - `posts`
   - `users`
   - `collection_logs`
4. Confira se os dados estão lá

Ou via terminal:

```bash
npm run db:test
```

### 7. Testar aplicação localmente

Com a nova `DATABASE_URL` configurada:

```bash
# Testar servidor web
npm run server

# Testar coletor
npm start
```

Verifique se tudo funciona normalmente.

### 8. Atualizar variáveis de ambiente em produção

**No Render (ou onde sua aplicação está hospedada):**

1. Acesse as configurações do seu serviço
2. Vá em "Environment Variables"
3. Atualize `DATABASE_URL` com a connection string do Supabase
4. Salve e aguarde o redeploy automático

**IMPORTANTE:** Não delete o banco do Render até confirmar que tudo está funcionando!

## Estrutura do Banco

O schema é mantido igual:

### Tabelas
- `posts` - Posts coletados do Instagram/TikTok
- `users` - Informações de usuários
- `collection_logs` - Logs das coletas do Apify

### Views
- `stats_summary` - Estatísticas gerais
- `daily_timeline` - Timeline diária de posts (2025)
- `top_hashtags` - Hashtags mais usadas

## Scripts Disponíveis

- `npm run db:export` - Exportar dados do Render
- `npm run db:import` - Importar dados para Supabase
- `npm run db:test` - Testar conexão com banco
- `npm run db:stats` - Ver estatísticas do banco
- `npm run db:init` - Criar schema (se necessário)

## Vantagens do Supabase

1. **Tier Gratuito Generoso:**
   - 500 MB de espaço em banco
   - Até 2 GB de transferência
   - Backups automáticos

2. **Features Incluídas:**
   - Dashboard web intuitivo
   - SQL Editor integrado
   - API REST automática (se precisar no futuro)
   - Backups diários

3. **Performance:**
   - Mesma tecnologia PostgreSQL
   - Conexões SSL seguras
   - Servidor na América do Sul

## Troubleshooting

### Erro: "Connection timeout"
- Verifique se a connection string está correta
- Confirme que copiou a senha corretamente (sem espaços)

### Erro: "SSL required"
- O código já está configurado para usar SSL com Supabase
- Se o erro persistir, verifique `database/connection.js`

### Erro: "Duplicate key"
- Acontece se você tentar importar dados que já existem
- Execute novamente e responda `s` para limpar dados existentes

### Dados não aparecem no Supabase
- Verifique os logs do script de importação
- Confirme que o arquivo de backup não está vazio
- Tente executar `npm run db:import` novamente

## Rollback (se necessário)

Se algo der errado e você precisar voltar para o Render:

1. Mude `DATABASE_URL` de volta para a string do Render
2. Restart da aplicação
3. Os dados no Render permanecerão intactos (até serem deletados)

## Próximos Passos

Após migração bem-sucedida:

1. ✅ Confirme que a aplicação está funcionando
2. ✅ Monitore logs por 24-48h
3. ✅ Configure backups no Supabase (automáticos no plano gratuito)
4. ✅ Atualize documentação interna se necessário
5. ⚠️ Só delete o banco do Render após 100% de certeza

## Suporte

Se encontrar problemas:

1. Verifique os logs dos scripts
2. Teste conexão: `npm run db:test`
3. Revise este guia
4. Consulte a documentação do Supabase: https://supabase.com/docs

## Checklist de Migração

- [ ] Dados exportados do Render (`npm run db:export`)
- [ ] Backup salvo em local seguro
- [ ] Projeto criado no Supabase
- [ ] Connection string obtida
- [ ] `.env` local atualizado
- [ ] Dados importados (`npm run db:import`)
- [ ] Importação verificada no dashboard
- [ ] Aplicação testada localmente
- [ ] Variáveis de ambiente atualizadas em produção
- [ ] Aplicação em produção funcionando
- [ ] Monitoramento por 24-48h OK
- [ ] Banco antigo do Render pode ser deletado

---

**Data de criação:** 2025-11-12
**Prazo Render:** 4 dias a partir da data de criação
