import { volume, type Piece } from "./model";
import { strutTieModel, tieLayout } from "./engine";
import { reactionGeometry } from "./theory";

// mm throughout. x runs from the support face to the tip; depth is measured down from the top face.
export type ProfilePoint = { x: number; depth: number };
export type ExcessConcreteStatus =
  | "kept"
  | "removed"
  | "notStrut"
  | "nothingToRemove";
export type ConcreteProfile = {
  /** Bottom face from the support face (x = 0, depth = h) to the tip (x = L, depth = h2). */
  bottom: ProfilePoint[];
  status: ExcessConcreteStatus;
  /** Lower edge of the strut extended to the bottom: depth = intercept − tangent·x. */
  cutLine: { intercept: number; tangent: number; strutWidth: number } | null;
  /** Concrete removed from the side elevation (mm²) and its share of the original area. */
  removedArea: number;
  removedRatio: number;
  area: number;
  centroidX: number;
};

const legacyArea = (p: Piece) =>
  (p.geometry.length * (p.geometry.height + p.geometry.tipHeight)) / 2;
const legacyCentroid = (p: Piece) => {
  const g = p.geometry;
  return (
    (g.length * (g.height + 2 * g.tipHeight)) / (3 * (g.height + g.tipHeight))
  );
};

/** Same resolution as calculateCase: the cut belongs to the strut-and-tie model only. */
export function resolvedMethod(p: Piece) {
  const layout = tieLayout(p);
  const ratio = reactionGeometry(p).a / layout.d;
  const classification =
    ratio <= 0.5 ? "veryShort" : ratio <= 1 ? "short" : "cantilever";
  const method =
    p.design.method === "auto"
      ? classification === "veryShort"
        ? "friction"
        : classification === "short"
          ? "strut"
          : "beam"
      : p.design.method;
  return { method, classification, layout };
}

function polygonProperties(p: Piece, bottom: ProfilePoint[]) {
  const g = p.geometry;
  // Closed outline: top face, tip, bottom face back to the support face.
  const outline = [
    { x: 0, depth: 0 },
    { x: g.length, depth: 0 },
    ...[...bottom].reverse(),
  ];
  let twice = 0,
    moment = 0;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i],
      b = outline[(i + 1) % outline.length];
    const cross = a.x * b.depth - b.x * a.depth;
    twice += cross;
    moment += (a.x + b.x) * cross;
  }
  const area = Math.abs(twice) / 2;
  return { area, centroidX: area > 0 ? moment / (3 * twice) : 0 };
}

/**
 * Bottom face of the corbel. With "remove", the concrete below the lower edge of the
 * strut (strut-and-tie model of the engine) is cut away, keeping:
 * - the full height h at the support face (node and interface are untouched);
 * - the tip height h2 from the cut to the tip (front anchorage and load node);
 * - every point above the strut, so the strut width used in the checks stays inside.
 */
export function concreteProfile(p: Piece): ConcreteProfile {
  const g = p.geometry;
  const original: ProfilePoint[] = [
    { x: 0, depth: g.height },
    { x: g.length, depth: g.tipHeight },
  ];
  const base = {
    bottom: original,
    cutLine: null,
    removedArea: 0,
    removedRatio: 0,
    area: legacyArea(p),
    centroidX: legacyCentroid(p),
  };
  if ((p.design.excessConcrete ?? "keep") === "keep")
    return { ...base, status: "kept" };
  const { method, classification, layout } = resolvedMethod(p);
  if (method !== "strut") return { ...base, status: "notStrut" };
  const reaction = reactionGeometry(p);
  const model = strutTieModel({
    vertical: 1,
    horizontal: 0,
    a: reaction.a,
    d: layout.d,
    dPrime: layout.dPrime,
    bearingLength: reaction.effectiveLength,
    width: p.design.bearingWidth,
    loadHeight: p.design.bearingHeight,
    maxTangent: classification === "veryShort" ? 1.4 : 2,
  });
  const t = model.tangent;
  // Strut axis: depth = d − t·x. Its lower edge lies w/2 below, measured normal to the axis.
  const intercept = Math.max(
    g.height,
    layout.d + (model.strutWidth / 2) * Math.sqrt(1 + t * t),
  );
  const cutLine = { intercept, tangent: t, strutWidth: model.strutWidth };
  const slope = (g.height - g.tipHeight) / g.length;
  const cutAt = (x: number) => intercept - t * x;
  if (!(t > slope) || !(cutAt(g.length) < g.tipHeight - 1e-6))
    return { ...base, cutLine, status: "nothingToRemove" };
  const x1 = (intercept - g.height) / (t - slope);
  const xc = (intercept - g.tipHeight) / t;
  const bottom: ProfilePoint[] = [{ x: 0, depth: g.height }];
  if (x1 > 1e-9) bottom.push({ x: x1, depth: g.height - slope * x1 });
  bottom.push(
    { x: xc, depth: g.tipHeight },
    { x: g.length, depth: g.tipHeight },
  );
  const props = polygonProperties(p, bottom);
  const removedArea = Math.max(0, legacyArea(p) - props.area);
  if (removedArea < 1) return { ...base, cutLine, status: "nothingToRemove" };
  return {
    bottom,
    status: "removed",
    cutLine,
    removedArea,
    removedRatio: removedArea / legacyArea(p),
    area: props.area,
    centroidX: props.centroidX,
  };
}

