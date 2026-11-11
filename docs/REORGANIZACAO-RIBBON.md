# Reorganização do ribbon — issue #9

Comparação com a `master` em `54abc400ae43a5a3bdf025df85c327dde1ad5086`. A mudança organiza ferramentas; não altera handlers de cálculo, persistência, unidades, arquivos ou exportadores.

## Base e ordem de integração

No início desta contribuição, o fork e o original estavam no mesmo commit. A issue #7 estava aberta, a central Configurações ainda não estava na `master` e o PR #8 permanecia aberto. Esta branch parte da `master`, sem incorporar essas contribuições.

**Exceção prevista pela #9:** Tema escuro permanece funcional em Exibir e no acesso rápido. Só deve sair de Exibir quando existir acesso funcional em Configurações. Na integração da #7, preservar seus grupos e itens futuros, compartilhar as identidades/estados de cotas, armaduras, cargas e grade e manter critérios vinculados à peça. Não restaurar os grupos removidos de Início/Modelo/Documentação para resolver conflitos.

## Contagens e repetições intencionais

São posições declaradas no ribbon, somando as abas, não botões simultaneamente visíveis nem implementações distintas.

| Aba          |  Antes | Depois | Responsabilidade                                                     |
| ------------ | -----: | -----: | -------------------------------------------------------------------- |
| Arquivo      |      7 |      5 | Gerenciar projeto e abrir Exportar                                   |
| Início       |     19 |      8 | Preparação, cálculo e documentos do fluxo frequente                  |
| Modelo       |     12 |     11 | Edição completa e organização da peça                                |
| Exibir       |     16 |     16 | Vistas, navegação do modelo, visibilidade, painéis e tema provisório |
| Documentação |      9 |      7 | Abrir documentos e exportar suas saídas diretas                      |
| **Total**    | **63** | **47** | **39 identidades preservadas**                                       |

Há oito repetições intencionais: Novo consolo, Geometria, Ações da peça, Calcular e Sugerir armaduras em Início/Modelo; Memória e Detalhamento em Início/Documentação; Exportar em Início/Arquivo. Elas evitam trocar de aba no fluxo frequente. Os demais comandos têm uma localização no ribbon. Acesso rápido, inspetor, árvore, documentos e controles junto às vistas continuam complementares.

## Inventário por identidade e efeito

Na coluna Antes, I = Início, M = Modelo, E = Exibir, A = Arquivo e D = Documentação. A localização principal nova é explícita; a última coluna registra atalhos mantidos e a razão da repetição quando existe.

