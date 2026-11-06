# Publicar o ConsoloStruct no Struct Launcher

O produto `consolostruct` já integra o catálogo OpenStruct. O workflow de publicação está
conectado ao hub público `ricardocorsini/openstruct-catalog`, com assinatura individual dos
pacotes e catálogo assinado. A chave do produto é `consolostruct-packages-v1`.

## Preparar a versão

Mantenha a versão igual em package.json, Tauri e Cargo. O comando abaixo sincroniza esses
arquivos e os lockfiles, sem criar commit ou publicar uma versão:

```sh
npm run release:version -- 0.6.1
npm run format
npm run check
```

Revise e envie o commit normalmente. A primeira versão do código recebido nesta integração
é 0.6.0. Sua publicação deve acontecer depois de concluir os ajustes e aprovar a validação.

## Publicar pelo GitHub

Na aba Actions, selecione **Publish release → Run workflow**, escolha a branch master e
informe a tag da versão, por exemplo `v0.6.0`. O workflow confere as versões do código e cria
a tag, se necessário. Uma tag existente é preservada e deve apontar para o mesmo código.

Também é possível criar/enviar uma tag `v…` pelo Git. Para uma solicitação versionada de release,
crie `.github/release-request.json` com o número da versão e o SHA completo do commit revisado:

```json
{
  "schemaVersion": 1,
  "tag": "v0.6.0",
  "commit": "SUBSTITUA_PELO_SHA_COMPLETO_DO_CODIGO_REVISADO"
}
```

O commit dessa solicitação na branch master dispara a mesma esteira. Não substitua o SHA
pelo nome de uma branch: a release deve apontar para código imutável e revisado.

## Resultado

A esteira compila **Windows x64 / NSIS** e **Linux x64 / AppImage**, aguarda os dois builds,
calcula SHA-256 e assina os arquivos antes de publicar a release completa. O catálogo do
launcher detecta a release assinada e oferece Instalar ou Atualizar.

Os Secrets do produto são `OPENSTRUCT_PACKAGE_KEY` e, opcionalmente, o token de notificação
`OPENSTRUCT_DISTRIBUTION_TOKEN`. A chave pública já está registrada no hub. Nunca inclua chaves
privadas no código ou nas solicitações de release.

Esta preparação não cria uma tag ou release do ConsoloStruct antes da revisão do código.
O CI usa Ubuntu 24.04 para manter compatibilidade com o Playwright 1.58.2 fixado no projeto.
