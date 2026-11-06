// Run from the repository root: node scripts/benchmark.mjs
import { createServer } from "vite";
import { performance } from "node:perf_hooks";
const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
try {
  const { shortFixture } = await server.ssrLoadModule("/tests/fixtures.ts");
  const { number, exampleProject } = await server.ssrLoadModule(
    "/src/domain/model.ts",
  );
  const { buildDetail } = await server.ssrLoadModule("/src/detailing/model.ts");
  const { pieceDrawing } = await server.ssrLoadModule(
    "/src/detailing/drawing.ts",
  );
  const { DetailBuilder } = await server.ssrLoadModule("/src/detailing/job.ts");
  const results = { node: process.version, samples: 5, pieces: 12 };
  let sum = 0,
    started = performance.now();
  for (let i = 0; i < 10000; i++) sum += number(i * 0.137, 2).length;
  results.number10000Ms = performance.now() - started;
  const p = shortFixture(),
    project = { ...exampleProject(), pieces: [p] },
    times = [];
  for (let i = 0; i < 5; i++) {
    started = performance.now();
    for (let j = 0; j < 12; j++)
      pieceDrawing(project, buildDetail({ ...p, id: `perf-${j}` }));
    times.push(performance.now() - started);
  }
  results.twelveDetailsMedianMs = times.sort((a, b) => a - b)[2];
  results.checksum = sum;
  const many = {
      ...project,
      pieces: Array.from({ length: 12 }, (_, i) => ({ ...p, id: `perf-${i}` })),
    },
    builder = new DetailBuilder();
  builder.build(many, p.id, "all");
  started = performance.now();
  for (let i = 0; i < 10; i++) builder.build(many, p.id, "all");
  results.cachedTwelveDetailsMeanMs = (performance.now() - started) / 10;
  process.stdout.write(JSON.stringify(results, null, 2) + "\n");
} finally {
  await server.close();
}
