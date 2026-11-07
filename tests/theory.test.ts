import { describe, expect, it } from "vitest";
import {
  elDebsSimplified,
  reactionGeometry,
  upperStitchLayout,
} from "../src/domain/theory";
import { calculate, tieLayout } from "../src/domain/engine";
import {
  area,
  decodeProject,
  exampleProject,
  newPiece,
} from "../src/domain/model";
import { buildDetail } from "../src/detailing/model";
import { buildSceneModel } from "../src/visualization/model3d";
import { suggestReinforcement } from "../src/domain/autodesign";
import { shortFixture } from "./fixtures";

describe("Base Consolo — conferência independente de El Debs", () => {
  const data = {
    vertical: 200000,
    horizontal: 50000,
    a: 300,
    d: 400,
    loadHeight: 80,
    width: 300,
    fcd: 30 / 1.4,
  };
  it("reproduz equilíbrio e compressão (3.18–3.22) sem o arredondamento 5,55", () => {
    // Calculado separadamente com 35 dígitos decimais: V*a=60 MNmm; H*dh=4 MNmm.
    const m = elDebsSimplified(data);
    expect(m.z).toBe(360);
    expect(m.lever).toBeCloseTo(230.46638387921275, 10);
    expect(m.tieForce).toBeCloseTo(227777.77777777778, 8);
    expect(m.strutForce).toBeCloseTo(277697.7662544588, 8);
    expect(m.strutStress).toBeCloseTo(11.57074026060245, 10);
    expect(m.tieForce / (500 / 1.15)).toBeCloseTo(523.8888888888889, 10);
    expect(m.momentResidual).toBeCloseTo(0, 6);
  });
  it("mantém o efeito de H mesmo acima dos 6% citados como usuais", () => {
    const m = elDebsSimplified(data);
    expect(m.horizontalMomentRatio).toBeCloseTo(1 / 15, 12);
    expect(m.strutStress).toBeGreaterThan(
      elDebsSimplified({ ...data, horizontal: 0 }).strutStress,
    );
    expect(m.tieForceApprox).toBeCloseTo(226666.66666666666, 8);
    expect(m.tieForceApprox).toBeLessThan(m.tieForce);
  });
  it("β=0,85 reduz o limite, sem reduzir as forças da carga indireta", () => {
    const direct = elDebsSimplified(data);
    const indirect = elDebsSimplified({ ...data, indirect: true });
    expect(indirect.strutLimit / direct.strutLimit).toBeCloseTo(0.85, 12);
    expect(indirect.strutForce).toBe(direct.strutForce);
  });
  it("com H=0, o limite (3.25) equivale exatamente à verificação da biela", () => {
    const m = elDebsSimplified({ ...data, horizontal: 0 });
    expect(data.vertical / (data.width * data.d) / m.tauLimit).toBeCloseTo(
      m.strutStress / m.strutLimit,
      12,
    );
  });
  it("só novos projetos ativam os complementos; projetos antigos preservam sua política", () => {
    expect(newPiece(1).design.literatureRecommendations).toBe(true);
    const project = exampleProject();
    const old = JSON.parse(JSON.stringify(project));
    delete old.pieces[0].design.literatureRecommendations;
    delete old.pieces[0].design.reactionPosition;
    const migrated = decodeProject(JSON.stringify(old));
    expect(migrated.pieces[0].design.literatureRecommendations).toBe(false);
    expect(migrated.pieces[0].design.reactionPosition).toBe("specified");
  });
  it("aplica piso H/V=0,20 à estimativa, sem somar 0,20 ao coeficiente", () => {
    const p = newPiece(1);
    p.design.supportType = "ptfe";
    p.loads.horizontal = 0;
    const v = calculate(p).values;
    expect(v.horizontal).toBeCloseTo(117600, 8);
    expect(v.horizontalEstimated).toBeCloseTo(47040, 8);
    expect(v.horizontalFloorAdded).toBeCloseTo(70560, 8);
  });
  it("conserva V/H de análise e acusa o piso bibliográfico não atendido", () => {
    const p = shortFixture();
    p.design.literatureRecommendations = true;
    const r = calculate(p);
    expect(r.values.horizontal).toBe(15000);
    expect(r.checks.find((c) => c.id === "literatureHorizontal")?.status).toBe(
      "fail",
    );
    expect(suggestReinforcement(p).changed).toBe(false);
  });
  it("verifica h2≥h/2 separadamente da dedução normativa de a2", () => {
    const p = shortFixture();
    p.geometry.tipHeight = 200;
    p.design.literatureRecommendations = true;
    const r = calculate(p);
    expect(r.checks.find((c) => c.id === "tipHeight")?.status).toBe("pass");
    expect(r.checks.find((c) => c.id === "literatureTip")?.status).toBe("fail");
  });
  it("distingue costura de 50% da parcela vertical e estribos de 20% do tirante", () => {
    const p = shortFixture();
    p.design.literatureRecommendations = true;
    p.rebar.tieCount = 2;
    p.rebar.tieDiameter = 12.5;
    p.loads.vertical = 300000;
    const v = calculate(p).values;
    // d=500−(25+6,3+12,5/2)=462,45 mm, Asw=0,5*(300000*300/416,205)/(500/1,15).
    expect(v.d).toBeCloseTo(462.45, 10);
    expect(v.stitchLiterature).toBeCloseTo(
      (0.5 * 90000000) / 416.205 / (500 / 1.15),
      10,
    );
    expect(v.stitchRequired).toBeGreaterThan(v.stitchNormative);
    p.rebar.tieCount = 8;
    p.rebar.tieDiameter = 25;
    p.design.tieLayers = 2;
    const w = calculate(p).values;
    expect(w.stirrupRequired).toBeCloseTo(0.2 * area(8, 25), 10);
    expect(w.stirrupRequired).toBeGreaterThan(w.stirrupNormative);
  });
  it("o limite complementar de concreto só entra em 0,4≤a/d≤1", () => {
    const p = shortFixture();
    p.design.literatureRecommendations = true;
    p.geometry.loadOffset = tieLayout(p).d * 0.4;
    let r = calculate(p);
    expect(
      r.checks.find((c) => c.id === "literatureConcrete")?.capacity,
    ).toBeCloseTo((0.2 * 30) / 1.4);
    p.geometry.loadOffset -= 0.0001;
    r = calculate(p);
    expect(r.checks.find((c) => c.id === "literatureConcrete")).toBeUndefined();
  });
});

