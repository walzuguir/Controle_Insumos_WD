# Controle de Insumos WD — Contexto Completo do Projeto

## Resumo Executivo

Sistema web de controle de insumos e estoque para a **Widmen Autocenter** (rede de auto centers no RJ, ~9 filiais). Objetivo: rastrear fluxo de insumos do CD (Centro de Distribuição) para as lojas, consumo nas lojas, e embasar decisão de compra antecipada.

**Status:** Em produção. 54 issues fechadas, 4 abertas. Pronto pra apresentação aos responsáveis de compras (Karen) e estoque (Evandro).

---

## Stack Técnico

### Frontend
- **Framework:** React + Vite (PWA)
- **Gráficos:** Chart.js (react-chartjs-2)
- **Seletor pesquisável:** react-select
- **UI:** CSS customizado com variáveis de tema escuro
- **Deploy:** Vercel (`https://controle-insumos-wd.vercel.app`)

### Backend
- **Runtime:** Node.js + Express
- **Banco de dados:** Google Sheets (API v4) via Service Account
- **Autenticação:** JWT + bcryptjs
- **Cache:** Em memória (TTL 30-60s)
- **Deploy:** Railway (hobby plan, $5/mês)

### Persistência
- **Google Sheets ID:** `1r0BwAk8dfedYpXa_oEgq5V_DrRxSTTRdN6rQE3sDMm8`
- **Abas (colunas):**
  - `Insumos`: id, nome, unidade, estoque_minimo, ativo, created_at, updated_at (A:G)
  - `Filiais`: id, nome, endereco, responsavel, ativo, created_at, updated_at (A:G)
  - `Usuarios`: id, nome, email, senha_hash, filial_id (A:E)
  - `Movimentacoes`: id, data, tipo, insumo_id, filial_origem, filial_destino, quantidade, responsavel_id, created_at, updated_at, nota_fiscal, requisitante (A:L)
  - `EstoqueMinimo`: filial_id, insumo_id, estoque_minimo, created_at (A:D)

---

## Arquitetura Frontend

### Estrutura de Pastas
frontend/
├── src/
│ ├── components/
│ │ ├── Header.jsx # Menu e logout
│ │ ├── PrivateRoute.jsx # Proteção de rotas
│ │ ├── SeletorInsumo.jsx # Dropdown pesquisável (react-select)
│ │ └── ComparativoMensal.jsx # Painel de análise temporal
│ ├── pages/
│ │ ├── Login.jsx
│ │ ├── Home.jsx # Dashboard com cards de filiais
│ │ ├── EntradaInsumos.jsx # Registra entrada (fornecedor → CD/filial)
│ │ ├── SaidaInsumos.jsx # Registra saída/consumo
│ │ ├── CadastroGestor.jsx # Três abas: cadastrar insumos, filiais, estoque mínimo
│ │ ├── Dashboard.jsx # Visão de estoque por filial/insumo
│ │ ├── Relatorio.jsx # Duas abas: tabela de movimentações + comparativo mensal
│ │ └── PainelGaps.jsx # Itens em estado crítico (estoque < mínimo)
│ ├── services/
│ │ ├── api.js # Cliente axios com interceptor de 401
│ │ └── classificarMovimento.js # Função pura: categoriza tipo de movimento
│ ├── utils/
│ │ └── (estilos inline, funções auxiliares)
│ ├── App.jsx # Rotas
│ ├── index.css # Tema CSS com variáveis
│ └── main.jsx

### Fluxo de Autenticação
1. Login via email/senha → POST `/auth/login`
2. Backend retorna JWT + dados do usuário (id, nome, email, filial_id)
3. localStorage guarda token + usuario JSON
4. `PrivateRoute` valida se token existe; se não, redireciona pra `/login`
5. Interceptor de resposta detecta 401, limpa localStorage, redireciona com `?expirado=1`

### Perfis e Permissões

| Perfil | filial_id | Pode fazer |
|--------|-----------|-----------|
| **Gestor** | `"gestor"` | Tudo: entrada, saída, transferência em qualquer filial, cadastro, configurar mínimos |
| **Responsável de Filial** | `"2"`, `"3"`, etc | Registra saída/consumo na própria filial, registra entrada na própria filial (novo), vê saldos da própria filial |

Regra de ouro: **`filial_destino` e `filial_origem` vêm sempre do token, nunca do body do formulário.** Impede que um usuário credite estoque em filial que não é a dele.

### Componentes Reutilizáveis

**`SeletorInsumo.jsx`**
- Entrada: `{ insumos, valor, onChange, placeholder }`
- Saída: chama `onChange(id)` ao selecionar
- Implementação: react-select com ordenação alfabética, busca por texto
- Usado em: EntradaInsumos, SaidaInsumos, Dashboard, Relatório, CadastroGestor

**`ComparativoMensal.jsx`**
- Painel de análise temporal: dias 1-31, agregado por dia
- Seletores: mês, ano, categoria (Entrada/Consumo/Transferência), insumo, filial, responsável
- Gráfico: barras com cores por categoria, tooltip mostrando dia e quantidade
- Totais semanais: cards abaixo do gráfico destacando semana de pico
- Responsivo: quebra em 2 colunas no mobile

