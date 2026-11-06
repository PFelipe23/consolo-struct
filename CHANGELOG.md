# Histórico de alterações

Este arquivo resume as mudanças documentadas no código-fonte recebido. Não pressupõe que existam tags, releases publicadas ou instaladores para cada versão.

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