/** Concrete volume in m³ of one piece, with the cut when it is applied. */
export const pieceVolume = (p: Piece, profile = concreteProfile(p)) =>
  profile.status === "removed"
    ? (p.geometry.width * profile.area) / 1e9
    : volume(p.geometry);

/** Depth of the bottom face at x (linear between profile points). */
export function bottomDepth(profile: ConcreteProfile, x: number) {
  const b = profile.bottom;
  if (x <= b[0].x) return b[0].depth;
  for (let i = 1; i < b.length; i++)
    if (x <= b[i].x) {
      const a = b[i - 1],
        c = b[i];
      return c.x === a.x
        ? Math.min(a.depth, c.depth)
        : a.depth + ((c.depth - a.depth) * (x - a.x)) / (c.x - a.x);
    }
  return b[b.length - 1].depth;
}

/**
 * Deepest point at x that keeps a clear distance `offset` to the bottom face.
 * For the original straight face this is the legacy expression, bit for bit.
 */
export function bottomOffsetDepth(
  profile: ConcreteProfile,
  x: number,
  offset: number,
) {
  const b = profile.bottom;
  if (b.length === 2) {
    const slope = (b[0].depth - b[1].depth) / (b[1].x - b[0].x);
    return b[0].depth - slope * x - offset * Math.sqrt(1 + slope ** 2);
  }
  // Lowest point of the union of discs of radius `offset` centred on the face, on the vertical x.
  let best = Infinity;
  for (let i = 1; i < b.length; i++) {
    const a = b[i - 1],
      c = b[i];
    const m = (c.depth - a.depth) / (c.x - a.x);
    const lo = Math.max(a.x, x - offset),
      hi = Math.min(c.x, x + offset);
    if (lo > hi) continue;
    // Stationary point of depth(px) − √(offset² − (px − x)²) along the segment.
    const px = Math.min(
      hi,
      Math.max(lo, x - (m * offset) / Math.sqrt(1 + m * m)),
    );
    const depth = a.depth + m * (px - a.x);
    best = Math.min(
      best,
      depth - Math.sqrt(Math.max(0, offset ** 2 - (px - x) ** 2)),
    );
  }
  return best;
}

/** Largest x where a horizontal bar at `depth` keeps `offset` to the bottom face. */
export function bottomReach(
  profile: ConcreteProfile,
  depth: number,
  offset: number,
  length: number,
) {
  const b = profile.bottom;
  if (b.length === 2) {
    const slope = (b[0].depth - b[1].depth) / (b[1].x - b[0].x);
    return slope > 0
      ? (b[0].depth - depth - offset * Math.sqrt(1 + slope ** 2)) / slope
      : length;
  }
  if (bottomOffsetDepth(profile, length, offset) >= depth) return length;
  if (bottomOffsetDepth(profile, 0, offset) < depth) return 0;
  let lo = 0,
    hi = length;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (bottomOffsetDepth(profile, mid, offset) >= depth) lo = mid;
    else hi = mid;
  }
  return lo;
}

export const excessConcreteLabels: Record<ExcessConcreteStatus, string> = {
  kept: "Geometria original mantida",
  removed: "Concreto excedente removido",
  notStrut:
    "Recorte não aplicado: o método resolvido não é o de bielas e tirantes",
  nothingToRemove:
    "Recorte não aplicado: não há concreto abaixo da biela que possa ser removido mantendo h e h₂",
};
