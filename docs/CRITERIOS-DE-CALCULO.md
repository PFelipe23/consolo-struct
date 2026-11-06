# Motor 0.3.0 — critérios LC-ELU-2026.1

## Alcance

Este documento especifica o que o programa calcula e permite reproduzir suas decisões. O motor trata **consolo simples de concreto armado, seção retangular junto ao suporte, ações estáticas no plano médio e ELU de combinações normais**. Os dois caminhos são bielas e tirantes (curto) e atrito-cisalhamento (muito curto). A sugestão de armaduras é uma busca discreta, seguida das mesmas verificações usadas para o arranjo informado.

A implementação não equivale à aplicação integral de duas normas a um projeto. Cada resultado tem estado `pass`, `fail`, `review`, `invalid` ou `unsupported`. `pass` significa atendimento às verificações implementadas, sob as entradas e hipóteses registradas; não é aprovação executiva da peça ou da estrutura. Uma pendência `review` não é transformada em atendimento.

## Referências analisadas

Foram lidos os documentos fornecidos nesta solicitação, incluindo as seções gerais às quais os capítulos de consolos remetem. A paginação abaixo é a impressa, não o índice do visualizador PDF.

| Fonte                                                                    | Recorte usado                                                              | Aplicação                                                                                             |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| ABNT NBR 6118:2026                                                       | §§7.4–7.5, 8.2–8.3, 9.3–9.5, 17.3.5.2, 18.3.2.2, 21.2, 22.2, 22.3 e 22.5.1 | Durabilidade, materiais, aderência, ancoragem, mínimos, modelos resistentes e disposições de consolos |
| ABNT NBR 9062:2017                                                       | §§6.3.4, 7.3.1–7.3.9 e 9.2.1.1; pp.46–55 para consolos                     | Classificação, ações horizontais, atrito, tirante, costura, suspensão e geometria                     |
| El Debs, _Concreto pré-moldado — fundamentos e aplicações_, trecho cap.4 | §4.3.1.1, pp.115–116; §4.4.4, pp.137–148                                   | Fendilhamento transversal, equilíbrio com braço 0,9d, comparação dos modelos e costura                |
| José Milton de Araújo, _Curso de Concreto Armado_, vol.4, trecho cap.4   | §4.5, pp.114–125                                                           | Geometria do modelo biela-tirante e exemplo numérico                                                  |

A edição bibliográfica completa dos dois livros não foi inferida a partir de trechos sem folha de rosto. O trecho de El Debs remete explicitamente à NBR 9062/85. Textos, tabelas, páginas digitalizadas e PDFs das fontes não são redistribuídos no pacote. Há equações implementadas e referências para consulta nos exemplares do usuário.

## Decisões entre fontes

| Questão                    | Diferença encontrada                                                                                     | Decisão do motor                                                                                                                  |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| γn                         | 6118 §22.2 indica pelo menos 1,2; 9062 §7.3.1.1 distingue produção e predominância da ação permanente    | `max(1,2; γn9062; γn informado)`. É política conservadora explícita, não declaração de que os textos são idênticos                |
| Fronteira a/d = 0,5        | A classificação literal da 6118 inclui a fronteira em curtos; a 9062 a inclui em muito curtos            | Convenção da 9062. A memória registra o modelo; bielas pode ser solicitado para monolítico                                        |
| Costura                    | 9062 expressa **área por altura**; 6118 prescreve **área total** de pelo menos 40% do tirante nos curtos | Converter corretamente as grandezas e usar o envelope descrito adiante                                                            |
| Resistência no muito curto | Limites de 6 MPa e coeficientes antigos aparecem em El Debs                                              | Usar a expressão da 9062:2017, com teto 8 MPa; não copiar limites históricos como norma atual                                     |
| H mínimo                   | O livro traz a aproximação histórica H/V = 0,20                                                          | Usar tipo de apoio da 9062:2017 ou resultante de análise justificada                                                              |
| Taxa mecânica máxima       | ω = 0,15 aparece no tratamento histórico                                                                 | Não apresentá-la como limite atual. No modelo de atrito, a demonstração de ductilidade permanece pendente de análise complementar |
| Suspensão                  | O tratamento simplificado do livro pode atribuir parcela da reação ao mecanismo direto                   | Dimensionar para **100% da ação indireta**, conforme as normas fornecidas                                                         |
| Barra soldada              | Regras de várias barras transversais e regra de barra única são diferentes                               | Barra única com mesmo diâmetro, geometria e qualificação específica; não usar a regra de 60% do tirante                           |
| CA-60 / aderência          | Tabela 8.2 fornecida distingue CA-50 e CA-60                                                             | η1 = 2,25 para CA-50 e 1,00 para CA-25/CA-60; não transferir automaticamente valores de edições anteriores                        |

