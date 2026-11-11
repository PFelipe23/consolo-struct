import { describe, expect, it } from "vitest";
import {
  ribbonCommands,
  ribbonGroups,
  ribbonTabs,
  type Action,
} from "../src/components/ribbonCommands";

// Inventário do baseline 54abc400, independente do catálogo que está sendo testado.
const baseline = [
  "new",
  "open",
  "save",
  "project",
  "add",
  "duplicate",
  "rename",
  "delete",
  "select",
  "pan",
  "geometry",
  "loads",
  "materials",
  "rebar",
  "elevation",
  "section",
  "three",
  "fit",
  "zoomIn",
  "zoomOut",
  "calculate",
  "autodesign",
  "design",
  "export",
  "dimensions",
  "steel",
  "forces",
  "grid",
  "browser",
  "properties",
  "checks",
  "theme",
  "pdf",
  "dxf",
  "svg",
  "csv",
  "report",
  "details",
  "pieces",
];
const actions = (tab: (typeof ribbonTabs)[number]) =>
  ribbonGroups[tab].flatMap((group) => group.tools.map((tool) => tool.action));

describe("Catálogo e composição do ribbon", () => {
  it("preserva as 39 identidades, com grupos estáveis e sem duplicação dentro de uma aba", () => {
    expect(Object.keys(ribbonCommands).sort()).toEqual([...baseline].sort());
    const reachable = new Set<Action>();
    for (const tab of ribbonTabs) {
      const groups = ribbonGroups[tab];
      expect(new Set(groups.map((group) => group.id)).size).toBe(groups.length);
      const ids = actions(tab);
      expect(new Set(ids).size).toBe(ids.length);
      for (const id of ids) {
        expect(ribbonCommands[id].label.trim()).not.toBe("");
        expect(ribbonCommands[id].tip.trim()).not.toBe("");
        reachable.add(id);
      }
    }
    expect([...reachable].sort()).toEqual([...baseline].sort());
  });

  it("limita Início ao fluxo principal e mantém a edição completa em Modelo", () => {
    expect(actions("Início")).toEqual([
      "add",
      "geometry",
      "loads",
      "calculate",
      "autodesign",
      "report",
      "details",
      "export",
    ]);
    expect(actions("Início").length).toBeLessThanOrEqual(8);
    expect(actions("Modelo")).toEqual(
      expect.arrayContaining([
        "duplicate",
        "rename",
        "delete",
        "materials",
        "rebar",
        "design",
      ]),
    );
    for (const tab of ["Início", "Modelo"] as const) {
      expect(actions(tab)).not.toContain("select");
      expect(actions(tab)).not.toContain("pan");
    }
    expect(actions("Arquivo")).toEqual([
      "new",
      "open",
      "save",
      "project",
      "export",
    ]);
    expect(actions("Documentação")).toEqual([
      "report",
      "pieces",
      "details",
      "pdf",
      "dxf",
      "svg",
      "csv",
    ]);
  });

  it("mantém somente as oito repetições intencionais dos atalhos de Início", () => {
    const repeated = Object.fromEntries(
      baseline
        .map((id) => [
          id,
          ribbonTabs.filter((tab) => actions(tab).includes(id as Action)),
        ])
        .filter(([, tabs]) => tabs.length > 1),
    );
    expect(repeated).toEqual({
      add: ["Início", "Modelo"],
      geometry: ["Início", "Modelo"],
      loads: ["Início", "Modelo"],
      calculate: ["Início", "Modelo"],
      autodesign: ["Início", "Modelo"],
      report: ["Início", "Documentação"],
      details: ["Início", "Documentação"],
      export: ["Arquivo", "Início"],
    });
    // As camadas compartilhadas com #7 serão intencionais quando ela for integrada.
    expect(actions("Exibir")).toEqual(
      expect.arrayContaining([
        "dimensions",
        "steel",
        "forces",
        "grid",
        "theme",
      ]),
    );
  });

  it("separa edição, visibilidade, documentos, exportação e salvamento", () => {
    expect(ribbonCommands.rebar.label).toBe("Editar armaduras");
    expect(ribbonCommands.steel.label).toBe("Mostrar armaduras");
    expect(ribbonCommands.loads.label).toBe("Ações da peça");
    expect(ribbonCommands.forces.label).toBe("Mostrar cargas");
    for (const pair of [
      ["rebar", "steel"],
      ["loads", "forces"],
      ["report", "pdf"],
      ["save", "export"],
    ] as const) {
      expect(ribbonCommands[pair[0]]).not.toBe(ribbonCommands[pair[1]]);
      expect(ribbonCommands[pair[0]].label).not.toBe(
        ribbonCommands[pair[1]].label,
      );
    }
    expect(ribbonCommands.save.tip).toContain(".consolo.json");
    expect(ribbonCommands.autodesign.tip).toContain("modificar a peça");
  });
});
