# Validação do motor 0.3.0

## Base e grau de validação

Há comparação independente com o exemplo numérico de Araújo, checagens algébricas manuais de fórmulas da 9062, testes de domínio/limites e testes do fluxo de interface. Isso é validação de implementação; não é certificação do software nem substitui revisão independente do modelo de engenharia.

A leitura normativa foi registrada em `CRITERIOS-DE-CALCULO.md`. Os exemplos não foram usados como justificativa para copiar coeficientes de edições antigas.

## Exemplo de Araújo — pp.122–125 do trecho fornecido

Entrada do modelo mecânico: Vd=140 kN; H=0; a=100 mm; b=200 mm; d=250 mm; d′=50 mm; comprimento do apoio=100 mm; fck=25 MPa; fyk=500 MPa; γs=1,15.

| Grandeza    | Resultado analítico sem arredondamento | Referência impressa / observação                          |
| ----------- | -------------------------------------: | --------------------------------------------------------- |
| tanθ        |                           1,3333333333 | O livro arredonda para 1,33                               |
| senθ        |                               0,800000 | Geometria do triângulo                                    |
| cosθ        |                               0,600000 | Geometria do triângulo                                    |
| c2          |                             140,000 mm | 14,0 cm                                                   |
| z           |                          133,333333 mm | Aproximadamente 13,3 cm                                   |
| T           |                             105,000 kN | Aproximadamente 105,26 kN com os arredondamentos do livro |
| σ sob apoio |                              7,000 MPa | 7,0 MPa                                                   |
| σ na biela  |                              6,250 MPa | Aproximadamente 6,3 MPa                                   |
| As          |                241,500 mm² = 2,415 cm² | Aproximadamente 2,42 cm²                                  |

O teste compara o **modelo resistente com as mesmas forças de cálculo**, não declara que a peça histórica, com todos os detalhes antigos, atende integralmente às edições atuais. Aplicar γn atual a forças características pode alterar as ações do exemplo; forças de cálculo não podem ser majoradas duas vezes.

O exemplo apresenta adoção de três estribos de 5 mm para costura em torno de 1,21 cm². A área exata de seis ramos de 5 mm é **1,178097 cm²**, inferior a 1,21 cm². O motor não trata essa diferença de adoção/arredondamento como atendimento: a quantidade é arredondada para cima após comparação com a área exata.

Um segundo teste, derivado por equilíbrio e não copiado da implementação, acrescenta H=20 kN a 20 mm acima do concreto. Com z=133,333 mm e e=70 mm, obtém-se T=135,500 kN e Fc=192,500 kN. O resíduo do equilíbrio de momentos é numericamente nulo.

## Controle manual do caminho de atrito

Geometria inicial: b=300 mm; h=400 mm; cobrimento=25 mm; estribo=6,3 mm; tirante=20 mm em uma camada. Logo d=358,7 mm. Vk=350 kN; Hk adicional=40 kN; γf=1,4; γn=1,2; elastômero.

- Vd = 588,000 kN.
- Hd = 40×1,4×1,2 + 0,16×588 = 161,280 kN.
- fyd = 500/1,15 = 434,7826087 MPa.
- As de atrito = (0,8×588000/1,4 + 161280)/fyd = **1143,744 mm²**.
- τwd = 588000/(300×358,7) = **5,464176 MPa**.
- Parcela do limite de concreto = 0,27×(1−30/250)×30/1,4 = **5,091428571 MPa**.

A resistência do concreto não atende. Isso mostra por que a geometria/armadura da versão de interface não pode receber aprovação apenas por já vir preenchida.

## Cobertura automatizada

- Modelo geométrico de Araújo e equilíbrio com H elevado.
- Atrito-cisalhamento, tetos de concreto e 8 MPa, costura por altura versus área total.
- Mínimos de flexão e taxa mecânica estritamente >0,04.
- Coeficientes de todos os tipos de apoio; γn, forças já de cálculo e H favorável.
- Fórmulas de material para alta resistência e coeficiente de aderência do CA-60.
- Camadas e centroide; suspensão integral; fendilhamento transversal.
- Contato com excentricidade de H e bloqueio de contato parcial.
- Comprimento, confinamento e condição de redução da ancoragem; barra soldada de mesmo diâmetro e desenvolvimento da força do ramo.
- Fronteiras a/d=0,5 e 1, fadiga, força/excentricidade fora do plano, junta, entrada inválida e finitude.
- Combinações simultâneas e envelope independente por verificação.
- Migração de arquivos, assinatura, determinismo, ausência de mutação e resultados obsoletos.
- Sugestão de armaduras, ausência de solução e preservação de dados externos.
- Grade com 27 combinações de largura/altura/carga para ausência de NaN/Infinity nos resultados emitidos.

A validação do aplicativo, comandos e contagem final de testes constam de `VALIDACAO.md`.

## Casos reproduzíveis incluídos

`examples/casos-validacao.lume.json` contém Curto-ELU (atende às verificações implementadas), Muito-curto-ELU (conferência de ductilidade pendente) e Junta-rugosa (ductilidade e confirmação da interface). `resultados-esperados.json` registra os resultados para detectar regressões futuras; não constitui uma fonte independente por ser saída do próprio motor.

Os testes analíticos estão separados desses snapshots. Para reproduzir: `npm ci && npm run check`. Os exemplos podem ser recriados com `npx vite-node scripts/generate-examples.ts`.
