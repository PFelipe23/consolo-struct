# ConsoloStruct 0.6 - navegação e desempenho

A interface desktop foi preservada. Esta entrega concentra as mudanças na navegação, reaproveitamento de conteúdo e identidade do aplicativo. O motor estrutural continua na versão 0.3.0 e não teve suas equações alteradas.

## Detalhamento

- Pan e zoom usam uma câmera em memória e atualizam o grupo SVG por `requestAnimationFrame`, no máximo uma vez por quadro. Os formulários e o navegador não são renderizados novamente a cada movimento do mouse.
- As medidas do viewport são reaproveitadas durante o gesto. A atualização da câmera não força uma leitura de layout após cada escrita do transform.
- A preparação dos detalhes roda em um worker local, com alternativa progressiva se o ambiente não permitir criá-lo. Não há serviço externo.
- As peças sem alterações reaproveitam cálculo, formas, desenho e marcação SVG. O cache por peça é limitado a 200 entradas; o cache de conjuntos recentes tem limite de quatro conjuntos e orçamento estimado de 32 MiB.
- No modo Todos, a prévia monta os grupos que atravessam a região visível. Em conjuntos grandes vistos de muito longe, mostra uma visão geral identificada. DXF, PDF, SVG e CSV continuam incluindo todo o escopo escolhido, independentemente da região visível.
- A aba permanece montada ao alternar para outro documento aberto, preservando a câmera. Fechar a aba descarta a vista; seus parâmetros continuam no projeto.
- Exportar aguarda a revisão atual dos dados. Um resultado de preparação antigo não libera a exportação de entradas mais recentes.

## Memória e propriedades

O envelope do cálculo aparece normalmente. A memória detalhada de uma combinação e os textos internos de cada verificação são montados ao expandir sua seção. O relatório é reaproveitado nas trocas entre documentos, e componentes pesados deixam de acompanhar atualizações de estado que não lhes dizem respeito.

Os formatadores numéricos são reutilizados. Antes, cada número formatado criava uma nova instância de `Intl.NumberFormat`. Os rascunhos automáticos são agrupados por 250 ms, com gravação ao sair; o comando Salvar arquivo continua imediato.

## Comparação indicativa de rotinas

Medições em Node 24.22.1 no mesmo ambiente de desenvolvimento, usando o caso Curto-ELU e mediana de cinco execuções para os doze detalhes:

| Rotina                                       |            0.5 |      0.6 |
| -------------------------------------------- | -------------: | -------: |
| Formatar 10 mil números                      |      392,58 ms | 74,97 ms |
| Construir 12 detalhes, sem cache             |      118,86 ms | 32,78 ms |
| Consultar novamente os 12 detalhes com cache | Não disponível |  4,21 ms |

Os valores variam com carga e máquina. Eles medem essas rotinas, não FPS nem latência do aplicativo Tauri. Não são uma previsão do desempenho na máquina do usuário. Para repetir a medição da versão atual:

```bash
npm ci
node scripts/benchmark.mjs
```

Os testes de interface verificam que uma sequência de trinta movimentos de pan fica abaixo de cinco commits React, que a câmera é preservada na troca de abas e que combinações recolhidas não montam suas tabelas. Há um teste para a alternativa sem worker, além das exportações.

## Usar a navegação

1. Clique na seta de cada consolo para expandir ou recolher sua árvore. É possível manter vários abertos; a seleção é independente dessa expansão.
2. Clique em ×n para editar a quantidade de peças iguais. Enter confirma; Esc cancela. O quadro de aço usa a quantidade confirmada. A coluna Quantidade da lista Peças também é editável.
3. Use o × de uma aba para fechá-la. As ferramentas e os itens do navegador reabrem a vista. Fechar todas as abas deixa o projeto carregado.
4. Novo projeto abre Dados do projeto. Confirmar cria o projeto com nome, cliente e responsável; cancelar preserva o projeto que estava aberto.

## Identidade e compatibilidade

ConsoloStruct integra o OpenStruct. O Atlas fornecido é o ícone do aplicativo, e o símbolo OpenStruct é extraído da identidade visual fornecida. A memória de cálculo e as exportações identificam o sistema e o ecossistema. A paleta e a estrutura gerais dos formulários foram mantidas.

Arquivos `.lume.json` e rascunhos anteriores continuam reconhecidos. Os novos arquivos editáveis usam `.consolo.json`; o esquema permanece sendo o 3. O identificador interno do aplicativo Tauri foi conservado para permitir acesso ao armazenamento anterior.

Para avaliar o executável de produção no Ubuntu:

```bash
npm ci
npm run desktop:build -- --no-bundle
./src-tauri/target/release/consolostruct
```

O pacote inclui código-fonte e `dist/` pronto para a prévia local. A execução nativa no WebKitGTK, a comparação de FPS no computador do usuário e a criação de instaladores nativos não foram realizadas neste ambiente.
