# Validação da revisão Base Consolo — 0.7.0

Motor 0.4.0, política LC-ELU-2026.2. Referências, diferenças e decisões estão em [COMPARACAO-BASE-CONSOLO.md](COMPARACAO-BASE-CONSOLO.md).

## Verificações locais

- `npm ci`: instalação pelo lockfile.
- `npm run format:check`: formatação do código e documentação.
- `npm run check`: TypeScript e **110 testes** de domínio/cálculo/detalhamento/visualização; 16 testes novos cobrem o trecho bibliográfico e a reação deslocada.
- `npm run build`: geração da interface de produção.
- `LUME_TEST_BROWSER=/tmp/chromium npm run test:e2e`: **26 testes de interface**, incluindo leitura dos arquivos antigos, salvamento no esquema 4, critérios complementares, reação deslocada exportada, memória comparativa, desenho, 3D, abas, histórico, pan sem renderização por evento e quantitativos.
- Memória PDF gerada com o exemplo complementar: fórmulas, números, β transliterado, versão do motor e snapshot das entradas conferidos; revisão visual por renderização. O arquivo de QA não é um projeto executivo nem é distribuído como exemplo do livro.

## Conferência numérica independente

Para Vd=200000 N, Hd=50000 N, a=300 mm, d=400 mm, d_h=80 mm e b=300 mm, uma conta decimal separada com 35 dígitos fornece:

| Grandeza                     |                  Valor |
| ---------------------------- | ---------------------: |
| z                            |                 360 mm |
| a_bie                        |  230,46638387921275 mm |
| T                            |   227777,77777777778 N |
| Rc                           |   277697,76625445882 N |
| σc                           |  11,57074026060245 MPa |
| As com fyk=500 MPa e γs=1,15 | 523,88888888888889 mm² |

Os testes comparam essas constantes, o equilíbrio de momentos e a equivalência algébrica dos critérios de tensão com H=0. Não se trata de um exemplo publicado no trecho, que não contém exercício numérico completo.

## Distribuição

Os instaladores Linux AppImage e Windows NSIS são gerados pelo workflow de release já usado pelo OpenStruct. A compilação nativa, a assinatura dos pacotes, os hashes e a sincronização do catálogo são verificações da distribuição executadas no GitHub; os testes locais do navegador não substituem esses builds. O histórico das execuções é a evidência de cada publicação.

Os limites anteriores de ELU local, ancoragens especiais, ELS, aparelhos de apoio, torção e Gerber continuam registrados. O caso “Reação 3/4 L — ductilidade” mantém a falha de ductilidade que resulta dos dados informados; o caso “Contato parcial” permanece bloqueado. Não se alteram entradas para esconder essas condições.
