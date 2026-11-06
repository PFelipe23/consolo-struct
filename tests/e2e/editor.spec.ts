import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
test("edita, desfaz, salva, reabre, revisa e exporta", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "C01 · Apoio principal" }),
  ).toBeVisible();
  await page.getByLabel("Altura no pilar").fill("45,5");
  await page.getByLabel("Altura no pilar").press("Enter");
  await expect(page.locator("svg").getByText("h = 45,5")).toBeVisible();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(page.getByLabel("Altura no pilar")).toHaveValue("40");
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(page.getByLabel("Altura no pilar")).toHaveValue("45,5");
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await expect(page.locator(".result-summary").first()).toContainText(
    "Há verificações não atendidas",
  );
  await page.getByLabel("Comprimento").fill("28");
  await page.getByLabel("Comprimento").press("Enter");
  await expect(
    page.getByText("Cálculo desatualizado", { exact: true }),
  ).toBeVisible();
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "Salvar", exact: true }).click();
  const saved = await dl;
  const savedPath = await saved.path();
  const json = JSON.parse(await readFile(savedPath!, "utf8"));
  expect(json.pieces[0].geometry.height).toBe(455);
  await page.getByRole("button", { name: "Duplicar", exact: true }).click();
  await expect(page.getByRole("heading", { name: /C03/ })).toBeVisible();
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles(savedPath!);
  await expect(
    page.getByRole("heading", { name: "C01 · Apoio principal" }),
  ).toBeVisible();
  await page.getByLabel("Posição da carga").fill("50");
  await page.getByLabel("Posição da carga").press("Enter");
  await expect(
    page.getByText(
      "A distância da carga deve estar dentro do comprimento do consolo.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Geometria para CAD/ }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Fechar janela" }).click();
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await page
    .locator(".document-tabs")
    .getByRole("button", { name: "Seção A–A", exact: true })
    .click();
  await expect(
    page.getByRole("group", { name: "Seção transversal do consolo C01" }),
  ).toBeVisible();
  await page
    .locator(".inspector-tabs")
    .getByRole("button", { name: "Armaduras", exact: true })
    .click();
  await page.getByLabel("Diâmetro N1").selectOption("25");
  await expect(page.locator(".provided-area").first()).toContainText("19,63");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const pdfEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /Memória de cálculo/ }).click();
  const pdf = await pdfEvent;
  await pdf.saveAs(testInfo.outputPath("memoria.pdf"));
  expect(
    (await readFile(testInfo.outputPath("memoria.pdf")))
      .subarray(0, 4)
      .toString(),
  ).toBe("%PDF");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const dxfEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /Geometria para CAD/ }).click();
  await (await dxfEvent).saveAs(testInfo.outputPath("geometria.dxf"));
  await page.getByRole("button", { name: "Peças do projeto" }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("button", { name: "Calcular", exact: true }).click();
  await page
    .locator(".document-tabs")
    .getByRole("button", { name: "Memória", exact: true })
    .click();
  await expect(
    page.getByText("Combinações e memória numérica", { exact: true }),
  ).toBeVisible();
  await page
    .locator(".document-tabs")
    .getByRole("button", { name: "C01 · Elevação", exact: true })
    .click();
  await page.getByRole("button", { name: "Alternar tema" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.getByLabel("Diâmetro N1")).not.toBeVisible();
  await page
    .locator(".inspector-tabs")
    .getByRole("button", { name: "Armaduras", exact: true })
    .click();
  await expect(page.getByLabel("Diâmetro N1")).toHaveValue("25");
  expect(errors).toEqual([]);
});
test("rejeita importação inválida e permanece utilizável", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles({
    name: "bad.json",
    mimeType: "application/json",
    buffer: Buffer.from('{"schemaVersion":999}'),
  });
  await expect(page.getByRole("status")).toContainText("Projeto inválido");
  await expect(
    page.getByRole("heading", { name: "C01 · Apoio principal" }),
  ).toBeVisible();
});
test("layout em notebook e celular sem transbordamento horizontal", async ({
  page,
}) => {
  for (const size of [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "C01 · Apoio principal" }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
});
