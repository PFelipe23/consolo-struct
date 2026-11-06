// Recreate the distributable examples. Run: npx vite-node scripts/generate-examples.ts
import { writeFileSync } from "node:fs";
import { shortFixture } from "../tests/fixtures";
import { exampleProject } from "../src/domain/model";
import { calculate } from "../src/domain/engine";
const project = exampleProject();
writeFileSync(
  "examples/pavilhao-horizonte.lume.json",
  JSON.stringify(project, null, 2),
);
const short = shortFixture();
const very = structuredClone(short);
very.id = "very-short-validation";
very.name = "Muito-curto-ELU";
very.geometry.loadOffset = 150;
very.geometry.length = 300;
very.loads.vertical = 200000;
very.loads.horizontal = 32000;
very.design.bearingLength = 100;
very.design.lowerStitchCount = 2;
const rough = structuredClone(very);
rough.id = "rough-validation";
rough.name = "Junta-rugosa";
rough.design.joint = "rough";
rough.design.roughnessConfirmed = false;
const all = {
  ...project,
  name: "Casos de validação 0.3",
  client: "Exemplos numéricos; não são projeto executivo",
  pieces: [short, very, rough],
};
writeFileSync(
  "examples/casos-validacao.lume.json",
  JSON.stringify(all, null, 2),
);
writeFileSync(
  "examples/resultados-esperados.json",
  JSON.stringify(
    all.pieces.map((p) => ({ name: p.name, result: calculate(p) })),
    null,
    2,
  ),
);
console.log(
  all.pieces.map((p) => ({
    name: p.name,
    status: calculate(p).status,
    issues: calculate(p)
      .checks.filter((c) => c.status !== "pass")
      .map((c) => c.id),
  })),
);
