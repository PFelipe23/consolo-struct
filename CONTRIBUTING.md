# Como contribuir

Contribuições de código, documentação e casos de reprodução são bem-vindas. Antes de propor uma mudança, consulte o [README](README.md), a [arquitetura](docs/ARQUITETURA.md) e os [critérios de cálculo](docs/CRITERIOS-DE-CALCULO.md).

## Abrir uma issue

Use o modelo apropriado: erro do aplicativo, divergência de cálculo ou proposta de recurso. Pesquise issues existentes e descreva uma ocorrência por issue. Remova nomes de clientes, dados pessoais e informações confidenciais dos exemplos e imagens. Não publique arquivos de terceiros sem autorização.

Uma divergência numérica deve incluir entradas e unidades, hipótese adotada, resultado obtido e esperado, referência com edição/item e um exemplo mínimo. Os testes atuais não representam certificação normativa nem aprovação de projeto. Suspeitas de vulnerabilidade de software seguem [SECURITY.md](SECURITY.md).

## Preparar o ambiente

Consulte [Instalação](docs/INSTALACAO.md). Para trabalhar na interface web:

```bash
git clone https://github.com/ricardocorsini/consolo-struct.git
cd consolo-struct
npm ci
npm run dev
```

Use Node.js 22.12 ou superior. O aplicativo desktop também exige Rust e os pré-requisitos nativos do Tauri.

## Preparar uma alteração

1. Crie uma branch com nome descritivo a partir da versão atual do repositório.
2. Mantenha a alteração focada e preserve os limites declarados do motor.
3. Adicione testes de regressão para defeitos corrigidos e atualize a documentação afetada.
4. Para cálculo, registre unidades, equações, referências e decisões; cubra limites de domínio, entradas inválidas e resultados pendentes. Não transforme pendências em aprovação apenas para obter um teste verde.
5. Para arquivos de projeto, preserve a compatibilidade ou documente e teste a migração. Nunca reutilize resultados antigos após alterar entradas.
6. Verifique licenças ao introduzir dependências ou recursos de terceiros; atualize os avisos aplicáveis.

## Verificar antes do pull request

```bash
npm run format:check
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

No Linux, o navegador de testes pode exigir `npx playwright install --with-deps chromium`. Para mudanças desktop, teste também o fluxo Tauri no sistema correspondente. Informe verificações não executadas e seus motivos; não apresente uma compilação web como teste nativo.

O projeto usa Prettier. `npm run format` formata várias pastas e arquivos; revise o diff para evitar mudanças não relacionadas. Não inclua `node_modules/`, `dist/`, saídas de testes, credenciais ou dados privados no commit.

## Enviar o pull request

Descreva o problema, a solução, a relação com issues e os testes efetivamente executados. Inclua imagens para mudanças visuais e exemplos reproduzíveis para mudanças de cálculo. Destaque incompatibilidades e limitações restantes. Use o modelo de pull request do repositório.

As contribuições de código devem ser compatíveis com a [licença MIT](LICENSE) do projeto. Não copie texto integral de normas ou conteúdo protegido sem permissão; cite as fontes e seus itens.
