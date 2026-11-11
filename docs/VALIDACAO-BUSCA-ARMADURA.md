# Validação da busca de armadura — issue #16

## Implementado

Contribuição para [a issue #16](https://github.com/ricardocorsini/consolo-struct/issues/16), baseada no `master` original `2720f58e0d0a6fdf28cae992bbe6f0d2acc01a42`, com o fork atualizado antes da implementação. Branch: `feat/autodesign-search`. A contribuição da issue #3 ainda não fazia parte dessa base e não foi incorporada aqui.

O único módulo de produção alterado é `src/domain/autodesign.ts`. O dimensionamento secundário que ocorria depois da escolha do vencedor agora ocorre em cada candidato, antes do julgamento. Mantêm-se as fórmulas, bitolas e coeficientes, o tratamento prévio da viga, o menor espaçamento entre combinações e a regra de pele para h > 600 mm. Demandas omitidas por domínio de flexão inválido não geram contagens NaN.

As dez verificações secundárias listadas na issue foram confirmadas no motor e incorporadas ao conjunto crítico: `stitch`, `stitchSpacing`, `stitchZone`, `stitchClear`, `stitchDiameter`, `lowerStitch`, `lowerSpacing`, `transverse`, `suspension` e `splitting`. Nenhum outro id foi acrescentado. Costura/disposição só se aplicam fora da viga ou com h ≤ 600 mm; costura inferior só no muito curto; estribos construtivos só fora da viga; suspensão só na carga indireta. Fendilhamento está sempre presente, com demanda zero quando não se aplica.

Para cada bitola crescente, a busca testa todas as camadas da primeira contagem viável e então passa à próxima bitola. Uma contagem reprovada não encerra a bitola. A poda usa área **estritamente maior**, preservando a pontuação `área + camadas·0,001 + contagem·0,00001`, inclusive os empates entre bitolas. O contador representa os candidatos efetivamente avaliados após os descartes prévios, sem contar cada recálculo como um novo candidato.

Sem solução, a mensagem mostra os rótulos críticos comuns aos candidatos ou, sem interseção, as falhas do último arranjo avaliado da maior bitola. Foram preservadas a frase “Nenhum dado foi alterado.” e a mensagem de domínio excedido das secundárias. Domínios não calculáveis usam as razões do motor. Quando o dimensionamento excede o esquema e elimina as verificações do resultado, as falhas calculadas antes dessa etapa são mantidas apenas para diagnóstico. A assinatura e os campos de `DesignProposal` permanecem iguais. Entradas e dados externos não são mutados.

Capturas do fluxo existente com as novas mensagens: [sucesso](images/busca-armadura-sucesso.png) e [falha em janela estreita](images/busca-armadura-falha.png).

## Validado

Antes de editar, `npm run check` passou com **167 testes**. A busca original foi preservada, sem alteração de algoritmo, em `tests/reference/autodesign-before.ts`; foram ajustados somente imports e o nome exportado. A referência completa com dimensionamento por candidato está em `tests/reference/autodesign-exhaustive.ts`: não usa auxiliares privados da implementação nova e não possui poda nem parada na primeira contagem.

| Critério | Comando executado                                                                   | Resultado                                                                                                                                                                                                                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CA1      | `npx vitest run tests/autodesign.test.ts tests/engine.test.ts tests/theory.test.ts` | Peça, resultado completo e `changed` iguais à referência histórica em dez cenários: curto, viga de 700 mm, combinação H com costura compatível, pele, atrito, revisões de materiais/biela e três falhas existentes. Só mensagem/contador podem diferir.                                                                                 |
| CA2      | Mesmo comando                                                                       | O caso original de combinação H com N2 de 6,3 mm falhava em `stitchClear`; agora é recusado com o rótulo correspondente. A referência exaustiva confirma ausência de solução. Outro teste dimensiona costura superior/inferior, estribos, fendilhamento e suspensão antes do julgamento e confere todas as dez verificações.            |
| CA3      | Mesmo comando                                                                       | Falhas por concreto, cisalhamento e piso horizontal bibliográfico citam rótulos críticos e preservam a entrada. Testes com respostas controladas do motor confirmam interseção por id, apresentação por rótulo, fallback da maior bitola e ausência de candidatos avaliados.                                                            |
| CA4      | Mesmo comando                                                                       | Contagem comparada ao número de objetos candidatos distintos enviados ao motor, excluindo a entrada original. Redução confirmada para curto e viga de 700 mm. A mensagem de sucesso usa o novo número. Ancoragem soldada também foi conferida: passo de uma barra, contagens ímpares avaliadas e 476 candidatos na referência completa. |
| CA5      | Mesmo comando                                                                       | A busca otimizada produz peça e resultado iguais à varredura exaustiva com secundária nos mesmos dez cenários, incluindo `shortFixture()` e `cantileverFixture({ length: 700 })`. Testes adicionais refutam poda com `≥`, prioridade indevida de camadas e abandono prematuro de uma bitola.                                            |
| CA6      | `npm run check` e `npm run format:check`                                            | Aprovados: 206 testes em 10 arquivos e formatação correta. Casos anteriores sem solução continuam `changed=false`; uma peça já ótima também permanece `changed=false`.                                                                                                                                                                  |

O comando de testes direcionados passou com **117 testes**. Também foram executados e aprovados `npm run build` e `npm run test:e2e`, este com **68 testes**. Os três novos testes de interface cobrem sugestão/contador, salvamento, dados externos, Desfazer/Refazer, falha secundária sem alteração da peça e diagnóstico de concreto nos dois temas em janela de 390 px.

| Caso                                                                            | Candidatos da busca antiga | Candidatos novos | Comparação da proposta                                       |
| ------------------------------------------------------------------------------- | -------------------------- | ---------------- | ------------------------------------------------------------ |
| `shortFixture()`                                                                | 154                        | 28               | Peça e resultado idênticos                                   |
| `cantileverFixture({ length: 700 })`                                            | 154                        | 84               | Peça e resultado idênticos, inclusive pendências externas    |
| Viga com pele, h = 700 mm, a = 1000 mm, L = 1200 mm                             | 154                        | 70               | Peça e resultado idênticos; N2 preservado e pele em `review` |
| Concreto insuficiente, cisalhamento insuficiente e piso horizontal não atendido | 154                        | 154              | Sem alteração, como antes; diagnóstico mais específico       |

O empate de área foi testado com oito barras de 10 mm e duas de 20 mm: ambas têm `200π mm²`. A solução posterior continua elegível e vence pelos termos de camadas/contagem. Outro teste faz um arranjo de duas camadas vencer um de uma camada por ter menor área. As respostas controladas nesses testes isolam a ordem de busca; as comparações das fixtures usam o motor real.

O motor de cálculo, esquema de arquivo, unidades, dependências e consumidores da API permanecem inalterados. O fluxo do aplicativo já apresentava `proposal.message` e não precisou de alteração. O build mantém os avisos preexistentes de anotação do Zod, importação estática/dinâmica de `detailing/job.ts` e chunks acima de 500 kB.

## Não validado

O fluxo nativo Tauri não foi executado: Rust/Cargo e os pré-requisitos nativos não estão disponíveis neste ambiente. Os testes de interface executados usam Chromium/Playwright no Linux.

Não foi realizado um benchmark de tempo universal. A redução verificada é de candidatos avaliados; cada candidato agora pode exigir mais recálculos por incluir as secundárias. Sem solução, a varredura pode continuar completa. Não se afirma equivalência com GN Corbel nem nova confirmação normativa, pois nenhuma fórmula ou valor normativo foi alterado.

Implementação e revisão foram executadas sequencialmente com o modelo atual, sem troca de modelo nem subagente. A tentativa de refutar CA1/CA5 está registrada nos testes independentes de referência, poda e desempate.

## Limitações e divergências encontradas

A issue cita até 483 combinações nominais. Nas fixtures com alça, a busca antiga avalia efetivamente 154 depois dos descartes de camadas/linhas ímpares. Esse é o total correto da referência para a comparação; não se apresentou o limite nominal como contagem observada.

A ampliação de `critical` muda intencionalmente **o caso original “usa o menor smáx mesmo quando outra combinação governa o tirante”**: com N2 de 6,3 mm, o vencedor antigo tinha espaço livre da costura de **17,651666666666667 mm**, inferior aos **20 mm** exigidos. A busca nova não oferece esse vencedor nem encontra outro candidato viável; a mensagem cita “Espaço livre vertical da costura”. A regressão original foi mantida integralmente no novo teste. Para continuar verificando o envelope de espaçamento entre combinações no teste anterior, somente sua bitola N2 foi ajustada explicitamente de 6,3 para 10 mm; todas as suas asserções foram preservadas. Nesse arranjo compatível, a proposta permanece igual à busca antiga. Nenhuma outra fixture existente precisou mudar.

`stitchZone` e `stitchDiameter` são restrições de geometria/disposição, não demandas corrigíveis apenas aumentando contagens. Elas foram incluídas conforme a lista da issue para impedir propostas incompatíveis; a busca não altera suas bitolas ou limites. O espaço livre pode piorar ao aumentar costura, razão pela qual a viabilidade só é julgada após o dimensionamento.

Uma proposta ainda pode conter `review` ou falhas fora do conjunto crítico, como ancoragem e armadura de suporte informadas. Esses dados externos não são inventados nem as pendências convertidas em aprovação. Esta contribuição fica limitada à enumeração e ao julgamento descritos na issue #16.

PR manual sugerido: **Otimiza a busca e dimensiona armaduras secundárias por candidato**. Relacionar com **Closes #16** e usar esta validação como evidência.