## Unidades e entradas

Internamente: **mm, N, MPa = N/mm² e mm²**. Na interface: cm, kN, MPa e cm², sempre com conversão explícita. Contagens inteiras. Sem arredondamento intermediário; arredondar somente na apresentação.

- `a`: distância da face do suporte à linha vertical da força, centrada no comprimento do apoio.
- `bearingLength`: comprimento da área de transmissão na direção de a; não é o cobrimento.
- `bearingWidth`: largura efetiva transversal centrada. Não se presume dispersão transversal até toda a largura do consolo.
- `bearingHeight`: altura da linha de ação de H acima da superfície superior do concreto.
- `columnWidth`: dimensão disponível do suporte na direção da ancoragem.
- N1: ramos longitudinais resistentes. Uma alça horizontal tem dois ramos na mesma camada.
- N2/N2b: estribos horizontais fechados nos 2/3 d superiores e terço inferior.
- N3: estribos verticais construtivos; N4: fendilhamento transversal sob apoio; N5: suspensão. Cada estribo contado fornece dois ramos efetivos.
- As áreas de confinamento da ancoragem e de armadura local do suporte são informadas como áreas efetivas, com direção e ancoragem compatíveis. O software não presume sua existência.

### Altura útil

Para cada camada, o centro da primeira fileira está em `c + φN3 + φN1/2 + acréscimo`. O espaço livre vertical entre fileiras é `max(20 mm; φN1; 0,5 dag)`. As barras se distribuem entre as camadas; o centroide é ponderado pelo número de barras. `d = h − d′`.

Todo novo arranjo da busca automática recalcula d, a/d, forças internas, armaduras mínimas e todas as combinações. Não se usa altura útil fixa após alterar bitola ou camadas.

## Ações

No modo característico:

`Vd = (Vk + peso próprio opcional) × γf × γn`

`Hinformado,d = max(0; Hk × γf × γn)`

No modo de cálculo, V e H já incluem os coeficientes, inclusive γn. O fator aplicado pelo motor é 1. As combinações são **fornecidas pelo usuário**; o programa não decompõe G/Q, não gera combinações segundo NBR 8681 e não usa coeficientes excepcionais.

| Apoio com movimento horizontal permitido | H estimado / Vd |
| ---------------------------------------- | --------------: |
| Seco                                     |            0,80 |
| Argamassa                                |            0,50 |
| Elastômero                               |            0,16 |
| PTFE                                     |            0,08 |
| Aço / aço não soldado                    |            0,25 |
| Concreto / chapa metálica                |            0,40 |

No modo estimado, H informado é **adicional**: `Hd = Hestimado + max(Hinformado,d; 0)`. Isso evita descontar uma compressão favorável da estimativa normativa. No modo análise, H é a resultante total e exige justificativa, mesmo quando nulo. Apoios impedidos, grauteados ou soldados não aceitam a estimativa.

O peso próprio usa 25 kN/m³ e o volume do prisma trapezoidal. É concentrado em a apenas se isso for conservador em momento: `xG = L(h+2h2)/(3(h+h2)) ≤ a`. Caso contrário, exige combinação equivalente justificada. Não se acrescenta automaticamente a forças já de cálculo nem à opção de carga indireta. Não se inclui peso do elemento apoiado sem entrada explícita.

Cada combinação conserva seu par simultâneo V/H. O envelope é feito **separadamente para cada verificação**. A combinação que maximiza As do tirante não necessariamente governa contato, ancoragem ou outro requisito.

