# Dashboard GitHub Pages Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aproximar a versão GitHub Pages do dashboard operacional original, usando exclusivamente dados e processamento da sessão local.

**Architecture:** O HTML e os estilos do dashboard original formam a base visual. Um adaptador `session-api.js` mantém planos, rotas, versões e demarcações em memória; módulos puros produzem geometrias, sequência, métricas e dados de exportação. A interface existente consome esse adaptador em vez de endpoints FastAPI.

**Tech Stack:** HTML, CSS, JavaScript ES modules, MapLibre GL JS, Mapbox GL Draw, Turf.js, SheetJS e Node.js test runner.

**Spec:** `docs/superpowers/specs/2026-11-11-dashboard-github-pages-parity-design.md`

## Global Constraints

- Não usar backend, banco, autenticação ou dados corporativos embutidos.
- Descartar toda a sessão ao atualizar a página.
- Preservar o suporte a TXT grandes e UCs sem coordenadas.
- Manter serviços que exigem chave de API fora do fluxo.

## Review Focus

- Importação de mais de 200 mil UCs deve continuar responsiva e sem exceder limites de argumentos.
- UC sem GPS deve poder ser atribuída, mas não virar ponto no mapa.
- Conflito de rota não pode duplicar uma UC entre rotas.
- Restauração de versão deve recriar rotas e demarcações em memória.
- Exportação deve refletir ordem, dados de rota e abas de apoio da sessão atual.

---

### Task 1: Base visual e dependências do dashboard original

**Files:**
- Modify: `index.html`, `assets/styles.css`, `src/app.js`
- Create: `tests/interface.test.mjs`

**Interfaces:** Produz todos os painéis e identificadores da interface original, com ações ligadas a módulos locais.

- [ ] Escrever teste de estrutura para os painéis de livros, camadas, sequência, demarcações, balanceamento e histórico.
- [ ] Confirmar falha antes da interface ser portada.
- [ ] Portar HTML, estilos e dependências visuais do dashboard original, removendo referências de backend.
- [ ] Executar testes de interface e confirmar sucesso.

### Task 2: Workspace e camadas locais

**Files:**
- Create: `src/session-api.js`, `src/geometry.js`
- Create: `tests/session-api.test.mjs`, `tests/geometry.test.mjs`
- Modify: `src/model.js`, `src/map.js`

**Interfaces:** `LocalSession` fornece polos, livros, workspace e camadas GeoJSON; geometria fornece áreas por livro/rota e seleção de pontos.

- [ ] Escrever testes falhos para múltiplos livros, UCs sem GPS e GeoJSON de área.
- [ ] Implementar workspace local e camadas de livro/rota.
- [ ] Executar os testes focados e a suíte completa.

### Task 3: Planejamentos, rotas, sequência e conflitos

**Files:**
- Create: `src/planner.js`
- Modify: `src/session-api.js`, `src/app.js`, `src/map.js`
- Create: `tests/planner.test.mjs`

**Interfaces:** Planejamentos em memória incluem rotas ordenadas, atribuições exclusivas e sugestões geográficas.

- [ ] Escrever testes falhos para vizinho mais próximo, 2-opt limitado, rota manual e conflito de UC.
- [ ] Implementar planejador e operações de rota.
- [ ] Conectar sequência, desfazer, inverter, reordenar e sugestões à interface.
- [ ] Executar a suíte completa.

### Task 4: Demarcações e seleção espacial

**Files:**
- Modify: `src/geometry.js`, `src/session-api.js`, `src/map.js`, `src/app.js`
- Create: `tests/demarcations.test.mjs`

**Interfaces:** Demarcações possuem identificador, nome, cor, GeoJSON e conjunto de UCs internas.

- [ ] Escrever testes falhos de inclusão de ponto em polígono e restauração de demarcação.
- [ ] Implementar criação, edição, análise e exclusão de demarcações em memória.
- [ ] Portar painel de seleção por polígono e tratamento de conflito.
- [ ] Executar a suíte completa.

### Task 5: Métricas, versões e exportação completa

**Files:**
- Modify: `src/planner.js`, `src/session-api.js`, `src/export.js`, `src/app.js`
- Create: `tests/versions.test.mjs`, `tests/export-full.test.mjs`

**Interfaces:** Métricas retornam distância, tempos e desbalanceamento; versões representam cópia restaurável do planejamento; exportação retorna seis abas.

- [ ] Escrever testes falhos para balanceamento, restauração e abas de exportação.
- [ ] Implementar métricas e histórico temporário.
- [ ] Gerar XLSX com roteirização, resumo, sem coordenada, configuração, demarcações e histórico.
- [ ] Executar a suíte completa.

### Task 6: Fluxo de uso e publicação

**Files:**
- Modify: `README.md`, `TESTAR_LOCAL.bat`, `server.mjs`
- Create: `examples/EXEMPLO_MULTILIVRO.txt`

**Interfaces:** Usuário consegue testar pelo HTTP local e publicar no GitHub Pages sem ajustes de servidor.

- [ ] Escrever teste para o exemplo multillivro e documentação dos limites de sessão.
- [ ] Documentar importação, recursos disponíveis e publicação.
- [ ] Executar testes, validação sintática e inspeção da página servida localmente.

## Self-review

- O plano cobre cada recurso incluído no escopo aprovado e mantém os limites de uma aplicação estática.
- As interfaces de tarefas posteriores dependem dos módulos locais definidos anteriormente.
- Serviços de clima e Google Routes permanecem fora do plano por exigirem chaves e backend.
