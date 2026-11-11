import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { cantileverFixture } from "../fixtures";
const open = async (
  page: import("@playwright/test").Page,
  piece: ReturnType<typeof cantileverFixture>,
) => {
  await page.goto("/");
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles({
    name: "cantilever.lume.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        format: "lumeconsolo",
        schemaVersion: 4,
        name: "Viga em balanço",
        client: "Validação",
        author: "",
        pieces: [piece],
      }),
    ),
  });
};
test("1 < a/d ≤ 2: calcula como viga em balanço, sem NaN na memória e na exportação", async ({
  page,
}) => {
  await open(page, cantileverFixture());
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-summary").first()).not.toContainText(
    "Fora do domínio do motor",
  );
  await expect(
    page
      .locator("tr")
      .filter({ hasText: "Compressão diagonal do concreto (viga em balanço)" })
      .first(),
  ).toContainText("Atende");
  await page
    .locator(".document-tabs")
    .getByRole("button", { name: "Memória", exact: true })
    .click();
  const memory = page.locator(".report-paper");
  await memory.locator(".case-memory > summary").first().click();
  await expect(memory.locator(".case-memory > summary").first()).toContainText(
    "Viga em balanço",
  );
  await expect(memory).toContainText("Msd = Vd·a + Hd·(hapoio + d′)");
  await expect(memory).not.toContainText("NaN");
  await expect(memory).not.toContainText("undefined");
  await expect(memory).not.toContainText("Comparação dos modelos");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Cálculo auditável/ }).click();
  const file = await download;
  const text = await readFile((await file.path())!, "utf8");
  expect(text).not.toContain("NaN");
  const data = JSON.parse(text);
  expect(data.result.combinations[0].method).toBe("beam");
  expect(data.result.combinations[0].classification).toBe("cantilever");
});
test("domínio inválido mostra armadura indeterminada em vez de número sentinela", async ({
  page,
}) => {
  await open(
    page,
    cantileverFixture({ vertical: 350000, loadOffset: 700, length: 800 }),
  );
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".calculation-metrics").first()).toContainText(
    "indeterminado",
  );
  await expect(
    page
      .locator("tr")
      .filter({ hasText: "Domínio da flexão (viga em balanço)" })
      .first(),
  ).toContainText("Não atende");
  await expect(page.locator(".calculation").first()).not.toContainText("NaN");
});
