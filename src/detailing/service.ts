import type { Project } from "../domain/model";
import type { DetailBuilder, DetailBundle } from "./job";
let worker: Worker | null = null,
  disabled = false,
  serial = 0;
let fallback: DetailBuilder | undefined;
const pending = new Map<
  number,
  { resolve: (bundle: DetailBundle) => void; reject: (error: Error) => void }
>();
const recent = new Map<string, DetailBundle>();
const sizes = new Map<string, number>();
const inFlight = new Map<string, Promise<DetailBundle>>();
let recentBytes = 0;
async function local(project: Project, pieceId: string, scope: "one" | "all") {
  const { DetailBuilder } = await import("./job");
  fallback ??= new DetailBuilder();
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  if (scope === "all") {
    let started = performance.now();
    for (const piece of project.pieces) {
      fallback.build(project, piece.id, "one");
      if (performance.now() - started > 8) {
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        started = performance.now();
      }
    }
  }
  return fallback.build(project, pieceId, scope);
}
export function cachedDetails(key: string) {
  return recent.get(key);
}
async function prepareDetails(
  key: string,
  project: Project,
  pieceId: string,
  scope: "one" | "all",
): Promise<DetailBundle> {
  const old = recent.get(key);
  if (old) return old;
  let bundle: DetailBundle;
  if (disabled || typeof Worker === "undefined")
    bundle = await local(project, pieceId, scope);
  else {
    try {
      if (!worker) {
        try {
          worker = new Worker(new URL("./detail.worker.ts", import.meta.url), {
            type: "module",
            name: "ConsoloStruct Detalhamento",
          });
        } catch {
          disabled = true;
          throw new Error("worker-unavailable");
        }
        worker.onmessage = (
          e: MessageEvent<{
            id: number;
            bundle?: DetailBundle;
            error?: string;
          }>,
        ) => {
          const entry = pending.get(e.data.id);
          if (!entry) return;
          pending.delete(e.data.id);
          if (e.data.bundle) entry.resolve(e.data.bundle);
          else entry.reject(new Error(e.data.error ?? "Erro no detalhamento."));
        };
        worker.onerror = () => {
          disabled = true;
          worker?.terminate();
          worker = null;
          pending.forEach((p) => p.reject(new Error("worker-unavailable")));
          pending.clear();
        };
      }
      bundle = await new Promise<DetailBundle>((resolve, reject) => {
        const id = ++serial;
        pending.set(id, { resolve, reject });
        worker!.postMessage({ id, project, pieceId, scope });
      });
    } catch (error) {
      if (
        !disabled &&
        error instanceof Error &&
        error.message !== "worker-unavailable"
      )
        throw error;
      disabled = true;
      bundle = await local(project, pieceId, scope);
    }
  }
  const size =
    bundle.sections.reduce((n, s) => n + s.markup.length * 2, 0) +
    bundle.drawing.entities.length * 180;
  if (size <= 32 * 1024 * 1024) {
    recentBytes -= sizes.get(key) ?? 0;
    recent.delete(key);
    recent.set(key, bundle);
    sizes.set(key, size);
    recentBytes += size;
    while (recent.size > 4 || recentBytes > 32 * 1024 * 1024) {
      const first = recent.keys().next().value!;
      recent.delete(first);
      recentBytes -= sizes.get(first) ?? 0;
      sizes.delete(first);
    }
  }
  return bundle;
}
export function requestDetails(
  key: string,
  project: Project,
  pieceId: string,
  scope: "one" | "all",
): Promise<DetailBundle> {
  const old = recent.get(key);
  if (old) return Promise.resolve(old);
  const existing = inFlight.get(key);
  if (existing) return existing;
  const job = prepareDetails(key, project, pieceId, scope).finally(() =>
    inFlight.delete(key),
  );
  inFlight.set(key, job);
  return job;
}