## Materiais

Combinação normal: γc = 1,40; γs = 1,15. Não são aplicadas automaticamente reduções de γc por fabricação.

`fcd = fck/γc`; `fyd = fyk/γs`; `αv2 = 1−fck/250`.

Para os modelos de consolo adota-se conservadoramente `fy = min(fyd; 435 MPa)`, conforme recomendação do trecho de El Debs. Para costura e suspensão, o limite 435 MPa também é explícito na 9062. A ancoragem usa fyd do material, sem reduzir artificialmente a força de escoamento.

Resistências de bielas/nós da 6118 §22.3.2:

- fcd1 = 0,85 αv2 fcd;
- fcd2 = 0,60 αv2 fcd;
- fcd3 = 0,72 αv2 fcd.

O motor adota fcd2 para a biela fissurada, fcd3 no nó sob apoio e fcd1 no nó comprimido junto ao suporte. Na biela também se compara o limite da 9062 (fcd para carga direta; 0,85 fcd indireta), conservando o menor.

`fctm = 0,3 fck^(2/3)` até C50; acima, `2,12 ln[1+0,1(fck+8)]`, conforme o documento de 2026. `fctk,inf = 0,7 fctm`; `fctk,sup = 1,3 fctm`.

Na avaliação da armadura mínima de flexão, empregam-se αc e ηc da edição fornecida, com `ηc=1` até C40 e `(40/fck)^(1/3)` acima. Não se introduz ηc silenciosamente nas expressões próprias de §22.3.2.

## Modelos resistentes

### Curto — 0,5 < a/d ≤ 1

Geometria baseada em Araújo, §4.5:

`tanθ = (d−d′)/(a+c_ap/2)`; `z = a tanθ`; `e = d′+h_ap`.

Limitar a inclinação ao domínio de §22.3.1: tanθ entre 0,57 e 2. O modelo pode reduzir a altura efetiva para respeitar o limite superior. Não aumentar uma tangente insuficiente: nesse caso há falha.

`T = Vd a/z + Hd(1+e/z)`

`Fc = (Vd+Hd e/a)/senθ`

A largura da biela é obtida por expansão do apoio na altura 2d′. O programa limita essa abertura à dispersão 1:2 relativa à vertical: `c1 = min(c_ap+2d′/tanθ; c_ap+2d′)`; `c2=c1 senθ`. Essa redução da área é uma adaptação conservadora documentada em relação à geometria do livro; não se altera o equilíbrio de momentos adotado.

`σb = Fc/(b_eff c2)`

Além do modelo geométrico, usa-se o piso simplificado da 9062 §7.3.5.3:

`As9062 = [(0,1+a/d)Vd + Hd]/fy`.

`Asmodelo = max(T/fy; As9062)`.

A verificação de escoamento prévio compara a capacidade do tirante com a força de tirante na primeira resistência do concreto, sob crescimento proporcional de V/H. É uma verificação mecânica do **modelo adotado**, não uma promessa de ductilidade global:

`As,ef fy ≤ T × min(fcd2/σb; fcd3/σapoio,max; fcd1/σn)`.

### Muito curto — a/d ≤ 0,5

Automático: atrito-cisalhamento da 9062 §§7.3.4.2 e 7.3.5.4.

`Asatrito = (0,8 Vd/μ + Hd)/fy`.

μ = 1,4 monolítico; 1,0 junta rugosa preparada segundo §6.3.4; 0,6 junta lisa. A rugosidade não é presumida: exige confirmação.

`ρ = As,ef/(bd)`

`τwd = Vd/(bd)`

`τwu = min[3+0,9ρfy; 0,27(1−fck/250)fcd; 8 MPa]`.

Complemento de El Debs: a área não fica abaixo da obtida pelo equilíbrio com braço 0,9d:

`AsElDebs = [Vd a/(0,9d) + Hd(1+(d′+h_ap)/(0,9d))]/fy`.

É usado o equilíbrio completo, sem aproximar o multiplicador de H para 1,2.

`Asmodelo = max(Asatrito; AsElDebs)`.

