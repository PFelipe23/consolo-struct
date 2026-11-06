import { describe, expect, it } from "vitest";
import { documentReducer, initialDocuments } from "../src/domain/documents";
import { DetailBuilder, detailRequestKey } from "../src/detailing/job";
import { exampleProject, number } from "../src/domain/model";
import { shortFixture } from "./fixtures";
describe("Documentos e ciclo das abas", () => {
  it("fecha documento ativo, escolhe vizinho e pode reabrir sem duplicar", () => {
    let state = documentReducer(initialDocuments, {
      type: "open",
      id: "three",
    });
    state = documentReducer(state, { type: "close", id: "three" });
    expect(state.active).toBe("section");
    expect(state.tabs).not.toContain("three");
    state = documentReducer(state, { type: "open", id: "three" });
    state = documentReducer(state, { type: "open", id: "three" });
    expect(state.tabs.filter((t) => t === "three")).toHaveLength(1);
  });
  it("fechar aba inativa preserva a ativa; fechar todas permite estado vazio", () => {
    let state = documentReducer(initialDocuments, {
      type: "close",
      id: "report",
    });
    expect(state.active).toBe("elevation");
    for (const id of [...state.tabs])
      state = documentReducer(state, { type: "close", id });
    expect(state.active).toBeNull();
    expect(state.tabs).toEqual([]);
  });
  it("novo projeto reinicia documentos sem abrir relatórios pesados", () => {
    const state = documentReducer(initialDocuments, { type: "reset" });
    expect(state.tabs).toEqual(["elevation"]);
    expect(state.visited).toEqual(["elevation"]);
  });
});
describe("Reutilização de detalhamento e quantitativos", () => {
  it("não refaz geometria/cálculo de peças que não mudaram", () => {
    const a = shortFixture(),
      b = { ...shortFixture(), id: "other", name: "C02" },
      project = { ...exampleProject(), pieces: [a, b] };
    const builder = new DetailBuilder(),
      first = builder.build(project, a.id, "all"),
      second = builder.build(project, a.id, "all");
    expect(second.details[0]).toBe(first.details[0]);
    expect(second.drawings[1]).toBe(first.drawings[1]);
    const revised = { ...project, pieces: [{ ...a, quantity: 5 }, b] },
      third = builder.build(revised, a.id, "all");
    expect(third.details[1]).toBe(first.details[1]);
    expect(third.details[0].totalMass).toBeCloseTo(
      first.details[0].mass * 5,
      8,
    );
    expect(third.details[0].bars.map((x) => x.cutLength)).toEqual(
      first.details[0].bars.map((x) => x.cutLength),
    );
  });
  it("chave da peça selecionada independe de outras quantidades; a de todos inclui todas", () => {
    const project = exampleProject(),
      old = detailRequestKey(project, project.pieces[0].id, "one"),
      all = detailRequestKey(project, project.pieces[0].id, "all");
    project.pieces[1].quantity += 3;
    expect(detailRequestKey(project, project.pieces[0].id, "one")).toBe(old);
    expect(detailRequestKey(project, project.pieces[0].id, "all")).not.toBe(
      all,
    );
  });
  it("formata números preservando separadores e precisão em chamadas repetidas", () => {
    expect(number(1234.5, 2)).toBe("1.234,50");
    expect(number(0.125, 3)).toBe("0,125");
    expect(number(1234.5, 2)).toBe("1.234,50");
  });
});
