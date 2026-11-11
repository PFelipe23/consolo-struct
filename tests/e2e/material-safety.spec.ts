import { test, expect, type Page, type Locator } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { shortFixture, cantileverFixture } from "../fixtures";

const commandName = "Coeficientes dos materiais da peça selecionada";
const concrete = (root: Locator) =>
  root.getByRole("textbox", {
    name: /^Coeficiente do concreto γc/,
  });
const steel = (root: Locator) =>
  root.getByRole("textbox", { name: /^Coeficiente do aço γs/ });
const production = (root: Locator) =>
  root.getByRole("combobox", { name: "Processo de produção", exact: true });
const action = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const settings = (page: Page) =>
  page.getByRole("tab", { name: "Configurações", exact: true });
const opener = (page: Page) =>
  page
    .getByRole("tabpanel")
    .getByRole("button", { name: commandName, exact: true });
async function open(page: Page) {
  await settings(page).click();
  await opener(page).click();
  const dialog = page.getByRole("dialog", { name: commandName });
  await expect(dialog).toBeVisible();
  return dialog;
}
async function edit(field: Locator, value: string) {
  await field.fill(value);
  await field.press("Enter");
}
async function save(page: Page) {
  const event = page.waitForEvent("download");
  await page
    .locator(".quick-access")
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  const path = (await (await event).path())!;
  return { path, project: JSON.parse(await readFile(path, "utf8")) };
}
async function calculate(page: Page) {
  await page.getByRole("tab", { name: "Início", exact: true }).click();
  await action(page, "Calcular").click();
}
async function memory(page: Page) {
  await page
    .locator(".document-tabs")
    .getByRole("button", { name: "Memória", exact: true })
    .click();
  await page.locator(".report-paper .case-memory > summary").first().click();
}

test.beforeEach(async ({ page }) => {
  const first = shortFixture(),
    second = cantileverFixture();
  first.name = "C01";
  second.name = "C02";
  const project = {
    format: "lumeconsolo",
    schemaVersion: 4,
    name: "Materiais",
    client: "",
    author: "",
    pieces: [first, second],
  };
  const raw = JSON.parse(JSON.stringify(project));
  for (const p of raw.pieces) {
    delete p.design.gammaC;
    delete p.design.gammaS;
  }
  await page.addInitScript(
    (raw) => localStorage.setItem("lumeconsolo.project.v1", raw),
    JSON.stringify(raw),
  );
  await page.goto("/");
});

test("abre legado sem editar e devolve foco ao comando", async ({ page }) => {
  const before = (await save(page)).project;
  const dialog = await open(page);
  await expect(concrete(dialog)).toHaveValue("1,4");
  await expect(steel(dialog)).toHaveValue("1,15");
  await expect(dialog).toContainText("Peça C01");
  await expect(dialog.getByRole("note")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener(page)).toBeFocused();
  await expect(action(page, "Desfazer")).toBeDisabled();
  expect((await save(page)).project).toEqual(before);
});

test("produção não preenche valores, edições são por peça e participam do histórico", async ({
  page,
}) => {
  let dialog = await open(page);
  await production(dialog).selectOption("factory");
  await expect(concrete(dialog)).toHaveValue("1,4");
  await expect(steel(dialog)).toHaveValue("1,15");
  await expect(dialog).toContainText(
    "Par de referência para Pré-fabricado (controle de fábrica): γc = 1,3 · γs = 1,1",
  );
  await edit(concrete(dialog), "1,3");
  await edit(steel(dialog), "1,1");
  await expect(dialog.getByRole("note")).toHaveCount(0);
  await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
  await action(page, "Desfazer").click();
  dialog = await open(page);
  await expect(steel(dialog)).toHaveValue("1,15");
  await page.keyboard.press("Escape");
  await action(page, "Refazer").click();
  await page
    .getByRole("tabpanel")
    .getByRole("button", { name: "Critérios da peça selecionada", exact: true })
    .click();
  const design = page.locator(".design-panel");
  await expect(concrete(design)).toHaveValue("1,3");
  await expect(steel(design)).toHaveValue("1,1");
  await production(design).selectOption("precast");
  await expect(design.getByRole("note")).toContainText(
    "γc adotado 1,3, abaixo da referência 1,4",
  );
  await expect(design.getByRole("note")).toContainText(
    "γs adotado 1,1, abaixo da referência 1,15",
  );
  await page
    .locator(".inspector-tabs")
    .getByRole("button", { name: "Materiais", exact: true })
    .click();
  await expect(page.locator(".inspector-tip")).toContainText(
    "Adotados: γc = 1,3 e γs = 1,1",
  );
  await page.locator(".tree-piece").filter({ hasText: "C02" }).click();
  dialog = await open(page);
  await expect(concrete(dialog)).toHaveValue("1,4");
  await expect(steel(dialog)).toHaveValue("1,15");
});

