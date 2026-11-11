import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { shortFixture } from "../fixtures";

const selector = (page: Page) =>
  page.getByRole("combobox", { name: "Classe de aço do tirante", exact: true });
const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });
const command = (page: Page, action: string) =>
  page.locator(`.ribbon-panel [data-action="${action}"]`);
async function materials(page: Page) {
  await tab(page, "Modelo").click();
  await command(page, "materials").click();
  await expect(selector(page)).toBeVisible();
}
async function save(page: Page) {
  const event = page.waitForEvent("download");
  await page
    .locator(".quick-access")
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  const path = (await (await event).path())!;
  return { path, data: JSON.parse(await readFile(path, "utf8")) };
}
async function calculate(page: Page) {
  await tab(page, "Início").click();
  await command(page, "calculate").click();
}

test.beforeEach(async ({ page }) => {
  const first = shortFixture();
  first.name = "C01";
  first.materials.fyk = 420;
  const second = structuredClone(first);
  second.name = "C02";
  second.id = "second-steel";
  second.materials.fyk = 500;
  await page.addInitScript(
    (raw) => localStorage.setItem("lumeconsolo.project.v1", raw),
    JSON.stringify({
      format: "lumeconsolo",
      schemaVersion: 4,
      name: "Classes de aço",
      client: "",
      author: "",
      pieces: [first, second],
    }),
  );
  await page.goto("/");
});

test("legado 420 MPa abre personalizado sem mutação, permanece unsupported e pode ser salvo/reaberto", async ({
  page,
}) => {
  const before = (await save(page)).data;
  await materials(page);
  await expect(selector(page)).toHaveValue("420");
  await expect(selector(page).locator("option:checked")).toHaveText(
    "Personalizado (420 MPa), não suportado",
  );
  await expect(selector(page).locator("option:checked")).toHaveJSProperty(
    "disabled",
    true,
  );
  await expect(
    page.getByRole("textbox", { name: /Resistência ao escoamento/ }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Desfazer", exact: true }),
  ).toBeDisabled();
  await calculate(page);
  await expect(page.locator(".result-summary").first()).toContainText(
    "Fora do domínio do motor",
  );
  await expect(
    page.getByText(
      "O motor admite aço do tirante CA-25, CA-50 ou CA-60; informe fyk 250, 500 ou 600 MPa.",
      { exact: true },
    ),
  ).toBeVisible();
  const saved = await save(page);
  expect(saved.data).toEqual(before);
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles(saved.path);
  await materials(page);
  await expect(selector(page)).toHaveValue("420");
});

test("as três escolhas gravam números e preservam outras peças, histórico e salvamento", async ({
  page,
}) => {
  await materials(page);
  await expect(selector(page).locator("option")).toHaveText([
    "Personalizado (420 MPa), não suportado",
    "CA-25 · 250 MPa",
    "CA-50 · 500 MPa",
    "CA-60 · 600 MPa",
  ]);
  const original = (await save(page)).data;
  for (const fyk of [250, 500, 600]) {
    await selector(page).selectOption(String(fyk));
    const selected = (await save(page)).data;
    expect(selected.pieces[0].materials).toEqual({
      ...original.pieces[0].materials,
      fyk,
    });
    expect(selected.pieces[0]).toEqual({
      ...original.pieces[0],
      materials: { ...original.pieces[0].materials, fyk },
    });
    expect(selected.pieces[1]).toEqual(original.pieces[1]);
    await expect(selector(page).locator("option")).toHaveCount(3);
  }
  await expect(page.locator(".inspector")).toContainText(
    "η1 = 1,0 · pendente de confirmação",
  );
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(selector(page)).toHaveValue("500");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(selector(page)).toHaveValue("250");
  await page.getByRole("button", { name: "Desfazer", exact: true }).click();
  await expect(selector(page)).toHaveValue("420");
  await page.getByRole("button", { name: "Refazer", exact: true }).click();
  await expect(selector(page)).toHaveValue("250");
  const saved = await save(page);
  await selector(page).selectOption("600");
  await page.getByLabel("Abrir arquivo de projeto").setInputFiles(saved.path);
  await materials(page);
  await expect(selector(page)).toHaveValue("250");
});

test("memória, PDF e auditoria mostram a classe e η1, mantendo os estados do motor", async ({
  page,
}) => {
  for (const [fyk, steel, eta] of [
    [250, "CA-25", "1,0"],
    [500, "CA-50", "2,25"],
    [600, "CA-60", "1,0"],
  ] as const) {
    await materials(page);
    await selector(page).selectOption(String(fyk));
    await expect(page.locator(".inspector")).toContainText(
      `Aderência do tirante ${steel}: η1 = ${eta}`,
    );
    await calculate(page);
    await page
      .locator(".document-tabs")
      .getByRole("button", { name: "Memória", exact: true })
      .click();
    const paper = page.locator(".report-paper");
    await expect(paper).toContainText(`Tirante ${steel}`);
    await expect(paper).toContainText(
      `Aderência do tirante ${steel}: η1 = ${eta}`,
    );
    if (fyk === 600)
      await expect(paper).toContainText(
        "pendente de confirmação pelo responsável técnico",
      );
    const event = page.waitForEvent("download");
    await page.getByRole("button", { name: "Baixar PDF", exact: true }).click();
    const pdf = (await readFile((await (await event).path())!)).toString(
      "latin1",
    );
    expect(pdf).toContain(`Tirante: ${steel}`);
    expect(pdf).toContain(`Aderencia do tirante ${steel}: eta1`);
    await command(page, "export").click();
    const auditEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: /Cálculo auditável/ }).click();
    const audit = JSON.parse(
      await readFile((await (await auditEvent).path())!, "utf8"),
    );
    expect(audit.input.materials.fyk).toBe(fyk);
    expect(audit.input.materials).not.toHaveProperty("steelClass");
    expect(audit.result.combinations).toHaveLength(1);
  }
});

test("aço transversal oferece somente CA-50/CA-60 e usa a mesma apresentação sem alterar o tirante", async ({
  page,
}) => {
  await tab(page, "Modelo").click();
  await command(page, "design").click();
  await page
    .locator(".design-panel")
    .getByText("Durabilidade e disposição", { exact: true })
    .click();
  const transverse = page
    .locator(".design-panel")
    .getByRole("combobox", { name: "Aço da costura e estribos", exact: true });
  await expect(transverse.locator("option")).toHaveText([
    "CA-50 · 500 MPa",
    "CA-60 · 600 MPa",
  ]);
  await transverse.selectOption("600");
  const project = (await save(page)).data;
  expect(project.pieces[0].design.fykTransverse).toBe(600);
  expect(project.pieces[0].materials.fyk).toBe(420);
});

test("seletor é acessível por teclado e cabe nos dois temas em janela estreita", async ({
  page,
}) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page
          .getByRole("button", { name: "Alternar tema", exact: true })
          .click();
      await materials(page);
      await selector(page).focus();
      await expect(selector(page)).toBeFocused();
      await selector(page).press("Home");
      await selector(page).press("ArrowDown");
      await selector(page).press("Enter");
      await expect(selector(page)).toHaveValue("500");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await selector(page).evaluate(
          (el) => el.getBoundingClientRect().width <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
