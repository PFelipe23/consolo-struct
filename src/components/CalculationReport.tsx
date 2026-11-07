import type { CalculationResult, Check } from "../domain/engine";
import { number } from "../domain/model";
import { memo } from "react";
import LazyDetails from "./LazyDetails";
export const resultLabels: Record<CalculationResult["status"], string> = {
  pass: "Atende às verificações implementadas",
  fail: "Há verificações não atendidas",
  review: "Requer conferência complementar",
  invalid: "Entradas inválidas",
  unsupported: "Fora do domínio do motor",
};
const statusLabels = {
  pass: "Atende",
  fail: "Não atende",
  review: "Conferir",
  na: "Não aplicável",
};
function Checks({ checks }: { checks: Check[] }) {
  return (
    <div className="calculation-table-wrap">
      <table className="calculation-table">
        <thead>
          <tr>
            <th>Verificação / referência</th>
            <th>Exigência</th>
            <th>Disponível / limite</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          {checks.map((c) => (
            <tr key={c.id} className={`result-${c.status}`}>
              <td>
                <LazyDetails title={c.label}>
                  {() => (
                    <>
                      <p>{c.formula}</p>
                      <p>{c.detail}</p>
                      <small>{c.reference}</small>
                    </>
                  )}
                </LazyDetails>
              </td>
              <td>
                {c.demand === null ? "—" : `${number(c.demand, 3)} ${c.unit}`}
              </td>
              <td>
                {c.capacity === null
                  ? "—"
                  : `${number(c.capacity, 3)} ${c.unit}`}
              </td>
              <td>
                <strong>{statusLabels[c.status]}</strong>
                {c.utilization !== null && (
                  <small>{number(c.utilization * 100, 1)}%</small>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function CalculationReport({
  result,
  stale = false,
  compact = false,
}: {
  result?: CalculationResult;
  stale?: boolean;
  compact?: boolean;
}) {
  if (!result)
    return (
      <div className="info-block">
        Informe os dados na aba Cálculo das propriedades e use{" "}
        <strong>Calcular</strong>. A sugestão de armaduras também recalcula a
        altura útil e todas as combinações.
      </div>
    );
  if (stale)
    return (
      <div className="report-warning">
        Cálculo desatualizado. As entradas foram alteradas. Execute Calcular
        para gerar resultados da revisão atual.
      </div>
    );
  const v = result.values;
  return (
    <div className={compact ? "calculation compact" : "calculation"}>
      <div className={`result-summary result-${result.status}`}>
        <strong>{resultLabels[result.status]}</strong>
        <small>
          Motor {result.engineVersion} · {result.policy} · ELU estático
        </small>
      </div>
      {result.reasons.map((r, i) => (
        <p className="check-error" key={i}>
          {r}
        </p>
      ))}
      {!!result.combinations.length && (
        <div className="calculation-metrics">
          <div>
            <span>Altura útil</span>
            <strong>{number(v.d / 10, 2)} cm</strong>
          </div>
          <div>
            <span>a/d</span>
            <strong>{number(v.ratio, 3)}</strong>
          </div>
          <div>
            <span>Tirante necessário</span>
            <strong>{number(v.tieRequired / 100, 2)} cm²</strong>
          </div>
          <div>
            <span>Tirante adotado</span>
            <strong>{number(v.tieProvided / 100, 2)} cm²</strong>
          </div>
        </div>
      )}
      <Checks checks={result.checks} />
      {!compact && (
        <>
          <h3>Combinações e memória numérica</h3>
          <p>
            Envelope por verificação. Combinação determinante da área do
            tirante: <strong>{result.governingCase || "—"}</strong>. V e H são
            simultâneos em cada caso.
          </p>
          {result.combinations.map((c, i) => (
            <LazyDetails
              className="case-memory"
              key={i}
              title={
                <>
                  {c.name} ·{" "}
                  {c.classification === "short" ? "Curto" : "Muito curto"} ·{" "}
                  {c.method === "strut"
                    ? "Bielas e tirantes"
                    : "Atrito-cisalhamento"}{" "}
                  · {resultLabels[c.status]}
                </>
              }
            >
              {() => (
                <>
                  <div className="memory-values">
                    {[
                      ["Vd", c.values.vertical / 1000, "kN"],
                      ["Hd", c.values.horizontal / 1000, "kN"],
                      [
                        "Centro físico do apoio",
                        c.values.bearingCenter / 10,
                        "cm",
                      ],
                      ["a de cálculo", c.values.a / 10, "cm"],
                      [
                        "Deslocamento da reação",
                        c.values.reactionShift / 10,
                        "cm",
                      ],
                      [
                        "Excentricidade total no contato",
                        c.values.bearingEccentricity / 10,
                        "cm",
                      ],
                      [
                        "H acrescentado pelo piso bibliográfico",
                        c.values.horizontalFloorAdded / 1000,
                        "kN",
                      ],
                      [
                        "γn aplicado às ações características",
                        c.values.gammaN,
                        "",
                      ],
                      ["fcd", c.values.fcd, "MPa"],
                      ["fyd adotado", c.values.fydLimited, "MPa"],
                      ["d′", c.values.dPrime, "mm"],
                      ["θ do modelo geométrico", c.values.stm_theta, "°"],
                      ["z do modelo geométrico", c.values.stm_z, "mm"],
                      ["As por atrito", c.values.tieFriction, "mm²"],
                      ["As simplificado 9062", c.values.tie9062, "mm²"],
                      ["As El Debs", c.values.tieElDebs, "mm²"],
                      [
                        "As mínimo de flexão",
                        c.values.tieMinimumFlexure,
                        "mm²",
                      ],
                      [
                        "As mínimo mecânico",
                        c.values.tieMinimumMechanical,
                        "mm²",
                      ],
                      ["Taxa da costura", c.values.stitchRate, "mm²/mm"],
                      ["Ancoragem necessária", c.values.anchorRequired, "mm"],
                    ].map(([label, value, unit]) => (
                      <div key={String(label)}>
                        <span>{label}</span>
                        <strong>
                          {number(Number(value), 3)} {unit}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <h4>Comparação dos modelos</h4>
                  <div className="calculation-table-wrap">
                    <table
                      className="calculation-table"
                      aria-label={`Comparação dos modelos · ${c.name}`}
                    >
                      <thead>
                        <tr>
                          <th>Modelo / condição</th>
                          <th>As do tirante</th>
                          <th>Concreto</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Geométrico de Araújo · monolítico</td>
                          <td>
                            {number(
                              c.values.stm_tieForce / c.values.fydLimited / 100,
                              3,
                            )}{" "}
                            cm²
                          </td>
                          <td>
                            σb = {number(c.values.stm_strutStress, 3)} MPa
                          </td>
                        </tr>
                        <tr>
                          <td>NBR 9062 simplificado · 0,5 &lt; a/d ≤ 1</td>
                          <td>{number(c.values.tie9062 / 100, 3)} cm²</td>
                          <td>Conferir biela e nós</td>
                        </tr>
                        <tr>
                          <td>El Debs · equilíbrio completo (3.18)</td>
                          <td>{number(c.values.tieElDebs / 100, 3)} cm²</td>
                          <td>
                            σc = {number(c.values.elDebs_strutStress, 3)} MPa
                          </td>
                        </tr>
                        <tr>
                          <td>El Debs · aproximação 1,2 H (3.19), auxiliar</td>
                          <td>
                            {number(
                              c.values.elDebs_tieForceApprox /
                                c.values.fydLimited /
                                100,
                              3,
                            )}{" "}
                            cm²
                          </td>
                          <td>Não substitui a altura real de H</td>
                        </tr>
                        <tr>
                          <td>Atrito-cisalhamento · a/d ≤ 0,5</td>
                          <td>{number(c.values.tieFriction / 100, 3)} cm²</td>
                          <td>
                            τ = {number(c.values.tau, 3)} /{" "}
                            {number(c.values.tauLimit, 3)} MPa
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="table-note">
                    {c.values.literatureEnabled
                      ? "Complementos de El Debs ativados."
                      : "Complementos de El Debs desativados."}{" "}
                    A comparação não torna aplicável um modelo fora do seu
                    domínio. A expressão simplificada do concreto, equações
                    3.22–3.25, usa z = 0,9d, hbie = 0,2d e mantém Hd·dh. Costura
                    complementar = {number(c.values.stitchLiterature / 100, 3)}{" "}
                    cm²; estribos complementares ={" "}
                    {number(c.values.stirrupLiterature / 100, 3)} cm².
                  </p>
                  <p className="table-note">
                    Grandezas dos modelos alternativos são auxiliares; somente o
                    método identificado acima e seus critérios de envelope
                    definem esta combinação.
                  </p>
                  <Checks checks={c.checks} />
                </>
              )}
            </LazyDetails>
          ))}
          <h3>Hipóteses e alcance da análise</h3>
          <ul>
            {result.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          <p className="table-note">
            Atendimento numérico refere-se às verificações implementadas. O
            dimensionamento do suporte, ELS, dispositivo de apoio e detalhamento
            executivo permanecem fora deste relatório.
          </p>
        </>
      )}
    </div>
  );
}
export default memo(CalculationReport);
