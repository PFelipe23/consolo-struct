import { describe, expect, it } from "vitest";
import { calculate } from "../src/domain/engine";
import { suggestReinforcement } from "../src/domain/autodesign";
import {
  decodeProject,
  exampleProject,
  fingerprint,
} from "../src/domain/model";
import { steelBondDescription } from "../src/domain/steel";
import { toCalculationJson } from "../src/lib/exports";
import { cantileverFixture, shortFixture } from "./fixtures";

describe("Classes de aço com ancoragem e busca integradas (#3 + #12 + #16)", () => {
  it.each([250, 500, 600])(
    "preserva fyk=%s, opções físicas e pendências na busca",
    (fyk) => {
      for (const welded of [false, true])
        for (const floor of [false, true])
          for (const fixture of [
            shortFixture,
            () => cantileverFixture({ length: 700 }),
          ]) {
            const input = fixture();
            input.materials.fyk = fyk;
            input.design.supportWeldedBar = welded;
            input.design.anchorRatioFloor = floor;
            input.design.supportAnchor = "hook";
            input.design.hookNormalCover = 75;
            const before = structuredClone(input);
            const proposal = suggestReinforcement(input);
            expect(input).toEqual(before);
            expect(proposal.piece.materials).toEqual(input.materials);
            expect(proposal.piece.design.supportWeldedBar).toBe(welded);
            expect(proposal.piece.design.anchorRatioFloor).toBe(floor);
            expect(proposal.result).toEqual(calculate(proposal.piece));
            expect(proposal.result.fingerprint).toBe(
              fingerprint(proposal.piece),
            );
            for (const c of proposal.result.combinations) {
              const v = c.values;
              const alpha = welded ? 0.5 : 0.7;
              const ratio = v.tieRequired / v.tieProvided;
              const used = floor ? Math.max(1, ratio) : ratio;
              expect(v.anchorAlpha).toBe(alpha);
              expect(v.anchorRatio).toBe(used);
              expect(v.anchorWeldedBar).toBe(Number(welded));
              expect(v.anchorRatioFloor).toBe(Number(floor));
              expect(v.anchorRequired).toBe(
                Math.max(
                  alpha * v.lb * used,
                  0.3 * v.lb,
                  10 * proposal.piece.rebar.tieDiameter,
                  100,
                ),
              );
              expect(
                c.checks.find((ch) => ch.id === "anchorWeldedBar")?.status,
              ).toBe(welded ? "review" : undefined);
            }
          }
      if (fyk === 600)
        expect(steelBondDescription(fyk)).toContain("pendente de confirmação");
    },
  );
  it("preserva opções físicas e aço legado sem tornar o projeto calculável", () => {
    const project = exampleProject();
    const input = shortFixture();
    input.materials.fyk = 420.5;
    input.design.supportWeldedBar = true;
    input.design.anchorRatioFloor = true;
    project.pieces = [input];
    const restored = decodeProject(JSON.stringify(project));
    expect(restored).toEqual(project);
    const proposal = suggestReinforcement(restored.pieces[0]);
    expect(proposal.changed).toBe(false);
    expect(proposal.piece).toEqual(input);
    expect(proposal.result.status).toBe("unsupported");
    const audit = JSON.parse(toCalculationJson(restored, restored.pieces[0]));
    expect(audit.input).toEqual(input);
    expect(audit.result).toEqual(calculate(input));
  });
});
