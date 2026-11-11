# Dashboard GitHub Pages — Migração de Recursos Operacionais

## Intenção

Transformar a versão estática em uma experiência visual e operacional próxima do dashboard FastAPI original, mantendo o processamento local do TXT e o descarte da sessão ao recarregar a página.

## Abordagem escolhida

Reaproveitar a estrutura visual, estilos e interações do dashboard original. Substituir as chamadas `/api/...` por uma camada JavaScript em memória que fornece os mesmos dados para a interface durante a sessão atual.

## Recursos incluídos

- Seleção de polo e múltiplos livros.
- Estatísticas de UCs totais, com GPS, sem GPS, atribuídas e pendentes.
- Camadas de mapa para livros, rotas antigas, rotas planejadas, pontos pendentes e pontos planejados.
- Busca de UC, filtros de camadas, visualização de rotas antigas e ajuste da área visível.
- Criação, edição, exclusão e ordenação manual de rotas novas.
- Desfazer, limpar, inverter, reordenar e sugerir próxima UC por distância geográfica.
- Sugestão de sequência por vizinho mais próximo e melhoria 2-opt executadas no navegador.
- Polígonos de demarcação: desenhar, editar, renomear, excluir, localizar UCs internas e adicioná-las à rota.
- Tratamento de conflito quando uma UC já pertence a outra rota na mesma sessão.
- Comparação de carga por rota, com distância geográfica, tempos de leitura, deslocamento e margem configurável.
- Planejamentos, versões e restauração durante a aba aberta.
- Exportação XLSX com abas de roteirização, resumo, UCs sem coordenada, configuração, demarcações e histórico temporário.

## Limites preservados

- O arquivo TXT, planejamentos, versões e rotas são descartados ao atualizar ou fechar a página.
- Não haverá login, SQLite, colaboração, backup central ou acesso à pasta corporativa.
- Google Routes e previsão do tempo ficam fora desta versão por dependerem de serviços externos e chaves de API.
- O mapa utiliza fontes públicas e requer internet.

## Estrutura técnica

- `index.html` e `assets/styles.css`: adaptação da interface original para uma página estática.
- `src/session-api.js`: adaptador local que fornece polos, livros, workspace, planos, rotas, versões, demarcações e métricas.
- `src/geometry.js` e `src/planner.js`: GeoJSON, seleção espacial, distância, sequência e balanceamento.
- `src/app.js`: interface operacional reutilizada e conectada ao adaptador local.
- `src/export.js`: planilha com as mesmas abas principais da exportação original.
- `tests/`: parser, sessão, geometria, planejador, exportação e adaptador local.

## Critérios de aceite

- Depois do upload, o usuário encontra os comandos e painéis principais presentes no dashboard original.
- A sessão suporta múltiplos livros, demarcações, rotas e versões sem acessar servidor.
- Todas as alterações ficam refletidas nas camadas do mapa e no Excel baixado.
- UCs sem coordenada continuam disponíveis para atribuição e aparecem na exportação adequada.