---

## Arquitetura Backend

### Rotas (todas protegidas por `autenticar` exceto `/auth/login`)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/insumos` | Lista insumos ativos |
| POST | `/insumos` | Cria insumo (gestor) |
| PUT | `/insumos/:id` | Edita insumo |
| PATCH | `/insumos/:id/desativar` | Desativa (soft delete) |
| PATCH | `/insumos/:id/reativar` | Reativa |
| GET | `/filiais` | Lista filiais ativas |
| POST | `/filiais` | Cria filial (gestor) |
| PATCH | `/filiais/:id/desativar` | Desativa |
| PATCH | `/filiais/:id/reativar` | Reativa |
| GET | `/movimentacoes?filial=&insumo_id=&tipo=&data_inicio=&data_fim=` | Lista com filtros |
| POST | `/movimentacoes` | Registra entrada/saída/transferência |
| GET | `/saldos` | Calcula estoque atual por filial/insumo (com mínimos) |
| POST | `/estoque-minimo` | Configura mínimo específico por filial |
| GET | `/auth/usuarios` | Retorna id e nome dos usuários (para exibir nomes nas tabelas) |
| POST | `/auth/login` | Autentica e retorna JWT |

### Lógica de Movimentações

**Tipos de movimento:**
1. **Entrada** (`tipo: "entrada"`)
   - Fluxo: `filial_origem = "fornecedor"`, `filial_destino = CD ou filial`
   - Quem faz: Gestor (sempre) ou Responsável (novo, só na própria filial)
   - Campo extra: `nota_fiscal` (opcional), `requisitante` (texto livre, opcional)

2. **Saída/Consumo** (`tipo: "saida"`)
   - Fluxo: `filial_origem = filial própria`, `filial_destino = "" (vazio)`
   - Quem faz: Responsável (sua filial) ou Gestor (qualquer filial)
   - Interpretação: se `filial_destino` vazio, é consumo; se tem destino, é transferência
   - Campo extra: `requisitante` (texto livre, opcional)

3. **Transferência** (`tipo: "transferencia"`)
   - Fluxo: Gera duas linhas (uma saída, uma entrada)
   - Quem faz: Gestor (transferência CD → Filial)
   - Ambas as linhas herdam `requisitante` do formulário

**Cálculo de saldo:**
Para cada filial/insumo:
saldo = entradas - saídas - consumos
estado = saldo >= estoque_minimo ? "ok" : "crítico"

Estoque mínimo pode ser global (por insumo) ou específico (por filial). Se existe específico, usa ele; senão, usa o global.

### Cache

**`cache.js`** (compartilhado)
- Map simples em memória
- TTL de 60s
- Funções: `getCache(key)`, `setCache(key, data)`, `clearCache()`

**`saldos.js`** (usa cache)
- Armazena resultado do cálculo de saldos
- Invalidado quando: nova movimentação registrada, nova configuração de mínimo

**Outros arquivos** (filiais, insumos, estoque-minimo)
- Cache próprio local (variáveis `cache*`, `cacheTimestamp`)
- TTL 30-60s por arquivo
- Invalidado quando POST/PUT/PATCH é executado

---

## Regras de Negócio Críticas

### CD é filial id "1"
Todo movimento começa ou passa pelo CD. Entrada sempre vai pra CD ou direto pra filial (novo). Transferência é CD → Filial.

### Responsável nunca escolhe filial de destino
No backend, durante POST de entrada:
```js
if (!ehGestor) {
  filial_destino = req.usuario.filial_id; // Sempre a própria
} else if (ehGestor && filial_destino) {
  // Gestor escolhe
} else {
  error("Filial não informada");
}
```

### Requisitante é separado de responsável
- `responsavel_id`: quem operou o sistema (vem do JWT, auditoria)
- `requisitante`: quem pediu o material (texto livre, não é FK)

Isso permite rastrear que "Marcos (pintor)" consumiu 5L de álcool, mas não precisa que Marcos tenha login.

### Estoque negativo não é permitido
Antes de registrar saída, valida: `saldo_atual >= quantidade_saida`. Se não, retorna 400 "Saldo insuficiente".

---

## Decisões de Arquitetura Importantes

### Google Sheets como banco de dados
✅ **Vantagens:** sem custo, fácil auditoria (abre a planilha e vê tudo), sem dependência de infra externa
❌ **Limitações:** rate limit ~100 requisições/minuto, não há suporte a transações, schema fixo

**Mitigation:** cache em memória, agregações no frontend, índices manuais via `parseRows`.

### Duas camadas de cache
- **Cache local por rota** (`cache*` em cada arquivo): rápido, simplista
- **Cache centralizado** (`cache.js`): para dados críticos (saldos)

Hoje está bom pro volume atual. Se crescer 10x, refatorar pra Redis.

