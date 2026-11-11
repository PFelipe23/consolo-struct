# Histórico de alterações

Este arquivo resume as mudanças documentadas no código-fonte recebido. Não pressupõe que existam tags, releases publicadas ou instaladores para cada versão.

## Não lançado

- Otimiza Sugerir armaduras: avalia todas as camadas da primeira contagem viável por bitola e poda apenas áreas estritamente maiores que a melhor encontrada, preservando a pontuação e os empates. O contador passa a mostrar candidatos efetivamente avaliados.
- Dimensiona costura superior/inferior, estribos, fendilhamento e suspensão em cada candidato antes de julgá-lo; inclui as respectivas verificações críticas e mantém o tratamento de viga/pele. Nenhuma fórmula ou limite do motor é alterado.
- Explica sugestões sem solução com os rótulos críticos comuns aos candidatos ou as falhas do último arranjo da maior bitola, preservando as entradas. Mantém as mensagens de domínio e as pendências externas; registra a comparação com buscas completas na validação da issue #16.

- Torna γc e γs editáveis por peça em Cálculo e em Configurações > Dimensionamento > Coeficientes dos materiais da peça selecionada. Padrões 1,40/1,15 em arquivos antigos, sem mudança de esquema; histórico e salvamento preservam as escolhas. A troca de produção não muda os valores automaticamente.
- Usa os coeficientes adotados em fcd, fyd, fctd, fywd e armadura mínima de flexão, preservando os tetos de 435 MPa. Registra adotados e referências na memória, PDF, cálculo auditável e notas de detalhamento com valores alterados.
- Acrescenta pendência `review` para cada coeficiente abaixo do par informado na issue #2: pré-moldado/moldado no local 1,40/1,15; pré-fabricado 1,30/1,10. A redução é tratada como permissão da NBR 9062:2017 §8.1, sujeita à decisão do responsável técnico; o produto não certifica o enquadramento do elemento. Referências normativas não conferidas nesta contribuição. γf, γn, combinações e classes de aço permanecem iguais.
- Adiciona o critério selecionável do limite da biela (`strutLimit`): padrão `fcd2` preservado e alternativas `fcd3`, `indirect085` e `direct100`. Opções incompatíveis com a introdução da carga ficam desabilitadas e são rejeitadas pelo motor com `unsupported`.
- Disponibiliza o controle em Configurações > Dimensionamento > Limite da biela da peça selecionada e nas propriedades de Cálculo, usando o mesmo estado da peça, histórico e arquivo de projeto. Não altera critérios das outras peças nem o esquema 4.
- Limites alternativos aplicados à biela geram `review` com a comparação ao padrão; memória, PDF e cálculo auditável mostram o critério e a fórmula escolhidos. Nós, apoio, escoamento prévio, inclinação, complemento de El Debs, atrito e viga em balanço mantêm suas verificações. Referências das alternativas indicadas no repositório, com conferência normativa pendente.
- Adiciona a aba superior Configurações ao ribbon, com grupos Geral / Aparência, Desenho, Modelo 3D, Dimensionamento e Detalhamento, navegação por teclado e rolagem horizontal em janelas estreitas.
- Reutiliza tema, cotas, armaduras, cargas e grade, preservando os acessos anteriores, seus estados e as regras atuais de persistência. O atalho Critérios da peça selecionada continua acessando dados da peça.
- Identifica preferências futuras como Em breve, em itens desabilitados com texto visível. Abrir a central não altera documentos, dados, resultados nem histórico; não há mudanças no motor ou no formato de arquivos.
- Simplifica as cinco abas anteriores do ribbon de 63 para 46 posições, preservando as 39 ações e a nova central Configurações. Início reúne oito atalhos do fluxo frequente; Modelo concentra a edição completa, inclusive Excluir; Documentação concentra documentos e saídas diretas.
- Centraliza rótulos, ícones e ajuda em um catálogo tipado. Padroniza Salvar projeto e Detalhamento e distingue edição de armaduras/ações da visibilidade das vistas. Mantém controles contextuais e exportadores especializados.
- Preserva alturas do ribbon, permite rolagem das abas e melhora a legibilidade dos botões. Expõe estados dos modos locais e retorna o foco ao comando que abriu um diálogo.
- Move Tema de Exibir para a central Configurações integrada, mantendo também o acesso rápido. Nenhuma alteração no motor, formato de projeto, unidades ou conteúdo das exportações.
- Viga em balanço para `1 < a/d ≤ 2` (issue #6): no modo automático, o motor deixa de devolver `unsupported` e calcula flexão simples (bloco retangular), tração horizontal, cisalhamento pelo Modelo I com `Vc = 0`, estribos com mínimo e espaçamento máximo, costura até h = 600 mm e armadura de pele em revisão acima disso, em paridade com o GN Corbel. Novas verificações `beamDomain`, `beamShear`, `beamStirrups`, `beamStirrupSpacing`, `beamStitch` e `beamSkin`; classificação `cantilever` e método `beam`.
- Domínio inválido da flexão deixa a armadura indeterminada, sem número sentinela. Bielas e tirantes e os complementos de El Debs não se aplicam nessa faixa; mantém-se o piso `Hd ≥ 0,20 Vd`.
- `a/d > 2` continua fora do domínio, com nova mensagem; bielas e tirantes ou atrito explícitos com `a/d > 1` orientam para o modo automático.
- O passo dos estribos N3 passa a vir de uma função compartilhada entre motor e detalhamento.
- Memória, PDF e cálculo auditável com rótulo "Viga em balanço" e valores do modelo; sugestão de armaduras considera as novas verificações.
- Nenhum resultado muda para `a/d ≤ 1`. Referências normativas do modelo citadas no GN Corbel, com conferência pendente.

## 0.7.1

- Corrige o rótulo antigo do motor na barra de status: a interface passa a usar a versão real do núcleo de cálculo.
- Mantém integralmente as melhorias da revisão Base Consolo 0.7.0 e o motor 0.4.0.

## 0.7.0

- Motor 0.4.0 / LC-ELU-2026.2: revisão minuciosa do trecho Base Consolo, com matriz de comparação por página e decisão documentada frente às normas.
- Complementos explícitos de El Debs para H, tirante, biela, tensão de referência, costura, estribos e altura da ponta; novos projetos vêm habilitados, projetos antigos preservam sua opção.
- Posição de cálculo da reação independente do aparelho, envelope 3/4 L e deslocamento c_ap/6; verificação conjunta com o efeito de H no contato.
- Memória, PDF e JSON com comparação dos modelos, equações completas, valores intermediários e domínios de aplicação.
- Corrigida a divergência entre espaçamento calculado e desenhado da costura superior; eixos compartilhados entre motor, detalhe e vistas.
- Exemplos novos e testes analíticos de equilíbrio, mínimos, contato, compatibilidade e interface.
- Projetos salvos no esquema 4, com importação de 1–3, para preservar as novas opções de cálculo contra descarte em versões antigas.

## 0.6.0

### Interface e navegação

- Identidade ConsoloStruct, integrante do OpenStruct, com atualização dos ícones e identificação dos documentos.
- Expansão independente dos consolos na árvore do projeto.
- Edição da quantidade de peças pelo indicador ×n e fechamento/reabertura de abas.
- Criação de projeto após confirmação dos dados, preservando o projeto anterior ao cancelar.

### Desempenho

- Pan/zoom do detalhamento agrupados por quadro de tela.
- Preparação de detalhes em worker com alternativa local, cache por peça e desenho das regiões visíveis.
- Preparação gradual das combinações e verificações da memória.

### Compatibilidade e limites

- Novos projetos usam `.consolo.json`; leitura de `.lume.json` e dos esquemas anteriores preservada. O esquema atual continua sendo 3.
- Motor ELU mantido em 0.3.0, política LC-ELU-2026.1, sem ampliação para análise espacial ou global.
- Sem instaladores nativos pré-compilados nesta entrega.

Consulte [Desempenho 0.6](docs/DESEMPENHO-0.6.md) e o [registro de validação da entrega](docs/VALIDACAO.md). Esse registro descreve testes anteriores e suas limitações, não substitui a execução dos testes no checkout atual.

## Recursos anteriores incorporados

O código-fonte inclui detalhamento local 2D com quadro de aço e exportações DXF/SVG/PDF/CSV, vista 3D e motor ELU auditável. Consulte [Detalhamento](docs/DETALHAMENTO.md), [Arquitetura](docs/ARQUITETURA.md) e [Validação do motor](docs/VALIDACAO-MOTOR.md). Não foi reconstruído um histórico detalhado de releases anteriores.
