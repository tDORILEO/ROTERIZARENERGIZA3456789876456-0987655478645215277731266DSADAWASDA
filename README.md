# Roteirizador de Leitura — GitHub Pages

Aplicação estática para montar roteiros de leitura a partir de TXT enviados pelo próprio usuário.

## Uso

1. Abra o site publicado.
2. Clique **Importar TXT** e selecione um ou mais TXT com colunas separadas por `;`.
3. Escolha o polo, marque os livros, crie um planejamento e clique nas UCs do mapa.
4. Informe os dados da rota, clique **Salvar agora** e, ao final, **Exportar Excel**.

Os arquivos e as rotas ficam somente na memória do navegador. Ao atualizar ou fechar a página, a sessão é descartada.

## Teste local

Não abra `index.html` diretamente pelo Explorador de Arquivos: navegadores bloqueiam módulos JavaScript em URLs `file://`. Execute `TESTAR_LOCAL.bat` e abra `http://localhost:8080`. Use **Importar TXT**; o indicador no topo mostra a quantidade de UCs carregadas.

Para exportar, selecione uma ou mais UCs no mapa, preencha os dados da rota, clique **Salvar agora** e então **Exportar Excel**. O navegador baixará `roteirizacao.xlsx`.

## Formato do TXT

São aceitas as colunas `POLO`, `UC` (ou `CDC`), `LIVRO`, `ROTA`, `LOCALIDADE`, `NOME_LOCALIDADE`, `LATITUDE` e `LONGITUDE`. Veja [examples/EXEMPLO_TEXTO.txt](examples/EXEMPLO_TEXTO.txt).

## Publicar no GitHub Pages

Envie todo o conteúdo desta pasta para um repositório GitHub. Em **Settings → Pages**, selecione **Deploy from a branch**, a branch principal e a pasta `/(root)`. O arquivo `.nojekyll` permite publicar os módulos JavaScript diretamente.

## Desenvolvimento

Com Node.js instalado, execute `node --test tests/*.test.mjs`.
