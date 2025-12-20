# Database - Scripts e Ferramentas

Este diretório contém scripts para gerenciamento e manutenção do banco de dados PostgreSQL/Supabase do projeto COP30.

## 📋 Índice

- [Scripts Disponíveis](#scripts-disponíveis)
- [Correções de Segurança Aplicadas](#correções-de-segurança-aplicadas)
- [Backup e Restauração](#backup-e-restauração)
- [Verificação e Diagnóstico](#verificação-e-diagnóstico)

---

## 🛠️ Scripts Disponíveis

### 1. `check-rls.js` - Verificar Estado do RLS

Verifica o estado atual do Row Level Security (RLS) nas tabelas e testa conexões.

**Uso:**
```bash
node database/check-rls.js
```

**O que faz:**
- ✓ Verifica se RLS está ativado nas tabelas
- ✓ Lista todas as políticas RLS existentes
- ✓ Verifica views
- ✓ Testa consultas básicas
- ✓ Fornece diagnóstico automático

---

### 2. `backup-nodejs.js` - Backup do Banco

Cria backup completo do banco de dados sem precisar instalar `pg_dump`.

**Uso:**
```bash
node database/backup-nodejs.js
```

**O que exporta:**
- ✓ Todos os dados das tabelas (posts, users, collection_logs)
- ✓ Definições das views
- ✓ Políticas RLS (se existirem)

**Localização dos backups:**
```
database/backups/backup-nodejs-[timestamp].sql
```

---

### 3. `apply-security-fixes.js` - Aplicar Correções de Segurança

Aplica as correções de segurança do Supabase automaticamente.

**Uso:**
```bash
# Com backup automático (recomendado)
node database/apply-security-fixes.js

# Sem backup (não recomendado)
node database/apply-security-fixes.js --skip-backup
```

**O que faz:**
1. 📦 Faz backup automático do banco
2. 🔒 Aplica correções de segurança
3. ✅ Verifica se tudo foi aplicado corretamente
4. 🧪 Testa consultas

---

## 🔒 Correções de Segurança Aplicadas

### Problemas Resolvidos

#### 1. **Security Definer Views** (3 erros)

**Antes:**
```sql
CREATE VIEW stats_summary AS ...
```

**Depois:**
```sql
CREATE VIEW stats_summary
WITH (security_invoker = true) AS ...
```

Views corrigidas:
- ✓ `stats_summary`
- ✓ `daily_timeline`
- ✓ `top_hashtags`

**Motivo:** Views com `SECURITY DEFINER` executam com permissões do criador, não do usuário. Isso pode criar vulnerabilidades de segurança.

---

#### 2. **RLS Desabilitado** (3 erros)

**Antes:**
- RLS desativado nas tabelas `posts`, `users`, `collection_logs`
- Qualquer pessoa podia inserir/atualizar/deletar dados

**Depois:**
- ✓ RLS ativado em todas as tabelas
- ✓ 4 políticas por tabela (SELECT, INSERT, UPDATE, DELETE)

**Políticas criadas:**

##### Leitura Pública (SELECT)
```sql
CREATE POLICY "Allow public read access on [table]"
  ON [table]
  FOR SELECT
  USING (true);
```
- **Quem pode:** Todos (anônimos e autenticados)
- **O que pode:** Ler todos os dados

##### Escrita Restrita (INSERT/UPDATE/DELETE)
```sql
CREATE POLICY "Allow authenticated [operation] on [table]"
  ON [table]
  FOR [INSERT|UPDATE|DELETE]
  WITH CHECK (auth.role() = 'authenticated');
```
- **Quem pode:** Apenas usuários autenticados
- **O que pode:** Inserir, atualizar ou deletar dados

---

## 💾 Backup e Restauração

### Fazer Backup Manual

```bash
node database/backup-nodejs.js
```

### Restaurar Backup

#### Opção 1: Via psql (linha de comando)
```bash
psql "$DATABASE_URL" < database/backups/backup-nodejs-[timestamp].sql
```

#### Opção 2: Via Supabase Dashboard
1. Acesse **Database** → **SQL Editor**
2. Copie o conteúdo do arquivo de backup
3. Cole e execute no editor SQL

### Localização dos Backups

```
database/backups/
├── backup-nodejs-2025-12-18T13-49-45.sql  (102 MB)
├── backup-nodejs-2025-12-18T13-48-07.sql  (102 MB)
└── ...
```

---

## 🔍 Verificação e Diagnóstico

### Verificar Estado Atual

```bash
node database/check-rls.js
```

**Saída esperada (após correções):**
```
📋 Estado do RLS nas tabelas:
  collection_logs: 🔒 ATIVADO
  posts: 🔒 ATIVADO
  users: 🔒 ATIVADO

📜 Políticas RLS existentes:
  [12 políticas listadas]

👁️ Views existentes:
  ✓ daily_timeline
  ✓ stats_summary
  ✓ top_hashtags

🔬 Diagnóstico:
  ✓ RLS está ativado e políticas estão configuradas.
```

---

## 📊 Estatísticas do Banco

**Após correções e limpeza aplicadas:**
- ✅ RLS ativado em 3 tabelas
- ✅ 12 políticas RLS configuradas (4 por tabela)
- ✅ 3 views recriadas com security_invoker
- ✅ **7.187 posts** válidos (período: nov-dez/2025)
- ✅ 650 registros na timeline diária
- ✅ 33.343 hashtags únicas

**Distribuição Temporal:**
- Novembro/2025: 6.934 posts (96.5%)
- Dezembro/2025: 253 posts (3.5%)

**Limpeza realizada em 19/12/2025 (2 etapas):**
1. Primeira etapa: Removidos 490 posts anteriores a 01/10/2025
2. Segunda etapa: Removidos 2.441 posts de outubro/2025
3. **Total removido:** 2.931 posts (28.9% do total original)
4. **Dataset final:** 7.187 posts de novembro-dezembro/2025

**Backups disponíveis:**
- `backup-nodejs-2025-12-20T02-09-56.sql` - Antes da limpeza de outubro (9.628 posts)
- `backup-nodejs-2025-12-20T02-03-08.sql` - Antes da limpeza inicial (10.118 posts)

---

## ⚠️ Notas Importantes

### Modelo de Acesso

**Leitura:** Pública
- Qualquer pessoa pode ler os dados via API REST do Supabase
- Ideal para dashboards públicos e análises

**Escrita:** Restrita
- Apenas usuários autenticados podem modificar dados
- Protege contra inserções/modificações não autorizadas

### Autenticação para Escrita

Para fazer INSERT/UPDATE/DELETE, você precisa:
1. Autenticar via Supabase Auth
2. Usar o token JWT nas requisições
3. Ou usar a `service_role` key (apenas backend)

**Exemplo com service_role:**
```javascript
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
await supabase.from('posts').insert({ ... })
```

---

## 🚨 Troubleshooting

### Problema: "permission denied for table posts"

**Causa:** RLS está ativado mas você não está autenticado

**Solução:**
```javascript
// Para leitura (SELECT) - funciona sem autenticação
const { data } = await supabase.from('posts').select('*')

// Para escrita - precisa autenticar
const supabase = createClient(url, serviceRoleKey) // Use service_role
await supabase.from('posts').insert({ ... })
```

### Problema: "Dados não carregam no frontend"

**Diagnóstico:**
```bash
node database/check-rls.js
```

**Possíveis causas:**
1. RLS ativado sem políticas de SELECT → Resolvido pelas políticas públicas
2. Erro de conexão → Verifique DATABASE_URL
3. Problema no frontend → Verifique console do navegador

---

## 📝 Arquivos

```
database/
├── README.md                      # Esta documentação
├── schema.sql                     # Schema original
├── fix_security_issues.sql        # SQL de correções
├── check-rls.js                   # Script de verificação
├── backup-nodejs.js               # Script de backup
├── apply-security-fixes.js        # Script de aplicação
└── backups/                       # Diretório de backups
    └── backup-nodejs-*.sql
```

---

## ✅ Checklist de Segurança

- [x] RLS ativado em todas as tabelas
- [x] Políticas de leitura pública configuradas
- [x] Políticas de escrita restrita configuradas
- [x] Views com security_invoker
- [x] Backup criado antes de modificações
- [x] Testes de consulta bem-sucedidos
- [ ] Verificar linter do Supabase (próximo passo)

---

## 🎯 Próximos Passos

1. **Testar a aplicação web**
   ```bash
   cd web-app
   npm start
   ```
   Verifique se os dados carregam corretamente

2. **Verificar Supabase Linter**
   - Acesse Supabase Dashboard → Database → Database Linter
   - Os 6 erros devem estar resolvidos

3. **Monitorar logs**
   - Verifique se não há erros de permissão
   - Confirme que leitura pública funciona
   - Teste escrita com autenticação

---

## 📞 Suporte

Se encontrar problemas:
1. Execute `node database/check-rls.js` para diagnóstico
2. Verifique os logs do Supabase
3. Consulte a documentação do Supabase sobre RLS
