# Histórico de alterações

Este arquivo resume as mudanças documentadas no código-fonte recebido. Não pressupõe que existam tags, releases publicadas ou instaladores para cada versão.

## Não lançado

- Simplifica o ribbon de 63 para 47 posições, preservando as 39 ações. Início reúne oito atalhos do fluxo frequente; Modelo concentra a edição completa, inclusive Excluir; Documentação concentra documentos e saídas diretas.
- Centraliza rótulos, ícones e ajuda em um catálogo tipado. Padroniza Salvar projeto e Detalhamento e distingue edição de armaduras/ações da visibilidade das vistas. Mantém controles contextuais e exportadores especializados.
- Preserva alturas do ribbon, permite rolagem das abas e melhora a legibilidade dos botões. Expõe estados dos modos locais e retorna o foco ao comando que abriu um diálogo.
- Mantém Tema em Exibir enquanto Configurações (#7) não estiver integrada à master. Nenhuma alteração no motor, formato de projeto, unidades ou conteúdo das exportações.

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
