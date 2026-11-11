# Validação — coeficientes dos materiais (issue #2)

Contribuição para [a issue #2](https://github.com/ricardocorsini/consolo-struct/issues/2), com edição também em Configurações, conforme solicitado. Base: `master` do original e do fork em `41c3a12b5d9e487244f3517c5edc8146e03184e8`. O fork foi conferido antes da implementação e novamente antes da conclusão, incorporando a integração da issue #5 publicada durante o trabalho. Branch: `feat/material-safety-settings`.

## Comportamento entregue

- **Configurações > Dimensionamento > Coeficientes dos materiais da peça selecionada** abre um diálogo que identifica a peça, mostra adotados/referências e permite editar produção, γc e γs. Os mesmos controles ficam no painel Cálculo.
- Edição por peça, com Desfazer/Refazer e persistência no projeto. Abrir e fechar sem editar preserva arquivo e histórico; fechar devolve o foco ao comando. Trocar produção não preenche coeficientes automaticamente.
- Padrões 1,40/1,15, inclusive para arquivos antigos. Novos campos finitos entre 1 e 2, sem alterar `schemaVersion` (4).
- Referências exatamente como informadas na issue: pré-moldado/moldado no local 1,40/1,15; fábrica 1,30/1,10. Cada coeficiente abaixo da respectiva referência aparece com adotado e referência numa verificação `review`. Igualdade ou valores superiores não geram essa pendência. Uma falha independente pode continuar governando o estado geral.
- `materialProperties` preserva o terceiro argumento `fykTransverse`; γc e γs são o quarto e o quinto argumentos, com padrões compatíveis. A propagação inclui `minimumFlexuralSteel`.
- Memória e PDF mostram adotados/referências em ambos os modelos. O cálculo auditável guarda entradas e resultados completos. Valores alterados e pendências constam nas notas do detalhamento; os desenhos com valores padrão permanecem iguais.

## Referências numéricas

mm, N e MPa internamente, sem arredondamento intermediário. Para C30/CA-50:

| γc / γs     | fcd (MPa)     | fyd (MPa)      | fyd limitado / fywd (MPa, CA-50) |
| ----------- | ------------- | -------------- | -------------------------------- |
| 1,40 / 1,15 | 21,4285714286 | 434,7826086957 | 434,7826086957                   |
| 1,30 / 1,10 | 23,0769230769 | 454,5454545455 | 435                              |

`fctd = 0,7 fctm/γc` e `fywd = min(fywk/γs; 435)` usam os coeficientes adotados. Os tetos existentes permanecem; não se afirma redução universal de 4,3% do tirante. As constantes de atrito, geometria e solda, γf, γn, combinações e classes de aço permanecem iguais.

## Verificações

Ambiente Linux, Node.js 24 e Chromium pelo Playwright. Antes da alteração: `format:check`, `check` (**131 testes**), `build` e `test:e2e` (**52 testes**) passaram.

Na nova base `41c3a12`, que inclui a issue #5, `npm run check` também passou antes de reaplicar esta contribuição: **145 testes**. As comparações numéricas abaixo foram recapturadas nessa base.

Após a alteração:

| Comando                | Resultado                          |
| ---------------------- | ---------------------------------- |
| `npm run format:check` | Aprovado                           |
| `npm run check`        | Aprovado: 167 testes em 9 arquivos |
| `npm run build`        | Aprovado                           |
| `npm run test:e2e`     | Aprovado: 65 testes                |

Os testes existentes de cálculo mantêm suas expectativas. Somente os inventários de ações e a sequência de teclado do ribbon foram ampliados para incluir o novo comando solicitado.

Foram comparados resultados completos capturados **antes** e **depois**, em 453 cenários: três processos de produção, cinco resistências do concreto, três seleções de modelo, cinco razões a/d e dois tipos de carregamento, mais três casos de viga em balanço. A comparação inclui estados fora do domínio, sem convertê-los em resultados calculados. Também foram comparadas duas sugestões de armadura, quatro modelos de detalhamento e as saídas SVG/DXF geométricas, CSV e cálculo auditável. Permaneceram idênticos, excluídos somente os novos metadados de coeficientes e o horário de emissão da auditoria. Usaram-se as mesmas entradas legadas, sem os novos campos, para preservar também a impressão digital da entrada nessa comparação.

Três desses resultados completos (atrito, bielas e tirantes, viga em balanço) têm hashes SHA-256 anteriores fixados em `tests/materialSafety.test.ts`. O teste remove apenas os quatro novos campos de metadados antes de comparar. A impressão digital de um projeto normalizado com campos adicionais pode mudar; os resultados antigos continuam sendo invalidados pelo fluxo existente.

Os novos testes cobrem resistências, teto de 435 MPa, armadura mínima fora do piso geométrico, propagação nos três modelos, referências/igualdade/valores abaixo e acima, pendência por combinação e após sugestão, validação de campos, legado, ida e volta JSON, PDF e notas SVG/DXF. Na interface: isolamento por peça, produção sem preenchimento automático, histórico, campos inválidos, salvamento/reabertura, sincronização entre painéis, memória/auditoria, retorno de foco, temas claro/escuro e largura de 390 px.

O build conserva os avisos já observados na base: anotação de otimização do Zod, importação estática/dinâmica de `detailing/job.ts` e chunks acima de 500 kB. Não houve mudança de dependências.

## Capturas

- [Tema claro — 1440 × 1050](images/coeficientes-materiais-claro.png)
- [Tema escuro — 1440 × 1050](images/coeficientes-materiais-escuro.png)
- [Janela estreita — 390 × 844](images/coeficientes-materiais-janela-estreita.png)

## Limites e integração

A redução é tratada como permissão atribuída à NBR 9062:2017 §8.1 pela issue, sujeita à decisão explícita do responsável técnico. O produto não certifica o enquadramento do elemento. Os textos normativos não estavam disponíveis nesta contribuição; os pares foram usados exatamente como informados, sem reproduzir texto de norma. Referências: NBR 9062:2017 §8.1; NBR 6118:2026.

O fluxo nativo Tauri não foi executado: Rust/Cargo e os pré-requisitos nativos não estão instalados neste ambiente. A validação web não substitui o teste desktop.

A issue #5 foi integrada ao `master` original durante a implementação. O fork foi atualizado para essa versão e a chamada auxiliar de `materialProperties` em `StrutLimitControl` passou a receber também `design.gammaC` e `design.gammaS`. Um teste de interface confere a prévia do limite com valores alterados em ambos os acessos; um teste numérico confere o limite alternativo e a preservação das duas pendências. Os critérios e fórmulas da issue #5 permanecem iguais.

## Sugestão para o PR manual

Título: **Permite configurar γc e γs por peça em Configurações e Cálculo**.

O motor usava coeficientes fixos, impedindo registrar uma adoção explícita pelo responsável técnico. Esta alteração permite editar γc/γs por peça, preserva os padrões e registra pendência `review` abaixo da referência de produção. A troca de produção mantém os valores adotados. Memória, PDF, auditoria e notas de detalhamento refletem as escolhas, preservando os tetos de 435 MPa e as demais fórmulas.

Validação: formatação, 167 testes unitários, build e 65 testes de interface aprovados; comparação de 453 cenários sem regressão com os padrões. Conferência normativa e teste Tauri permanecem pendentes pelos motivos acima.

Closes #2
