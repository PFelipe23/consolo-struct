import {
  area,
  fingerprint,
  geometryErrors,
  pieceSchema,
  volume,
  type Piece,
} from "./model";
import {
  elDebsSimplified,
  reactionGeometry,
  upperStitchLayout,
} from "./theory";

export const ENGINE_VERSION = "0.4.0";
export const POLICY = "LC-ELU-2026.2";
export type CheckStatus = "pass" | "fail" | "review" | "na";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  demand: number | null;
  capacity: number | null;
  utilization: number | null;
  unit: string;
  formula: string;
  reference: string;
  detail: string;
}
export interface CaseResult {
  name: string;
  classification: "short" | "veryShort";
  method: "strut" | "friction";
  checks: Check[];
  values: Record<string, number>;
  status: "pass" | "fail" | "review";
}
export interface CalculationResult {
  kind: "calculated";
  engineVersion: string;
  policy: string;
  fingerprint: string;
  status: "pass" | "fail" | "review" | "invalid" | "unsupported";
  reasons: string[];
  combinations: CaseResult[];
  governingCase: string;
  checks: Check[];
  values: Record<string, number>;
  assumptions: string[];
}
const refs = {
  safety: "NBR 6118:2026 §22.2; NBR 9062:2017 §7.3.1.1; política LC-ELU-2026.2",
  geometry: "NBR 9062:2017 §7.3.3",
  stm: "Araújo, v.4, §4.5, eq.4.5.2–4.5.12; NBR 6118:2026 §22.3 e §22.5.1",
  friction: "NBR 9062:2017 §7.3.4.2 e §7.3.5.4",
  stitch: "NBR 9062:2017 §7.3.6; NBR 6118:2026 §22.5.1.4.3; El Debs §4.4.4",
  anchor: "NBR 6118:2026 §9.3.2, §9.4.2.4–6; NBR 9062:2017 §7.3.5.5",
  literature:
    "El Debs, trecho fornecido §3.5.1, pp.125–130, eqs.3.18–3.27 e quadro 3.2; complemento bibliográfico",
};
const supportRatios = {
  dry: 0.8,
  mortar: 0.5,
  elastomer: 0.16,
  ptfe: 0.08,
  steel: 0.25,
  concreteSteel: 0.4,
  restrained: 0,
} as const;
export function materialProperties(
  fck: number,
  fyk: number,
  fykTransverse = 500,
) {
  const fcd = fck / 1.4,
    fyd = fyk / 1.15;
  const fctm =
    fck <= 50 ? 0.3 * fck ** (2 / 3) : 2.12 * Math.log(1 + 0.1 * (fck + 8));
  const alphaV2 = 1 - fck / 250;
  return {
    fcd,
    fyd,
    fydLimited: Math.min(fyd, 435),
    fywd: Math.min(fykTransverse / 1.15, 435),
    fctm,
    fctd: (0.7 * fctm) / 1.4,
    fctkSup: 1.3 * fctm,
    alphaV2,
    etaC: fck <= 40 ? 1 : (40 / fck) ** (1 / 3),
    lambda: fck <= 50 ? 0.8 : 0.8 - (fck - 50) / 400,
    alphaC: fck <= 50 ? 0.85 : 0.85 * (1 - (fck - 50) / 200),
    fcd1: 0.85 * alphaV2 * fcd,
    fcd2: 0.6 * alphaV2 * fcd,
    fcd3: 0.72 * alphaV2 * fcd,
  };
}
export function tieLayout(p: Piece) {
  const { geometry: g, rebar: r, design: d } = p;
  const spacingVertical = Math.max(20, r.tieDiameter, 0.5 * d.aggregate);
  const first =
    g.cover + r.stirrupDiameter + r.tieDiameter / 2 + d.extraTopCover;
  const rows = Array.from({ length: d.tieLayers }, (_, i) => ({
    count:
      Math.floor(r.tieCount / d.tieLayers) +
      (i < r.tieCount % d.tieLayers ? 1 : 0),
    y: first + i * (r.tieDiameter + spacingVertical),
  }));
  const dPrime =
    rows.reduce((sum, row) => sum + row.count * row.y, 0) / r.tieCount;
  const perRow = Math.max(...rows.map((row) => row.count));
  const inner = g.width - 2 * (g.cover + r.stirrupDiameter);
  const freeSpacing =
    perRow > 1
      ? (inner - perRow * r.tieDiameter) / (perRow - 1)
      : inner - r.tieDiameter;
  return {
    rows,
    dPrime,
    d: g.height - dPrime,
    spacingVertical,
    perRow,
    freeSpacing,
    inner,
    spacingHorizontalMin: Math.max(20, r.tieDiameter, 1.2 * d.aggregate),
    maxDepth:
      Math.max(...rows.filter((row) => row.count).map((row) => row.y)) +
      r.tieDiameter / 2,
  };
}
// Literature model, keeping full precision (the printed example rounds tan(theta) to 1.33).
export function strutTieModel({
  vertical,
  horizontal,
  a,
  d,
  dPrime,
  bearingLength,
  width,
  loadHeight = 0,
  maxTangent = 2,
}: {
  vertical: number;
  horizontal: number;
  a: number;
  d: number;
  dPrime: number;
  bearingLength: number;
  width: number;
  loadHeight?: number;
  maxTangent?: number;
}) {
  const tangent = Math.min(maxTangent, (d - dPrime) / (a + bearingLength / 2));
  const theta = Math.atan(tangent),
    sin = Math.sin(theta),
    cos = Math.cos(theta);
  const effectiveD = tangent * (a + bearingLength / 2) + dPrime;
  const z = a * tangent,
    e = dPrime + loadHeight;
  const expandedWidth = Math.min(
    bearingLength + (2 * dPrime) / tangent,
    bearingLength + 2 * dPrime,
  );
  const strutWidth = expandedWidth * sin;
  const effectiveV = vertical + (horizontal * e) / a;
  const tieForce = (vertical * a) / z + horizontal * (1 + e / z);
  const strutForce = effectiveV / sin;
  return {
    tangent,
    theta: (theta * 180) / Math.PI,
    sin,
    cos,
    effectiveD,
    z,
    e,
    strutWidth,
    expandedWidth,
    effectiveV,
    tieForce,
    strutForce,
    strutStress: strutForce / (width * strutWidth),
    bearingStress: vertical / (width * bearingLength),
    supportNodeWidth: strutWidth / cos,
    supportNodeStress: (tieForce - horizontal) / ((width * strutWidth) / cos),
    momentResidual: tieForce * z - vertical * a - horizontal * (z + e),
  };
}
function check(
  id: string,
  label: string,
  demand: number,
  capacity: number,
  unit: string,
  formula: string,
  reference: string,
  detail = "",
): Check {
  const finite = Number.isFinite(demand) && Number.isFinite(capacity);
  return {
    id,
    label,
    demand: finite ? demand : null,
    capacity: finite ? capacity : null,
    utilization:
      finite && capacity > 0
        ? demand / capacity
        : demand === 0 && capacity === 0
          ? 0
          : null,
    status:
      finite && demand <= capacity + Math.max(1e-8, Math.abs(capacity) * 1e-10)
        ? "pass"
        : "fail",
    unit,
    formula,
    reference,
    detail,
  };
}
function note(
  id: string,
  label: string,
  detail: string,
  reference: string,
  status: CheckStatus = "review",
): Check {
  return {
    id,
    label,
    detail,
    reference,
    status,
    demand: null,
    capacity: null,
    utilization: null,
    unit: "",
    formula: "",
  };
}
function statusOf(checks: Check[]): "pass" | "fail" | "review" {
  return checks.some((c) => c.status === "fail")
    ? "fail"
    : checks.some((c) => c.status === "review")
      ? "review"
      : "pass";
}
export function minimumFlexuralSteel(
  b: number,
  h: number,
  d: number,
  fck: number,
  fyk: number,
) {
  const m = materialProperties(fck, fyk);
  const moment = 0.8 * ((b * h * h) / 6) * m.fctkSup;
  const stress = m.alphaC * m.etaC * m.fcd;
  const discriminant = d * d - (2 * moment) / (b * stress);
  if (discriminant < 0) return { moment, required: Infinity };
  const compressionDepth = d - Math.sqrt(discriminant);
  return {
    moment,
    required: Math.max(0.0015 * b * h, (stress * b * compressionDepth) / m.fyd),
  };
}
function calculateCase(
  p: Piece,
  load: { name: string; vertical: number; horizontal: number; gamma: number },
): CaseResult {
  const g = p.geometry,
    r = p.rebar,
    q = p.design,
    b = g.width,
    reaction = reactionGeometry(p),
    a = reaction.a;
  const layout = tieLayout(p),
    d = layout.d,
    dp = layout.dPrime,
    ratio = a / d;
  const classification = ratio <= 0.5 ? "veryShort" : "short";
  const method =
    q.method === "auto"
      ? classification === "veryShort"
        ? "friction"
        : "strut"
      : q.method;
  const m = materialProperties(
    p.materials.fck,
    p.materials.fyk,
    q.fykTransverse,
  );
  const gn9062 =
    q.production === "factory"
      ? q.permanentPredominant
        ? 1
        : 1.1
      : q.production === "precast"
        ? q.permanentPredominant
          ? 1.1
          : 1.2
        : 1.2;
  const gammaN = Math.max(1.2, gn9062, q.gammaN);
  const factor = q.forceMode === "design" ? 1 : load.gamma * gammaN;
  const selfWeight =
    q.includeSelfWeight && q.forceMode === "characteristic"
      ? volume(g) * 25000
      : 0;
  // Concentrate self-weight at a only if conservative; otherwise use its actual moment arm in a supplementary check below.
  const vertical = (load.vertical + selfWeight) * factor;
  const horizontalProvided = Math.max(0, load.horizontal * factor);
  const horizontalEstimated =
    q.horizontalMode === "estimated"
      ? supportRatios[q.supportType] * vertical
      : 0;
  const horizontalBeforeFloor = horizontalProvided + horizontalEstimated;
  const horizontalFloor = q.literatureRecommendations ? 0.2 * vertical : 0;
  // An analysed pair is not silently rewritten. The book's floor is a separate check.
  const horizontal =
    q.horizontalMode === "estimated"
      ? Math.max(horizontalBeforeFloor, horizontalFloor)
      : horizontalBeforeFloor;
  const asTie = area(r.tieCount, r.tieDiameter),
    fy = m.fydLimited;
  const bearingEccentricity =
    reaction.shift + (horizontal * q.bearingHeight) / vertical;
  const bearingStress =
    (vertical / (q.bearingWidth * q.bearingLength)) *
    (1 + (6 * bearingEccentricity) / q.bearingLength);
  const mu = q.joint === "monolithic" ? 1.4 : q.joint === "rough" ? 1 : 0.6;
  const model = strutTieModel({
    vertical,
    horizontal,
    a,
    d,
    dPrime: dp,
    bearingLength: reaction.effectiveLength,
    width: q.bearingWidth,
    loadHeight: q.bearingHeight,
    maxTangent: classification === "veryShort" ? 1.4 : 2,
  });
  const frictionAs = (0.8 * vertical) / (fy * mu) + horizontal / fy;
  const shortNormAs = ((0.1 + ratio) * vertical) / fy + horizontal / fy;
  const elDebs = elDebsSimplified({
    vertical,
    horizontal,
    a,
    d,
    loadHeight: dp + q.bearingHeight,
    width: b,
    fcd: m.fcd,
    indirect: q.loadType === "indirect",
  });
  const elDebsAs = elDebs.tieForce / fy;
  const literatureDomain = ratio >= 0.4 && ratio <= 1;
  const asModel =
    method === "strut"
      ? Math.max(
          model.tieForce / fy,
          classification === "short" ? shortNormAs : 0,
        )
      : Math.max(frictionAs, elDebsAs);
  const minFlex = minimumFlexuralSteel(
    b,
    g.height,
    d,
    p.materials.fck,
    p.materials.fyk,
  );
  const asMechanical = ((0.04 * p.materials.fck) / p.materials.fyk) * b * d;
  const tieRequired = Math.max(
    asModel,
    minFlex.required,
    asMechanical,
    q.literatureRecommendations && literatureDomain ? elDebsAs : 0,
  );
  const asV =
    method === "friction"
      ? Math.max((0.8 * vertical) / (fy * mu), (vertical * a) / (0.9 * d) / fy)
      : Math.max(model.tieForce - horizontal, (0.1 + ratio) * vertical) / fy;
  const rho = asTie / (b * d),
    tau = vertical / (b * d);
  const tauLimitSteel = 3 + 0.9 * rho * fy;
  const tauLimitConcrete = 0.27 * m.alphaV2 * m.fcd;
  const tauLimit = Math.min(tauLimitSteel, tauLimitConcrete, 8);
  // Edge clearances refer to the actual pad, not the shifted reaction or the sub-area.
  const a2 = g.length - g.loadOffset - q.bearingLength / 2;
  const frontClearanceRequired =
    q.frontAnchor === "welded"
      ? g.cover + r.tieDiameter
      : g.cover + (r.tieDiameter < 20 ? 3.5 : 5) * r.tieDiameter;
  const zone = (2 * d) / 3;
  // 9062 specifies steel per unit height; 6118 specifies total area. Do not interchange them.
  const rate9062 = ((classification === "short" ? 0.4 : 0.5) * asV) / d;
  const total6118 = classification === "short" ? 0.4 * asTie : 0;
  const totalLiterature = (classification === "short" ? 0.4 : 0.5) * asV;
  const stitchRate = Math.max(
    rate9062,
    0.0015 * b,
    total6118 / zone,
    totalLiterature / zone,
  );
  const stitchRequired = stitchRate * zone;
  const stitchLiterature = (0.5 * elDebs.tieVertical) / fy;
  const stitchEnvelope = q.literatureRecommendations
    ? Math.max(stitchRequired, stitchLiterature)
    : stitchRequired;
  const stitchProvided = 2 * area(r.stitchCount, r.stitchDiameter);
  const stitchLayout = upperStitchLayout(p, layout);
  const stitchSpacing = stitchLayout.pitch,
    stitchSpacingLimit = Math.min(100, a);
  const lowerZone = d / 3,
    lowerRequired = classification === "veryShort" ? 0.0015 * b * lowerZone : 0;
  const lowerProvided = 2 * area(q.lowerStitchCount, r.stitchDiameter);
  const stirrupNormative = q.loadType === "direct" ? 0.0015 * b * g.height : 0;
  const stirrupLiterature = 0.2 * asTie;
  const stirrupRequired = q.literatureRecommendations
    ? Math.max(stirrupNormative, stirrupLiterature)
    : stirrupNormative;
  const stirrupProvided = 2 * area(r.stirrupCount, r.stirrupDiameter);
  const suspensionRequired = q.loadType === "indirect" ? vertical / m.fywd : 0;
  const suspensionProvided = 2 * area(q.suspensionCount, q.suspensionDiameter);
  const lateralMargin = (b - q.bearingWidth) / 2;
  const splittingForce =
    lateralMargin > g.cover ? 0.3 * vertical * (1 - q.bearingWidth / b) : 0;
  const splittingRequired = splittingForce / m.fywd;
  const splittingProvided = 2 * area(q.splittingCount, q.splittingDiameter);
  const eta1 = p.materials.fyk === 500 ? 2.25 : 1;
  const fbd =
    eta1 *
    (q.bond === "good" ? 1 : 0.7) *
    (r.tieDiameter < 32 ? 1 : (132 - r.tieDiameter) / 100) *
    m.fctd;
  const lb = Math.max((r.tieDiameter * m.fyd) / (4 * fbd), 25 * r.tieDiameter);
  const anchorAlpha =
    q.supportAnchor === "hook" && q.hookNormalCover >= 3 * r.tieDiameter
      ? 0.7
      : 1;
  const anchorRequired = Math.max(
    (anchorAlpha * lb * tieRequired) / asTie,
    0.3 * lb,
    10 * r.tieDiameter,
    100,
  );
  const confinementRequired = (0.25 * area(1, r.tieDiameter) * m.fyd) / m.fywd;
  const standardCover = { I: 25, II: 30, III: 40, IV: 50 }[q.exposure];
  const minCover = Math.max(
    standardCover -
      (q.qualityCoverReduction && q.production !== "cast" ? 5 : 0),
    r.tieDiameter,
    q.aggregate / 1.2,
  );
  const loopPinFactor =
    p.materials.fyk === 250
      ? r.tieDiameter < 20
        ? 4
        : 5
      : p.materials.fyk === 500
        ? r.tieDiameter < 20
          ? 5
          : 8
        : 6;
  const checks: Check[] = [];
  const add = (c: Check) => checks.push(c);
  if (q.literatureRecommendations) {
    add(
      check(
        "literatureHorizontal",
        "Força horizontal mínima complementar (El Debs)",
        horizontalFloor,
        horizontal,
        "N",
        "Hd ≥ 0,20 Vd",
        refs.literature,
        "Recomendação bibliográfica ativada. Em H por análise, o par informado é conservado e a insuficiência é indicada; em H estimado, aplica-se o piso sem somá-lo novamente.",
      ),
    );
    add(
      check(
        "literatureTip",
        "Altura da ponta complementar (El Debs)",
        g.height / 2,
        g.tipHeight,
        "mm",
        "h2 ≥ h/2",
        refs.literature,
        "Recomendação mais restritiva que h2 ≥ h/2−a2 da NBR 9062. Não substitui a verificação normativa.",
      ),
    );
    if (literatureDomain) {
      add(
        check(
          "literatureConcrete",
          "Tensão de referência complementar (El Debs)",
          tau,
          0.2 * m.fcd,
          "MPa",
          "τwd = Vd/(b d) ≤ 0,20 fcd; 0,4 ≤ a/d ≤ 1",
          refs.literature,
        ),
      );
      add(
        check(
          "literatureStrut",
          "Biela simplificada complementar (El Debs)",
          elDebs.strutStress,
          elDebs.strutLimit,
          "MPa",
          "z=0,9d; hbie=0,2d; Rc=(Vd a+Hd dh)/abie; σc=Rc/(0,2bd) ≤ βfcd",
          refs.literature,
          "Mantido o termo Hd·dh, sem a aproximação de desprezá-lo. β=1 para carga direta e 0,85 para indireta. O modelo geométrico e seus nós continuam verificados.",
        ),
      );
    }
  }
  add(
    check(
      "tie",
      "Armadura do tirante",
      tieRequired,
      asTie,
      "mm²",
      "As,req = max(As,modelo; As,min,6118; 0,04 fck/fyk · b d; As,ElDebs se habilitado no domínio)",
      "NBR 9062 §7.3.5; NBR 6118 §17.3.5.2.1 e §22.5.1.4.1",
      "A área inclui a parcela horizontal e as armaduras mínimas.",
    ),
  );
  add(
    check(
      "mechanical",
      "Taxa mecânica mínima do tirante",
      0.04 + 1e-7,
      (rho * p.materials.fyk) / p.materials.fck,
      "",
      "ω = (As / bd) fyk/fck > 0,04",
      "NBR 9062 §7.3.5.2",
    ),
  );
  if (method === "strut") {
    add(
      check(
        "strut",
        "Compressão da biela",
        model.strutStress,
        Math.min(m.fcd2, (q.loadType === "direct" ? 1 : 0.85) * m.fcd),
        "MPa",
        "σb = (Vd + Hd·e/a)/(beff·c2·senθ); fcd2 = 0,60 αv2 fcd",
        refs.stm,
        "Modelo geométrico de Araújo, largura efetiva limitada à largura do apoio; abertura lateral limitada a 1:2. Limite conservador para biela fissurada.",
      ),
    );
    add(
      check(
        "angleMin",
        "Inclinação mínima da biela",
        0.57,
        model.tangent,
        "",
        "tanθ ≥ 0,57",
        "NBR 6118 §22.3.1",
      ),
    );
    add(
      check(
        "nodeSupport",
        "Nó comprimido junto ao suporte",
        model.supportNodeStress,
        m.fcd1,
        "MPa",
        "σn = (T − Hd) / (beff·c2/cosθ) ≤ 0,85 αv2 fcd",
        "NBR 6118 §22.3.2; Araújo fig.4.5.2",
      ),
    );
    const concreteScale = Math.min(
      m.fcd2 / model.strutStress,
      m.fcd3 / bearingStress,
      m.fcd1 / model.supportNodeStress,
    );
    add(
      check(
        "ductility",
        "Escoamento do tirante antes do concreto",
        asTie * fy,
        model.tieForce * concreteScale,
        "N",
        "As,ef·fyd ≤ T·min(fcd2/σb; fcd3/σapoio; fcd1/σn)",
        "NBR 6118 §22.5.1.2(b); verificação mecânica LC-ELU-2026.2",
        "Comparação de limites no modelo adotado, sob crescimento proporcional de Vd e Hd. Não é uma verificação de ductilidade global da estrutura.",
      ),
    );
  } else {
    add(
      check(
        "strut",
        "Compressão diagonal / cisalhamento",
        tau,
        tauLimit,
        "MPa",
        "τwd = Vd/(bd) ≤ min(3 + 0,9ρfyd; 0,27(1−fck/250)fcd; 8)",
        refs.friction,
      ),
    );
    add(
      note(
        "ductility",
        "Ductilidade no modelo de atrito",
        "A lei empírica de atrito-cisalhamento não fornece, sozinha, um limite superior de armadura que demonstre escoamento prévio. Requer avaliação do mecanismo e do detalhamento; não se reutiliza o antigo limite ω=0,15 como exigência da edição atual.",
        "NBR 6118 §22.5.1.2(b); NBR 9062 §7.3.4.2",
      ),
    );
  }
  add(
    check(
      "bearing",
      q.loadType === "direct"
        ? "Compressão na zona do apoio"
        : "Compressão no nó de aplicação indireta",
      bearingStress,
      m.fcd3,
      "MPa",
      "eapoio = Δa + Hd·hapoio/Vd; σmax = Vd/(c·beff)·(1+6eapoio/c) ≤ 0,72 αv2 fcd",
      "NBR 6118 §22.3.2 e §22.5.1.4.2",
      "Distribuição linear de compressão e contato integral (eapoio ≤ c/6). Inclui deslocamento da reação e altura de H, somados antes de verificar o núcleo. Não admite tração de contato nem ganho por confinamento; o aparelho exige verificação própria.",
    ),
  );
  add(
    check(
      "stitch",
      "Costura nos 2/3 d superiores",
      stitchEnvelope,
      stitchProvided,
      "mm²",
      "As,cost = max(r9062·2d/3; 0,0015b·2d/3; 0,4As,tir [curto]; kAsv; 0,5 Vd a/(0,9d fy) se El Debs ativado)",
      refs.stitch,
      "N2 conta estribos horizontais fechados, com dois ramos efetivos. k=0,4 curto / 0,5 muito curto: complemento conservador de El Debs.",
    ),
  );
  add(
    check(
      "stitchSpacing",
      "Espaçamento vertical da costura",
      stitchSpacing,
      stitchSpacingLimit,
      "mm",
      "s = (yúltima−yprimeira)/(n−1) ≤ min(100; a); para n=1, s=2d/3",
      "NBR 9062 §7.3.3.12",
      "Espaçamento real dos eixos desenhados, abaixo da última camada do tirante e dentro dos 2/3 d superiores. Não se usa mais zona/n quando o detalhe tem outra distribuição.",
    ),
  );
  add(
    check(
      "stitchZone",
      "Costura cabe abaixo do tirante",
      stitchLayout.start,
      stitchLayout.end,
      "mm",
      "yprimeira ≤ d′+2d/3",
      refs.stitch,
    ),
  );
  add(
    check(
      "stitchClear",
      "Espaço livre vertical da costura",
      Math.max(20, r.stitchDiameter, 0.5 * q.aggregate),
      stitchSpacing - r.stitchDiameter,
      "mm",
      "s−φ ≥ max(20;φ;0,5dag)",
      "NBR 6118 §18.3.2.2, critério construtivo adotado",
    ),
  );
  add(
    check(
      "stitchDiameter",
      "Diâmetro da costura",
      r.stitchDiameter,
      Math.min(b, g.height) / 15,
      "mm",
      "φcost ≤ min(b,h)/15",
      "NBR 9062 §7.3.3.12",
    ),
  );
  if (classification === "veryShort") {
    add(
      check(
        "lowerStitch",
        "Costura mínima no terço inferior",
        lowerRequired,
        lowerProvided,
        "mm²",
        "As,inf ≥ 0,0015 b · d/3",
        "NBR 9062 §7.3.6(b,d)",
      ),
    );
    add(
      check(
        "lowerSpacing",
        "Espaçamento no terço inferior",
        q.lowerStitchCount ? lowerZone / q.lowerStitchCount : Infinity,
        stitchSpacingLimit,
        "mm",
        "sinf ≤ min(100; a)",
        "NBR 9062 §7.3.3.12 e §7.3.6",
      ),
    );
  }
  add(
    check(
      "transverse",
      "Estribos verticais construtivos",
      stirrupRequired,
      stirrupProvided,
      "mm²",
      "As,vert ≥ max(0,0015 b h [direta]; 0,2 As,tir [se El Debs ativado])",
      "NBR 9062 §7.3.7.2",
      "N3 conta estribos fechados, com dois ramos. Complemento de El Debs p.129(e) quando ativado; N5 de suspensão permanece independente, sem dupla contagem.",
    ),
  );
  if (q.loadType === "indirect")
    add(
      check(
        "suspension",
        "Suspensão da carga indireta integral",
        suspensionRequired,
        suspensionProvided,
        "mm²",
        "As,sus = Vd/min(fywk/γs;435)",
        "NBR 6118 §22.5.1.4.4; NBR 9062 §7.3.8",
        "Resiste a 100% da carga indireta, sem adotar redução de 60% do exemplo histórico do livro.",
      ),
    );
  add(
    check(
      "splitting",
      "Fendilhamento transversal sob apoio",
      splittingRequired,
      splittingProvided,
      "mm²",
      "As,fend = 0,30 Vd(1−beff/b)/fywd, se afastamento lateral > c",
      "NBR 9062 §7.3.3.3; El Debs §4.3.1.1, p.115–116",
      "Modelo de bloco parcialmente carregado centrado, na direção transversal. N4 é armadura exclusiva; não é somada novamente à costura.",
    ),
  );
  add(
    check(
      "bearingInside",
      "Apoio contido no comprimento",
      g.loadOffset + q.bearingLength / 2,
      g.length,
      "mm",
      "a + c/2 ≤ L",
      refs.geometry,
    ),
  );
  add(
    check(
      "bearingInner",
      "Face interna do apoio",
      q.bearingLength / 2,
      g.loadOffset,
      "mm",
      "a − c/2 ≥ 0",
      refs.geometry,
    ),
  );
  add(
    check(
      "bearingWidth",
      "Apoio contido na largura",
      q.bearingWidth,
      b,
      "mm",
      "beff ≤ b",
      refs.geometry,
    ),
  );
  add(
    check(
      "tipHeight",
      "Altura mínima da extremidade",
      Math.max(0, g.height / 2 - a2),
      g.tipHeight,
      "mm",
      "h2 ≥ h/2 − a2",
      "NBR 9062 §7.3.3.1",
    ),
  );
  add(
    check(
      "frontClearance",
      "Afastamento frontal do apoio",
      frontClearanceRequired,
      a2,
      "mm",
      "a2 ≥ c+φ (soldada), c+3,5φ (alça φ<20), c+5φ (alça φ≥20)",
      "NBR 9062 §7.3.3.4",
    ),
  );
  add(
    check(
      "tieDepth",
      "Tirante no quinto superior",
      layout.maxDepth,
      g.height / 5,
      "mm",
      "Profundidade da barra mais baixa ≤ h/5",
      "NBR 9062 §7.3.3.11",
    ),
  );
  add(
    check(
      "clearSpacing",
      "Espaçamento livre entre barras",
      layout.spacingHorizontalMin,
      layout.freeSpacing,
      "mm",
      "ah ≥ max(20; φ; 1,2dag)",
      "NBR 6118 §7.5 e §18.3.2.2, adotado como critério de disposição",
    ),
  );
  add(
    check(
      "tieDiameter",
      "Diâmetro máximo do tirante",
      r.tieDiameter,
      Math.min(25, Math.min(b, g.height) / (q.frontAnchor === "loop" ? 8 : 6)),
      "mm",
      "φ ≤ min(25; min(b,h)/8 ou /6)",
      "NBR 9062 §7.3.3.6–7",
    ),
  );
  add(
    check(
      "tiePitch",
      "Espaçamento máximo em planta",
      layout.perRow > 1 ? layout.freeSpacing + r.tieDiameter : 0,
      Math.min(d, (q.frontAnchor === "loop" ? 15 : 20) * r.tieDiameter),
      "mm",
      "s ≤ min(d; 15φ [alça] ou 20φ [soldada])",
      "NBR 9062 §7.3.3.6–7",
    ),
  );
  add(
    check(
      "cover",
      "Cobrimento nominal",
      minCover,
      g.cover,
      "mm",
      "cnom ≥ max(ctabela−Δredução; φ; dag/1,2)",
      "NBR 6118 §7.4.7 e tabela 7.2; NBR 9062 §9.2.1.1",
      "Redução de 5 mm somente quando explicitado controle de qualidade; nenhuma redução adicional por fck é automática.",
    ),
  );
  add(
    check(
      "concreteClass",
      "Resistência mínima para exposição",
      { I: 20, II: 25, III: 30, IV: 40 }[q.exposure],
      p.materials.fck,
      "MPa",
      "C20/C25/C30/C40 para CAA I/II/III/IV",
      "NBR 6118 tabela 7.1",
    ),
  );
  add(
    check(
      "anchorage",
      "Ancoragem do tirante no suporte",
      anchorRequired,
      q.supportAnchorLength,
      "mm",
      "lb=max(φfyd/(4fbd);25φ); lb,nec=max(αlb As,calc/As,ef;0,3lb;10φ;100)",
      refs.anchor,
    ),
  );
  add(
    check(
      "anchorConfinement",
      "Armadura transversal na ancoragem",
      confinementRequired,
      q.anchorConfinementArea,
      "mm²",
      "As,conf·fywd ≥ 0,25 Aφ fyd",
      "NBR 6118 §9.4.2.6.1",
      "Área efetiva que atravessa o plano crítico ao longo da ancoragem; informar separadamente, sem presumir a existência de estribos no pilar.",
    ),
  );
  add(
    check(
      "supportRebar",
      "Armadura local na face do suporte",
      asTie,
      q.supportRebarArea,
      "mm²",
      "As,suporte ≥ As,tirante",
      "NBR 9062 §7.3.3.14",
      "Não constitui dimensionamento do pilar, painel ou viga-suporte.",
    ),
  );
  if (q.supportAnchor === "straight") {
    add(
      check(
        "anchorFits",
        "Trecho reto cabe no suporte",
        q.supportAnchorLength,
        g.columnWidth - g.cover,
        "mm",
        "lb,disp ≤ P − c",
        "Compatibilidade geométrica; NBR 6118 §9.4",
      ),
    );
    if (p.materials.fyk === 250)
      add(
        note(
          "smoothHook",
          "Gancho para barra lisa",
          "CA-25 tracionado exige gancho; ancoragem exclusivamente reta não é admitida neste modelo.",
          "NBR 6118 §9.4.2.1(a)",
          "fail",
        ),
      );
  } else
    add(
      note(
        "hookPath",
        "Percurso do gancho no suporte",
        "Conferir comprimento equivalente informado, diâmetro de dobramento, ponta reta, confinamento e interferências. A interface não define a geometria completa do pilar.",
        "NBR 6118 §9.4.2.3–6",
      ),
    );
  if (q.frontAnchor === "loop") {
    add(
      check(
        "loopPin",
        "Diâmetro interno da alça horizontal",
        loopPinFactor * r.tieDiameter,
        q.loopInternalDiameter,
        "mm",
        "D ≥ kφ (tabela 9.1)",
        "NBR 6118 tabela 9.1; NBR 9062 §7.3.3.5",
      ),
    );
    add(
      check(
        "loopWidth",
        "Espaço transversal para alça",
        q.loopInternalDiameter + 2 * r.tieDiameter,
        b - 2 * g.cover,
        "mm",
        "D + 2φ ≤ b − 2c",
        "Compatibilidade geométrica da ancoragem horizontal",
      ),
    );
    if (layout.rows.some((row) => row.count % 2 !== 0))
      add(
        note(
          "loopEven",
          "Ramos das alças",
          "A ancoragem por alças horizontais exige número par de ramos de tirante em cada camada.",
          "Modelo de armadura em alças",
          "fail",
        ),
      );
    if (p.materials.fyk === 600 && r.tieDiameter >= 20)
      add(
        note(
          "loopSteel",
          "Dobramento CA-60",
          "A tabela 9.1 não fornece pino para CA-60 com φ ≥ 20 mm. Selecione outra solução.",
          "NBR 6118 tabela 9.1",
          "fail",
        ),
      );
    if (
      !(3 * g.cover <= a2 && a2 <= 3 * (g.cover + r.tieDiameter)) ||
      q.loadType !== "direct"
    )
      add(
        note(
          "frontSplitting",
          "Fendilhamento no plano da alça",
          "A condição de dispensa 3c ≤ a2 ≤ 3(c+φ), sob carga direta, não está satisfeita. É necessária análise do fendilhamento no plano horizontal da alça; a armadura N4 transversal não substitui essa análise.",
          "NBR 9062 §7.3.3.5",
        ),
      );
  } else {
    add(
      check(
        "weldDiameter",
        "Barra transversal soldada de mesmo diâmetro",
        Math.abs(q.weldedBarDiameter - r.tieDiameter),
        0,
        "mm",
        "φt = φtir",
        "NBR 6118 §9.4.7.1; NBR 9062 §7.3.3.7",
      ),
    );
    add(
      check(
        "weldForce",
        "Resistência de cálculo da solda por ramo",
        Math.max(
          (tieRequired * fy) / r.tieCount,
          1.15 * area(1, r.tieDiameter) * m.fyd,
        ),
        q.weldResistancePerBar,
        "N",
        "Rwd,ramo ≥ max(As,req fyd/n; 1,15 Aφ fyd)",
        "NBR 6118 §9.4.7.1 e §9.5.4",
        "Rwd é fornecida pelo projeto/qualificação; inclui-se o piso conservador de 1,15 da força de escoamento do ramo, conforme §9.5.4. O software não calcula resistência metalúrgica nem substitui os ensaios.",
      ),
    );
    if (q.weldSpecification.trim().length < 10)
      add(
        note(
          "weldSpec",
          "Especificação da solda",
          "Registrar aço soldável, procedimento, contorno completo e origem da resistência de cálculo por ramo.",
          "NBR 9062 §7.3.3.8–10; NBR 6118 §9.4.7.1",
        ),
      );
  }
  if (!q.inputsConfirmed)
    add(
      note(
        "reviewInputs",
        "Conferência dos dados de cálculo",
        "Dados novos ou migrados ainda não foram conferidos. Verificar apoio, ações, ancoragens, material, hipótese de carga no plano e contagem de estribos (dois ramos, diferente da área ilustrativa da versão 0.2).",
        "Controle de entrada LC-ELU-2026.2",
      ),
    );
  if (q.joint === "rough" && !q.roughnessConfirmed)
    add(
      note(
        "roughness",
        "Rugosidade da interface",
        "Confirmar rugosidade mínima de 5 mm em 30 mm e preparação da superfície antes de adotar μ=1,0.",
        "NBR 9062 §6.3.4 e §7.3.5.4",
      ),
    );
  if (q.includeSelfWeight && q.forceMode === "design")
    add(
      note(
        "weightDesign",
        "Peso próprio nas ações de cálculo",
        "As forças foram informadas já majoradas; o peso próprio não é acrescentado automaticamente. Conferir sua inclusão nas combinações fornecidas.",
        "Convenção de entrada",
      ),
    );
  const values = {
    ...m,
    d,
    dPrime: dp,
    a,
    bearingCenter: reaction.center,
    reactionShift: reaction.shift,
    effectiveBearingLength: reaction.effectiveLength,
    ratio,
    gammaN,
    gammaN9062: gn9062,
    factor,
    selfWeight,
    vertical,
    horizontal,
    horizontalProvided,
    horizontalEstimated,
    horizontalFloor,
    horizontalFloorAdded: horizontal - horizontalBeforeFloor,
    bearingEccentricity,
    bearingStress,
    mu,
    rho,
    tau,
    tauLimit,
    tauLimitSteel,
    tauLimitConcrete,
    ...Object.fromEntries(
      Object.entries(model).map(([k, v]) => [`stm_${k}`, v]),
    ),
    tieProvided: asTie,
    tieRequired,
    tieModel: asModel,
    tieFriction: frictionAs,
    tie9062: shortNormAs,
    tieElDebs: elDebsAs,
    tieMinimumFlexure: minFlex.required,
    tieMinimumMechanical: asMechanical,
    minMoment: minFlex.moment,
    asV,
    stitchRate: stitchEnvelope / zone,
    stitchNormative: stitchRequired,
    stitchLiterature,
    stitchRequired: stitchEnvelope,
    stitchProvided,
    stitchSpacing,
    stitchSpacingLimit,
    lowerRequired,
    lowerProvided,
    stirrupRequired,
    stirrupNormative,
    stirrupLiterature,
    stirrupProvided,
    suspensionRequired,
    suspensionProvided,
    splittingRequired,
    splittingProvided,
    anchorRequired,
    lb,
    anchorAlpha,
    fbd,
    confinementRequired,
    a2,
    frontClearanceRequired,
    minCover,
    literatureEnabled: q.literatureRecommendations ? 1 : 0,
    literatureDomain: literatureDomain ? 1 : 0,
    ...Object.fromEntries(
      Object.entries(elDebs).map(([k, v]) => [`elDebs_${k}`, v]),
    ),
  };
  return {
    name: load.name,
    classification,
    method,
    checks,
    values,
    status: statusOf(checks),
  };
}
export function calculate(p: Piece): CalculationResult {
  const base: CalculationResult = {
    kind: "calculated",
    engineVersion: ENGINE_VERSION,
    policy: POLICY,
    fingerprint: fingerprint(p),
    status: "invalid",
    reasons: [],
    combinations: [],
    governingCase: "",
    checks: [],
    values: {},
    assumptions: [
      "Consolo simples, concreto armado, seção retangular na ligação, carga vertical descendente e ações no plano médio; ELU estático.",
      "γc=1,4 e γs=1,15 (combinações normais); γn ≥ 1,2 por compatibilização conservadora das duas normas fornecidas.",
      "As combinações de ações são fornecidas pelo usuário. Valores de cálculo já incluem γn; não são majorados novamente.",
      "No modo estimado, Hd = coeficiente do apoio × Vd + H adicional positivo. No modo análise, H é a resultante total justificada. Compressão horizontal favorável é ignorada.",
      p.design.literatureRecommendations
        ? "Complementos de El Debs §3.5.1, pp.125–130 ativados: H≥0,20V, h2≥h/2, costura de 50% da parcela vertical simplificada, estribos verticais≥20% do tirante e, em 0,4≤a/d≤1, envelope do tirante e limites complementares do concreto. Não constituem novos requisitos da ABNT."
        : "Complementos de El Debs §3.5.1 desativados. Modelos auxiliares são comparativos e não alteram o envelope normativo/documentado da versão anterior.",
      "a informado posiciona o centro físico do apoio. A posição de cálculo da reação e seu deslocamento são registrados separadamente; o braço de H é d′+hapoio.",
      "A armadura mínima e a costura usam o envelope documentado das normas e dos complementos bibliográficos, sem copiar limites históricos revogados.",
      "N1 é número de ramos longitudinais. N2/N3/N4/N5 são estribos fechados com dois ramos efetivos e ancorados; áreas informadas de suporte/confinamento são efetivas, não áreas brutas arbitrárias.",
      "Não há verificação automática de ELS/fissuração, fadiga, torção espacial, estabilidade global, pinos/chumbadores, soldabilidade ou aparelho elastomérico. O desenho e o DXF ainda não são detalhamento executivo.",
    ],
  };
  const parsed = pieceSchema.safeParse(p);
  if (!parsed.success) {
    base.reasons = parsed.error.issues.map(
      (i) => `${i.path.join(".")}: ${i.message}`,
    );
    return base;
  }
  const errors = geometryErrors(p),
    g = p.geometry,
    q = p.design,
    layout = tieLayout(p);
  const reaction = reactionGeometry(p);
  const ratio = reaction.a / layout.d;
  if (
    errors.length ||
    layout.d <= 0 ||
    layout.dPrime >= layout.d ||
    q.tieLayers > p.rebar.tieCount
  ) {
    base.reasons = [
      ...errors,
      ...(layout.dPrime >= layout.d
        ? ["O centroide do tirante deve estar acima da meia altura."]
        : []),
      ...(q.tieLayers > p.rebar.tieCount
        ? ["Há mais camadas do que ramos de tirante."]
        : []),
    ];
    return base;
  }
  const unsupported: string[] = [];
  if (ratio > 1)
    unsupported.push(
      "a/d > 1: o elemento deve ser tratado como viga em balanço; não é calculado pelo motor de consolos curtos.",
    );
  if (q.fatigue)
    unsupported.push(
      "Fadiga, impacto e cargas cíclicas requerem análise específica; o motor atual é de ELU estático.",
    );
  if (q.transverseEccentricity !== 0 || q.transverseForce !== 0)
    unsupported.push(
      "Excentricidade transversal ou força fora do plano: requer modelo espacial.",
    );
  if (q.method === "friction" && ratio > 0.5)
    unsupported.push("Atrito-cisalhamento só é implementado para a/d ≤ 0,5.");
  if (q.method === "strut" && ratio <= 0.5 && q.joint !== "monolithic")
    unsupported.push(
      "O prolongamento do modelo de Araújo para consolo muito curto exige concretagem monolítica.",
    );
  if (
    (q.method === "strut" || (q.method === "auto" && ratio > 0.5)) &&
    q.joint !== "monolithic"
  )
    unsupported.push(
      "Consolo curto com junta de concretagem requer modelo adicional da interface; adote análise específica.",
    );
  if (![250, 500, 600].includes(p.materials.fyk))
    unsupported.push(
      "O motor admite aço do tirante CA-25, CA-50 ou CA-60; informe fyk 250, 500 ou 600 MPa.",
    );
  if (q.horizontalMode === "estimated" && q.supportType === "restrained")
    unsupported.push(
      "Apoio impedido, grauteado ou soldado exige estudo da força horizontal. Use H por análise e registre a justificativa.",
    );
  if (
    q.horizontalMode === "analysis" &&
    q.horizontalJustification.trim().length < 10
  )
    unsupported.push(
      "Informe a origem/modelo da força horizontal calculada, inclusive quando H=0.",
    );
  if (q.includeSelfWeight && q.loadType === "indirect")
    unsupported.push(
      "Peso próprio automático não é combinado com carga indireta. Modele separadamente ações diretas e indiretas.",
    );
  const centroidX =
    (g.length * (g.height + 2 * g.tipHeight)) / (3 * (g.height + g.tipHeight));
  if (
    q.includeSelfWeight &&
    q.forceMode === "characteristic" &&
    centroidX > reaction.a
  )
    unsupported.push(
      "O centroide do peso próprio está além da força concentrada. Inclua seu efeito em uma combinação equivalente justificada e desative a adição automática.",
    );
  const allLoads = [{ name: "Principal", ...p.loads }, ...q.combinations];
  if (allLoads.some((l) => l.vertical <= 0))
    unsupported.push(
      "Cada combinação deve conter carga vertical descendente positiva; carga nula ou inversão não pertence ao modelo implementado.",
    );
  for (const load of allLoads) {
    const weight =
      q.includeSelfWeight && q.forceMode === "characteristic"
        ? volume(g) * 25000
        : 0;
    const rawRatio =
      Math.max(0, load.horizontal) / (load.vertical + weight) +
      (q.horizontalMode === "estimated" ? supportRatios[q.supportType] : 0);
    const hRatio =
      q.horizontalMode === "estimated" && q.literatureRecommendations
        ? Math.max(rawRatio, 0.2)
        : rawRatio;
    if (reaction.shift + hRatio * q.bearingHeight > q.bearingLength / 6 + 1e-8)
      unsupported.push(
        `[${load.name}] A resultante no apoio sai do núcleo central (Δa + H·hapoio/V > c/6). O modelo de contato integral não é aplicável; verificar contato parcial e dispositivo de apoio.`,
      );
  }
  if (reaction.effectiveLength <= 0)
    unsupported.push(
      "A posição da reação não cabe no aparelho de apoio. Reveja o centro, comprimento e deslocamento selecionado.",
    );
  if (unsupported.length) {
    base.status = "unsupported";
    base.reasons = unsupported;
    return base;
  }
  const combinations = allLoads.map((load) => calculateCase(p, load));
  if (
    combinations.some((c) =>
      Object.values(c.values).some((v) => !Number.isFinite(v)),
    )
  ) {
    base.reasons = [
      "A geometria ou as ações não permitem solução finita. Reveja altura útil, apoio e armaduras.",
    ];
    return base;
  }
  const governing = combinations.reduce((a, b) =>
    b.values.tieRequired > a.values.tieRequired ? b : a,
  );
  // Envelope each verification independently, never combine V and H from different load cases.
  const checks = new Map<string, Check>();
  for (const c of combinations)
    for (const ch of c.checks) {
      const previous = checks.get(ch.id);
      const priority = (v: Check) =>
        (v.status === "fail" ? 1e9 : v.status === "review" ? 1e8 : 0) +
        (v.utilization ?? 0);
      if (!previous || priority(ch) > priority(previous))
        checks.set(ch.id, { ...ch, detail: `[${c.name}] ${ch.detail}` });
    }
  const enveloped = [...checks.values()];
  const values = { ...governing.values };
  for (const key of [
    "tieRequired",
    "stitchRequired",
    "stitchRate",
    "lowerRequired",
    "stirrupRequired",
    "suspensionRequired",
    "splittingRequired",
    "anchorRequired",
  ])
    values[key] = Math.max(...combinations.map((c) => c.values[key]));
  return {
    ...base,
    combinations,
    governingCase: governing.name,
    values,
    checks: enveloped,
    status: statusOf(enveloped),
  };
}