describe("Reação deslocada e coerência com o detalhamento", () => {
  it("o envelope 3/4 L não reduz um braço já maior", () => {
    const p = shortFixture();
    p.design.reactionPosition = "threeQuarter";
    expect(reactionGeometry(p).a).toBe(337.5);
    p.geometry.loadOffset = 400;
    expect(reactionGeometry(p).a).toBe(400);
  });
  it("não move o apoio, mas reposiciona a reação no 3D e recalcula a/d", () => {
    const p = shortFixture();
    p.geometry.loadOffset = 330;
    p.design.reactionPosition = "threeQuarter";
    const v = calculate(p).values;
    expect(v.bearingCenter).toBe(330);
    expect(v.a).toBe(337.5);
    expect(v.reactionShift).toBe(7.5);
    expect(v.effectiveBearingLength).toBe(85);
    expect(v.ratio).toBeCloseTo(337.5 / tieLayout(p).d, 12);
    // a2 is measured from the original outer pad edge, not the moved reaction.
    expect(v.a2).toBe(70);
    const scene = buildSceneModel(p);
    expect(scene.bearing.center[0]).toBe(330);
    expect(scene.loads[0].to[0]).toBe(337.5);
  });
  it("soma deslocamento e H*h/V antes de aceitar o contato integral", () => {
    const p = shortFixture();
    p.design.reactionPosition = "outerThird";
    expect(calculate(p).status).toBe("unsupported");
    p.design.bearingHeight = 0;
    const r = calculate(p);
    expect(r.combinations).toHaveLength(1);
    expect(r.values.bearingEccentricity).toBeCloseTo(100 / 6, 12);
    expect(r.values.bearingStress).toBeCloseTo(8, 12);
  });
  it("recusa 3/4 L quando o aparelho informado não comporta essa reação", () => {
    const p = shortFixture();
    p.design.reactionPosition = "threeQuarter";
    const r = calculate(p);
    expect(r.status).toBe("unsupported");
    expect(r.values).toEqual({});
    expect(r.reasons.join(" ")).toContain("núcleo central");
  });
  it("as costuras desenhadas e verificadas usam os mesmos níveis e espaçamento", () => {
    const p = shortFixture();
    const levels = upperStitchLayout(p, tieLayout(p));
    const detail = buildDetail(p);
    const zs = detail.bars
      .filter((b) => b.family === "stitch")
      .flatMap((b) => b.locations.map((l) => l.z));
    expect(zs.sort((a, b) => a - b)).toEqual(levels.levels);
    expect(calculate(p).values.stitchSpacing).toBeCloseTo(
      levels.levels[1] - levels.levels[0],
      12,
    );
  });
  it("não aprova duas costuras por usar incorretamente zona/n", () => {
    const p = shortFixture();
    p.rebar.stitchCount = 2;
    expect(
      calculate(p).checks.find((c) => c.id === "stitchSpacing")?.status,
    ).toBe("fail");
  });
});
