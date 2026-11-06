# Segurança

## Escopo

Esta política trata de vulnerabilidades do software, como acesso indevido a arquivos, execução de conteúdo não confiável e exposição de dados. Erros de dimensionamento e divergências numéricas também merecem atenção, mas devem ser descritos com o modelo de **Divergência de cálculo**, sem dados confidenciais.

Não há compromisso documentado de manutenção de versões antigas ou prazo garantido de correção. Ao relatar um problema, informe a versão do aplicativo e, se disponível, o commit utilizado.

## Relatar uma vulnerabilidade

Não publique segredos, dados pessoais, arquivos privados ou detalhes de exploração em uma issue pública.

1. Consulte a aba **Security** deste repositório. Se a opção **Report a vulnerability** estiver disponível, use o relato privado do GitHub.
2. Se essa opção não estiver disponível, abra uma issue apenas solicitando um canal privado de contato, sem detalhes de exploração nem anexos sensíveis. Aguarde a indicação de um canal pelo mantenedor.

Este documento não confirma que o relato privado esteja habilitado. Não há um endereço de contato privado publicado aqui.

No canal privado confirmado, forneça versão/commit, sistema operacional, passos mínimos de reprodução, impacto observado e, quando possível, uma amostra sintética. Faça testes apenas em ambientes e arquivos que você está autorizado a usar.

## Cuidados com projetos e resultados

- Trate arquivos de projeto recebidos como conteúdo não confiável e mantenha cópias de segurança.
- Remova dados de clientes antes de compartilhar projetos, memórias ou capturas.
- Não exponha o servidor local de desenvolvimento à internet como se fosse um serviço de produção.
- Revise dependências e avisos de segurança antes de distribuir uma compilação.
- O aplicativo não certifica projetos estruturais. Resultados, pendências e desenhos exigem conferência por responsável técnico; leia os [limites do cálculo](docs/CRITERIOS-DE-CALCULO.md) e do [detalhamento](docs/DETALHAMENTO.md).
