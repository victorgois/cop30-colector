# Projeto Técnico: Sistema de Coleta, Análise e Visualização de Dados sobre COP30 em Redes Sociais

**Período de Execução:** Outubro a Dezembro de 2025  
**Orçamento Total:** R$ 5.000,00  
**Responsável:** VICTOR GOIS DE OLIVEIRA PACHECO LTDA
CNPJ: 47.944.119/0001-86

---

## 1. RESUMO EXECUTIVO

Este documento descreve a metodologia técnica para desenvolvimento de um sistema automatizado de coleta, análise e visualização de dados sobre a COP30 nas plataformas Instagram e TikTok. O sistema coletará dados durante todo o mês de novembro de 2025, utilizando a plataforma Apify para extração de dados, seguida de análise e disponibilização através de aplicação web com visualizações interativas em D3.js.

---

## 2. OBJETIVOS

### 2.1 Objetivo Geral
Desenvolver sistema completo para monitoramento e análise de conversas sobre COP30 e temas relacionados nas redes sociais Instagram e TikTok.

### 2.2 Objetivos Específicos
- Implementar sistema automatizado de coleta de dados via API Apify
- Estruturar banco de dados para armazenamento eficiente
- Desenvolver aplicação web para visualização interativa dos dados
- Produzir documento metodológico completo do projeto
- Realizar análises quantitativas e qualitativas do conteúdo coletado

---

## 3. PALAVRAS-CHAVE MONITORADAS

O sistema monitorará as seguintes palavras-chave em português, espanhol e inglês:

- **COP30** / **Cop30**
- **Amazonia** / **Amazônia**
- **clima** / **climate**
- **sustentabilidade** / **sustentabilidad** / **sustainability**

---

## 4. CRONOGRAMA GERAL

### Fase 1: Desenvolvimento do Sistema (Outubro 2025)
- Semana 1-2: Arquitetura e configuração da infraestrutura
- Semana 3: Desenvolvimento do sistema de coleta
- Semana 4: Testes e ajustes

### Fase 2: Coleta de Dados (Novembro 2025)
- Dias 1-30: Coleta automatizada contínua
- Monitoramento diário do sistema
- Backup e validação dos dados

### Fase 3: Análise e Visualização (Dezembro 2025)
- Semana 1-2: Análise dos dados coletados
- Semana 3: Desenvolvimento das visualizações
- Semana 4: Documentação metodológica e entrega final

---

## 5. ARQUITETURA TÉCNICA

### 5.1 Plataforma de Coleta: Apify

**Escolha Técnica:** Apify foi selecionado por oferecer scrapers dedicados e mantidos para Instagram e TikTok, com APIs robustas e documentação completa.

#### 5.1.1 Limitações e Capacidades do Apify

**Plano Recomendado:** Starter ($49/mês ou ~R$245/mês)
- Créditos mensais: $49 em platform usage
- Memória: 32 GB RAM para Actors
- Retenção de dados: 14 dias
- Suporte via chat

**Estimativa de Custos por Plataforma:**

**Instagram:**
- Scraper principal: Instagram Hashtag Scraper
- Custo: $5.00 por 1.000 posts ($0.005/post)
- Limite técnico: 400-800 resultados por hashtag
- Taxa máxima: 50 requisições/minuto (até 72.000 requisições/dia)

**TikTok:**
- Scraper principal: TikTok Hashtag Scraper
- Custo: $5.00 por 1.000 posts ($0.005/post)
- Limite técnico: 400-800 resultados por hashtag
- Velocidade: 100-200 posts/segundo

**Estimativa de Volume de Dados:**
- 8 hashtags monitoradas (4 termos × 2 plataformas)
- Máximo teórico: 800 posts/hashtag × 8 hashtags = 6.400 posts únicos
- Considerando coleta diária em novembro (30 dias): ~15.000 a 25.000 posts
- Custo estimado de coleta: $75-125 (~R$375-625)

#### 5.1.2 Estratégia de Coleta

Para otimizar custos e respeitar limites técnicos:

1. **Coleta Escalonada:**
   - Executar coleta 2x por dia (manhã e noite)
   - Alternar entre plataformas para evitar rate limits
   - Priorizar hashtags principais (COP30, Cop30)

2. **Deduplicação:**
   - Identificação única por post ID
   - Evitar coleta redundante de posts já capturados