**Ductilidade permanece com estado “conferir” no modelo de atrito.** A expressão empírica de resistência, isoladamente, não fornece demonstração completa de que o tirante escoa antes de mecanismos frágeis. O antigo limite ω=0,15 não foi promovido a requisito vigente. Não existe botão que transforme essa pendência em aprovação.

Para concretagem monolítica é possível selecionar explicitamente bielas, usando a extensão de Araújo para muito curtos: limitar tanθ a 1,4 e usar a altura efetiva correspondente. Esse caminho deve ser avaliado pelo projetista; não é usado para juntas de concretagem. Em casos muito altos, não se utiliza a dispensa de costura de §7.3.3.13.

### Armadura mínima

A área necessária é o maior entre o modelo, o mínimo de flexão e o mínimo mecânico da 9062.

Para a flexão mínima: `Mmin=0,8 W0 fctk,sup`, `W0=bh²/6`; resolver equilíbrio da seção retangular com bloco de tensão αc ηc fcd e altura útil real. Usar ainda o piso absoluto `0,0015bh`.

Mínimo mecânico: `ω=(As,ef/bd) fyk/fck > 0,04`. A desigualdade é estrita e verificada separadamente; não foi substituída por “≥”.

## Compressão sob apoio e fendilhamento

O carregamento vertical é centrado no comprimento informado. A altura da linha de H gera excentricidade local `e_ap=Hd h_ap/Vd`. Para contato integral, assume-se distribuição linear e verifica-se:

`σmax = Vd/(b_eff c_ap) × (1+6 e_ap/c_ap) ≤ fcd3`.

Se `e_ap > c_ap/6`, o motor **interrompe** a solução: não extrapola a distribuição linear para contato que admite descolamento. Não há aumento da resistência por confinamento de área parcialmente carregada. Rigidez, rotação, cisalhamento, escorregamento e resistência do aparelho de apoio são verificações separadas.

Quando a borda lateral do apoio dista da lateral do consolo mais que o cobrimento, há armadura exclusiva de fendilhamento transversal N4, com base no modelo de bloco parcialmente carregado centrado de El Debs:

`Ffend = 0,30 Vd(1−b_eff/b)`; `AsN4 = Ffend/fywd`.

Esse modelo não resolve excentricidade transversal, fendilhamento no plano horizontal da alça nem ancoragem de pinos. Não se conta N4 novamente como N2 ou N3.

## Armaduras secundárias

Para a costura, define-se Asv pela parcela vertical do modelo conservador. No modelo bielas, o programa conserva ainda o efeito amplificador da excentricidade de H ao subtrair somente Hd de T; isso é conservador em relação à parcela estritamente vertical.

Altura da zona superior: `z_cost=2d/3`.

`r9062 = k Asv/d`, k=0,4 curto e 0,5 muito curto.

`rmin = 0,0015b` em mm²/mm (equivale a 0,15b em cm²/m quando b está em cm).

`Ascost,req = max(r9062 z_cost; rmin z_cost; 0,4As,tir,ef [curto]; kAsv [complemento El Debs])`.

Quantidade mínima: arredondar para cima considerando **dois ramos** por estribo. Além da área, verificar φ ≤ min(b,h)/15, espaçamento ≤ min(100 mm; a) e espaço livre adotado construtivamente para concretagem. A distribuição é por faixas tributárias, meia distância nas extremidades. No muito curto, o terço inferior recebe costura mínima adicional.

Para ação direta, N3 ≥ 0,0015bh. Para ação indireta, N5 ≥ Vd/fywd e não se inclui a mesma área em duas famílias. Arranjo e ancoragem dos estribos secundários precisam ser definidos no detalhamento executivo; o desenho esquemático não os certifica.

## Ancoragens e geometria

