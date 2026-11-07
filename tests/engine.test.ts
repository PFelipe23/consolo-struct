import { describe, it, expect } from "vitest";
import {
  calculate,
  materialProperties,
  minimumFlexuralSteel,
  strutTieModel,
  tieLayout,
} from "../src/domain/engine";
import { suggestReinforcement } from "../src/domain/autodesign";
import {
  newPiece,
  area,
  decodeProject,
  exampleProject,
  fingerprint,
} from "../src/domain/model";
import { shortFixture } from "./fixtures";
const c = (p: ReturnType<typeof newPiece>, id: string) =>
  calculate(p).checks.find((x) => x.id === id)!;
describe("Referências independentes", () => {
  it("reproduz Araújo v.4 p.122–125 sem arredondar a tangente", () => {
    const m = strutTieModel({
      vertical: 140000,
      horizontal: 0,
      a: 100,
      d: 250,
      dPrime: 50,
      bearingLength: 100,
      width: 200,
    });
    expect(m.tangent).toBeCloseTo(4 / 3, 12);
    expect(m.sin).toBeCloseTo(0.8, 12);
    expect(m.cos).toBeCloseTo(0.6, 12);
    expect(m.strutWidth).toBeCloseTo(140, 10);
    expect(m.z).toBeCloseTo(400 / 3, 10);
    expect(m.tieForce).toBeCloseTo(105000, 8);
    expect(m.strutStress).toBeCloseTo(6.25, 10);
    expect(m.bearingStress).toBe(7);
    expect(m.tieForce / (500 / 1.15) / 100).toBeCloseTo(2.415, 10);
    expect(m.momentResidual).toBeCloseTo(0, 6);
  });
  it("não considera suficientes 3 estribos de 5 mm para 1,21 cm²", () => {
    expect(area(6, 5) / 100).toBeCloseTo(1.178097245, 8);
    expect(area(6, 5)).toBeLessThan(121);
  });
  it("fecha o equilíbrio com H e sua altura de aplicação", () => {
    const m = strutTieModel({
      vertical: 140000,
      horizontal: 20000,
      a: 100,
      d: 250,
      dPrime: 50,
      bearingLength: 100,
      width: 200,
      loadHeight: 20,
    });
    // z=133.333; T=105000+20000*(1+70/133.333)=135500 N.
    expect(m.tieForce).toBeCloseTo(135500, 8);
    expect(m.strutForce).toBeCloseTo(192500, 8);
    expect(m.momentResidual).toBeCloseTo(0, 6);
  });
  it("usa limite atual 0,27 alpha_v2 fcd no exemplo muito curto", () => {
    const r = calculate(newPiece(1)),
      v = r.values;
    expect(v.d).toBeCloseTo(358.7, 10);
    expect(v.vertical).toBeCloseTo(588000, 8);
    expect(v.horizontal).toBeCloseTo(161280, 8);
    expect(v.tieFriction).toBeCloseTo(1143.744, 8);
    expect(v.tauLimitConcrete).toBeCloseTo(5.09142857142857, 10);
    expect(v.tau).toBeCloseTo(588000 / (300 * 358.7), 10);
    expect(c(newPiece(1), "strut").status).toBe("fail");
  });
  it("distingue área total da costura de área por unidade de altura", () => {
    const p = shortFixture(),
      r = calculate(p),
      v = r.values;
    expect(v.stitchRequired).toBeCloseTo(0.4 * area(4, 16), 10);
    expect(v.stitchRate).toBeCloseTo(v.stitchRequired / ((2 * v.d) / 3), 10);
    expect(v.stitchProvided).toBeCloseTo(area(12, 6.3), 10);
  });
  it("aplica a resistência limitada a 8 MPa na faixa resistente alta", () => {
    const p = newPiece(1);
    p.materials.fck = 90;
    p.rebar.tieCount = 8;
    p.design.tieLayers = 2;
    expect(calculate(p).values.tauLimit).toBe(8);
  });
});
describe("Ações, materiais e consistência", () => {
  it("aprova o caso curto exclusivamente nas verificações implementadas", () => {
    const r = calculate(shortFixture());
    expect(r.reasons).toEqual([]);
    expect(r.checks.filter((c) => c.status !== "pass")).toEqual([]);
    expect(r.status).toBe("pass");
  });
  it("não majora novamente ações de cálculo", () => {
    const p = shortFixture(),
      v = calculate(p).values;
    expect(v.vertical).toBe(140000);
    expect(v.horizontal).toBe(15000);
    expect(v.factor).toBe(1);
  });
  it("adota gamma n mínimo 1,2 e registra a divergência para fábrica", () => {
    const p = newPiece(1);
    p.design.production = "factory";
    const v = calculate(p).values;
    expect(v.gammaN9062).toBe(1);
    expect(v.gammaN).toBe(1.2);
  });
  it("aceita gamma n superior por opção explícita", () => {
    const p = newPiece(1);
    p.design.gammaN = 1.4;
    expect(calculate(p).values.factor).toBeCloseTo(1.96);
  });
  it.each([
    ["dry", 0.8],
    ["mortar", 0.5],
    ["elastomer", 0.16],
    ["ptfe", 0.08],
    ["steel", 0.25],
    ["concreteSteel", 0.4],
  ] as const)("coeficiente de apoio %s", (type, coef) => {
    const p = newPiece(1);
    p.design.supportType = type;
    p.design.literatureRecommendations = false;
    p.loads.horizontal = 0;
    const v = calculate(p).values;
    expect(v.horizontal / v.vertical).toBeCloseTo(coef, 12);
  });
  it("ignora H favorável e não subtrai da estimativa", () => {
    const p = newPiece(1);
    p.loads.horizontal = -90000;
    p.design.literatureRecommendations = false;
    const v = calculate(p).values;
    expect(v.horizontalProvided).toBe(0);
    expect(v.horizontal).toBeCloseTo(0.16 * v.vertical, 8);
  });
  it("inclui o peso próprio só quando o braço adotado é conservador", () => {
    const p = newPiece(1);
    p.design.includeSelfWeight = true;
    expect(calculate(p).values.selfWeight).toBeCloseTo(562.5, 10);
    p.geometry.loadOffset = 50;
    expect(calculate(p).status).toBe("unsupported");
  });
  it("usa fctm e eta_c da edição fornecida para concretos de alta resistência", () => {
    const m = materialProperties(60, 500);
    expect(m.fctm).toBeCloseTo(2.12 * Math.log(7.8), 12);
    expect(m.etaC).toBeCloseTo((2 / 3) ** (1 / 3), 12);
    expect(m.fcd2).toBeCloseTo((0.6 * 0.76 * 60) / 1.4, 12);
  });
  it("dimensiona armadura mínima por Mmin além do piso absoluto", () => {
    const v = minimumFlexuralSteel(300, 400, 360, 30, 500);
    expect(v.moment).toBeCloseTo(
      ((0.8 * 300 * 400 ** 2) / 6) * 1.3 * 0.3 * 30 ** (2 / 3),
    );
    expect(v.required).toBeGreaterThanOrEqual(180);
  });
  it("CA-60 não recebe automaticamente eta1=2,25 de CA-50", () => {
    const p = shortFixture();
    const a = calculate(p).values.fbd;
    p.materials.fyk = 600;
    expect(calculate(p).values.fbd).toBeCloseTo(a / 2.25, 10);
  });
  it("calcula d pelo centroide ponderado das camadas", () => {
    const p = newPiece(1);
    p.rebar.tieCount = 6;
    p.design.tieLayers = 2;
    expect(tieLayout(p).dPrime).toBeCloseTo(61.3, 10);
    expect(tieLayout(p).d).toBeCloseTo(338.7, 10);
  });
  it("reforço de suspensão absorve 100% da carga indireta", () => {
    const p = shortFixture();
    p.design.loadType = "indirect";
    const v = calculate(p).values;
    expect(v.suspensionRequired).toBeCloseTo(140000 / (500 / 1.15), 10);
    expect(c(p, "suspension").status).toBe("fail");
  });
  it("fendilhamento transversal usa a largura real do apoio", () => {
    const p = shortFixture();
    p.design.bearingWidth = 200;
    const v = calculate(p).values;
    expect(v.splittingRequired).toBeCloseTo(
      (0.3 * 140000 * 0.5) / (500 / 1.15),
      10,
    );
    expect(c(p, "splitting").status).toBe("fail");
  });
  it("verifica ancoragem com comprimento e confinamento informados", () => {
    const p = shortFixture();
    p.design.supportAnchorLength = 50;
    p.design.anchorConfinementArea = 0;
    expect(c(p, "anchorage").status).toBe("fail");
    expect(c(p, "anchorConfinement").status).toBe("fail");
  });
  it("não usa redução de gancho quando cobrimento normal é insuficiente", () => {
    const p = shortFixture();
    p.design.supportAnchor = "hook";
    p.design.hookNormalCover = 20;
    expect(calculate(p).values.anchorAlpha).toBe(1);
    p.design.hookNormalCover = 48;
    expect(calculate(p).values.anchorAlpha).toBe(0.7);
    expect(c(p, "hookPath").status).toBe("review");
  });
  it("a barra transversal única soldada precisa ter o mesmo diâmetro", () => {
    const p = shortFixture();
    p.design.frontAnchor = "welded";
    p.design.weldedBarDiameter = 10;
    expect(c(p, "weldDiameter").status).toBe("fail");
    p.design.weldedBarDiameter = 16;
    expect(c(p, "weldDiameter").status).toBe("pass");
  });
  it("não dispensa estudo horizontal para apoio impedido", () => {
    const p = newPiece(1);
    p.design.supportType = "restrained";
    expect(calculate(p).status).toBe("unsupported");
  });
  it("a taxa mecânica é estritamente superior a 0,04", () => {
    const p = shortFixture();
    p.materials.fck = (area(4, 16) * 500) / (0.04 * 400 * tieLayout(p).d);
    expect(c(p, "mechanical").status).toBe("fail");
  });
});
describe("Limites, combinações e rastreabilidade", () => {
  it("a/d=0,5 usa a convenção muito curto da 9062", () => {
    const p = newPiece(1);
    p.geometry.length = 500;
    p.geometry.loadOffset = tieLayout(p).d / 2;
    expect(calculate(p).combinations[0].classification).toBe("veryShort");
    p.geometry.loadOffset += 1e-6;
    expect(calculate(p).combinations[0].classification).toBe("short");
  });
  it("a/d=1 é calculável; acima disso bloqueia", () => {
    const p = newPiece(1);
    p.geometry.length = 600;
    p.geometry.loadOffset = tieLayout(p).d;
    expect(calculate(p).status).not.toBe("unsupported");
    p.geometry.loadOffset += 1e-6;
    expect(calculate(p).status).toBe("unsupported");
  });
  it.each(["fatigue", "transverseForce", "transverseEccentricity"] as const)(
    "bloqueia %s",
    (key) => {
      const p = newPiece(1);
      if (key === "fatigue") p.design.fatigue = true;
      else p.design[key] = 1;
      expect(calculate(p).status).toBe("unsupported");
    },
  );
  it("bloqueia atrito em consolo curto", () => {
    const p = shortFixture();
    p.design.method = "friction";
    expect(calculate(p).status).toBe("unsupported");
  });
  it("não aprova ação nula, dimensão inválida ou número de barras não inteiro", () => {
    const p = newPiece(1);
    p.loads.vertical = 0;
    expect(calculate(p).status).toBe("unsupported");
    p.loads.vertical = 350000;
    p.geometry.height = -1;
    expect(calculate(p).status).toBe("invalid");
    p.geometry.height = 400;
    p.rebar.tieCount = 2.5;
    expect(calculate(p).status).toBe("invalid");
  });
  it("rejeita números não finitos sem produzir resultados aparentes", () => {
    const p = newPiece(1);
    p.loads.vertical = Infinity;
    const r = calculate(p);
    expect(r.status).toBe("invalid");
    expect(r.combinations).toEqual([]);
    expect(r.checks).toEqual([]);
  });
  it("a junta rugosa exige confirmação de preparação", () => {
    const p = newPiece(1);
    p.design.joint = "rough";
    expect(c(p, "roughness").status).toBe("review");
    p.design.roughnessConfirmed = true;
    expect(c(p, "roughness")).toBeUndefined();
    expect(calculate(p).values.mu).toBe(1);
  });
  it("combinações são simultâneas e o envelope preserva a origem", () => {
    const p = shortFixture();
    p.design.combinations = [
      { name: "H alto", vertical: 80000, horizontal: 80000, gamma: 1.4 },
      { name: "V alto", vertical: 200000, horizontal: 0, gamma: 1.4 },
    ];
    const r = calculate(p);
    expect(r.combinations).toHaveLength(3);
    expect(r.combinations[1].values.vertical).toBe(80000);
    expect(r.combinations[1].values.horizontal).toBe(80000);
    expect(r.values.tieRequired).toBe(
      Math.max(...r.combinations.map((c) => c.values.tieRequired)),
    );
    expect(r.checks.find((c) => c.id === "bearing")!.detail).toContain(
      "V alto",
    );
  });
  it("identifica pendências mesmo quando outra combinação tem menor índice", () => {
    const p = shortFixture();
    p.design.inputsConfirmed = false;
    p.design.combinations = [
      { name: "Baixa", vertical: 10000, horizontal: 0, gamma: 1.4 },
    ];
    expect(c(p, "reviewInputs").status).toBe("review");
  });
  it("qualquer parâmetro de cálculo altera a assinatura", () => {
    const p = shortFixture(),
      before = fingerprint(p);
    p.design.bearingWidth -= 5;
    expect(fingerprint(p)).not.toBe(before);
  });
  it("migra projeto v1 e exige conferir os novos dados", () => {
    const p = exampleProject();
    const old = {
      ...p,
      schemaVersion: 1,
      pieces: p.pieces.map(({ design, ...piece }) => {
        void design;
        return piece;
      }),
    };
    const restored = decodeProject(JSON.stringify(old));
    expect(restored.schemaVersion).toBe(4);
    expect(restored.pieces[0].design.inputsConfirmed).toBe(false);
  });
  it("os resultados são determinísticos e não alteram a entrada", () => {
    const p = shortFixture(),
      before = JSON.stringify(p);
    expect(calculate(p)).toEqual(calculate(p));
    expect(JSON.stringify(p)).toBe(before);
  });
  it("busca discreta recalcula as camadas e conserva os dados externos", () => {
    const p = shortFixture(),
      r = suggestReinforcement(p);
    expect(r.changed).toBe(true);
    expect(r.result.values.tieProvided).toBeGreaterThanOrEqual(
      r.result.values.tieRequired,
    );
    expect(r.result.checks.find((c) => c.id === "clearSpacing")!.status).toBe(
      "pass",
    );
    expect(r.piece.design.supportRebarArea).toBe(1000);
    expect(r.piece.design.anchorConfinementArea).toBe(100);
    expect(r.result.fingerprint).toBe(fingerprint(r.piece));
  });
  it("a sugestão não cria solução quando o concreto é insuficiente", () => {
    const p = shortFixture();
    p.loads.vertical = 1e7;
    const r = suggestReinforcement(p);
    expect(r.changed).toBe(false);
    expect(r.piece).toEqual(p);
  });
  it("verifica finitude em uma grade de seções e solicitações", () => {
    for (const h of [200, 400, 800])
      for (const b of [200, 400, 600])
        for (const V of [10000, 100000, 1000000]) {
          const p = newPiece(1);
          p.geometry.height = h;
          p.geometry.tipHeight = h / 2;
          p.geometry.width = b;
          p.loads.vertical = V;
          p.design.bearingWidth = b - 50;
          const r = calculate(p);
          for (const cc of r.combinations)
            for (const value of Object.values(cc.values))
              expect(Number.isFinite(value)).toBe(true);
        }
  });
});
describe("Contato e ancoragem frontal", () => {
  it("considera a excentricidade de H na pressão do apoio", () => {
    const p = shortFixture(),
      v = calculate(p).values;
    expect(v.bearingEccentricity).toBeCloseTo((15000 * 10) / 140000, 10);
    expect(v.bearingStress).toBeCloseTo(
      4 * (1 + (6 * ((15000 * 10) / 140000)) / 100),
      10,
    );
  });
  it("não extrapola a fórmula de contato integral para apoio que descola", () => {
    const p = shortFixture();
    p.loads.horizontal = 300000;
    expect(calculate(p).status).toBe("unsupported");
    expect(calculate(p).reasons.join()).toContain("contato parcial");
  });
  it("exige solda capaz de desenvolver o ramo integral, com reserva de 15%", () => {
    const p = shortFixture();
    p.design.frontAnchor = "welded";
    p.design.weldedBarDiameter = 16;
    const check = c(p, "weldForce");
    expect(check.demand).toBeCloseTo(1.15 * area(1, 16) * (500 / 1.15), 10);
    expect(check.status).toBe("fail");
  });
});
