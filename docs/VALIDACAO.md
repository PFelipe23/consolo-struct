# Validação da entrega 0.6.0

Registro da distribuição ZIP, testada em 05/11/2026. O `dist/` citado neste registro pertence à distribuição original e não é versionado no repositório; gere-o com `npm run build`. O motor e os critérios são descritos em `CRITERIOS-DE-CALCULO.md`; a comparação com referências está em `VALIDACAO-MOTOR.md`.

## Verificação da preparação do repositório

Na preparação para publicação em 05/11/2026, foram repetidos `npm run check` (TypeScript e 94 testes aprovados), `npm run build` e `npm run format:check`, todos com sucesso. Também foram conferidos os links locais do README e a sintaxe dos scripts de shell.

A repetição dos 25 testes de interface foi bloqueada antes de qualquer cenário: o Chromium não pôde abrir seu socket local no ambiente de execução. Portanto, esta rodada não confirma os testes de interface; os resultados da distribuição original abaixo são um registro anterior. Rust/Cargo não estavam disponíveis, de modo que não houve compilação nativa nesta rodada.

O workflow de CI do repositório executa os checks web e a suíte de interface em ambiente próprio. Consulte o resultado associado ao commit usado; a existência do workflow não implica aprovação.

## Verificações executadas na distribuição original

| Verificação                                                              | Resultado                                                                                                          |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| TypeScript estrito — `npm run check`                                     | Aprovado                                                                                                           |
| Vitest — domínio e cálculo                                               | 94 testes aprovados (63 de domínio/cálculo, 9 de geometria 3D, 16 de detalhamento e 6 de navegação/cache)          |
| Playwright — editor e fluxos do motor                                    | 25 testes aprovados (19 fluxos anteriores e 6 de criação, árvore, quantidades, abas, desempenho e compatibilidade) |
| Compilação — `npm run build`                                             | Aprovada; `dist/` incluído                                                                                         |
| Aplicativo compilado servido localmente, requisições externas bloqueadas | Funcional; nenhuma requisição externa ou erro JavaScript                                                           |
| PDF gerado pelo aplicativo                                               | Memória de 9 páginas; detalhes de 3 páginas, extraídos e inspecionados                                             |
| Snapshot `.calc.json` exportado                                          | Versão 0.3.0, entradas e resultado coerentes com o exemplo Curto-ELU                                               |
| DXF                                                                      | Geometria em mm mantida; detalhes em cm, reabertos com ezdxf sem erros ou reparos                                  |
| Interface clara/escura, notebook                                         | Inspeção visual; sem transbordamento da janela                                                                     |

O Vite informou remoção de comentários de anotação de pureza em dependência Zod. Não houve falha de compilação. O PDF de exemplo da memória pode ser gerado pelo aplicativo. Os PDFs pré-gerados dos exemplos não estão incluídos neste repositório.

## Fluxos de interface

Pan por botão central/Espaço/ferramenta, zoom no cursor, cotas paramétricas, desfazer/refazer, abertura e salvamento, exportações, temas e painéis foram preservados. Novos testes cobrem cálculo atendido, edição de ancoragem causando falha, invalidação de resultado, combinação adicional, exportação completa do cálculo, sugestão reversível de armadura e bloqueio por campo inválido visível.

Os testes de layout existentes cobrem 1920×1080, 1440×1050, 1366×768, 960×640 e 390×844. A inspeção da distribuição compilada incluiu 1440×1080 e 1366×768. O uso principal continua sendo desktop.

## O que não foi compilado/testado

Não foi produzido instalador nativo. O ambiente possui Node 24.22.1; nesta rodada o comando Cargo não estava disponível, e não foi possível executar a cadeia nativa. A configuração, o nome do binário e os ícones Tauri foram atualizados. O identificador de armazenamento anterior foi preservado para compatibilidade com os rascunhos existentes. O teste visual foi realizado no Chromium de teste (133), usando a mesma interface e motor do pacote Tauri, sem executar WebKitGTK.

Não foram executadas compilações Windows/macOS, assinatura digital, notarização, instalação em diferentes versões do Ubuntu ou verificação independente por outro engenheiro. O pacote contém o projeto Tauri e instruções para compilá-lo localmente. Não contém `.deb`, AppImage, `.exe` ou `.dmg` prontos.