| Ação         | Significado                                         | Antes   | Principal depois | Atalhos mantidos / justificativa                                                 |
| ------------ | --------------------------------------------------- | ------- | ---------------- | -------------------------------------------------------------------------------- |
| `new`        | Criar projeto após confirmação dos dados            | A       | Arquivo          | Cancelar preserva o projeto anterior                                             |
| `open`       | Abrir projeto                                       | A       | Arquivo          | Acesso rápido; leitura nativa/web existente                                      |
| `save`       | Salvar projeto reabrível `.consolo.json`            | A, D    | Arquivo          | Acesso rápido e Ctrl/Cmd+S; nome único Salvar projeto                            |
| `project`    | Editar dados do projeto                             | A, D    | Arquivo          | Título do projeto e raiz da árvore                                               |
| `export`     | Escolher saída no diálogo existente                 | A, I    | Arquivo          | Início evita troca de aba; inclui cálculo auditável                              |
| `add`        | Adicionar consolo                                   | I, M    | Modelo           | Início e botão da árvore; preserva limite de 200 tipos                           |
| `duplicate`  | Copiar a peça selecionada                           | I, M    | Modelo           | Deixa de ocupar o fluxo curto de Início                                          |
| `rename`     | Editar identificação, descrição e quantidade        | I, M    | Modelo           | Nome Identificação da peça; quantidade também na árvore/lista                    |
| `delete`     | Excluir peça após confirmação                       | I       | Modelo           | Também no diálogo de identificação; última peça protegida                        |
| `geometry`   | Editar dimensões                                    | I, M    | Modelo           | Início, inspetor e cotas editáveis                                               |
| `loads`      | Editar forças e coeficientes                        | I, M    | Modelo           | Início e inspetor; nome Ações da peça                                            |
| `materials`  | Editar concreto e aço                               | I, M    | Modelo           | Inspetor; não duplica todo o grupo em Início                                     |
| `rebar`      | Editar quantidades e bitolas                        | I, M    | Modelo           | Inspetor; Editar armaduras não é Mostrar armaduras                               |
| `design`     | Abrir critérios da peça selecionada                 | I, M    | Modelo           | Aba Cálculo do inspetor; não é preferência global                                |
| `calculate`  | Retornar ao modelo e calcular                       | I, M    | Modelo           | Início; Calcular revisão atual na memória conserva o relatório                   |
| `autodesign` | Calcular e adotar sugestão de armaduras             | I, M    | Modelo           | Início; pode modificar a peça e participa do histórico                           |
| `elevation`  | Abrir/reabrir elevação                              | I, E    | Exibir           | Árvore e faixa de documentos                                                     |
| `section`    | Abrir/reabrir seção                                 | I, E    | Exibir           | Árvore e faixa de documentos                                                     |
| `three`      | Abrir/reabrir vista 3D                              | I, E    | Exibir           | Árvore e faixa de documentos                                                     |
| `select`     | Retornar ao modelo e selecionar                     | I, M, E | Exibir           | Seleção/edição local em 2D e órbita em 3D                                        |
| `pan`        | Retornar ao modelo e mover a vista                  | I, M, E | Exibir           | Controles locais, botão central e Espaço + arrastar                              |
| `fit`        | Retornar ao modelo e enquadrar                      | I, E    | Exibir           | Botões/F de cada vista; comando geral não enquadra detalhes                      |
| `zoomIn`     | Retornar ao modelo e aumentar zoom                  | E       | Exibir           | Controles e roda em cada vista                                                   |
| `zoomOut`    | Retornar ao modelo e diminuir zoom                  | E       | Exibir           | Controles e roda em cada vista                                                   |
| `dimensions` | Mostrar/ocultar cotas do modelo                     | E       | Exibir           | Mesmo estado existente; não altera cotas de detalhamento                         |
| `steel`      | Mostrar/ocultar armaduras do modelo                 | E       | Exibir           | Mesmo estado existente; não edita bitolas                                        |
| `forces`     | Mostrar/ocultar cargas do modelo                    | E       | Exibir           | Mesmo estado existente; não edita forças                                         |
| `grid`       | Mostrar/ocultar grade do modelo                     | E       | Exibir           | Mesmo estado existente; sem nova persistência                                    |
| `browser`    | Abrir/fechar árvore                                 | E       | Exibir           | Fechar no painel e reabrir junto aos documentos                                  |
| `properties` | Abrir/fechar propriedades                           | E       | Exibir           | Fechar no painel e reabrir junto aos documentos; comandos de edição também abrem |
| `checks`     | Retornar ao modelo e expandir/recolher verificações | E       | Exibir           | Cabeçalho local das verificações                                                 |
| `theme`      | Alternar tema claro/escuro                          | E       | Exibir           | Acesso rápido; exceção até integração funcional da #7                            |
| `report`     | Abrir/reabrir memória                               | D       | Documentação     | Início, árvore e documentos; não exporta PDF                                     |
| `details`    | Abrir/reabrir desenhos e quadro de aço              | I, D    | Documentação     | Início, árvore, documentos e diálogo Exportar; nome único Detalhamento           |
| `pieces`     | Abrir/reabrir lista de peças                        | D       | Documentação     | Árvore e documentos                                                              |
| `pdf`        | Exportar memória PDF diretamente                    | A, D    | Documentação     | Baixar PDF na memória e diálogo Exportar                                         |
| `dxf`        | Exportar contornos DXF em mm diretamente            | D       | Documentação     | Diálogo Exportar; não substitui Detalhes DXF em cm                               |
| `svg`        | Exportar contorno SVG diretamente                   | D       | Documentação     | Diálogo Exportar; não substitui Detalhes SVG                                     |
| `csv`        | Exportar quantidades do projeto diretamente         | A, D    | Documentação     | Diálogo Exportar; não substitui Quadro CSV                                       |

