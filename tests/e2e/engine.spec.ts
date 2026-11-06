import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { shortFixture } from "../fixtures";
const project = () => ({
  format: "lumeconsolo",
  schemaVersion: 2,
  name: "Regressão ELU",
  client: "Validação",
  author: "",
  pieces: [shortFixture()],
});
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles({
    name: "engine.lume.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(project())),
  });
});
test("calcula, altera ancoragem e identifica a revisão obsoleta", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-summary").first()).toContainText(
    "Atende às verificações implementadas",
  );
  await page
    .getByRole("button", { name: "Critérios de cálculo", exact: true })
    .click();
  await page
    .locator(".design-panel")
    .getByText("Ancoragem no suporte", { exact: true })
    .click();
  const field = page.getByLabel("Comprimento disponível da ancoragem");
  await field.fill("5");
  await field.press("Enter");
  await expect(
    page.getByText("Cálculo desatualizado", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(
    page.locator("tr").filter({ hasText: "Ancoragem do tirante no suporte" }),
  ).toContainText("Não atende");
});
test("inclui combinação, exporta memória auditável e preserva simultaneidade", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Critérios de cálculo", exact: true })
    .click();
  await page
    .locator(".design-panel")
    .getByText("Combinações adicionais (0)", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Adicionar combinação", exact: true })
    .click();
  await page.getByLabel("V · 1").fill("200");
  await page.getByLabel("V · 1").press("Enter");
  await page.getByLabel("H · 1").fill("20");
  await page.getByLabel("H · 1").press("Enter");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /Cálculo auditável/ }).click();
  const file = await dl;
  const r = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(r.result.engineVersion).toBe("0.3.0");
  expect(r.result.combinations).toHaveLength(2);
  expect(r.result.combinations[1].values.vertical).toBe(200000);
  expect(r.result.combinations[1].values.horizontal).toBe(20000);
  expect(r.input.design.combinations[0].vertical).toBe(200000);
});
test("sugestão de armadura pode ser desfeita e não altera suporte", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Sugerir armaduras", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Arranjo sugerido");
  let dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  let file = await dl;
  let saved = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(
    saved.pieces[0].rebar.tieCount * saved.pieces[0].rebar.tieDiameter ** 2,
  ).not.toBe(4 * 16 ** 2);
  expect(saved.pieces[0].design.supportRebarArea).toBe(1000);
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  file = await dl;
  saved = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(saved.pieces[0].rebar.tieCount).toBe(4);
  expect(saved.pieces[0].rebar.tieDiameter).toBe(16);
});
test("bloqueia cálculo com rascunho numérico inválido visível", async ({
  page,
}) => {
  await page.getByLabel("Altura no pilar").fill("-5");
  await page.getByLabel("Altura no pilar").press("Enter");
  await expect(page.getByLabel("Altura no pilar")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "campo com valor inválido",
  );
  await expect(page.locator(".result-summary")).toHaveCount(0);
});