test("prévia do limite da biela usa os coeficientes editados em Configurações e Cálculo", async ({
  page,
}) => {
  const dialog = await open(page);
  await edit(concrete(dialog), "1,3");
  await edit(steel(dialog), "1,1");
  await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
  await action(page, "Limite da biela da peça selecionada").click();
  const strut = page.getByRole("dialog");
  await expect(strut).toContainText("Limite escolhido: 12,1846 MPa");
  await strut
    .getByRole("combobox", { name: "Critério do limite da biela", exact: true })
    .selectOption("fcd3");
  await expect(strut).toContainText("Limite escolhido: 14,6215 MPa");
  await strut.getByRole("button", { name: "Concluir", exact: true }).click();
  await page
    .getByRole("tabpanel")
    .getByRole("button", { name: "Critérios da peça selecionada", exact: true })
    .click();
  const design = page.locator(".design-panel");
  await expect(design.locator(".strut-limit-control")).toContainText(
    "Limite escolhido: 14,6215 MPa",
  );
  await edit(concrete(design), "1,4");
  await expect(design.locator(".strut-limit-control")).toContainText(
    "Limite escolhido: 13,5771 MPa",
  );
});

test("campos rejeitam limites inválidos e importação inválida preserva projeto", async ({
  page,
}) => {
  const dialog = await open(page);
  for (const field of [concrete(dialog), steel(dialog)]) {
    for (const value of ["0,9", "2,01", "Infinity", ""]) {
      await edit(field, value);
      await expect(field).toHaveAttribute("aria-invalid", "true");
      await expect(dialog.getByRole("alert")).toContainText("Informe 1 a 2");
    }
    await edit(field, "2");
    await expect(field).toHaveAttribute("aria-invalid", "false");
  }
  await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
  const before = (await save(page)).project;
  const invalid = structuredClone(before);
  invalid.pieces[0].design.gammaC = 0.9;
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles({
    name: "invalid.consolo.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await expect(page.getByRole("status")).toContainText("Projeto inválido");
  expect((await save(page)).project).toEqual(before);
});

for (const piece of ["C01", "C02"]) {
  test(`salva e reabre adotados; memória e auditoria registram referência e review — ${piece}`, async ({
    page,
  }) => {
    await page.locator(".tree-piece").filter({ hasText: piece }).click();
    const dialog = await open(page);
    await edit(concrete(dialog), "1,3");
    await edit(steel(dialog), "1,1");
    await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
    const saved = await save(page);
    const p = saved.project.pieces.find(
      (p: { name: string }) => p.name === piece,
    );
    expect(p.design).toMatchObject({ gammaC: 1.3, gammaS: 1.1 });
    await page.getByLabel("Abrir arquivo de projeto").setInputFiles(saved.path);
    await page.locator(".tree-piece").filter({ hasText: piece }).click();
    await calculate(page);
    await expect(page.locator(".result-summary").first()).not.toContainText(
      "Atende às verificações implementadas",
    );
    await memory(page);
    const paper = page.locator(".report-paper");
    for (const label of [
      "γc adotado",
      "γs adotado",
      "γc de referência da produção",
      "γs de referência da produção",
    ])
      await expect(paper.getByText(label, { exact: true })).toBeVisible();
    await expect(
      paper
        .locator("tr.result-review")
        .filter({ hasText: "Coeficientes dos materiais abaixo da referência" })
        .first(),
    ).toBeVisible();
    await action(page, "Exportar").click();
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: /Cálculo auditável/ }).click();
    const audit = JSON.parse(
      await readFile((await (await event).path())!, "utf8"),
    );
    expect(audit.result.values).toMatchObject({
      gammaC: 1.3,
      gammaS: 1.1,
      gammaCReference: 1.4,
      gammaSReference: 1.15,
    });
    expect(
      audit.result.checks.find((c: { id: string }) => c.id === "materialSafety")
        .status,
    ).toBe("review");
  });
}

test("diálogo em ambos os temas e janela estreita mantém rolagem, foco e controles acessíveis", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await action(page, "Alternar tema").click();
      const dialog = await open(page);
      await edit(concrete(dialog), "1,3");
      await edit(steel(dialog), "1,1");
      await expect(dialog.getByRole("note")).toBeVisible();
      await dialog
        .getByRole("button", { name: "Concluir", exact: true })
        .scrollIntoViewIfNeeded();
      expect(
        await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await dialog
        .getByRole("button", { name: "Concluir", exact: true })
        .click();
      await expect(opener(page)).toBeFocused();
    }
  }
});