Os testes numéricos não equivalem à certificação nem à verificação integral das normas. ELS, dispositivo de apoio completo, suporte global, detalhes especiais e escopo excluído permanecem explicitados no motor e no documento de critérios.

## Reprodução

```bash
npm ci
npm run check
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
```

Em uma máquina com um Chromium de teste já instalado, pode-se informar seu caminho por `LUME_TEST_BROWSER`. A interface pronta em `dist/` pode ser testada por `bash INICIAR_WEB.sh`, sem instalar Node ou Rust.

## Visualização 3D

Foram exercitados WebGL 2 com renderização por software no Chromium de teste e o fallback SVG com WebGL indisponível. Os cinco testes cobrem órbita, pan, zoom, enquadramento, presets, edição das cotas, histórico, arquivo de projeto, camadas, temas, modo compatível e trocas repetidas de vista. A geração da malha foi confrontada com dimensões e volume conhecidos.

A distribuição compilada foi servida por HTTP local com acesso externo bloqueado. A vista 3D abriu, exibiu as seis cotas e não gerou erros JavaScript. O módulo ThreeViewport não foi requisitado na abertura da vista 2D; foi carregado ao selecionar 3D. Também foram inspecionadas as vistas sólida/translúcida, tema escuro, superior, modo compatível e telas 1440×1050, 1366×768 e 390×844.

A renderização para em repouso; a suíte confirmou que o contador de quadros fica estável no modo compatível. A troca de vista remove a cena anterior. Esses testes não medem desempenho em todas as GPUs ou versões do WebKitGTK.

O Vite emite aviso de tamanho do módulo 3D (aproximadamente 627 kB minificado, 162 kB gzip). Esse módulo é local e carregado sob demanda. A compilação foi concluída. A configuração Tauri continua incluída; não foi produzido instalador nativo nesta entrega.

## Detalhamento 0.5

As 16 verificações novas cobrem desenvolvimento de alça por arcos, mandris, ganchos 135°, massa teórica, quantidade de barras físicas, tirante duplo, posições variáveis, comprimentos de corte, multiplicação pelas peças, ganchos no suporte, pinos, interferência pino/tirante, migração, unidades DXF, exportação de todos e escape de campos editáveis. Os três fluxos novos de interface exercitam escopo individual/todos, DXF/CSV/PDF, camadas, revisão, notas, histórico, arquivo salvo, pan/zoom, temas e bloqueio por campo inválido.

Os exemplos de C01 e C02 atendem às verificações de cálculo e geometria implementadas. Permanecem a conferência com a armadura do suporte e, em C02, a verificação específica dos pinos. Nenhum arquivo recebe liberação automática para execução.

O DXF de todos os consolos usa unidades 5 (cm), inclui arcos editáveis e foi reaberto/auditado pelo ezdxf. A saída PDF usa três páginas livres: uma por tipo e uma de resumo geral. Todas foram renderizadas para inspeção, com atenção aos cortes, formas e quadro de aço. Os desenhos não usam uma folha A1 fixa.

A distribuição compilada foi conferida localmente com requisições externas bloqueadas, nos temas claro e escuro. Detalhamento e jsPDF são carregados sob demanda; não há necessidade de rede para exportar. O teste não inclui instalação nativa ou execução em WebKitGTK.

## Navegação e identidade 0.6

A suíte exercita a criação do projeto somente após confirmar Dados do projeto, cancelamento sem substituir o projeto anterior, edição da quantidade no navegador com multiplicação no CSV, expansão simultânea de C01 e C02, fechamento/reabertura das abas, preservação da câmera entre Memória e Detalhamento e carregamento gradual das combinações. Um teste força indisponibilidade do worker e verifica a alternativa local.

O pan é medido por instrumentação de commits React: a sequência de 30 movimentos deve permanecer abaixo de cinco commits, em vez de um por evento. Exportar Todos continua incluindo as peças fora da região atualmente desenhada. O Atlas foi convertido para ícones PNG/ICO/ICNS pelo gerador oficial do Tauri. A memória e os detalhes PDF receberam a nova identificação.
