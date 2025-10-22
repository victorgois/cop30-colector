# Guia de Configuração do Banco de Dados

Escolha uma das opções abaixo para configurar o PostgreSQL.

---

## Opção 1: PostgreSQL Local (macOS)

### Passo 1: Executar script de instalação

```bash
./setup-database-local.sh
```

### Passo 2: Atualizar .env

Abra o arquivo `.env` e atualize:

```env
DATABASE_URL=postgresql://SEU_USUARIO@localhost:5432/cop30_db
```

Substitua `SEU_USUARIO` pelo seu nome de usuário do Mac (use o comando `whoami` para descobrir).

### Passo 3: Testar conexão

```bash
psql cop30_db -c "SELECT COUNT(*) FROM posts;"
```

---

## Opção 2: Supabase (Cloud - Gratuito)

### Passo 1: Criar conta no Supabase

1. Acesse: https://supabase.com
2. Clique em "Start your project"
3. Faça login com GitHub

### Passo 2: Criar novo projeto

1. Clique em "New Project"
2. Preencha:
   - **Name**: cop30-db
   - **Database Password**: [crie uma senha forte]
   - **Region**: South America (São Paulo)
3. Clique em "Create new project"
4. Aguarde ~2 minutos (projeto sendo criado)

### Passo 3: Obter Connection String

1. No menu lateral, clique em "Project Settings" (ícone de engrenagem)
2. Vá em "Database"
3. Role até "Connection string"
4. Copie a URI no formato **URI** (não Pooler)
5. Substitua `[YOUR-PASSWORD]` pela senha que você criou

Exemplo:
```
postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### Passo 4: Atualizar .env

```env
DATABASE_URL=postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
```

### Passo 5: Executar schema no Supabase

Opção A - Via interface web:
1. No Supabase, vá em "SQL Editor"
2. Clique em "New query"
3. Cole o conteúdo do arquivo `database/schema.sql`
4. Clique em "Run"

Opção B - Via linha de comando:
```bash
# Instalar cliente PostgreSQL (só precisa do cliente)
brew install libpq

# Executar schema (substitua pela sua connection string)
psql "postgresql://postgres.xxxxx:SUA_SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" < database/schema.sql
```

### Passo 6: Testar conexão

```bash
node -e "require('./database/connection')"
```

Você deve ver: `Database connected successfully at: [timestamp]`

---

## Opção 3: Render (Cloud - Gratuito)

### Passo 1: Criar conta

1. Acesse: https://render.com
2. Faça login com GitHub

### Passo 2: Criar PostgreSQL

1. No dashboard, clique em "New +"
2. Selecione "PostgreSQL"
3. Preencha:
   - **Name**: cop30-db
   - **Database**: cop30_db
   - **User**: cop30_user
   - **Region**: Oregon (mais próximo gratuito)
   - **PostgreSQL Version**: 15
   - **Plan**: Free
4. Clique em "Create Database"

### Passo 3: Obter credenciais

1. Aguarde o banco ser criado (~1 minuto)
2. Na página do banco, role até "Connections"
3. Copie a "External Database URL"

### Passo 4: Atualizar .env

```env
DATABASE_URL=postgresql://cop30_user:xxxx@oregon-postgres.render.com/cop30_db
```

### Passo 5: Executar schema

```bash
# Via psql (precisa ter libpq instalado)
psql "SUA_DATABASE_URL_AQUI" < database/schema.sql
```

---

## Verificar se está funcionando

Após configurar qualquer uma das opções:

### 1. Testar conexão do Node.js

```bash
node -e "require('./database/connection')"
```

Saída esperada:
```
Database connected successfully at: 2025-10-14T12:00:00.000Z
```

### 2. Verificar tabelas criadas

```bash
# Para local:
psql cop30_db -c "\dt"

# Para Supabase/Render (use sua connection string):
psql "SUA_DATABASE_URL" -c "\dt"
```

Deve mostrar as tabelas:
- posts
- users
- collection_logs

### 3. Testar uma query

```bash
# Local:
psql cop30_db -c "SELECT COUNT(*) FROM posts;"

# Cloud:
psql "SUA_DATABASE_URL" -c "SELECT COUNT(*) FROM posts;"
```

---

## Próximos Passos

Após configurar o banco:

1. ✅ Verifique se `DATABASE_URL` está correta no `.env`
2. ✅ Execute o collector: `npm start`
3. ✅ Veja os dados sendo salvos nos logs
4. ✅ Inicie o servidor web: `npm run server`
5. ✅ Acesse: http://localhost:3000

---

## Solução de Problemas

### Erro: "connection refused"
- PostgreSQL local: `brew services start postgresql@15`
- Cloud: Verifique se copiou a URL correta

### Erro: "password authentication failed"
- Verifique a senha no `.env`
- Para local, tente sem senha: `postgresql://usuario@localhost:5432/cop30_db`

### Erro: "database does not exist"
- Local: `createdb cop30_db`
- Cloud: Recrie o projeto

### Erro: "relation posts does not exist"
- Execute o schema: `psql DATABASE_URL < database/schema.sql`

---

## Comandos Úteis

```bash
# Ver todos os posts
psql DATABASE_URL -c "SELECT platform, username, caption FROM posts LIMIT 5;"

# Ver estatísticas
psql DATABASE_URL -c "SELECT * FROM stats_summary;"

# Ver timeline
psql DATABASE_URL -c "SELECT * FROM daily_timeline LIMIT 10;"

# Contar posts por plataforma
psql DATABASE_URL -c "SELECT platform, COUNT(*) FROM posts GROUP BY platform;"

# Deletar todos os posts (cuidado!)
psql DATABASE_URL -c "TRUNCATE posts CASCADE;"
```
