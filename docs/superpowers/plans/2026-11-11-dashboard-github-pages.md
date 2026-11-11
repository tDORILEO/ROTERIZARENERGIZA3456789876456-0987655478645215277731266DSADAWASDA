# Dashboard GitHub Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um dashboard estático que importa TXT localmente, monta rotas de leitura no mapa e exporta o resultado para XLSX.

**Architecture:** HTML/CSS/JavaScript sem backend. O parser e o modelo mantêm todos os dados em memória; `app.js` liga a interface aos módulos de importação, mapa e exportação. Bibliotecas de mapa e XLSX são carregadas de CDNs públicas.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Node.js test runner, MapLibre GL JS e SheetJS.

**Spec:** `docs/superpowers/specs/2026-11-11-dashboard-github-pages-design.md`

## Global Constraints

- Publicar diretamente no GitHub Pages, sem Python, banco ou API própria.
- Não persistir TXT, rotas ou dados de usuário após atualizar a página.
- Não incluir login, chaves de API, arquivos corporativos ou dados de produção.
- Aceitar TXT `;` em UTF-8 e Windows-1252.

## Review Focus

- TXT vazio ou com cabeçalhos ausentes deve produzir mensagem clara e não abrir o painel.
- Coordenadas com vírgula decimal devem criar pontos válidos.
- UC repetida entre arquivos deve aparecer uma única vez.
- Tentativa de atribuir a mesma UC a duas rotas deve ser recusada.
- Exportação sem rota deve avisar o usuário sem gerar arquivo incompleto.

---

### Task 1: Estrutura estática e publicação

**Files:**
- Create: `index.html`
- Create: `assets/styles.css`
- Create: `.nojekyll`
- Create: `package.json`

**Interfaces:**
- Produces: página HTML com pontos de montagem `uploadScreen`, `workspace` e `toast`; comando `npm test`.

- [ ] Criar o teste que verifica a existência dos módulos estáticos e do comando `npm test`.
- [ ] Executar `npm test` e confirmar falha por arquivos ausentes.
- [ ] Criar a casca responsiva com tela de importação, espaço de trabalho oculto e referências aos módulos JavaScript.
- [ ] Executar `npm test` e confirmar sucesso.

### Task 2: Parser de TXT

**Files:**
- Create: `src/parser.js`
- Create: `tests/parser.test.js`

**Interfaces:**
- Produces: `parseTxt(text, sourceName) -> {rows, rejected, columns}` e `decodeFile(buffer) -> string`.
- Consumes: arquivos locais via `File.arrayBuffer()` em `src/app.js`.

- [ ] Escrever testes falhos para separador `;`, vírgula decimal, fallback `CDC` e rejeição de cabeçalho inválido.
- [ ] Executar `npm test -- tests/parser.test.js` e confirmar a falha esperada pela ausência do módulo.
- [ ] Implementar decodificação UTF-8/Windows-1252 e normalização dos campos de entrada.
- [ ] Executar `npm test -- tests/parser.test.js` e confirmar sucesso.

### Task 3: Modelo de sessão e roteirização

**Files:**
- Create: `src/model.js`
- Create: `tests/model.test.js`

**Interfaces:**
- Produces: `createSession(rows)`, `getBooks(session, polo)`, `assignRoute(session, route, ucIds)` e `buildExportRows(session)`.
- Consumes: linhas normalizadas de `parseTxt` e ações da interface.

- [ ] Escrever testes falhos para deduplicação por UC, filtros por polo/livro, atribuição exclusiva e resumo das rotas.
- [ ] Executar `npm test -- tests/model.test.js` e confirmar falha pela ausência do módulo.
- [ ] Implementar estado em memória e regras de atribuição.
- [ ] Executar `npm test -- tests/model.test.js` e confirmar sucesso.

### Task 4: Mapa e interface operacional

**Files:**
- Create: `src/map.js`
- Create: `src/app.js`
- Modify: `index.html`
- Modify: `assets/styles.css`

**Interfaces:**
- Consumes: sessão criada por `createSession` e UCs filtradas por polo/livro.
- Produces: seleção de UCs no mapa, formulário de rota e estado de rotas visível para exportação.

- [ ] Escrever teste falho para a função pura `selectablePoints(rows)` que remove UCs sem coordenada.
- [ ] Executar o teste e confirmar falha pela ausência do módulo.
- [ ] Implementar camadas MapLibre, filtros, seleção por clique e criação/edição de rota em memória.
- [ ] Executar a suíte e confirmar sucesso.

### Task 5: Exportação XLSX e tratamento de sessão

**Files:**
- Create: `src/export.js`
- Create: `tests/export.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Produces: `createWorkbookData(session) -> {roteirizacao, resumo}` e download pelo navegador.
- Consumes: `buildExportRows(session)`.

- [ ] Escrever teste falho que confere linhas de roteirização e agregação no resumo.
- [ ] Executar `npm test -- tests/export.test.js` e confirmar falha pela ausência do módulo.
- [ ] Implementar os dados das abas e acionar download SheetJS somente quando houver rotas.
- [ ] Executar `npm test` e confirmar sucesso.

### Task 6: Publicação e documentação

**Files:**
- Create: `README.md`
- Create: `examples/EXEMPLO_TEXTO.txt`
- Modify: `.gitignore`

**Interfaces:**
- Produces: instruções para enviar ao GitHub e habilitar Pages pela raiz da branch principal.

- [ ] Criar teste de presença do arquivo de exemplo e do aviso de não persistência no README.
- [ ] Executar a suíte e confirmar falha pelos arquivos ausentes.
- [ ] Documentar uso, formato esperado, limites, publicação GitHub Pages e dados descartados ao atualizar.
- [ ] Executar `npm test` e confirmar sucesso.

## Self-review

- O plano cobre importação, mapa, roteirização, exportação, ausência de persistência e publicação estática.
- O parser e o modelo possuem testes automatizados para os cinco riscos apontados em Review Focus.
- A integração visual será confirmada em navegador após os testes de módulos puros.
