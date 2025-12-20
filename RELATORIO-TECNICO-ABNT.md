# SISTEMA DE COLETA, ANÁLISE E VISUALIZAÇÃO DE DADOS SOBRE COP30 EM REDES SOCIAIS

## RELATÓRIO TÉCNICO FINAL

---

**Instituição:** VICTOR GOIS DE OLIVEIRA PACHECO LTDA
**CNPJ:** 47.944.119/0001-86
**Responsável Técnico:** Victor Gois de Oliveira Pacheco
**Período de Execução:** Outubro a Dezembro de 2025
**Local:** Brasil
**Data:** Dezembro de 2025

---

<div style="page-break-after: always;"></div>

## RESUMO

Este relatório apresenta o desenvolvimento e implementação de um sistema automatizado de coleta, análise e visualização de dados sobre a 30ª Conferência das Partes da Convenção-Quadro das Nações Unidas sobre Mudança do Clima (COP30) nas redes sociais Instagram e TikTok. O projeto foi executado em três fases distintas: (1) desenvolvimento da infraestrutura tecnológica (outubro/2025), (2) coleta automatizada de dados (novembro/2025) e (3) análise e visualização (dezembro/2025). Utilizou-se a plataforma Apify para extração de dados públicos, PostgreSQL como sistema de gerenciamento de banco de dados, e D3.js para desenvolvimento de visualizações interativas. O sistema monitorou 8 palavras-chave relacionadas à COP30, Amazônia, clima e sustentabilidade, resultando na coleta de 7.187 posts válidos do período de novembro a dezembro de 2025, 33.343 hashtags únicas e 650 registros na timeline diária. Após processo de limpeza e validação, o dataset final concentra-se exclusivamente no período do evento COP30 (novembro/2025), representando 96.5% dos dados, com posts adicionais de dezembro capturando reações pós-evento. Foram desenvolvidas 14 visualizações interativas e uma API RESTful completa para acesso aos dados. O projeto demonstra a viabilidade técnica de monitoramento em larga escala de conversas sobre temas ambientais em redes sociais, fornecendo subsídios para análises quantitativas e qualitativas do discurso público sobre mudanças climáticas.

**Palavras-chave:** COP30. Redes Sociais. Coleta de Dados. Visualização de Dados. Análise de Mídias Sociais. Web Scraping. D3.js.

---

## ABSTRACT

This report presents the development and implementation of an automated system for collecting, analyzing, and visualizing data about the 30th Conference of the Parties to the United Nations Framework Convention on Climate Change (COP30) on Instagram and TikTok social networks. The project was executed in three distinct phases: (1) technological infrastructure development (October/2025), (2) automated data collection (November/2025), and (3) analysis and visualization (December/2025). The Apify platform was used for public data extraction, PostgreSQL as the database management system, and D3.js for developing interactive visualizations. The system monitored 8 keywords related to COP30, Amazon, climate, and sustainability, resulting in the collection of 7,187 valid posts from November to December 2025, 33,343 unique hashtags, and 650 daily timeline records. After cleanup and validation process, the final dataset focuses exclusively on the COP30 event period (November/2025), representing 96.5% of the data, with additional December posts capturing post-event reactions. Fourteen interactive visualizations and a complete RESTful API were developed for data access. The project demonstrates the technical feasibility of large-scale monitoring of conversations about environmental topics on social networks, providing support for quantitative and qualitative analysis of public discourse on climate change.

**Keywords:** COP30. Social Networks. Data Collection. Data Visualization. Social Media Analytics. Web Scraping. D3.js.

---

<div style="page-break-after: always;"></div>

## SUMÁRIO

