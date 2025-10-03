# Sistema de Coleta e Análise de Dados - COP30

Sistema automatizado de coleta, análise e visualização de dados sobre COP30 nas redes sociais Instagram e TikTok.

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Visualizações](#visualizações)

## 📝 Sobre o Projeto

Este sistema foi desenvolvido para monitorar e analisar conversas sobre COP30 e temas relacionados (Amazônia, clima, sustentabilidade) nas redes sociais Instagram e TikTok durante o mês de novembro de 2025.

**Palavras-chave monitoradas:**
- COP30 / Cop30
- Amazonia / Amazônia
- clima / climate
- sustentabilidade / sustentabilidad / sustainability

## 🚀 Tecnologias Utilizadas

### Backend
- **Node.js 18+** - Runtime JavaScript
- **Express.js** - Framework web
- **PostgreSQL 15+** - Banco de dados
- **Apify SDK** - Coleta de dados

### Frontend
- **D3.js v7** - Visualizações de dados
- **HTML5/CSS3/JavaScript** - Interface web

### Ferramentas
- **node-cron** - Agendamento de tarefas
- **Winston** - Sistema de logs
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📁 Estrutura do Projeto

```
cop30/
├── collector/              # Sistema de coleta
│   ├── config/            # Configurações
│   ├── scrapers/          # Scrapers do Apify
│   └── utils/             # Utilitários
├── database/              # Banco de dados
│   ├── migrations/        # Migrações
│   ├── queries/           # Queries SQL
│   └── schema.sql         # Schema do banco
├── web-app/               # Aplicação web
│   ├── public/           # Frontend
│   │   ├── css/          # Estilos
│   │   └── js/           # JavaScript
│   │       └── visualizations/  # Visualizações D3.js
│   └── server/           # Backend
│       ├── routes/       # Rotas da API
│       └── database/     # Conexão com DB
├── logs/                  # Logs do sistema
├── .env.example          # Exemplo de variáveis de ambiente
└── package.json          # Dependências Node.js
```

## 📦 Pré-requisitos

- **Node.js 18+** - [Download](https://nodejs.org/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Conta Apify** - [Criar conta](https://apify.com/)
- **Git** - [Download](https://git-scm.com/)

## 🔧 Instalação

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd cop30
```

### 2. Instale as dependências Node.js

```bash
npm install
```

### 3. Configure o banco de dados PostgreSQL

```bash
# Criar banco de dados
createdb cop30_db

# Executar schema
psql cop30_db < database/schema.sql
```

## ⚙️ Configuração

### 1. Configure as variáveis de ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env
```

**Variáveis necessárias:**

```env
# Banco de dados
DATABASE_URL=postgresql://usuario:senha@localhost:5432/cop30_db

# Apify
APIFY_API_TOKEN=seu_token_apify_aqui

# Servidor
PORT=3000
NODE_ENV=development

# Coleta automática
AUTO_COLLECT_ENABLED=true

# Logs
LOG_LEVEL=info
```

### 2. Obter Token do Apify

1. Acesse [Apify Console](https://console.apify.com/)
2. Vá em **Settings → Integrations → API tokens**
3. Copie o token e adicione no arquivo `.env`

## 🎯 Uso

### Iniciar o servidor web

```bash
npm run server
```

Acesse: http://localhost:3000

### Iniciar coleta de dados (modo desenvolvimento)

```bash
npm start
```

### Executar migrações do banco

```bash
npm run db:migrate
```

## 🔌 API Endpoints

### GET /api/posts
Lista posts com filtros

**Parâmetros:**
- `platform` - Plataforma (instagram/tiktok)
- `keyword` - Palavra-chave
- `start_date` - Data inicial
- `end_date` - Data final
- `limit` - Limite de resultados (padrão: 100)

```bash
GET /api/posts?platform=instagram&keyword=COP30&limit=50
```

### GET /api/stats
Retorna estatísticas gerais

```bash
GET /api/stats
```

### GET /api/timeline
Dados para gráfico temporal

**Parâmetros:**
- `granularity` - Granularidade (day/hour)
- `platform` - Plataforma (opcional)

```bash
GET /api/timeline?granularity=day&platform=tiktok
```

### GET /api/hashtags
Top hashtags mais usadas

**Parâmetros:**
- `limit` - Limite de resultados (padrão: 50)
- `platform` - Plataforma (opcional)

```bash
GET /api/hashtags?limit=30
```

### GET /api/top-posts
Posts com maior engajamento

**Parâmetros:**
- `metric` - Métrica (likes_count/comments_count/shares_count)
- `limit` - Limite de resultados (padrão: 20)

```bash
GET /api/top-posts?metric=likes_count&limit=10
```

### GET /api/users/influential
Usuários mais influentes

**Parâmetros:**
- `limit` - Limite de resultados (padrão: 30)

```bash
GET /api/users/influential?limit=20
```

## 📊 Visualizações

### 1. Timeline de Posts
Gráfico de linha mostrando volume de posts ao longo do tempo, com filtros por plataforma.

### 2. Nuvem de Hashtags
Visualização interativa das hashtags mais usadas, com tamanho proporcional à frequência.

### 3. Análise de Engajamento
Gráfico de barras dos posts com maior engajamento (likes, comentários, compartilhamentos).

### 4. Dashboard de Métricas
- Total de posts coletados
- Usuários únicos
- Média de engajamento
- Última coleta realizada

## 📅 Cronograma do Projeto

### Fase 1: Desenvolvimento (Outubro 2025)
- ✅ Arquitetura e configuração da infraestrutura
- ✅ Desenvolvimento do sistema de coleta
- ⏳ Testes e ajustes

### Fase 2: Coleta (Novembro 2025)
- ⏳ Coleta automatizada contínua (30 dias)
- ⏳ Monitoramento diário
- ⏳ Backup e validação

### Fase 3: Análise (Dezembro 2025)
- ⏳ Análise dos dados
- ⏳ Refinamento das visualizações
- ⏳ Documentação final

## 💰 Estimativa de Custos

### Infraestrutura (mensal)
- Apify Starter Plan: R$ 245
- PostgreSQL (Supabase): R$ 125
- Hospedagem Backend: R$ 35
- Hospedagem Frontend: R$ 100

**Total mensal:** R$ 505

## 🔒 Considerações Éticas

- ✅ Coleta apenas dados públicos
- ✅ Respeito aos limites de taxa (rate limits)
- ✅ Conformidade com LGPD
- ✅ Não comercialização de dados
- ✅ Finalidade acadêmica

## 📝 Licença

Projeto desenvolvido por **VICTOR GOIS DE OLIVEIRA PACHECO LTDA**
CNPJ: 47.944.119/0001-86

## 📞 Contato

Para dúvidas ou sugestões sobre o projeto, entre em contato.

---

**Período de Execução:** Outubro a Dezembro de 2025
**Orçamento Total:** R$ 5.000,00