O diálogo Exportar conserva **Projeto editável**, **Cálculo auditável**, **Memória de cálculo**, **Geometria vetorial**, **Geometria para CAD** e **Lista de quantidades**, além do acesso ao Detalhamento e do aviso sobre contornos. A descrição passa a mostrar o formato real `.consolo.json`; o arquivo gerado não muda. Os botões locais Detalhes DXF/SVG/PDF e Quadro CSV conservam os exportadores, a peça e o escopo uma/todas as peças.

## Comparação do fluxo e da interface

Foi exercitado o mesmo cenário nos dois checkouts: Novo consolo → Geometria (L = 35 cm) → Ações (V = 150 kN) → Calcular → Memória → Detalhamento. São **seis comandos e zero trocas de aba superior** antes e depois. Antes, Memória era aberta pela faixa de documentos; depois também está diretamente em Início. Os valores do cálculo auditável obtidos nesse cenário são idênticos.

Início passa a caber em 960 px sem rolagem horizontal do ribbon. Em 390 px, a faixa de comandos usa rolagem horizontal, reduzida de 1167 px para 716 px de conteúdo. Não se reduziram ícones nem fontes. A altura do ribbon e a área útil do desenho permanecem iguais às do baseline nas quatro resoluções.

Capturas comparáveis de Início, com o mesmo projeto de exemplo e a mesma janela:

| Janela / tema    | Antes                                              | Depois                                               |
| ---------------- | -------------------------------------------------- | ---------------------------------------------------- |
| 1366×768, claro  | [Antes](images/ribbon/inicio-antes-claro.png)      | [Depois](images/ribbon/inicio-depois-claro.png)      |
| 1366×768, escuro | [Antes](images/ribbon/inicio-antes-escuro.png)     | [Depois](images/ribbon/inicio-depois-escuro.png)     |
| 390×844, claro   | [Antes](images/ribbon/inicio-390-antes-claro.png)  | [Depois](images/ribbon/inicio-390-depois-claro.png)  |
| 390×844, escuro  | [Antes](images/ribbon/inicio-390-antes-escuro.png) | [Depois](images/ribbon/inicio-390-depois-escuro.png) |

## Validação

O baseline passou em `npm run format:check`, `npm run check` (110 testes), `npm run build` e `npm run test:e2e` (26 testes). Os avisos do build sobre anotações do Zod, importação estática/dinâmica de `detailing/job` e chunks grandes já existiam.

A cobertura nova também revelou que o fechamento de diálogos não devolvia o foco ao comando de origem. Isso foi confirmado no build do baseline (`document.activeElement` voltava a `BODY` após Escape) e corrigido com o retorno ao elemento que abriu a janela.

A cobertura acrescentada verifica o catálogo e suas repetições, o fluxo principal, estados de edição/visibilidade, navegação por teclado, campos confirmados e pendentes, histórico, seleção, retenção dos documentos/câmeras, exclusão e cancelamento, salvar/reabrir e exportações gerais/especializadas. A matriz de layout cobre os dois temas em 1920×1080, 1366×768, 960×640 e 390×844.

| Comando                | Baseline                        | Resultado final                |
| ---------------------- | ------------------------------- | ------------------------------ |
| `npm run format:check` | Aprovado                        | Aprovado                       |
| `npm run check`        | 110 testes aprovados            | 114 testes aprovados           |
| `npm run build`        | Aprovado, com os avisos citados | Aprovado, com os mesmos avisos |
| `npm run test:e2e`     | 26 testes aprovados             | 42 testes aprovados            |

Nenhuma falha pendente nas verificações finais. A validação é web/Chromium; não foi executado Tauri nativo, pois este ambiente não dispõe do toolchain Rust. Não houve teste com usuários nem medição de tempo de execução de tarefas; a comparação é de comandos/passos, dimensões e comportamento observado.
