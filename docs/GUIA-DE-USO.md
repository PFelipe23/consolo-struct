# Guia de uso

O ConsoloStruct calcula o **ELU estático local de consolos curtos e muito curtos de concreto armado**. Não substitui o projeto estrutural completo nem a conferência do responsável técnico. Antes do uso profissional, leia [Critérios de cálculo](CRITERIOS-DE-CALCULO.md), [Validação do motor](VALIDACAO-MOTOR.md) e [Detalhamento](DETALHAMENTO.md).

## 1. Criar ou abrir um projeto

Use **Novo projeto** e confirme nome, cliente e responsável em Dados do projeto. Cancelar mantém o projeto anterior. Use **Abrir** para carregar um projeto; o exemplo `examples/casos-validacao.lume.json` permite explorar o motor, e `examples/detalhamento/consolos-detalhados.lume.json` demonstra tirantes simples e duplos.

Novos arquivos usam `.consolo.json`; os antigos `.lume.json` continuam reconhecidos. O esquema atual é 3. Projetos antigos precisam da revisão dos parâmetros migrados antes de calcular. Salve com `Ctrl+S` (ou `Cmd+S` no macOS). Rascunhos do navegador e desktop são separados; transfira o arquivo de projeto para mudar de ambiente.

## 2. Conferir entradas

Selecione o consolo e revise geometria, materiais, cargas, armaduras e a aba **Cálculo** das propriedades. Confira apoio, ligação, durabilidade, ancoragens e combinações.

- A interface utiliza cm, kN e cm² conforme o campo; bitolas são em mm. O motor trabalha internamente em mm, N e MPa.
- Use ponto ou vírgula decimal, sem separador de milhar.
- No modo H estimado, H digitado é **adicional** ao coeficiente do apoio. No modo análise, é a resultante total e exige justificativa.
- Ações já de cálculo devem incluir γf e γn; não há segunda majoração.
- N1 conta ramos longitudinais. N2/N3/N4/N5 contam estribos fechados com dois ramos efetivos.
- Alterar bitolas, camadas, estribos ou cobrimento pode modificar a altura útil e o modelo resistente.
- As combinações são fornecidas pelo projetista; não há geração automática segundo NBR 8681.

## 3. Calcular e ler a memória

Clique em **Calcular** e consulte **Memória**. Expanda combinações e verificações para examinar fórmulas, resultados e referências. Alterações nas entradas invalidam o resultado anterior; recalcule antes de interpretar a peça.

Os estados distinguem: atendimento às verificações implementadas, verificações não atendidas, necessidade de conferência complementar, entradas inválidas e mecanismo fora do domínio. **Atender às verificações implementadas não equivale à aprovação executiva.**

**Sugerir armaduras** pesquisa candidatos de bitola, quantidade e camadas. A sugestão não resolve geometria, solda ou armadura existente no suporte. Confira as pendências mesmo após aceitar um arranjo.

Para experimentar uma falha conhecida, no exemplo Curto-ELU reduza a ancoragem disponível no suporte para 5 cm, recalcule e leia a memória. Desfaça a alteração antes de prosseguir. O exemplo Muito-curto-ELU conserva pendência explícita de ductilidade; Junta-rugosa exige confirmação da preparação da interface.

## 4. Navegar pelas vistas

- Em 2D: botão central ou Espaço + arrastar para pan; roda para zoom no cursor; `F` enquadra.
- Clique em uma cota para editar; `Enter` confirma e `Esc` cancela. `Ctrl+Z` desfaz e `Ctrl+Shift+Z` refaz.
- Em **Vista 3D**, arraste com o botão esquerdo para orbitar e com central/direito ou Espaço para pan. Use os presets Frontal, Superior, Lateral e Isométrica.
- Em **Exibir**, alterne cotas, cargas, armaduras, grade e transparência.
- A árvore pode manter vários consolos expandidos. Expandir não troca a seleção. Clique em ×n para editar a quantidade.
- Feche abas pelo × e reabra pelo navegador ou faixa de ferramentas. Fechar uma vista preserva o projeto.

A vista 3D e suas armaduras são representações esquemáticas, não análise resistente espacial nem detalhamento executivo. As setas mostram ações de entrada da combinação Principal, sem escala de intensidade. A câmera não altera os dados de cálculo.

## 5. Detalhar e exportar

Em **Detalhamento**, escolha **Somente este consolo** ou **Todos os consolos**, confira revisão, notas, camadas e armaduras. A quantidade multiplica o quadro de aço. Tirante duplo significa duas camadas na mesma face, não consolos nas duas faces do pilar.

- **DXF/SVG/PDF/CSV de detalhamento:** desenhos e comprimentos em cm, bitolas em mm. O quadro conta barras físicas, não apenas ramos.
- **Geometria DXF:** exportação antiga de contornos em mm, diferente do detalhamento.
- **Memória de cálculo:** relatório separado do desenho.
- **Cálculo auditável (`.calc.json`):** entradas e resultado com precisão completa; não é um arquivo importável como projeto.

As exportações de cálculo usam entradas atuais. No detalhamento, exportar pode ser permitido mesmo com pendências para revisão. A identificação **Para conferência do responsável técnico** não libera a execução; **Pendências impeditivas** exige correção. Consulte as convenções de corte, escala e fabricação em [DETALHAMENTO.md](DETALHAMENTO.md).

## Limites essenciais

Peças com 1 < a/d ≤ 2 são calculadas como viga em balanço (flexão simples e cisalhamento pelo Modelo I) quando o modelo resistente está em **Automático por a/d**; bielas e tirantes ou atrito escolhidos explicitamente nessa faixa são recusados. Acima de 600 mm de altura, a armadura de pele dessa faixa aparece como pendência a conferir, pois não é detalhada pelo programa. A viga em balanço não tem verificação de ELS, fissuração ou flecha.

Não estão incluídos dentes Gerber, consolos duplos/contínuos, a/d > 2, fadiga, ELS/fissuração, estrutura global, análise resistente espacial, dimensionamento dos pinos/chumbadores, aparelho de apoio completo, metalurgia das soldas ou compatibilização integral com as armaduras do suporte. Ductilidade do modelo de atrito e situações especiais de alça/gancho continuam com pendências explícitas.

O aplicativo aceita até 200 tipos de peça, 20 combinações adicionais por peça e projetos JSON de até 2 MB. Salve cópias de seus arquivos e retire dados privados antes de compartilhar exemplos em issues.
