# Validação — classes de aço (issue #3)

Contribuição para [a issue #3](https://github.com/ricardocorsini/consolo-struct/issues/3). Base: `2720f58e0d0a6fdf28cae992bbe6f0d2acc01a42`, `master` do original, já incluindo a integração da issue #2. O fork foi atualizado antes da implementação. Branch: `feat/steel-classes`.

## Alteração

O campo livre de resistência do tirante foi substituído pelo seletor **Modelo > Materiais > Classe de aço do tirante**, com CA-25 · 250 MPa, CA-50 · 500 MPa e CA-60 · 600 MPa. O módulo `src/domain/steel.ts` centraliza o mapa nos dois sentidos, η1, fatores de pino, exigência de gancho, restrições de dobramento e rótulos.

η1 permanece **1,00 / 2,25 / 1,00**, respectivamente. CA-60 está explicitamente **pendente de confirmação pelo responsável técnico quanto à superfície do fio/barra**, no código, propriedades, memória, PDF e critérios de cálculo. Esta contribuição preserva a decisão atual conforme a issue, sem atribuir novo valor normativo.

Projetos legados com fyk = 420 MPa abrem com **Personalizado (420 MPa), não suportado**, mantêm o número no salvamento e continuam `unsupported` com a mesma mensagem. A classe só muda por escolha explícita; a edição participa do histórico e afeta somente a peça selecionada. Não há conversão por arredondamento ou por faixa. O esquema continua numérico e sua versão permanece 4. O aço transversal continua restrito a 500/600 MPa, com os mesmos rótulos de classe.

Relatório, PDF, desenhos SVG/DXF e CSV de detalhamento usam o módulo para os rótulos. Um aço desconhecido não vira uma classe inventada, como CA-42. A prévia geométrica de mandris legados preserva o cálculo histórico, sem atribuir classe ao material nem habilitar seu dimensionamento. As verificações de cálculo e as pendências existentes do detalhamento continuam ativas.

## Antes e depois

Caso fixo reproduzível: `shortFixture()` de `tests/fixtures.ts`, com fck = 30 MPa, bitola do tirante = 20 mm, aderência `poor`, γc = 1,40 e γs = 1,15. Demais entradas da fixture inalteradas; mm, N e MPa, sem arredondamento intermediário.

Os números abaixo foram capturados antes de editar o motor e permaneceram **exatamente iguais**, com comparação `toBe`:

| Classe | fbd antes/depois (MPa) | lb antes/depois (mm) | lb,nec antes/depois (mm) | Pino exigido antes/depois (mm) |
| ------ | ---------------------- | -------------------- | ------------------------ | ------------------------------ |
| CA-25  | 1,013763853835911      | 1072,1989323512282   | 751,4420173462395        | 100                            |
| CA-50  | 2,2809686711308        | 953,0657176455362    | 333,974229931662         | 160                            |
| CA-60  | 1,013763853835911      | 2573,277437642948    | 771,9832312928844        | 120                            |

Esses números não afirmam atendimento da peça. O caso CA-25 mantém a falha pela ancoragem reta; CA-60 com bitola de 20 mm mantém a falha de aplicabilidade de dobramento. O fator de pino existente é preservado e não substitui essa verificação.

Os resultados completos dessas três peças foram capturados na base e fixados como hashes SHA-256 em `tests/steel.test.ts`. A comparação inclui todos os números, estados, verificações, referências e assinatura de entrada, sem remover campos do resultado.

Também foram comparados **108 cenários completos**: três classes × três modelos (bielas, atrito e viga em balanço) × três bitolas (16/20/25 mm) × duas condições de aderência × dois pares de coeficientes (1,40/1,15 e 1,30/1,10). Permaneceram idênticos. Seis modelos de detalhamento, suas saídas SVG/DXF, CSV de aço e três sugestões de armaduras também permaneceram idênticos. Números personalizados foram testados separadamente para confirmar preservação e bloqueio de cálculo.

## Verificação

Antes da implementação, `npm run check` passou com **167 testes**. Nenhum teste existente teve expectativa alterada nesta contribuição.

| Comando                | Resultado                           |
| ---------------------- | ----------------------------------- |
| `npm run format:check` | Aprovado                            |
| `npm run check`        | Aprovado: 180 testes em 10 arquivos |
| `npm run build`        | Aprovado                            |
| `npm run test:e2e`     | Aprovado: 70 testes                 |

Os novos testes cobrem mapa nos dois sentidos, coeficientes e pendência, valores inválidos/desconhecidos, fronteiras de bitola, restrições de dobramento, invariância de ancoragem e do resultado completo, abertura/salvamento de 420 MPa e rótulos de desenhos/CSV/PDF/auditoria. Na interface: legado sem mutação, seleção das três classes, isolamento por peça, histórico, reabertura, memória/PDF/auditoria, opções de aço transversal, teclado, temas claro/escuro e janela de 390 px.

A busca em `src/` não encontrou comparações `fyk === <número>` ou `fykTransverse === <número>`, nem rótulos calculados com `CA-${fyk/10}`. As operações aritméticas com fyk continuam numéricas, como antes. Não houve alteração de γc/γs, limite da biela, fórmulas de ancoragem, bitolas, dependências ou versão do esquema.

O build mantém os avisos preexistentes de anotação do Zod, importação estática/dinâmica de `detailing/job.ts` e chunks acima de 500 kB. O fluxo nativo Tauri não foi executado: Rust/Cargo e seus pré-requisitos nativos não estão disponíveis neste ambiente. Os testes web não substituem validação nativa.

## Capturas

- [CA-60 e pendência, tema claro](images/classes-aco-claro.png)
- [CA-60 e pendência, tema escuro](images/classes-aco-escuro.png)
- [Aço personalizado legado, janela estreita](images/classes-aco-legado-estreito.png)

## Sugestão para o PR manual

Título: **Centraliza classes de aço e substitui fyk livre por seletor**.

O Inspector permitia números que o motor sempre rejeitava, enquanto as regras de classe estavam dispersas. Esta alteração centraliza CA-25/CA-50/CA-60 e suas regras, preservando resultados e o η1 do CA-60 em 1,00, pendente de confirmação técnica. Valores legados desconhecidos continuam abrindo e são preservados como personalizados, com cálculo `unsupported`. Rótulos de propriedades, memória, PDF e detalhamento passam pelo mesmo módulo.

Validação: formatação, 180 testes unitários, build e 70 testes de interface aprovados; comparação de 108 cenários e dos três resultados completos sem alteração. Teste Tauri não executado; a decisão técnica sobre a superfície/η1 do CA-60 permanece pendente.

Closes #3
