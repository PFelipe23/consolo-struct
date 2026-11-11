# Validação do limite selecionável da biela — issue #5

Base: `9d3b1f2ecc9897ebc1c3924ef27b4027f5d9efdc`, após sincronizar original e fork. Essa versão já contém Configurações, o ribbon simplificado e a viga em balanço. A escolha fica em `design.strutLimit`, na peça; não foram criados padrões globais nem uma aplicação em massa a outras peças. O esquema do projeto permanece 4.

| Verificação            | Antes                | Depois               |
| ---------------------- | -------------------- | -------------------- |
| `npm run format:check` | Aprovado             | Aprovado             |
| `npm run check`        | 131 testes aprovados | 145 testes aprovados |
| `npm run build`        | Aprovado             | Aprovado             |
| `npm run test:e2e`     | 52 testes aprovados  | 58 testes aprovados  |

Os avisos de build sobre anotações do Zod, importação estática/dinâmica de `detailing/job` e chunks acima de 500 kB já existiam no baseline. Uma tentativa inicial de E2E foi interrompida após interferência na otimização de dependências do servidor de desenvolvimento (`504 Outdated Optimize Dep`); depois de reiniciar o servidor, a execução integral do baseline passou. Não há falhas pendentes nas verificações finais.

## Regressão do padrão conservador

Antes de alterar o código, foram registrados os resultados de 153 entradas: 150 variações combinando fck = 20/30/50/70/90 MPa, métodos auto/strut/friction, a/d = 0,35/0,5/0,7/1/1,4 e carga direta/indireta, mais três casos de viga em balanço. O a/d da matriz usa d = 460,7 mm do caso-base. As mesmas entradas legadas, sem `strutLimit`, produziram resultados completos de `calculate()` idênticos após a alteração, incluindo situações inválidas ou fora do domínio.

Também foram comparadas duas sugestões de armaduras, quatro preparações de detalhamento e amostras de SVG, DXF, CSV e cálculo auditável. Permaneceram idênticas; somente o carimbo de emissão foi retirado da comparação do cálculo auditável. O teste permanente compara campo ausente e `fcd2` explícito sem a assinatura de entradas: essa assinatura passa a incluir o campo quando ele está presente, sem alterar valores, fórmulas ou estados do cálculo padrão.

## Cobertura acrescentada

- [Testes de domínio](../tests/strutLimit.test.ts): quatro limites para C30 e γc = 1,4, compatibilidade da carga, arquivos antigos, esquema 4, valores fixos de nós/apoio/escoamento/inclinação, complemento de El Debs, combinações, preservação de atrito/viga em balanço e de `review` na sugestão.
- [Testes de interface](../tests/e2e/strut-limit.spec.ts): acesso por Configurações, controle compartilhado com Cálculo, teclado, fechar/reabrir e retorno do foco, histórico, isolamento das outras peças, arquivos incompatíveis, salvar/reabrir, memória, PDF e cálculo auditável, dois temas e janela de 390 px.
- Verificações existentes de domínio, documentos, cálculo, detalhamento e interface preservadas. Os testes de composição foram ajustados para o novo comando em Configurações, mantendo as 39 ações anteriores.

Para C30, foram conferidos os limites 11,314285714285717 (`fcd2`), 13,577142857142857 (`fcd3`), 18,214285714285715 (`indirect085`) e 21,42857142857143 MPa (`direct100`), com tolerância mais estrita que 1e-4. A opção `fcd3` preserva integralmente as outras verificações e acrescenta `strutLimitCriterion` em `review`.

## Limites e capturas

A validação executada é web/Chromium. Não foi executado Tauri nativo: este ambiente não dispõe do toolchain Rust. As referências das alternativas são as indicadas no repositório e não foram conferidas nos textos normativos nesta contribuição; a escolha exige conferência do responsável técnico, conforme [Critérios de cálculo](CRITERIOS-DE-CALCULO.md#critério-selecionável-do-limite-da-biela).

[Tema claro](images/limite-biela-claro.png) · [Tema escuro](images/limite-biela-escuro.png) · [Janela estreita](images/limite-biela-janela-estreita.png)