3. **Monitoramento:**
   - Logs diários de execução
   - Alertas para falhas ou anomalias
   - Dashboard de métricas de coleta

### 5.2 Banco de Dados

**Tecnologia:** PostgreSQL 15+

**Justificativa:** 
- Gratuito e open-source
- Excelente para dados estruturados e JSON
- Suporte a índices para buscas rápidas
- Compatível com hosting gratuito (Supabase, Render)

#### 5.2.1 Esquema do Banco de Dados
```sql
-- Tabela principal de posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL, -- 'instagram' ou 'tiktok'
    post_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    user_id VARCHAR(255),
    caption TEXT,
    hashtags TEXT[], -- Array de hashtags
    keyword_matched VARCHAR(100), -- Palavra-chave que gerou a coleta
    created_at TIMESTAMP,
    collected_at TIMESTAMP DEFAULT NOW(),
    
    -- Métricas de engajamento
    likes_count INTEGER,
    comments_count INTEGER,
    shares_count INTEGER,
    views_count INTEGER,
    
    -- URLs e mídia
    post_url TEXT,
    media_urls TEXT[],
    media_type VARCHAR(20), -- 'photo', 'video', 'carousel'
    
    -- Dados adicionais (JSON para flexibilidade)
    raw_data JSONB,
    
    -- Índices
    CONSTRAINT platform_check CHECK (platform IN ('instagram', 'tiktok'))
);

-- Índices para performance
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_keyword ON posts(keyword_matched);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);

-- Tabela de usuários (para análises)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    display_name VARCHAR(255),
    followers_count INTEGER,
    following_count INTEGER,
    bio TEXT,
    profile_url TEXT,
    collected_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de métricas de coleta
CREATE TABLE collection_logs (
    id SERIAL PRIMARY KEY,
    execution_date TIMESTAMP DEFAULT NOW(),
    platform VARCHAR(20),
    keyword VARCHAR(100),
    posts_collected INTEGER,
    execution_time_seconds INTEGER,
    status VARCHAR(50), -- 'success', 'partial', 'failed'
    error_message TEXT,
    apify_run_id VARCHAR(255)
);
````
5.3 Sistema de Coleta Automatizado
Tecnologia: Node.js 18+ com Apify SDK
5.3.1 Arquitetura do Sistema
````
┌─────────────────────┐
│   Cron Scheduler    │ (2x/dia: 6h e 18h)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Orchestrator       │
│  (Node.js)          │
└──────────┬──────────┘
           │
           ├─────────────────┐
           ▼                 ▼
    ┌─────────────┐   ┌─────────────┐
    │   Apify     │   │   Apify     │
    │  Instagram  │   │   TikTok    │
    │   Scraper   │   │   Scraper   │
    └──────┬──────┘   └──────┬──────┘
           │                 │
           └────────┬────────┘
                    ▼
           ┌─────────────────┐
           │  Data Processor │
           │  - Validação    │
           │  - Deduplicação │
           │  - Normalização │
           └────────┬─────────┘
                    ▼
           ┌─────────────────┐
           │   PostgreSQL    │
           │   Database      │
           └─────────────────┘
`````

### 5.4 Aplicação Web e Visualizações
Stack Tecnológico:

Frontend: HTML5, CSS3, JavaScript ES6+
Biblioteca de Visualização: D3.js v7
Backend: Node.js + Express
Hospedagem: Vercel/Netlify (frontend) + Render/Railway (backend)

#### 5.4.1 Visualizações Planejadas

- Timeline de Posts

Gráfico de linha mostrando volume de posts por dia
Filtros por plataforma e palavra-chave
Eventos destacados (picos de engajamento)


- Nuvem de Hashtags

Visualização interativa das hashtags mais usadas
Tamanho proporcional à frequência
Cores por categoria temática

- Análise de Engajamento

Gráfico de barras: posts com maior engajamento
Métricas: likes, comentários, compartilhamentos
Comparação Instagram vs TikTok

- Mapa de Rede de Usuários

Visualização de usuários mais influentes
Conexões baseadas em interações
Tamanho dos nós por número de seguidores


- Análise Temporal

Heatmap de atividade por dia/hora
Identificação de padrões temporais
Melhores horários de postagem


- Dashboard de Métricas

Total de posts coletados
Taxa de crescimento diária
Distribuição por plataforma
Palavras-chave mais efetivas



#### 5.4.2 Estrutura da Aplicação Web

