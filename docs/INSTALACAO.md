# Instalação e desenvolvimento

## Interface web

Requisitos: Git, Node.js **22.12 ou superior** e npm. A instalação inicial das dependências precisa de internet.

```bash
git clone https://github.com/ricardocorsini/consolo-struct.git
cd consolo-struct
npm ci
npm run dev
```

Abra http://127.0.0.1:1420. O servidor acompanha as alterações dos fontes. Encerre com `Ctrl+C`.

### Compilar e testar a interface pronta

O checkout do GitHub contém fontes; não presuma que exista uma pasta `dist/` ou um instalador pronto. Gere a interface:

```bash
npm run build
npm run preview
```

Use o endereço local exibido pelo Vite. Alternativamente, com Python 3 instalado, após gerar `dist/`:

```bash
bash INICIAR_WEB.sh
```

Abra http://127.0.0.1:8320. Para mudar a porta, execute `LUME_PORT=8321 bash INICIAR_WEB.sh`. Não abra `dist/index.html` via `file://`; os módulos exigem um servidor HTTP. Após a instalação e compilação, os recursos da interface são locais. Mantenha o terminal aberto durante o uso.

## Desktop no Ubuntu 24.04

O desktop usa Tauri 2 e exige Rust estável e bibliotecas nativas. Confira os [pré-requisitos oficiais](https://v2.tauri.app/start/prerequisites/) para seu sistema.

```bash
sudo apt update
sudo apt install -y build-essential pkg-config curl wget file \
  libwebkit2gtk-4.1-dev libxdo-dev libssl-dev \
  libayatana-appindicator3-dev librsvg2-dev patchelf
```

Instale Rust pelo [site oficial](https://www.rust-lang.org/tools/install), caso necessário. Depois, na raiz do repositório:

```bash
bash scripts/check-ubuntu.sh
npm ci
npm run desktop:dev
```

`desktop:dev` já inicia o Vite; não execute `npm run dev` simultaneamente na mesma porta. A primeira compilação Rust baixa dependências e pode demorar.

### Executável de produção

```bash
npm run desktop:build -- --no-bundle
./src-tauri/target/release/consolostruct
```

### Pacote Debian e AppImage

```bash
npm run desktop:build -- --bundles deb
sudo apt install ./src-tauri/target/release/bundle/deb/*.deb
```

O `.deb` é gerado em `src-tauri/target/release/bundle/deb/`. Para AppImage:

```bash
npm run desktop:build -- --bundles appimage
```

Saída em `src-tauri/target/release/bundle/appimage/`. Se houver erro de FUSE, consulte o ambiente do sistema; o AppImage também oferece `--appimage-extract-and-run`.

### Windows e macOS

Compile no respectivo sistema, após instalar seus pré-requisitos Tauri. Os destinos documentados são `npm run desktop:build -- --bundles nsis` (Windows) e `npm run desktop:build -- --bundles dmg` (macOS). Esses destinos e a execução nativa no WebKitGTK não foram validados na entrega original. Consulte [VALIDACAO.md](VALIDACAO.md); instruções de compilação não são garantia de instalador testado.

## Testes

```bash
npm run check
npm run build
npx playwright install chromium
npm run test:e2e
```

No Linux, bibliotecas adicionais do navegador podem exigir `npx playwright install --with-deps chromium`. Isso não é necessário para usar a interface em um navegador já instalado. O caminho de um navegador de testes existente pode ser informado por `LUME_TEST_BROWSER`.

## Problemas comuns

- **Node incompatível:** confira `node --version` e use a versão mínima indicada acima.
- **Porta ocupada:** encerre o processo anterior; no script Python, use `LUME_PORT`.
- **Pasta dist ausente:** execute `npm ci` e `npm run build` antes de `INICIAR_WEB.sh`.
- **Falha de compilação nativa:** execute `scripts/check-ubuntu.sh` no Ubuntu e confira os pré-requisitos do Tauri; a compilação web não testa a cadeia Rust/WebKitGTK.
- **Projeto não aparece no outro ambiente:** rascunhos web e desktop são independentes. Salve e transfira o arquivo `.consolo.json`.