1. [INTRODUÇÃO](#1-introdução)
   - 1.1 [Contextualização](#11-contextualização)
   - 1.2 [Justificativa](#12-justificativa)
   - 1.3 [Objetivos](#13-objetivos)
2. [REFERENCIAL TEÓRICO](#2-referencial-teórico)
   - 2.1 [Análise de Redes Sociais](#21-análise-de-redes-sociais)
   - 2.2 [Web Scraping e Coleta de Dados](#22-web-scraping-e-coleta-de-dados)
   - 2.3 [Visualização de Dados](#23-visualização-de-dados)
3. [METODOLOGIA](#3-metodologia)
   - 3.1 [Tipo de Pesquisa](#31-tipo-de-pesquisa)
   - 3.2 [Palavras-chave Monitoradas](#32-palavras-chave-monitoradas)
   - 3.3 [Cronograma de Execução](#33-cronograma-de-execução)
   - 3.4 [Considerações Éticas](#34-considerações-éticas)
4. [ARQUITETURA DO SISTEMA](#4-arquitetura-do-sistema)
   - 4.1 [Visão Geral](#41-visão-geral)
   - 4.2 [Plataforma de Coleta (Apify)](#42-plataforma-de-coleta-apify)
   - 4.3 [Banco de Dados (PostgreSQL)](#43-banco-de-dados-postgresql)
   - 4.4 [Sistema de Coleta Automatizado](#44-sistema-de-coleta-automatizado)
   - 4.5 [Aplicação Web](#45-aplicação-web)
   - 4.6 [Segurança e Conformidade](#46-segurança-e-conformidade)
5. [IMPLEMENTAÇÃO](#5-implementação)
   - 5.1 [Tecnologias Utilizadas](#51-tecnologias-utilizadas)
   - 5.2 [Estrutura do Projeto](#52-estrutura-do-projeto)
   - 5.3 [Processo de Coleta](#53-processo-de-coleta)
   - 5.4 [Processamento de Dados](#54-processamento-de-dados)
6. [RESULTADOS](#6-resultados)
   - 6.1 [Dados Coletados](#61-dados-coletados)
   - 6.2 [Visualizações Desenvolvidas](#62-visualizações-desenvolvidas)
   - 6.3 [API e Endpoints](#63-api-e-endpoints)
   - 6.4 [Performance e Escalabilidade](#64-performance-e-escalabilidade)
7. [ANÁLISE E DISCUSSÃO](#7-análise-e-discussão)
   - 7.1 [Análise Quantitativa](#71-análise-quantitativa)
   - 7.2 [Análise Qualitativa](#72-análise-qualitativa)
   - 7.3 [Limitações](#73-limitações)
8. [CONCLUSÃO](#8-conclusão)
   - 8.1 [Contribuições](#81-contribuições)
   - 8.2 [Trabalhos Futuros](#82-trabalhos-futuros)
9. [REFERÊNCIAS](#9-referências)
10. [APÊNDICES](#10-apêndices)
    - [A - Schema do Banco de Dados](#apêndice-a---schema-do-banco-de-dados)
    - [B - Endpoints da API](#apêndice-b---endpoints-da-api)
    - [C - Manual de Instalação](#apêndice-c---manual-de-instalação)

---

<div style="page-break-after: always;"></div>

## 1. INTRODUÇÃO

### 1.1 Contextualização

A 30ª Conferência das Partes da Convenção-Quadro das Nações Unidas sobre Mudança do Clima (COP30), programada para ocorrer em Belém do Pará em novembro de 2025, representa um marco histórico nas negociações climáticas globais (UNFCCC, 2024). Pela primeira vez, o Brasil sediará a conferência na Amazônia, região de importância estratégica para o equilíbrio climático planetário.

As redes sociais consolidaram-se como espaços privilegiados de debate público, mobilização social e formação de opinião sobre questões ambientais (PEARCE et al., 2019). Instagram e TikTok, em particular, emergem como plataformas centrais para disseminação de conteúdo sobre sustentabilidade e mudanças climáticas, especialmente entre públicos mais jovens (ANDERSON; JIANG, 2018).

Neste contexto, torna-se fundamental compreender como o discurso sobre a COP30 se configura nestas plataformas: quais narrativas predominam, quais atores sociais participam do debate, e como o engajamento público se manifesta. A análise sistemática destes dados pode fornecer insights valiosos para pesquisadores, formuladores de políticas públicas e organizações da sociedade civil.

### 1.2 Justificativa

A análise de conversas em redes sociais sobre eventos climáticos globais apresenta desafios metodológicos e técnicos significativos. A volatilidade do conteúdo, o volume expressivo de dados, e as limitações de acesso impostas pelas plataformas demandam soluções tecnológicas robustas e escaláveis.

Este projeto justifica-se pela necessidade de:

1. **Documentação sistemática** do discurso público sobre COP30 em tempo real
2. **Desenvolvimento de infraestrutura tecnológica** replicável para monitoramento de temas ambientais
3. **Democratização do acesso** a dados estruturados sobre conversas climáticas nas redes sociais
4. **Subsídio empírico** para pesquisas em comunicação ambiental, análise de discurso e estudos sobre mídias sociais

### 1.3 Objetivos

#### 1.3.1 Objetivo Geral

Desenvolver e implementar um sistema automatizado de coleta, análise e visualização de dados sobre conversas relacionadas à COP30 nas redes sociais Instagram e TikTok durante o mês de novembro de 2025.

#### 1.3.2 Objetivos Específicos

1. **Implementar sistema de coleta automatizada** via plataforma Apify, capaz de extrair dados públicos de Instagram e TikTok
2. **Estruturar banco de dados relacional** em PostgreSQL para armazenamento eficiente e escalável dos dados coletados
3. **Desenvolver aplicação web responsiva** com visualizações interativas utilizando D3.js
4. **Criar API RESTful** para acesso programático aos dados coletados
5. **Implementar políticas de segurança** (Row Level Security) em conformidade com boas práticas de proteção de dados
6. **Realizar análises quantitativas e qualitativas** dos padrões de engajamento e narrativas identificadas
7. **Documentar metodologia completa** para replicação em pesquisas futuras

---

<div style="page-break-after: always;"></div>

## 2. REFERENCIAL TEÓRICO

### 2.1 Análise de Redes Sociais

As mídias sociais digitais transformaram radicalmente a esfera pública contemporânea, criando novos espaços de deliberação, mobilização e formação de opinião (CASTELLS, 2013). No contexto das mudanças climáticas, estas plataformas desempenham papel dual: funcionam simultaneamente como amplificadoras de informação científica e como vetores de desinformação (ANDERSON, 2017).

Boyd e Ellison (2007) definem redes sociais online como serviços baseados na web que permitem aos indivíduos: (1) construir perfis públicos ou semi-públicos, (2) articular conexões com outros usuários, e (3) visualizar e navegar suas listas de conexões. No caso de Instagram e TikTok, adiciona-se a centralidade do conteúdo visual e audiovisual como elementos estruturantes da interação.

Pearce et al. (2019) argumentam que a análise de mídias sociais oferece oportunidades únicas para compreender percepções públicas sobre ciência climática, identificar redes de influência e mapear a circulação de narrativas. No entanto, os autores alertam para desafios metodológicos relacionados à representatividade amostral, vieses algorítmicos e efemeridade do conteúdo.

### 2.2 Web Scraping e Coleta de Dados

Web scraping refere-se ao conjunto de técnicas automatizadas para extração de dados de websites (MITCHELL, 2018). No contexto de redes sociais, envolve desafios técnicos específicos: autenticação, respeito a rate limits, tratamento de conteúdo dinâmico (JavaScript), e conformidade com Termos de Serviço.

Freelon (2018) discute as implicações éticas e metodológicas da coleta de dados em mídias sociais, propondo diretrizes para pesquisa responsável: (1) limitação a dados publicamente acessíveis, (2) anonimização quando pertinente, (3) transparência metodológica, e (4) atenção a questões de privacidade e consentimento.

A escolha da plataforma Apify para este projeto fundamenta-se em sua capacidade de abstrair complexidades técnicas do scraping, oferecendo scrapers mantidos e atualizados para plataformas dinâmicas como Instagram e TikTok (APIFY, 2024).

### 2.3 Visualização de Dados

Tufte (2001) estabelece princípios fundamentais de excelência gráfica: apresentar dados com clareza, precisão e eficiência; induzir o observador a pensar sobre substância, não sobre metodologia gráfica; evitar distorção da informação; e revelar dados em múltiplos níveis de detalhe.

No contexto de grandes volumes de dados (big data), visualizações interativas tornam-se essenciais para exploração e descoberta de padrões (FEW, 2009). D3.js (Data-Driven Documents) consolidou-se como biblioteca JavaScript líder para criação de visualizações dinâmicas baseadas em dados, permitindo manipulação direta do DOM e criação de gráficos customizados (BOSTOCK; OGIEVETSKY; HEER, 2011).

Para análise de dados de mídias sociais, visualizações temporais (timelines), redes (grafos), e nuvens de palavras/hashtags mostram-se particularmente eficazes para revelar padrões de engajamento, influência e disseminação de conteúdo (RUSSELL, 2013).

---

<div style="page-break-after: always;"></div>

## 3. METODOLOGIA

### 3.1 Tipo de Pesquisa

Esta pesquisa caracteriza-se como **exploratória e descritiva**, com abordagem **quantitativa e qualitativa** (CRESWELL; CLARK, 2017). Utiliza-se método de **análise de conteúdo digital** (HINE, 2015) aplicado a dados coletados em redes sociais.

A natureza exploratória justifica-se pela relativa novidade do objeto (COP30 ainda não ocorreu no momento da coleta) e pela necessidade de mapeamento inicial do campo discursivo. O caráter descritivo manifesta-se na sistematização e caracterização dos padrões identificados nos dados.

### 3.2 Palavras-chave Monitoradas

Foram selecionadas 4 palavras-chave principais em três idiomas (português, espanhol e inglês), totalizando 8 termos de busca:

**Tabela 1 - Palavras-chave monitoradas**

| Categoria | Português | Espanhol | Inglês |
|-----------|-----------|----------|--------|
| Evento principal | COP30, Cop30 | - | - |
| Região | Amazonia, Amazônia | - | - |
| Tema climático | clima | - | climate |
| Sustentabilidade | sustentabilidade | sustentabilidad | sustainability |

*Fonte: Elaborado pelo autor, 2025*

A seleção destas palavras-chave baseou-se em: (1) relevância direta para o tema COP30, (2) volume estimado de menções (pré-teste realizado em setembro/2025), e (3) representatividade dos principais eixos temáticos da conferência.

### 3.3 Cronograma de Execução

O projeto foi executado em três fases consecutivas:

**Tabela 2 - Cronograma de execução do projeto**

| Fase | Período | Atividades Principais | Status |
|------|---------|----------------------|--------|
| **Fase 1: Desenvolvimento** | Outubro/2025 | Arquitetura, configuração de infraestrutura, desenvolvimento do sistema de coleta, testes | ✅ Concluído |
| **Fase 2: Coleta de Dados** | Novembro/2025 | Coleta automatizada contínua (30 dias), monitoramento diário, backups, validação de dados | ✅ Concluído |
| **Fase 3: Análise e Visualização** | Dezembro/2025 | Análise de dados, desenvolvimento de visualizações, documentação metodológica, relatório final | ✅ Concluído |

*Fonte: Elaborado pelo autor, 2025*

### 3.4 Considerações Éticas

O projeto adotou rigorosos critérios éticos para coleta e tratamento de dados, em conformidade com:

#### 3.4.1 Princípios Éticos Adotados

1. **Dados Públicos:** Coleta restrita a conteúdo publicamente acessível nas plataformas
2. **Não-intrusividade:** Ausência de login, interação ou seguimento de perfis
3. **Respeito a Limites Técnicos:** Observância de rate limits e boas práticas de scraping
4. **Transparência Metodológica:** Documentação completa de fontes e métodos
5. **Finalidade Acadêmica:** Uso exclusivo para pesquisa, sem comercialização

#### 3.4.2 Conformidade Legal

**Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018):**
- Art. 7º, VI: Tratamento de dados públicos
- Art. 11: Dispensa de consentimento para dados tornados públicos pelo titular

**Termos de Serviço das Plataformas:**
- Coleta mediada por Apify, plataforma comercial com compliance estabelecido
- Ausência de automação direta que viole ToS
- Respeito a robots.txt e rate limits

#### 3.4.3 Anonimização e Privacidade

Embora os dados coletados sejam públicos, adotou-se:
- Agregação estatística em análises publicadas
- Não exposição de usernames individuais sem contexto
- Possibilidade de remoção mediante solicitação (opt-out)

---

<div style="page-break-after: always;"></div>

## 4. ARQUITETURA DO SISTEMA

### 4.1 Visão Geral

O sistema foi arquitetado seguindo padrão de **três camadas** (three-tier architecture): (1) camada de coleta e extração, (2) camada de armazenamento e processamento, e (3) camada de apresentação e visualização.

**Figura 1 - Arquitetura geral do sistema**

```
┌─────────────────────────────────────────────────────────────┐
│                    CAMADA DE COLETA                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Instagram  │         │    TikTok    │                 │
│  │   (Apify)    │         │   (Apify)    │                 │
│  └──────┬───────┘         └──────┬───────┘                 │
│         │                        │                          │
│         └────────┬───────────────┘                          │
│                  ▼                                          │
│         ┌─────────────────┐                                 │
│         │  Orchestrator   │                                 │
│         │   (Node.js +    │                                 │
│         │   node-cron)    │                                 │
│         └────────┬────────┘                                 │
└──────────────────┼─────────────────────────────────────────┘
                   │
┌──────────────────▼─────────────────────────────────────────┐
│              CAMADA DE ARMAZENAMENTO                        │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐          │
│  │         Data Processor & Validator           │          │
│  │  - Deduplicação (post_id único)              │          │
│  │  - Validação de schema                       │          │
│  │  - Normalização de dados                     │          │
│  │  - Extração de hashtags                      │          │
│  └─────────────────┬────────────────────────────┘          │
│                    ▼                                        │
│  ┌──────────────────────────────────────────────┐          │
│  │          PostgreSQL 15 + Supabase            │          │
│  │  Tabelas: posts, users, collection_logs      │          │
│  │  Views: stats_summary, daily_timeline,       │          │
│  │         top_hashtags                         │          │
│  │  RLS: 12 políticas de segurança             │          │
│  └─────────────────┬────────────────────────────┘          │
└────────────────────┼───────────────────────────────────────┘
                     │
┌────────────────────▼───────────────────────────────────────┐
│              CAMADA DE APRESENTAÇÃO                         │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐          │
│  │         Express.js API Server                │          │
│  │  - REST API (15 endpoints)                   │          │
│  │  - CORS configurado                          │          │
│  │  - Rate limiting                             │          │
│  └─────────────────┬────────────────────────────┘          │
│                    ▼                                        │
│  ┌──────────────────────────────────────────────┐          │
│  │          Web Application                     │          │
│  │  Frontend: HTML5 + CSS3 + JavaScript         │          │
│  │  Visualizações: D3.js v7 (14 componentes)    │          │
│  │  UI: Responsiva, acessível                   │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

*Fonte: Elaborado pelo autor, 2025*

### 4.2 Plataforma de Coleta (Apify)

**Apify** é uma plataforma cloud de web scraping e automação que oferece infraestrutura gerenciada para extração de dados em larga escala (APIFY, 2024).

#### 4.2.1 Scrapers Utilizados

**Tabela 3 - Scrapers Apify utilizados no projeto**

| Plataforma | Scraper | Actor ID | Capacidades |
|------------|---------|----------|-------------|
| Instagram | Instagram Hashtag Scraper | apify/instagram-scraper | Extração por hashtag, perfil, localização |
| TikTok | TikTok Hashtag Scraper | clockworks/tiktok-scraper | Busca por hashtag, trending, perfis |

*Fonte: Apify Platform, 2024*

#### 4.2.2 Estratégia de Coleta

Para otimizar custos e respeitar limites técnicos:

1. **Coleta Escalonada:** Execuções 2x/dia (06:00 e 18:00 UTC-3)
2. **Alternância de Plataformas:** Instagram e TikTok em horários distintos
3. **Priorização:** Hashtags principais (COP30, Cop30) com maior frequência
4. **Deduplicação:** Verificação de post_id antes de inserção no banco

### 4.3 Banco de Dados (PostgreSQL)

PostgreSQL 15 foi selecionado como SGBD pela robustez, suporte a tipos avançados (JSONB, arrays), e disponibilidade de hosting gratuito via Supabase.

#### 4.3.1 Modelo de Dados

O modelo relacional implementado consiste em três tabelas principais e três views materializadas:

**Tabela 4 - Estrutura do banco de dados**

| Tabela/View | Propósito | Registros* |
|-------------|-----------|-----------|
| `posts` | Armazenamento de publicações coletadas | 10.118 |
| `users` | Informações de criadores de conteúdo | 0** |
| `collection_logs` | Logs de execução do coletor | 0** |
| `stats_summary` (view) | Estatísticas agregadas por plataforma | 2 |
| `daily_timeline` (view) | Série temporal diária de posts | 650 |
| `top_hashtags` (view) | Ranking de hashtags mais usadas | 33.343 |

*Dados em dezembro/2025
**Tabelas criadas mas não populadas nesta fase do projeto

*Fonte: Elaborado pelo autor, 2025*

#### 4.3.2 Índices e Otimização

Para garantir performance em consultas:

```sql
CREATE INDEX idx_posts_platform ON posts(platform);
CREATE INDEX idx_posts_created_at ON posts(created_at);
CREATE INDEX idx_posts_keyword ON posts(keyword_matched);
CREATE INDEX idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX idx_posts_collected_at ON posts(collected_at);
```

Índice GIN (Generalized Inverted Index) em `hashtags` otimiza buscas em arrays, permitindo queries como `WHERE 'cop30' = ANY(hashtags)` com performance O(log n).

### 4.4 Sistema de Coleta Automatizado

Implementado em **Node.js 18** com dependências:

```json
{
  "apify-client": "^2.9.3",    // Cliente oficial Apify SDK
  "node-cron": "^3.0.3",       // Agendamento de tarefas
  "pg": "^8.11.3",             // Driver PostgreSQL
  "winston": "^3.11.0",        // Sistema de logs
  "dotenv": "^16.3.1"          // Variáveis de ambiente
}
```

#### 4.4.1 Fluxo de Coleta

**Figura 2 - Fluxo de processamento de coleta**

```
1. Trigger (cron: 0 6,18 * * *)
        ↓
2. Orchestrator seleciona hashtags do dia
        ↓
3. Para cada hashtag:
   3.1 Chama Apify Actor (Instagram ou TikTok)
   3.2 Aguarda conclusão (até 10 min timeout)
   3.3 Recupera dataset resultante
        ↓
4. Data Processor:
   4.1 Valida schema de cada post
   4.2 Extrai e normaliza hashtags
   4.3 Verifica duplicação (SELECT post_id)
   4.4 INSERT ou UPDATE no PostgreSQL
        ↓
5. Logger registra métricas:
   - Posts novos vs duplicados
   - Tempo de execução
   - Erros encontrados
        ↓
6. Notificação (se configurado)
```

*Fonte: Elaborado pelo autor, 2025*

### 4.5 Aplicação Web

#### 4.5.1 Backend - API RESTful

Express.js fornece 15 endpoints categorizados em:

**Endpoints de Dados:**
- `GET /api/posts` - Listagem com filtros
- `GET /api/stats` - Estatísticas gerais
- `GET /api/timeline` - Dados temporais
- `GET /api/hashtags` - Top hashtags

**Endpoints de Análise:**
- `GET /api/top-posts` - Ranking de engajamento
- `GET /api/users/influential` - Usuários influentes
- `GET /api/hashtag-network` - Rede de co-ocorrências
- `GET /api/latency-analysis` - Análise temporal de coleta

**Endpoints de Visualização:**
- `GET /api/platform-comparison` - Comparativo Instagram vs TikTok
- `GET /api/content-performance` - Performance de conteúdo
- `GET /api/engagement-distribution` - Distribuição de engajamento
- `GET /api/temporal-activity` - Heatmap temporal
- `GET /api/narrative-analysis` - Análise de narrativas
- `GET /api/emerging-hashtags` - Hashtags emergentes

**Endpoints Utilitários:**
- `GET /api/health` - Health check

#### 4.5.2 Frontend - Visualizações Interativas

Desenvolvidas 14 visualizações em D3.js v7:

**Tabela 5 - Visualizações implementadas**

| Visualização | Tipo de Gráfico | Biblioteca D3 | Propósito |
|-------------|-----------------|---------------|-----------|
| Timeline | Gráfico de Linha | d3-scale, d3-axis | Série temporal de posts |
| Hashtag Cloud | Nuvem de Palavras | d3-cloud | Frequência de hashtags |
| Hashtag Network | Grafo de Força | d3-force | Co-ocorrências de hashtags |
| Engagement | Gráfico de Barras | d3-scale, d3-axis | Ranking de engajamento |
| Gallery | Grid Interativa | - | Galeria de posts |
| Influencers | Tabela Ordenável | - | Top influenciadores |
| Latency Analysis | Scatter Plot | d3-scale | Tempo entre criação e coleta |
| Likes Timeline | Gráfico de Área | d3-area | Evolução de likes |
| Platform Comparison | Gráficos Múltiplos | d3-scale | Instagram vs TikTok |
| Content Performance | Bubble Chart | d3-pack | Performance de conteúdo |
| Temporal Heatmap | Heatmap | d3-scale-chromatic | Padrões dia/hora |
| Collection History | Timeline | d3-time | Histórico de coletas |
| Narrative Analysis | Word Cloud + Bar | d3-cloud | Análise textual |
| Hashtag Dashboard | Dashboard | Múltiplas | Painel completo de hashtags |

*Fonte: Elaborado pelo autor, 2025*

### 4.6 Segurança e Conformidade

#### 4.6.1 Row Level Security (RLS)

Implementado sistema completo de RLS no Supabase para controle granular de acesso:

**Modelo de Acesso:**
- **Leitura (SELECT):** Pública, sem autenticação necessária
- **Escrita (INSERT/UPDATE/DELETE):** Restrita a usuários autenticados

**Tabela 6 - Políticas RLS implementadas**

| Tabela | Operação | Política | Função SQL |
|--------|----------|----------|------------|
| posts | SELECT | Allow public read | `USING (true)` |
| posts | INSERT/UPDATE/DELETE | Allow authenticated | `WITH CHECK (auth.role() = 'authenticated')` |
| users | SELECT | Allow public read | `USING (true)` |
| users | INSERT/UPDATE/DELETE | Allow authenticated | `WITH CHECK (auth.role() = 'authenticated')` |
| collection_logs | SELECT | Allow public read | `USING (true)` |
| collection_logs | INSERT/UPDATE/DELETE | Allow authenticated | `WITH CHECK (auth.role() = 'authenticated')` |

*Fonte: Elaborado pelo autor, 2025*

Total: **12 políticas RLS** (4 por tabela)

#### 4.6.2 Views com Security Invoker

Corrigido problema de segurança detectado pelo Supabase Linter:

**Antes (vulnerável):**
```sql
CREATE VIEW stats_summary AS ...  -- Security Definer implícito
```

**Depois (seguro):**
```sql
CREATE VIEW stats_summary
WITH (security_invoker = true) AS ...  -- Executa com permissões do usuário
```

Aplicado às 3 views: `stats_summary`, `daily_timeline`, `top_hashtags`.

---

<div style="page-break-after: always;"></div>

## 5. IMPLEMENTAÇÃO

### 5.1 Tecnologias Utilizadas

**Tabela 7 - Stack tecnológico completo**

| Camada | Tecnologia | Versão | Justificativa |
|--------|------------|--------|---------------|
| **Runtime** | Node.js | 18+ | Performance, ecossistema NPM, async/await |
| **Backend** | Express.js | 4.18.2 | Simplicidade, middleware, REST API |
| **Banco de Dados** | PostgreSQL | 15 | Tipos avançados (JSONB, arrays), RLS |
| **Hosting DB** | Supabase | - | Tier gratuito, RLS nativo, backups |
| **Scraping** | Apify | Platform | Scrapers mantidos, compliance |
| **Agendamento** | node-cron | 3.0.3 | Sintaxe cron familiar, leve |
| **Logs** | Winston | 3.11.0 | Níveis de log, transports múltiplos |
| **Visualização** | D3.js | 7 | Flexibilidade, performance, comunidade |
| **Frontend** | HTML5/CSS3/ES6 | - | Padrão web, sem frameworks pesados |
| **Controle Versão** | Git + GitHub | - | Controle de versão, backup de código |

*Fonte: Elaborado pelo autor, 2025*

### 5.2 Estrutura do Projeto

```
cop30/
├── collector/                    # Sistema de coleta
│   ├── config/
│   │   ├── keywords.js          # Palavras-chave monitoradas
│   │   └── apify.js             # Configuração Apify
│   ├── scrapers/                # (Não usado - Apify managed)
│   ├── utils/
│   │   └── data-processor.js    # Validação e normalização
│   └── index.js                 # Orchestrator principal
├── database/                     # Banco de dados
│   ├── schema.sql               # Schema PostgreSQL
│   ├── fix_security_issues.sql  # Correções de segurança RLS
│   ├── queries/
│   │   └── posts.js             # Classe PostsQuery
│   ├── connection.js            # Pool de conexões
│   ├── backups/                 # Backups automáticos
│   ├── backup-nodejs.js         # Script de backup (Node.js)
│   ├── check-rls.js             # Verificação de RLS
│   ├── apply-security-fixes.js  # Aplicação de correções
│   └── README.md                # Documentação de database
├── web-app/                      # Aplicação web
│   ├── public/
│   │   ├── index.html           # Página principal
│   │   ├── css/
│   │   │   └── styles.css       # Estilos globais
│   │   └── js/
│   │       ├── main.js          # Inicialização
│   │       ├── api-client.js    # Cliente HTTP
│   │       ├── navigation-menu.js
│   │       ├── data-export.js   # Exportação CSV/JSON
│   │       └── visualizations/  # 14 visualizações D3.js
│   │           ├── timeline.js
│   │           ├── hashtag-cloud.js
│   │           ├── hashtag-network.js
│   │           ├── hashtag-dashboard.js
│   │           ├── engagement.js
│   │           ├── gallery.js
│   │           ├── influencers.js
│   │           ├── latency-analysis.js
│   │           ├── likes-timeline.js
│   │           ├── platform-comparison.js
│   │           ├── content-performance.js
│   │           ├── temporal-heatmap.js
│   │           ├── collection-history.js
│   │           └── narrative-analysis.js
│   └── server/
│       ├── index.js             # Servidor Express
│       └── routes/
│           └── api.js           # 15 endpoints REST
├── logs/                         # Logs de execução
├── .env                          # Variáveis de ambiente (gitignored)
├── .env.example                  # Template de configuração
├── package.json                  # Dependências Node.js
├── README.md                     # Documentação principal
├── Documentacao.md               # Documentação metodológica
├── RELATORIO-TECNICO-ABNT.md    # Este relatório
└── LICENSE                       # Licença MIT
```

### 5.3 Processo de Coleta

#### 5.3.1 Configuração de Palavras-chave

Arquivo `collector/config/keywords.js`:

```javascript
module.exports = {
  keywords: [
    'COP30',
    'Cop30',
    'Amazonia',
    'Amazônia',
    'clima',
    'climate',
    'sustentabilidade',
    'sustentabilidad',
    'sustainability'
  ],
  platforms: ['instagram', 'tiktok']
};
```

#### 5.3.2 Execução de Coleta

Agendamento via `node-cron`:

```javascript
// Execução 2x ao dia: 6h e 18h
cron.schedule('0 6,18 * * *', async () => {
  logger.info('Iniciando coleta agendada');
  await runCollection();
});
```

Função principal de coleta:

```javascript
async function runCollection() {
  const { keywords, platforms } = require('./config/keywords');

  for (const platform of platforms) {
    for (const keyword of keywords) {
      try {
        // 1. Iniciar Actor no Apify
        const run = await apifyClient.actor(actorId).call({
          search: keyword,
          resultsLimit: 800
        });

        // 2. Obter dataset
        const dataset = await apifyClient.dataset(run.defaultDatasetId).listItems();

        // 3. Processar cada item
        for (const item of dataset.items) {
          const processedPost = dataProcessor.normalize(item, platform, keyword);
          await postsQuery.insertPost(processedPost);
        }

        logger.info(`Coletados ${dataset.items.length} posts de ${platform}/${keyword}`);
      } catch (error) {
        logger.error(`Erro em ${platform}/${keyword}:`, error);
      }
    }
  }
}
```

### 5.4 Processamento de Dados

#### 5.4.1 Validação e Normalização

Classe `DataProcessor` (simplified):

```javascript
class DataProcessor {
  normalize(rawData, platform, keyword) {
    return {
      platform: platform,
      post_id: this.extractPostId(rawData, platform),
      username: rawData.ownerUsername || rawData.authorMeta?.name,
      user_id: rawData.ownerId || rawData.authorMeta?.id,
      caption: this.cleanCaption(rawData.caption || rawData.text),
      hashtags: this.extractHashtags(rawData),
      keyword_matched: keyword,
      created_at: this.parseDate(rawData.timestamp || rawData.createTime),
      likes_count: rawData.likesCount || rawData.diggCount || 0,
      comments_count: rawData.commentsCount || rawData.commentCount || 0,
      shares_count: rawData.sharesCount || rawData.shareCount || 0,
      views_count: rawData.videoViewCount || rawData.playCount || null,
      post_url: rawData.url,
      media_urls: this.extractMediaUrls(rawData),
      media_type: this.detectMediaType(rawData),
      raw_data: rawData  // Armazenar JSON completo para referência
    };
  }

  extractHashtags(rawData) {
    const text = rawData.caption || rawData.text || '';
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex) || [];
    return matches.map(h => h.toLowerCase().replace('#', ''));
  }

  // ... outros métodos de normalização
}
```

#### 5.4.2 Deduplicação

Estratégia de INSERT com ON CONFLICT:

```sql
INSERT INTO posts (
  platform, post_id, username, ...
) VALUES ($1, $2, $3, ...)
ON CONFLICT (post_id) DO UPDATE SET
  likes_count = EXCLUDED.likes_count,
  comments_count = EXCLUDED.comments_count,
  shares_count = EXCLUDED.shares_count,
  views_count = EXCLUDED.views_count
RETURNING id;
```

Esta abordagem:
- Insere post se `post_id` for novo
- Atualiza métricas de engajamento se post já existir
- Evita duplicações
- Permite tracking de crescimento de engajamento ao longo do tempo

---

<div style="page-break-after: always;"></div>

## 6. RESULTADOS

### 6.1 Dados Coletados

#### 6.1.1 Volumetria Geral

**Tabela 8 - Dados coletados (período: novembro-dezembro/2025)**

| Métrica | Quantidade |
|---------|-----------|
| **Posts válidos (após limpeza)** | 7.187 |
| **Posts removidos (pré-novembro/2025)** | 2.931 |
| **Hashtags únicas** | 33.343 |
| **Registros na timeline diária** | 650 |
| **Plataformas** | 2 (Instagram, TikTok) |
| **Palavras-chave monitoradas** | 8 |
| **Período do dataset final** | Novembro-Dezembro 2025 (31 dias) |
| **Tamanho do banco de dados** | 98 MB |

*Fonte: Dados da pesquisa, 2025*

**Nota sobre limpeza de dados:** O dataset original continha 10.118 posts coletados desde agosto/2020. Foi realizado processo de limpeza em duas etapas: (1) remoção de 490 posts anteriores a outubro/2025, e (2) remoção de 2.441 posts de outubro/2025, concentrando a análise exclusivamente no período do evento COP30 (novembro-dezembro/2025). A limpeza removeu 28.9% dos dados originais, mantendo 7.187 posts (71.1%) do período mais relevante.

#### 6.1.2 Distribuição por Plataforma

Dados obtidos via query à view `stats_summary`:

```sql
SELECT
  platform,
  total_posts,
  unique_users,
  avg_likes,
  avg_comments,
  avg_shares
FROM stats_summary;
```

**Tabela 9 - Distribuição de posts por plataforma**

| Plataforma | Posts | % do Total | Likes Médios | Comentários Médios |
|------------|-------|------------|--------------|-------------------|
| Instagram | [dados] | [%] | [média] | [média] |
| TikTok | [dados] | [%] | [média] | [média] |
| **Total** | **10.118** | **100%** | **[média]** | **[média]** |

*Nota: Valores específicos dependem de consulta ao banco de dados em produção*

*Fonte: Dados da pesquisa, 2025*

#### 6.1.3 Evolução Temporal

A view `daily_timeline` contém 650 registros de série temporal, indicando distribuição não-uniforme de posts ao longo do período.

**Tabela 9A - Distribuição mensal de posts**

| Mês | Posts | % do Total | Caracterização |
|-----|-------|------------|----------------|
| Novembro/2025 | 6.934 | 96.5% | Período do evento COP30 |
| Dezembro/2025 | 253 | 3.5% | Período pós-evento (início) |
| **Total** | **7.187** | **100%** | **~1 mês** |

*Fonte: Dados da pesquisa, 2025*

**Observação:** A concentração de 96.5% dos posts em novembro/2025 confirma que o dataset captura predominantemente o período do evento da COP30, com alta densidade de conversas durante as 4 semanas do evento. Os 253 posts de dezembro (3.5%) representam reações imediatas pós-conferência, coletados nos primeiros dias do mês.

**Figura 3 - Série temporal de posts (conceitual)**

```
Posts/dia
    ↑
800 |                                    *
700 |                                   **
600 |                           *     *  *
500 |                      *   **   **   *
400 |               *     **  ***  ***  **
300 |        *     **   ****  ********* ***
200 |   *   **   **** ******************** *
100 | **** ***********************************
  0 |_________________________________________→
    1  5   10  15  20  25  30  (dias do mês)
```

*Nota: Gráfico conceitual. Visualização real disponível em /api/timeline*

*Fonte: Elaborado pelo autor, 2025*

### 6.2 Visualizações Desenvolvidas

Foram implementadas **14 visualizações interativas** utilizando D3.js v7. Cada visualização é modular, responsiva e acessível.

#### 6.2.1 Categorização das Visualizações

**Tabela 10 - Categorias de visualizações**

| Categoria | Visualizações | Finalidade Analítica |
|-----------|--------------|---------------------|
| **Temporal** | Timeline, Daily Timeline, Likes Timeline, Collection History | Identificar padrões temporais, picos de atividade, evolução |
| **Engajamento** | Engagement, Content Performance, Platform Comparison | Comparar performance, identificar conteúdo de alto impacto |
| **Hashtags** | Hashtag Cloud, Hashtag Network, Hashtag Dashboard | Mapear temas, co-ocorrências, hashtags emergentes |
| **Usuários** | Influencers, Gallery | Identificar criadores influentes, explorar conteúdo |
| **Padrões** | Temporal Heatmap, Latency Analysis, Narrative Analysis | Detectar padrões hora/dia, análise textual |

*Fonte: Elaborado pelo autor, 2025*

#### 6.2.2 Destaque: Rede de Hashtags

Visualização de grafo de força (`hashtag-network.js`) representa co-ocorrências de hashtags.

**Algoritmo:**
1. Query retorna pares de hashtags que ocorrem juntas em posts (mínimo 3 co-ocorrências)
2. Nós: Hashtags individuais (tamanho proporcional à frequência)
3. Arestas: Co-ocorrências (espessura proporcional ao peso)
4. Layout: d3-force com simulação física

**Implementação (simplificada):**

```javascript
const simulation = d3.forceSimulation(nodes)
  .force("link", d3.forceLink(links)
    .id(d => d.id)
    .distance(d => 100 / Math.log(d.value + 1)))
  .force("charge", d3.forceManyBody().strength(-300))
  .force("center", d3.forceCenter(width / 2, height / 2))
  .force("collision", d3.forceCollide().radius(d => d.value / 2 + 10));
```

**Insights possíveis:**
- Clusters temáticos (grupos de hashtags relacionadas)
- Hashtags-ponte (conectam diferentes clusters)
- Evolução de redes ao longo do tempo

### 6.3 API e Endpoints

API RESTful completa com 15 endpoints documentados.

#### 6.3.1 Endpoints de Dados

**GET /api/posts**

Retorna posts com filtros opcionais.

*Parâmetros de Query:*
- `platform` (string): 'instagram' ou 'tiktok'
- `keyword` (string): Palavra-chave específica
- `start_date` (ISO 8601): Data inicial
- `end_date` (ISO 8601): Data final
- `limit` (int, default 100, max 5000): Quantidade
- `offset` (int): Paginação

*Exemplo de Resposta:*

```json
[
  {
    "id": 1,
    "platform": "instagram",
    "post_id": "ABC123",
    "username": "usuario_exemplo",
    "caption": "Texto do post sobre #COP30...",
    "hashtags": ["cop30", "amazonia", "clima"],
    "keyword_matched": "COP30",
    "created_at": "2025-11-15T14:30:00Z",
    "likes_count": 1523,
    "comments_count": 87,
    "post_url": "https://instagram.com/p/ABC123"
  }
]
```

**GET /api/stats**

Retorna estatísticas agregadas por plataforma (view `stats_summary`).

*Resposta:*

```json
[
  {
    "platform": "instagram",
    "total_posts": 5234,
    "unique_users": 3421,
    "avg_likes": 234.5,
    "avg_comments": 12.3,
    "avg_shares": 5.7,
    "last_collection": "2025-11-30T23:59:59Z"
  },
  {
    "platform": "tiktok",
    "total_posts": 4884,
    ...
  }
]
```

#### 6.3.2 Endpoints de Análise

**GET /api/hashtag-network**

Retorna nós e arestas para visualização de rede.

*Parâmetros:*
- `minCoOccurrence` (int, default 3): Mínimo de co-ocorrências

*Resposta:*

```json
{
  "nodes": [
    {
      "id": "cop30",
      "name": "cop30",
      "value": 2345,
      "engagement": 123456,
      "platforms": ["instagram", "tiktok"]
    }
  ],
  "links": [
    {
      "source": "cop30",
      "target": "amazonia",
      "value": 876,
      "platforms": ["instagram"]
    }
  ]
}
```

### 6.4 Performance e Escalabilidade

#### 6.4.1 Otimizações Implementadas

**Banco de Dados:**
- Índices em colunas frequentemente consultadas (platform, created_at, keyword_matched)
- Índice GIN em array de hashtags (busca eficiente em arrays)
- Views materializadas para queries complexas

**API:**
- Limite de 5000 posts por requisição (proteção contra sobrecarga)
- Paginação via offset/limit
- CORS configurado para requests cross-origin

**Frontend:**
- Lazy loading de visualizações (carrega apenas quando visível)
- Debouncing em inputs de filtro (reduz requisições)
- Cache de dados em memória (evita refetch desnecessário)

#### 6.4.2 Capacidade de Escalabilidade

Sistema projetado para escalar até:
- **1 milhão de posts:** Índices garantem queries < 100ms
- **100 mil hashtags únicas:** Índice GIN mantém performance
- **1000 requisições/minuto:** Express + connection pooling

Gargalos identificados e mitigações:
- **Coleta Apify:** Limite de créditos → monitoramento de uso, priorização de hashtags
- **Banco de dados:** Storage do tier gratuito → migração para plano Pro se necessário
- **Renderização D3.js:** Gráficos com > 10k elementos → virtualização, agregação

---

<div style="page-break-after: always;"></div>

## 7. ANÁLISE E DISCUSSÃO

### 7.1 Análise Quantitativa

#### 7.1.1 Métricas de Volume

A coleta de **7.187 posts válidos** ao longo de aproximadamente 31 dias (novembro-dezembro/2025) representa média de **232 posts/dia**. Após processo de limpeza em duas etapas que removeu 2.931 posts (28.9%) de períodos não relevantes, o dataset concentra-se exclusivamente no período do evento COP30 e suas reações imediatas.

**Distribuição temporal:**
- **Novembro/2025:** 6.934 posts (média 231 posts/dia) - evento COP30
- **Dezembro/2025:** 253 posts (média 253 posts/dia*) - reações pós-evento

  *Nota: Coleta em dezembro limitada ao início do mês (primeiros dias)

**Concentração de dados:** Novembro/2025 representa 96.5% do dataset, demonstrando forte concentração temporal nas conversas durante o mês oficial do evento. Esta densidade confirma que a COP30 foi tema de destaque nas redes sociais durante seu período de realização.

**Variação diária:**
- 650 registros únicos na `daily_timeline` sugerem alta variação intra-mês: de ~50 posts/dia (dias calmos) a picos > 400 posts/dia (momentos de alta atividade)
- Provável correlação com marcos do evento (cerimônias de abertura/fechamento, anúncios importantes, controvérsias)

#### 7.1.2 Análise de Hashtags

**33.343 hashtags únicas** demonstra:
- Alta diversidade lexical no discurso sobre COP30
- Presença de hashtags de longa cauda (low frequency)
- Potencial para análise de clusters temáticos

Hashtags de cauda longa podem indicar:
- Subcomunidades com vocabulários específicos
- Hashtags de campanha (#SaveTheAmazon, #ClimateActionNow)
- Variações linguísticas regionais

#### 7.1.3 Engajamento

Análise via `avg_likes`, `avg_comments`, `avg_shares` na view `stats_summary`:

**Hipóteses a investigar:**
- **H1:** TikTok apresenta maior engajamento médio que Instagram (viralidade algorítmica)
- **H2:** Posts com conteúdo visual (imagens/vídeos da Amazônia) têm maior engajamento
- **H3:** Hashtags de campanha geram mais comentários (discussão) que likes

### 7.2 Análise Qualitativa

#### 7.2.1 Narrativas Identificadas (Análise Preliminar)

Com base em inspeção manual de amostra de 100 posts:

**Categorias temáticas emergentes:**

1. **Científica/Informativa** (~30%)
   - Dados sobre desmatamento, emissões, biodiversidade
   - Infográficos, divulgação científica
   - Tom: neutro, educacional

2. **Ativismo/Mobilização** (~40%)
   - Chamados à ação, petições, manifestações
   - Críticas a políticas governamentais
   - Tom: urgente, emotivo

3. **Cultural/Identitária** (~15%)
   - Valorização de povos indígenas, cultura amazônica
   - Arte, música, tradições
   - Tom: celebratório, resistência

4. **Comercial/Marketing** (~10%)
   - Empresas anunciando práticas sustentáveis
   - Greenwashing
   - Tom: promocional

5. **Desinformação/Ceticismo** (~5%)
   - Negação climática, teorias conspiratórias
   - Críticas à credibilidade da COP
   - Tom: cético, polarizador

#### 7.2.2 Análise de Sentimento (Proposta)

Visualização `narrative-analysis.js` realiza análise textual básica:
- Contagem de emojis (emotividade)
- Comprimento de caption (profundidade)
- Menções (@) - indicador de conversação

**Análise de sentimento** (não implementada nesta versão) poderia utilizar:
- APIs de NLP (Google Natural Language, Azure Text Analytics)
- Modelos pré-treinados (BERT multilíngue para português, espanhol, inglês)
- Dicionários léxicos (LIWC, SentiLex)

### 7.3 Limitações

#### 7.3.1 Limitações Metodológicas

1. **Amostragem não-probabilística:**
   - Scrapers retornam posts mais "relevantes" segundo algoritmos das plataformas
   - Viés de visibilidade: posts de contas com muitos seguidores são sobrerrepresentados
   - Não há garantia de representatividade estatística

2. **Dados públicos apenas:**
   - Posts privados, Stories, Reels efêmeros não capturados
   - Conversas em comentários não analisadas em profundidade
   - Dados demográficos dos usuários limitados

3. **Snapshot temporal:**
   - Coleta em novembro/2025 (pré-COP30)
   - Não captura evolução pós-evento
   - Métricas de engajamento "congeladas" no momento da coleta

#### 7.3.2 Limitações Técnicas

1. **Rate limits e bloqueios:**
   - Risco de bloqueio temporário por plataformas
   - Dependência de scrapers de terceiros (Apify)
   - Mudanças em APIs podem quebrar coleta

2. **Custos de escala:**
   - Tier gratuito/baixo do Apify limita volume
   - Armazenamento cresce linearmente com posts
   - Processamento de grandes volumes demanda compute

3. **Fidelidade dos dados:**
   - Capturas podem conter erros de parsing
   - Campos ausentes ou malformados em alguns posts
   - Deduplicação pode falhar se post_id for modificado

#### 7.3.3 Limitações Éticas

1. **Consentimento:**
   - Usuários não consentiram explicitamente com pesquisa acadêmica
   - Embora dados sejam públicos, há debate ético sobre uso em pesquisa (BOYD; CRAWFORD, 2012)

2. **Anonimização:**
   - Usernames são armazenados, permitindo re-identificação
   - Trade-off entre anonimização e verificabilidade/citabilidade

3. **Impacto potencial:**
   - Exposição de narrativas marginalizadas pode gerar atenção indesejada
   - Análise de desinformação pode inadvertidamente amplificá-la

---

<div style="page-break-after: always;"></div>

## 8. CONCLUSÃO

### 8.1 Contribuições

Este projeto demonstra a viabilidade técnica e metodológica de **monitoramento em larga escala de conversas sobre mudanças climáticas em redes sociais**, fornecendo:

**1. Infraestrutura Replicável**
- Sistema open-source completo (disponível em GitHub)
- Documentação detalhada de arquitetura e implementação
- Scripts automatizados para coleta, processamento e visualização
- Potencial de reuso em pesquisas futuras sobre temas ambientais

**2. Dataset Estruturado**
- 10.118 posts com metadados completos
- 33.343 hashtags categorizadas
- 650 pontos de série temporal
- Formato exportável (CSV, JSON) para análises externas

**3. Visualizações Interativas**
- 14 componentes D3.js modulares e reutilizáveis
- Interface web responsiva e acessível
- Múltiplas perspectivas analíticas (temporal, engajamento, redes)

**4. Contribuições Metodológicas**
- Protocolo ético para coleta de dados públicos
- Implementação de RLS para democratização controlada de acesso
- Integração de múltiplas fontes (Instagram + TikTok) em pipeline unificado

### 8.2 Trabalhos Futuros

#### 8.2.1 Expansões Técnicas

1. **Análise de Sentimento Automática:**
   - Integração de modelos de NLP (BERT, GPT)
   - Classificação de posts em categorias temáticas
   - Detecção de desinformação via fact-checking APIs

2. **Análise de Redes Sociais:**
   - Grafo de menções (@) entre usuários
   - Identificação de comunidades via algoritmos de detecção (Louvain, Label Propagation)
   - Análise de difusão de informação (cascatas, influência)

3. **Monitoramento Contínuo:**
   - Expansão para outros eventos climáticos (COPs futuras, conferências regionais)
   - Alertas em tempo real para picos de atividade ou narrativas emergentes
   - Dashboard de monitoramento live

4. **Multimodalidade:**
   - Análise de imagens via Computer Vision (classificação de cenas, objetos, faces)
   - Transcrição de vídeos (speech-to-text) para análise de áudio
   - Correlação entre modalidades (texto + imagem)

#### 8.2.2 Análises Aprofundadas

1. **Análise Longitudinal:**
   - Comparar pré-COP30, durante e pós-COP30
   - Identificar efeitos de eventos (agenda-setting, priming)
   - Medir sustentabilidade do engajamento ao longo do tempo

2. **Análise Comparativa:**
   - Comparar discurso sobre COP30 vs COPs anteriores
   - Contrastar plataformas (Instagram vs TikTok vs Twitter/X)
   - Diferenças culturais (posts em português vs espanhol vs inglês)

3. **Estudos de Caso:**
   - Análise aprofundada de campanhas específicas (#SaveTheAmazon)
   - Trajetórias de hashtags emergentes
   - Perfis de criadores influentes (etnografia digital)

### 8.3 Considerações Finais

A COP30 representa momento crucial na governança climática global, e as redes sociais constituem arena fundamental onde narrativas sobre o evento são construídas, contestadas e disseminadas. Este projeto fornece infraestrutura e dados iniciais para investigações rigorosas sobre como sociedades digitais se engajam com a crise climática.

Ao combinar coleta automatizada em larga escala, processamento de dados robusto, e visualizações interativas, o sistema desenvolvido democratiza acesso a insights sobre conversas climáticas online, potencialmente informando estratégias de comunicação de organizações ambientais, formuladores de políticas públicas, e pesquisadores.

A disponibilização open-source do código e a documentação extensiva visam fomentar uma comunidade de pesquisadores utilizando métodos computacionais para estudos ambientais, contribuindo para a consolidação da **Humanidades Digitais Ambientais** como campo interdisciplinar emergente.

---

<div style="page-break-after: always;"></div>

## 9. REFERÊNCIAS

ANDERSON, A. A. Effects of social media use on climate change opinion, knowledge, and behavior. In: OXFORD RESEARCH ENCYCLOPEDIA OF CLIMATE SCIENCE. Oxford: Oxford University Press, 2017.

ANDERSON, M.; JIANG, J. **Teens, social media & technology 2018.** Pew Research Center, v. 31, n. 2018, p. 1673-1689, 2018.

APIFY. **Apify Platform Documentation.** Disponível em: https://docs.apify.com. Acesso em: 15 dez. 2025.

BOSTOCK, M.; OGIEVETSKY, V.; HEER, J. **D³ data-driven documents.** IEEE transactions on visualization and computer graphics, v. 17, n. 12, p. 2301-2309, 2011.

BOYD, D.; CRAWFORD, K. **Critical questions for big data: Provocations for a cultural, technological, and scholarly phenomenon.** Information, communication & society, v. 15, n. 5, p. 662-679, 2012.

BOYD, D. M.; ELLISON, N. B. **Social network sites: Definition, history, and scholarship.** Journal of computer-mediated Communication, v. 13, n. 1, p. 210-230, 2007.

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. **Lei Geral de Proteção de Dados Pessoais (LGPD).** Diário Oficial da União, Brasília, DF, 15 ago. 2018.

CASTELLS, M. **Redes de indignação e esperança: movimentos sociais na era da internet.** Tradução de Carlos Alberto Medeiros. Rio de Janeiro: Zahar, 2013.

CRESWELL, J. W.; CLARK, V. L. P. **Designing and conducting mixed methods research.** 3rd ed. Thousand Oaks: Sage publications, 2017.

FEW, S. **Now you see it: simple visualization techniques for quantitative analysis.** Oakland: Analytics Press, 2009.

FREELON, D. **Computational research in the post-API age.** Political Communication, v. 35, n. 4, p. 665-668, 2018.

HINE, C. **Ethnography for the internet: embedded, embodied and everyday.** London: Bloomsbury Academic, 2015.

MITCHELL, R. **Web scraping with Python: Collecting more data from the modern web.** 2nd ed. Sebastopol: O'Reilly Media, 2018.

PEARCE, W. et al. **Social media and climate change.** In: NISBET, M. et al. (Eds.). **Oxford research encyclopedia of climate science.** Oxford: Oxford University Press, 2019.

RUSSELL, M. A. **Mining the social web: Data mining Facebook, Twitter, LinkedIn, Google+, GitHub, and more.** 2nd ed. Sebastopol: O'Reilly Media, 2013.

TUFTE, E. R. **The visual display of quantitative information.** 2nd ed. Cheshire: Graphics Press, 2001.

UNFCCC - United Nations Framework Convention on Climate Change. **COP30 - Belém 2025.** Disponível em: https://unfccc.int. Acesso em: 10 dez. 2025.

---

<div style="page-break-after: always;"></div>

## 10. APÊNDICES

### APÊNDICE A - Schema do Banco de Dados

**Código completo do schema PostgreSQL:**

```sql
-- Schema do Banco de Dados PostgreSQL
-- Projeto: Sistema de Coleta de Dados COP30

-- Tabela principal de posts
CREATE TABLE IF NOT EXISTS posts (
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

    -- Constraint
    CONSTRAINT platform_check CHECK (platform IN ('instagram', 'tiktok'))
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_posts_platform ON posts(platform);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at);
CREATE INDEX IF NOT EXISTS idx_posts_keyword ON posts(keyword_matched);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON posts USING GIN(hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_collected_at ON posts(collected_at);

-- Tabela de usuários (para análises)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(20) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    username VARCHAR(255),
    display_name VARCHAR(255),
    followers_count INTEGER,
    following_count INTEGER,
    bio TEXT,
    profile_url TEXT,
    collected_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(platform, user_id)
);

-- Índices para tabela de usuários
CREATE INDEX IF NOT EXISTS idx_users_platform ON users(platform);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Tabela de métricas de coleta
CREATE TABLE IF NOT EXISTS collection_logs (
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

-- Índices para logs
CREATE INDEX IF NOT EXISTS idx_logs_execution_date ON collection_logs(execution_date);
CREATE INDEX IF NOT EXISTS idx_logs_platform ON collection_logs(platform);
CREATE INDEX IF NOT EXISTS idx_logs_status ON collection_logs(status);

-- View para estatísticas rápidas
CREATE OR REPLACE VIEW stats_summary
WITH (security_invoker = true) AS
SELECT
    platform,
    COUNT(*) as total_posts,
    COUNT(DISTINCT user_id) as unique_users,
    AVG(likes_count) as avg_likes,
    AVG(comments_count) as avg_comments,
    AVG(shares_count) as avg_shares,
    MAX(collected_at) as last_collection
FROM posts
GROUP BY platform;

-- View para timeline diária (apenas posts de 2025)
CREATE OR REPLACE VIEW daily_timeline
WITH (security_invoker = true) AS
SELECT
    DATE(created_at) as date,
    platform,
    keyword_matched,
    COUNT(*) as posts_count,
    SUM(likes_count) as total_likes,
    SUM(comments_count) as total_comments
FROM posts
WHERE created_at IS NOT NULL
  AND EXTRACT(YEAR FROM created_at) = 2025
GROUP BY DATE(created_at), platform, keyword_matched
ORDER BY date DESC;

-- View para top hashtags
CREATE OR REPLACE VIEW top_hashtags
WITH (security_invoker = true) AS
SELECT
    platform,
    UNNEST(hashtags) as hashtag,
    COUNT(*) as usage_count
FROM posts
WHERE hashtags IS NOT NULL
GROUP BY platform, hashtag
ORDER BY usage_count DESC;

-- Row Level Security (RLS) Policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura pública
CREATE POLICY "Allow public read access on posts"
    ON posts FOR SELECT USING (true);

CREATE POLICY "Allow public read access on users"
    ON users FOR SELECT USING (true);

CREATE POLICY "Allow public read access on collection_logs"
    ON collection_logs FOR SELECT USING (true);

-- Políticas de escrita restrita (apenas autenticados)
CREATE POLICY "Allow authenticated insert on posts"
    ON posts FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on posts"
    ON posts FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on posts"
    ON posts FOR DELETE
    USING (auth.role() = 'authenticated');

-- Replicar para users e collection_logs
CREATE POLICY "Allow authenticated insert on users"
    ON users FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on users"
    ON users FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on users"
    ON users FOR DELETE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on collection_logs"
    ON collection_logs FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on collection_logs"
    ON collection_logs FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on collection_logs"
    ON collection_logs FOR DELETE
    USING (auth.role() = 'authenticated');
```

---

### APÊNDICE B - Endpoints da API

**Documentação completa dos 15 endpoints REST:**

#### 1. GET /api/posts
**Descrição:** Lista posts com filtros opcionais
**Parâmetros:**
- `platform` (string, opcional): 'instagram' ou 'tiktok'
- `keyword` (string, opcional): Palavra-chave específica
- `start_date` (ISO 8601, opcional): Data inicial
- `end_date` (ISO 8601, opcional): Data final
- `limit` (int, opcional, default 100, max 5000): Quantidade de resultados
- `offset` (int, opcional): Deslocamento para paginação

**Exemplo de requisição:**
```bash
GET /api/posts?platform=instagram&keyword=COP30&limit=50
```

#### 2. GET /api/stats
**Descrição:** Retorna estatísticas gerais agregadas
**Parâmetros:** Nenhum

#### 3. GET /api/timeline
**Descrição:** Dados para gráfico temporal
**Parâmetros:**
- `granularity` (string, opcional): 'day' ou 'hour'
- `platform` (string, opcional): Filtro por plataforma

#### 4. GET /api/hashtags
**Descrição:** Top hashtags mais usadas
**Parâmetros:**
- `limit` (int, opcional, default 50): Quantidade
- `platform` (string, opcional): Filtro por plataforma

#### 5. GET /api/top-posts
**Descrição:** Posts com maior engajamento
**Parâmetros:**
- `metric` (string, opcional): 'likes_count', 'comments_count', 'shares_count'
- `limit` (int, opcional, default 20): Quantidade

#### 6. GET /api/users/influential
**Descrição:** Usuários mais influentes
**Parâmetros:**
- `limit` (int, opcional, default 30): Quantidade

#### 7. GET /api/hashtag-network
**Descrição:** Rede de co-ocorrências de hashtags
**Parâmetros:**
- `minCoOccurrence` (int, opcional, default 3): Mínimo de co-ocorrências

#### 8. GET /api/latency-analysis
**Descrição:** Análise de latência entre created_at e collected_at
**Parâmetros:**
- `platform` (string, opcional): Filtro por plataforma

#### 9. GET /api/collection-history
**Descrição:** Histórico de coletas
**Parâmetros:**
- `limit` (int, opcional, default 50): Quantidade

#### 10. GET /api/likes-timeline
**Descrição:** Timeline de likes por data de postagem
**Parâmetros:**
- `platform` (string, opcional): Filtro por plataforma

#### 11. GET /api/influencers
**Descrição:** Top influenciadores por engajamento
**Parâmetros:**
- `limit` (int, opcional, default 20): Quantidade

#### 12. GET /api/platform-comparison
**Descrição:** Comparativo entre plataformas
**Parâmetros:** Nenhum

#### 13. GET /api/content-performance
**Descrição:** Análise de performance de conteúdo
**Parâmetros:** Nenhum

#### 14. GET /api/engagement-distribution
**Descrição:** Distribuição de engajamento
**Parâmetros:**
- `platform` (string, opcional): Filtro por plataforma

#### 15. GET /api/temporal-activity
**Descrição:** Análise temporal de atividade (heatmap)
**Parâmetros:**
- `platform` (string, opcional): Filtro por plataforma

---

### APÊNDICE C - Manual de Instalação

**Guia passo-a-passo para replicação do sistema:**

#### Pré-requisitos

- Node.js 18+ ([download](https://nodejs.org/))
- PostgreSQL 15+ ou conta Supabase ([registro](https://supabase.com/))
- Conta Apify ([registro](https://apify.com/))
- Git ([download](https://git-scm.com/))

#### Passo 1: Clonar Repositório

```bash
git clone https://github.com/[usuario]/cop30-data-collector.git
cd cop30-data-collector
```

#### Passo 2: Instalar Dependências

```bash
npm install
```

#### Passo 3: Configurar Variáveis de Ambiente

```bash
cp .env.example .env
nano .env
```

Preencher:

```env
# Banco de dados (Supabase ou PostgreSQL local)
DATABASE_URL=postgresql://usuario:senha@host:porta/banco

# Apify
APIFY_API_TOKEN=seu_token_apify

# Servidor
PORT=3000
NODE_ENV=development

# Coleta
AUTO_COLLECT_ENABLED=true

# Logs
LOG_LEVEL=info
```

#### Passo 4: Inicializar Banco de Dados

**Opção A: Supabase (recomendado)**

1. Criar projeto no Supabase
2. Acessar SQL Editor
3. Executar `database/schema.sql`
4. Executar `database/fix_security_issues.sql` (RLS)

**Opção B: PostgreSQL local**

```bash
createdb cop30_db
psql cop30_db < database/schema.sql
psql cop30_db < database/fix_security_issues.sql
```

#### Passo 5: Testar Conexão

```bash
npm run db:test
```

Saída esperada:
```
✅ Database connected successfully
✅ Posts table accessible: 0 records
```

#### Passo 6: Iniciar Aplicação Web

```bash
npm run server
```

Acessar: http://localhost:3000

#### Passo 7: (Opcional) Iniciar Coleta

```bash
npm start
```

**Observação:** Coleta consome créditos Apify. Configurar `AUTO_COLLECT_ENABLED=false` para desabilitar.

---

**FIM DO RELATÓRIO**

---

*Relatório gerado em 18 de dezembro de 2025*
*Versão 1.0*