````
web-app/
├── public/
│   ├── index.html
│   ├── about.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── main.js
│       ├── api-client.js
│       └── visualizations/
│           ├── timeline.js
│           ├── hashtag-cloud.js
│           ├── engagement.js
│           └── network.js
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── api.js
│   └── database/
│       └── queries.js
└── package.json
`````

#### 5.4.3 API Endpoints

````js
// GET /api/posts - Lista posts com filtros
// Parâmetros: platform, keyword, start_date, end_date, limit
GET /api/posts?platform=instagram&keyword=COP30&limit=100

// GET /api/stats - Estatísticas gerais
GET /api/stats

// GET /api/timeline - Dados para gráfico temporal
// Parâmetros: granularity (day/hour), platform
GET /api/timeline?granularity=day&platform=tiktok

// GET /api/hashtags - Top hashtags
// Parâmetros: limit, platform
GET /api/hashtags?limit=50

// GET /api/top-posts - Posts com maior engajamento
// Parâmetros: metric (likes/comments/shares), limit
GET /api/top-posts?metric=likes&limit=20

// GET /api/users/influential - Usuários mais influentes
GET /api/users/influential?limit=30
````
## 6. ANÁLISE DE DADOS
### 6.1 Análises Quantitativas

- Métricas de Volume:

Total de posts por plataforma
Distribuição temporal (diária/semanal)
Taxa de crescimento ao longo de novembro


- Análise de Engajamento:

Média de likes, comentários e compartilhamentos
Taxa de engajamento por plataforma
Correlação entre tipo de conteúdo e engajamento


- Análise de Hashtags:

Frequência de co-ocorrência
Evolução temporal das hashtags
Hashtags emergentes

- Análise de Usuários:

Distribuição de atividade (lurkers vs criadores)
Usuários mais ativos
Crescimento de seguidores


### 6.2 Análises Qualitativas

- Análise de Conteúdo:

Categorização temática de posts
Identificação de narrativas dominantes
Sentimento geral (positivo/negativo/neutro)


- Análise Discursiva:

Principais argumentos sobre COP30
Frames e enquadramentos
Atores sociais mencionados


- Análise Visual:

Tipos de mídia mais compartilhados
Elementos visuais recorrentes
Padrões estéticos por plataforma

## 7. ORÇAMENTO DETALHADO

### 7.1 Custos de Infraestrutura (3 meses)

| Item | Custo Mensal | Total (3 meses) |
|------|--------------|-----------------|
| Apify Starter Plan | R$ 245 | R$ 735 |
| Banco de Dados (Supabase Pro)* | R$ 125 | R$ 375 |
| Hospedagem Backend (Render)* | R$ 35 | R$ 105 |
| Hospedagem Frontend (Vercel Pro)* | R$ 100 | R$ 300 |
| **Subtotal** | **R$ 505** | **R$ 1.515** |

*Valores aproximados com conversão de USD para BRL (taxa 1:5)

### 7.2 Custos de Desenvolvimento

| Item | Horas Estimadas | Valor/Hora | Total |
|------|-----------------|------------|-------|
| Arquitetura e Planejamento | 4h | R$ 50 | R$ 200 |
| Desenvolvimento Sistema de Coleta | 30h | R$ 50 | R$ 1500 |
| Desenvolvimento Banco de Dados | 4h | R$ 50 | R$ 200 |
| Desenvolvimento Interface Web | 8h | R$ 50 | R$ 400 |
| Implementação Visualizações | 8h | R$ 50 | R$ 400 |
| Testes e Ajustes | 8h | R$ 50 | R$ 400 |
| Monitoramento (30 dias) | 30h | R$ 50 | R$ 1.500 |
| Análise de Dados |16h | R$ 50 | R$ 800 |
| Documentação Metodológica | 8h | R$ 50 | R$ 400 |
| **Subtotal** | **116h** | - | **R$ 5800** |


### 7.3 Custos Totais e Ajuste ao Orçamento

| Categoria | Custo Real | Custo Ajustado** |
|-----------|------------|------------------|
| Infraestrutura | R$ 1.515 | R$ 1.000* |
| Desenvolvimento | R$ 5.800 | R$ 4.000 |
| **TOTAL** | **R$ 7.315** | **R$ 5.000** |

** Custo ajustado para atender orçamento do cliente

## 8. RISCOS E MITIGAÇÕES

### 8.1 Riscos Técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Mudanças nas APIs do Instagram/TikTok | Média | Alto | Usar scrapers mantidos pelo Apify; monitoramento diário |
| Rate limiting excessivo | Média | Médio | Implementar backoff; espaçar requisições; usar proxies |
| Volume de dados maior que estimado | Baixa | Alto | Configurar limites; priorizar hashtags principais |
| Falhas no sistema de coleta | Média | Alto | Sistema de retry automático; alertas; backups diários |
| Estouro de orçamento Apify | Média | Alto | Monitorar uso diário; configurar alertas de limite |

### 8.2 Riscos de Dados

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Dados duplicados | Alta | Baixo | Sistema de deduplicação por post_id |
| Dados incompletos ou corrompidos | Média | Médio | Validação na ingestão; logs detalhados |
| Perda de dados por falha | Baixa | Alto | Backups automáticos diários; replicação |
| Posts deletados após coleta | Alta | Baixo | Aceitar como limitação; documentar |

### 8.3 Riscos Legais e Éticos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Violação de ToS das plataformas | Baixa | Alto | Coletar apenas dados públicos; respeitar rate limits |
| Questões de privacidade (LGPD) | Baixa | Alto | Não coletar dados pessoais sensíveis; anonimizar quando possível |
| Uso indevido dos dados | Baixa | Médio | Documentar finalidade acadêmica; não comercializar |


## 9. ENTREGÁVEIS
### 9.1 Entregáveis Técnicos

- Sistema de Coleta Automatizado

Código-fonte completo (GitHub)
Scripts de configuração e deployment
Documentação técnica de instalação


- Banco de Dados Estruturado

Schema SQL completo
Dados coletados em formato exportável (CSV/JSON)
Scripts de backup e restore

- Aplicação Web Funcional

Interface responsiva e intuitiva
Visualizações interativas em D3.js
API RESTful documentada

- Dashboard de Monitoramento

Métricas de coleta em tempo real
Logs de execução
Alertas configuráveis


### 9.2 Entregáveis Analíticos

- Relatório de Análise Quantitativa

Estatísticas descritivas
Gráficos e tabelas
Insights principais


- Relatório de Análise Qualitativa

Categorização temática
Análise de narrativas
Exemplos ilustrativos

- Dataset Completo

Arquivo CSV com todos os posts
Dicionário de variáveis
Metadados da coleta

### 9.3 Entregáveis Metodológicos

- Documento de Metodologia (Este Documento)

Descrição completa do processo
Justificativas técnicas
Limitações e considerações éticas


- Manual do Usuário

Guia de uso da aplicação web
Interpretação das visualizações
Exemplos de análises possíveis


- Relatório Final do Projeto

Sumário executivo
Principais achados
Recomendações para trabalhos futuros


## 10. CONSIDERAÇÕES ÉTICAS
### 10.1 Coleta de Dados

Dados Públicos: Coletaremos apenas dados disponíveis publicamente nas plataformas
Não-intrusividade: Não faremos login, não seguiremos perfis, não interagiremos
Respeito aos Limites: Seguiremos rate limits e boas práticas de scraping
Transparência: Documentaremos todas as fontes e métodos de coleta

### 10.2 Uso e Armazenamento

Finalidade Específica: Dados usados exclusivamente para análise acadêmica sobre COP30
Não Comercialização: Dados não serão vendidos ou comercializados
Anonimização: Quando pertinente, usernames serão anonimizados nas análises
LGPD: Cumprimento da Lei Geral de Proteção de Dados brasileira
Segurança: Banco de dados protegido com autenticação e backups criptografados

### 10.3 Publicação e Compartilhamento

Agregação: Resultados publicados de forma agregada, sem exposição individual
Contexto: Sempre fornecer contexto adequado ao citar posts
Direitos Autorais: Respeitar direitos de imagem e autoria do conteúdo
Opt-out: Mecanismo para remoção de dados mediante solicitação



## 11. REFERÊNCIAS TÉCNICAS
### 11.1 Documentação de APIs e Ferramentas

1. **Apify Platform**

- Apify Documentation: https://docs.apify.com
- Instagram Scraper: https://apify.com/apify/instagram-scraper
- TikTok Scraper: https://apify.com/clockworks/tiktok-scraper
- Apify Client SDK (Node.js): https://docs.apify.com/api/client/js
- Apify API Reference: https://docs.apify.com/api/v2

2. **D3.js (Data-Driven Documents)**
- D3.js v7 Documentation: https://d3js.org
- Observable D3 Gallery: https://observablehq.com/@d3/gallery
- D3 Graph Gallery: https://d3-graph-gallery.com
- Mike Bostock's Blocks: https://bl.ocks.org/mbostock
- D3.js Tutorials: https://www.d3indepth.com

3. **PostgreSQL**
- PostgreSQL 15 Documentation: https://www.postgresql.org/docs/15/
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL JSON Functions: https://www.postgresql.org/docs/15/functions-json.html
- PostgreSQL Arrays: https://www.postgresql.org/docs/15/arrays.html
- Supabase Free Tier: https://supabase.com/pricing

4. **Node.js e Express**
- Node.js Documentation: https://nodejs.org/docs
- Express.js Guide: https://expressjs.com/en/guide/routing.html
- Node-cron (Agendamento): https://www.npmjs.com/package/node-cron
- pg (PostgreSQL client): https://node-postgres.com
- dotenv: https://www.npmjs.com/package/dotenv

5. **Hospedagem e Deploy**
- Vercel Documentation: https://vercel.com/docs
- Render Documentation: https://render.com/docs
- GitHub Actions: https://docs.github.com/en/actions
- Railway Documentation: https://docs.railway.app

### 13.2 Referências Metodológicas

- Apify Blog: "Ethics of Web Scraping" (2024)
- ACM Code of Ethics: https://www.acm.org/code-of-ethics
- GDPR Compliance Guide for Researchers
- "The Ethics of Web Scraping" - James Densmore (2017)
- LGPD Guia oficial: https://www.gov.br/lgpd



## 14. GLOSSÁRIO TÉCNICO

**Actor (Apify):** Unidade de execução na plataforma Apify; equivalente a um scraper ou automatização específica. Pode ser executado sob demanda ou agendado.

**API (Application Programming Interface):** Interface que permite comunicação entre diferentes sistemas de software através de requisições HTTP.

**Compute Unit (CU):** Unidade de medida de consumo de recursos computacionais na plataforma Apify (CPU + memória + tempo).

**Crawler:** Programa que navega automaticamente pela web coletando dados de páginas seguindo links e padrões.

**Dataset:** Conjunto de dados estruturados resultante de uma coleta, armazenado no formato tabular ou JSON.

**D3.js:** Biblioteca JavaScript para criação de visualizações de dados interativas e dinâmicas baseadas em manipulação do DOM.

**Deduplicação:** Processo de identificação e remoção de registros duplicados com base em identificadores únicos (post_id).

**Engagement (Engajamento):** Conjunto de métricas de interação do usuário com conteúdo (likes, comentários, compartilhamentos, views).

**ETL (Extract, Transform, Load):** Processo de extração de dados de fontes, transformação para formato adequado e carregamento em destino.

**Hashtag:** Marcador precedido por # usado em redes sociais para categorizar e descobrir conteúdo sobre tópicos específicos.

**JSON (JavaScript Object Notation):** Formato de dados estruturado e legível amplamente usado em APIs e armazenamento.

**LGPD (Lei Geral de Proteção de Dados):** Lei brasileira nº 13.709/2018 que regula tratamento de dados pessoais.

**MVP (Minimum Viable Product):** Versão mínima viável de produto com funcionalidades essenciais para validação.

**Node.js:** Ambiente de execução JavaScript server-side construído sobre o engine V8 do Chrome.

**PostgreSQL:** Sistema de gerenciamento de banco de dados relacional open-source robusto e escalável.

**Rate Limit:** Limite de requisições que podem ser feitas a uma API em determinado período para prevenir abuso.

**REST API:** Interface que segue princípios REST (Representational State Transfer) para comunicação stateless entre sistemas.

**ROI (Return on Investment):** Retorno sobre investimento; no contexto do projeto, relação entre custo e posts novos coletados.

**Scraping/Web Scraping:** Técnica de extração automatizada de dados de websites através de parsing de HTML/JSON.

**SDK (Software Development Kit):** Conjunto de ferramentas, bibliotecas e documentação para desenvolvimento de software.

**Timestamp:** Marca temporal que registra data e hora precisa de um evento no formato ISO 8601.

**ToS (Terms of Service):** Termos de Serviço; regras e condições para uso de uma plataforma ou serviço.



## 15. Assinatura