### JWT sem refresh token
- Token não expira (fica válido enquanto o servidor está up)
- Logout é feito via localStorage
- Se o servidor recai, usuários perdem sessão automaticamente

Simples demais? Sim. Suficiente? Hoje sim.

### React State para filtros
O Relatório tem dois states de filtro: um pra aba de tabela, outro pra aba de comparativo. Não sincronizam — você pode ter um filtro ativo na tabela e depois ir pro comparativo com filtros diferentes. É confuso, mas proposital: cada aba é uma análise diferente.

---

## Issues Abertas (Backlog)

### #22 — Refatoração: separar lógica dos templates
- Custom hooks: `useInsumos`, `useFiliais`, `useSaldos`
- Estilos compartilhados: move inline pra `estilos.js`
- Sem data, baixa prioridade, zero impacto em features

### #55 — Comparação filial a filial
- Gráfico com múltiplas séries (uma linha por filial)
- Filtro de filial virar multi-select
- Complexidade alta, não faz parte da próxima demo

### #58 — Comparação mês a mês com gráfico de linha
- Usa linha em vez de barra (melhor pra tendência)
- Precisa redesenhar fluxo de dados (dois meses simultâneos)
- Depende de #54 estar bem definida antes

### #57 — Ideias Salesforce
- Brainstorm de integrações futuras (API CRM, pipeline de vendas)
- Sem escopo definido ainda

---

## Como Rodar Localmente

### Setup inicial
```bash
git clone https://github.com/walzuguir/Controle_Insumos_WD.git
cd Controle_Insumos_WD

# Backend
cd backend
npm install
cp .env.example .env  # Preencher com credenciais Google Sheets e JWT_SECRET
npm run dev          # Roda em http://localhost:3001

# Frontend (nova aba)
cd ../frontend
npm install
npm run dev          # Roda em http://localhost:5173
```

### Variáveis de ambiente (`.env` no backend)

GOOGLE_SERVICE_ACCOUNT_EMAIL=seu-service-account@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_SPREADSHEET_ID=1r0BwAk8dfedYpXa_oEgq5V_DrRxSTTRdN6rQE3sDMm8
JWT_SECRET=sua-chave-aleatoria-aqui
PORT=3001

### Testes
```bash
cd backend
npm test  # Roda testes dos cálculos críticos (5 testes, node:test nativo)
```

---

## URLs Importantes

- **Produção Frontend:** `https://controle-insumos-wd.vercel.app`
- **Produção Backend:** `https://controleinsumoswd-production.up.railway.app`
- **GitHub:** `https://github.com/walzuguir/Controle_Insumos_WD`
- **Planilha Mestre:** Google Sheets (ID acima)

---

## Dados de Teste

Dois usuários pré-criados (ver planilha `Usuarios`):
- **Gestor:** wilson@empresa.com / (senha com hash)
- **Responsável de Filial:** responsavel@widmen.com / (senha com hash)

Usar bcrypt pra gerar novos:
```bash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('SENHA', 10).then(h => console.log(h))"
```

---

## Commits Recentes (Milestone 7)

- `#44` Campo "Requisitante" nas movimentações
- `#47` Responsável registra entrada na própria filial
- `#43` Busca e ordenação alfabética nos seletores de insumo
- `#45` Filtro de tipo no gráfico do Relatório
- `#46` Comparativo mensal de consumo por dia
- `#48-#56` Melhorias no comparativo (cache, toggles, mobile, semanas, legenda)

Total: 54 issues fechadas, 13 na última milestone.

---

## Conhecimento Crítico pra Não Esquecer

1. **Sempre derive filial do token, nunca do body.** É a linha que segura a segurança toda.
2. **classificarMovimento(m)** centraliza a regra de "consumo vs transferência". Reutiliza em 3+ lugares.
3. **Cache TTL é 30-60s.** Suficiente pra evitar rate limit, mas ainda "fresco" pra demo.
4. **SeletorInsumo é componente reutilizável.** Tá em 5 telas. Mudança lá impacta tudo.
5. **Relatório tem duas abas independentes.** Filtro de tabela ≠ filtro de comparativo. É confuso mas proposital.
6. **Requisitante é texto livre, não FK de usuário.** Por isso a Karen consegue rastrear "quem dentro da loja pediu".

---

## Próximas Sessões (Sugestão)

1. **Correções de bug** (em ordem de impacto):
   - `CadastroGestor.jsx`: restaurar `(error)` nos catches (regression)
   - `ComparativoMensal.jsx`: remover `console.log` de debug
   - `EntradaInsumos.jsx`: adicionar `disabled={loading}` no botão
   - `estoqueMinimo.js`: remover `invalidarCacheSaldos()` enganosa, usar `invalidarCache()` real

2. **#22 Refatoração**: depois que bugs acima estiverem fechados, tentar extrair custom hooks

3. **#55 ou #58**: depois da próxima apresentação à Karen/Evandro

---

**Última atualização:** Agosto 2026  
**Desenvolvedor:** Wilson Alzuguir  
**Pai/Mentor Técnico:** Dev Sênior Salesforce (revisões arquiteturais)