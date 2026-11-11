# Dashboard de Roteirização para GitHub Pages — Design

## Objetivo

Disponibilizar uma versão estática do dashboard de roteirização em GitHub Pages. Cada usuário envia os próprios TXT, planeja as rotas no mapa e baixa o resultado em Excel, sem login, servidor, banco de dados ou gravação de dados entre sessões.

## Experiência do usuário

1. Ao abrir o site, o usuário vê uma tela de importação e seleciona um ou mais arquivos TXT separados por `;`, no mesmo formato usado hoje.
2. O site valida os cabeçalhos e apresenta a quantidade de UCs, polos e livros encontrados.
3. Após importar, o usuário entra no painel operacional: escolhe polo e livro, vê as UCs no mapa e cria rotas clicando nos pontos.
4. As rotas, demarcações e sequência existem somente na memória da aba aberta.
5. O usuário exporta a roteirização para XLSX. Fechar ou atualizar a página descarta a sessão.

## Arquitetura escolhida

Aplicação HTML, CSS e JavaScript puro publicada como arquivos estáticos no GitHub Pages. O navegador interpreta os TXT, mantém o estado da sessão e gera o XLSX; nenhuma informação é enviada para um servidor.

MapLibre GL JS renderiza o mapa com camadas públicas. SheetJS gera o arquivo Excel no navegador. Dependências são carregadas por CDN, sem etapa de build.

## Dados e regras

- O importador aceita os campos `POLO`, `UC`, `LIVRO`, `ROTA`, `LOCALIDADE`, `NOME_LOCALIDADE`, `LATITUDE` e `LONGITUDE`; `CDC` pode substituir `UC`.
- Arquivos com UTF-8 ou Windows-1252 são aceitos.
- Registros sem UC ou coordenadas válidas são reportados e não entram no mapa.
- Uma UC só pode pertencer a uma rota nova por sessão.
- Cada rota informa leiturista, livro novo, rota nova e modo de deslocamento.
- A exportação inclui uma aba de roteirização e outra de resumo.

## Limites intencionais

- Não haverá login: a aplicação não contém dados corporativos nem salva dados do usuário.
- Não haverá banco, colaboração entre usuários, histórico, backup ou recuperação após atualizar a página.
- Google Routes, previsão do tempo e qualquer chave de API ficam fora da primeira versão. A sequência sugerida usará distância geográfica local.
- O mapa depende de conexão com a internet para carregar suas imagens.

## Estrutura proposta

- `index.html`: tela de importação e painel de roteirização.
- `assets/styles.css`: identidade visual e layout responsivo.
- `src/parser.js`: leitura e validação dos TXT.
- `src/model.js`: estado em memória e regras de atribuição de UCs.
- `src/map.js`: camadas e interação do mapa.
- `src/export.js`: geração do XLSX.
- `src/app.js`: fluxo de telas e eventos da interface.
- `tests/`: testes de parser e modelo executados com Node.js.

## Critérios de aceite

- A página pode ser publicada diretamente no GitHub Pages, sem Python ou servidor.
- Um TXT válido habilita o painel e mostra suas UCs no mapa.
- O usuário consegue criar uma rota com UCs selecionadas e impedir duplicidade de atribuição.
- O XLSX baixado contém as alterações da sessão.
- Recarregar a página remove os dados importados.
