import { calculate, tieLayout } from "../domain/engine";
import type { Piece } from "../domain/model";
import {
  mandrelDiameter,
  roundedPath,
  type BarPath,
  type Point,
} from "./geometry";

// "Armado como viga": top (tie/negative) and bottom (positive) bars bent at both ends.
// Elevation coordinates in mm: x from the support face to the tip, y = depth below the top face.

/** The arrangement depends on the full concrete outline; cutting the excess removes the bottom chord. */
export const beamArrangementAvailable = (p: Piece) =>
  p.design.excessConcrete !== "remove";
export const beamArrangementActive = (p: Piece) =>
  p.detailing.barArrangement === "beam" && beamArrangementAvailable(p);

export type BeamEnd = {
  /** Anchorage length required from the origin of the anchorage. */
  required: number;
  /** Straight length from the origin to the start of the bend. */
  straight: number;
  /** Straight leg after the 90° bend, as detailed. */
  leg: number;
  /** Longest leg that fits the concrete outline with the specified cover. */
  legMax: number;
  /** Anchorage developed along the bar: straight + arc + leg. */
  developed: number;
  fits: boolean;
};
export type BeamBar = {
  diameter: number;
  mandrel: number;
  radius: number;
  vertices: Point[];
  path: BarPath;
  back: BeamEnd;
  front: BeamEnd;
  /** Horizontal projection between the axes of the two legs. */
  span: number;
};
export type BeamLayout = {
  top: (BeamBar & { layer: number; count: number; depth: number })[];
  bottom: BeamBar & { count: number; depthSupport: number; depthTip: number };
  /** Inner edge of the bearing pad: origin of the anchorage at the tip. */
  frontOrigin: number;
  lbNecTop: number;
  lbNecBottom: number;
};

const finite = (v: number | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v) && v > 0;

function end(
  required: number,
  straight: number,
  radius: number,
  legMax: number,
  diameter: number,
): BeamEnd {
  const arc = (Math.PI * radius) / 2;
  const minimum = 8 * diameter;
  const needed = Math.max(minimum, required - Math.max(straight, 0) - arc);
  const leg = Math.max(0, Math.min(needed, legMax));
  return {
    required,
    straight,
    leg,
    legMax,
    developed: Math.max(straight, 0) + arc + leg,
    fits: legMax + 1e-6 >= needed,
  };
}

/** Transverse axis positions (mm from one lateral face) of n bars between the stirrup legs. */
export function beamBarPositions(p: Piece, count: number, diameter: number) {
  const g = p.geometry,
    edge = g.cover + p.rebar.stirrupDiameter + diameter / 2;
  return Array.from(
    { length: count },
    (_, i) => edge + (count > 1 ? (i * (g.width - 2 * edge)) / (count - 1) : 0),
  );
}

export function beamLayout(
  p: Piece,
  values: Record<string, number> = calculate(p).values,
): BeamLayout {
  const g = p.geometry,
    r = p.rebar,
    q = p.design,
    s = p.detailing;
  const layout = tieLayout(p);
  const slope = (g.height - g.tipHeight) / g.length;
  const bottomAt = (x: number, offset: number) =>
    g.height - slope * x - offset * Math.sqrt(1 + slope ** 2);
  const frontOrigin = Math.max(0, g.loadOffset - q.bearingLength / 2);
  // Tie: anchorage required by the engine (same lb,nec as the support check).
  const phi = r.tieDiameter;
  const lbTie = finite(values.lb) ? values.lb : 25 * phi;
  const lbNecTop = finite(values.anchorRequired)
    ? values.anchorRequired
    : Math.max(lbTie, 10 * phi, 100);
  // Positive bars are constructive: full anchorage of their own diameter, hooked ends.
  const phiB = s.beamBottomDiameter;
  const lbBottom = (lbTie / phi) * phiB;
  const alphaBottom = g.cover + r.stirrupDiameter >= 3 * phiB ? 0.7 : 1;
  const lbNecBottom = Math.max(
    alphaBottom * lbBottom,
    0.3 * lbBottom,
    10 * phiB,
    100,
  );

  const mandrel = mandrelDiameter(phi, p.materials.fyk);
  const radius = (mandrel + phi) / 2;
  const xFront = g.length - g.cover - phi / 2;
  const xBack = -(g.columnWidth - g.cover - phi / 2);
  const rows = layout.rows
    .map((row, layer) => ({ row, layer }))
    .filter(({ row }) => row.count > 0);
  const top = rows.map(({ row, layer }) => {
    const z = row.y;
    const back = end(
      lbNecTop,
      -xBack - radius,
      radius,
      g.height - g.cover - phi / 2 - z - radius,
      phi,
    );
    const front = end(
      lbNecTop,
      xFront - radius - frontOrigin,
      radius,
      bottomAt(xFront, g.cover + phi / 2) - z - radius,
      phi,
    );
    const vertices = [
      { x: xBack, y: z + radius + back.leg },
      { x: xBack, y: z },
      { x: xFront, y: z },
      { x: xFront, y: z + radius + front.leg },
    ];
    return {
      layer,
      count: row.count,
      depth: z,
      diameter: phi,
      mandrel,
      radius,
      vertices,
      path: roundedPath(vertices, radius),
      back,
      front,
      span: xFront - xBack,
    };
  });

  // Bottom bars sit inside the tie legs so the bends do not clash at the corners.
  const mandrelB = mandrelDiameter(phiB, p.materials.fyk);
  const radiusB = (mandrelB + phiB) / 2;
  const offset = g.cover + r.stirrupDiameter + phiB / 2;
  const xFrontB = xFront - phi / 2 - phiB / 2;
  const xBackB = xBack + phi / 2 + phiB / 2;
  const zSupport = bottomAt(0, offset);
  const zTip = bottomAt(xFrontB, offset);
  const ceiling = (top[0]?.depth ?? g.cover) + phi / 2 + phiB / 2;
  const backB = end(
    lbNecBottom,
    -xBackB - radiusB,
    radiusB,
    zSupport - radiusB - ceiling,
    phiB,
  );
  const frontB = end(
    lbNecBottom,
    Math.hypot(xFrontB - frontOrigin, zTip - bottomAt(frontOrigin, offset)) -
      radiusB,
    radiusB,
    zTip - radiusB - ceiling,
    phiB,
  );
  const verticesB = [
    { x: xBackB, y: zSupport - radiusB - backB.leg },
    { x: xBackB, y: zSupport },
    ...(slope > 0 ? [{ x: 0, y: zSupport }] : []),
    { x: xFrontB, y: zTip },
    { x: xFrontB, y: zTip - radiusB - frontB.leg },
  ];
  return {
    top,
    bottom: {
      count: s.beamBottomCount,
      diameter: phiB,
      mandrel: mandrelB,
      radius: radiusB,
      vertices: verticesB,
      path: roundedPath(verticesB, radiusB),
      back: backB,
      front: frontB,
      span: xFrontB - xBackB,
      depthSupport: zSupport,
      depthTip: zTip,
    },
    frontOrigin,
    lbNecTop,
    lbNecBottom,
  };
}
