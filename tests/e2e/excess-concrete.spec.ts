import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { shortFixture } from "../fixtures";

const command = (page: Page, action: string) =>
  page.locator(`.ribbon-panel [data-action="${action}"]`);
const tab = (page: Page, name: string) =>
  page.getByRole("tab", { name, exact: true });
const option = (dialog: Locator, name: string) =>
  dialog.getByRole("radio", { name: new RegExp(name) });
async function openSettings(page: Page) {
  await tab(page, "Configurações").click();
  await command(page, "excessConcrete").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
}
async function saved(page: Page) {
  const event = page.waitForEvent("download");
  await page
    .locator(".quick-access")
    .getByRole("button", { name: "Salvar projeto", exact: true })
    .click();
  return JSON.parse(await readFile((await (await event).path())!, "utf8"));
}

test.beforeEach(async ({ page }) => {
  const piece = shortFixture();
  delete (piece.design as Partial<typeof piece.design>).excessConcrete;
  const data = {
    format: "lumeconsolo",
    schemaVersion: 4,
    name: "Concreto excedente",
    author: "",
    client: "",
    pieces: [piece, { ...structuredClone(piece), id: "second", name: "C02" }],
  };
  await page.addInitScript(
    (raw) => localStorage.setItem("lumeconsolo.project.v1", raw),
    JSON.stringify(data),
  );
  await page.goto("/");
});

test("Configurações alterna manter/remover, atualiza a geometria e participa do histórico", async ({
  page,
}) => {
  await expect(page.locator(".excess-concrete-outline")).toHaveCount(0);
  const dialog = await openSettings(page);
  await expect(dialog).toContainText("Peça Curto-ELU");
  await expect(option(dialog, "Manter concreto excedente")).toBeChecked();
  await expect(dialog).toContainText("Geometria original mantida");
  await expect(dialog).toContainText("Volume dispensável");

  await option(dialog, "Remover concreto excedente").check();
  await expect(option(dialog, "Remover concreto excedente")).toBeChecked();
  await expect(dialog).toContainText("Concreto excedente removido");
  await dialog.getByRole("button", { name: "Concluir", exact: true }).click();
  await expect(page.locator(".excess-concrete-outline").first()).toBeAttached();

  const project = await saved(page);
  expect(project.pieces[0].design.excessConcrete).toBe("remove");
  expect(project.pieces[1].design.excessConcrete).toBe("keep");

  await page.keyboard.press("Control+z");
  await expect(page.locator(".excess-concrete-outline")).toHaveCount(0);
  const reopened = await openSettings(page);
  await expect(option(reopened, "Manter concreto excedente")).toBeChecked();
});