- Ancoragem do tirante no suporte: fbd = η1 η2 η3 fctd, conforme §§8.3 e 9.3.2. Má aderência usa η2=0,7; boa aderência precisa ser justificada.
- `lb = max(φ fyd/(4fbd); 25φ)`.
- `lb,nec = max(α lb As,req/As,ef; 0,3lb; 10φ; 100 mm)`.
- α=0,7 para gancho somente com cobrimento normal ≥3φ; fora disso α=1. O percurso real do gancho permanece pendente, pois a geometria integral do suporte não é definida.
- Armadura de confinamento na ancoragem, para as bitolas admitidas no consolo: capacidade ≥25% da força de uma barra (§9.4.2.6.1).
- Armadura local na face do suporte ≥área efetiva do tirante (§7.3.3.14). Não é dimensionamento do pilar.
- CA-25 tracionado não aceita ancoragem exclusivamente reta.
- Alças horizontais: número par de ramos em cada camada; pino mínimo conforme tabela 9.1; espaço físico transversal. Não se desenha gancho vertical frontal como se fosse solução universal.
- A dispensa de armadura contra fendilhamento no plano da alça exige carga direta e `3c ≤ a2 ≤ 3(c+φ)`. Fora dessa condição há pendência específica; os mínimos de pino não são tomados como prova de suficiência.
- Barra transversal única soldada: mesmo φ, limites geométricos de §9.4.7.1, procedimento de solda e resistência informados. Verifica-se a força de projeto por ramo e um piso de 1,15 da força de escoamento nominal do ramo. O requisito de qualificação com resistência medida, as normas de soldagem e os ensaios não são substituídos por esse cálculo. Reduções aplicáveis à resistência devem constar da Rwd informada.
- `a2=L−a−c_ap/2`; verificar afastamento frontal de §7.3.3.4 e h2 ≥ h/2−a2.
- Tirante inteiro no quinto superior de h; φ ≤ min(25; min(b,h)/8) para alça ou /6 para soldada; distância em planta ≤ min(d;15φ) ou min(d;20φ).
- Espaço livre horizontal ≥max(20;φ;1,2dag); critérios de disposição de §18.3.2.2 adotados explicitamente.

## Durabilidade

Cobrimentos nominais de referência: 25/30/40/50 mm para CAA I/II/III/IV; classes mínimas C20/C25/C30/C40. Verifica-se também cobrimento ≥φ e dag ≤1,2c. Redução de 5 mm só mediante opção explícita de controle de qualidade e processo compatível; não se acumulam automaticamente outras reduções especiais.

Isso não verifica relação água/cimento, execução, tolerâncias, idade de carregamento ou vida útil. O resultado de “cobrimento atende” tem esse alcance específico.

## Domínio interrompido e verificações externas

São interrompidos: a/d>1, força vertical nula ou ascendente, geometria inválida, número não finito, força/excentricidade transversal, fadiga declarada, contato parcial, atrito para curto, junta não monolítica no modelo bielas, aço fora das classes modeladas e H não justificado em apoio impedido. O tipo `unsupported` não contém números de dimensionamento aparentes.

Permanecem externos: ELS e fissuração; dentes Gerber; consolos duplos, contínuos e espaciais; ciclos, impacto e sismo; pilar/painel/viga-suporte completos; projeto do aparelho de apoio; pinos/chumbadores; ensaios e metalurgia das soldas; geometria completa de ancoragem com gancho; detalhamento, comprimentos de corte e interferências das armaduras. Não se devem completar esses itens por simples troca de rótulo ou “aceitar aviso”.

## Arquivos e auditoria

- `.lume.json`, esquema 2: entradas editáveis. Importa esquema 1 com dados novos não conferidos. Quantidades antigas eram ilustrativas e precisam ser revistas, especialmente a contagem de estribos.
- `.calc.json`: snapshot completo das entradas, unidades, versão, política, todas as combinações, resultados intermediários e verificações. Não é um projeto editável e não é tratado como resultado confiável ao importar `.lume.json`.
- PDF: entradas, hipóteses, referências, envelope, memória de cada combinação e apêndice integral de entradas; usa transliteração dos símbolos para evitar caracteres gregos quebrados no PDF.
- CSV: quantidades e resumo de ELU recalculado. Não é lista de corte.
- DXF/SVG: somente geometria não executiva, mantendo a separação entre modelo de cálculo e detalhamento.

Qualquer alteração de entrada invalida a memória visível. Exportações calculadas usam sempre o estado atual. Um campo numérico inválido que ainda está em edição bloqueia calcular/sugerir/exportar.
