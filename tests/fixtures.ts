import { newPiece } from "../src/domain/model";
export function shortFixture() {
  const p = newPiece(1);
  p.id = "short-validation";
  p.name = "Curto-ELU";
  p.description = "Caso de regressão do motor";
  p.quantity = 1;
  p.geometry = {
    width: 400,
    height: 500,
    tipHeight: 250,
    length: 450,
    loadOffset: 300,
    cover: 25,
    columnWidth: 900,
  };
  p.loads = { vertical: 140000, horizontal: 15000, gamma: 1.4 };
  p.rebar = {
    tieCount: 4,
    tieDiameter: 16,
    stitchCount: 6,
    stitchDiameter: 6.3,
    stirrupCount: 5,
    stirrupDiameter: 6.3,
  };
  p.design = {
    ...p.design,
    forceMode: "design",
    horizontalMode: "analysis",
    horizontalJustification:
      "Resultantes de cálculo simultâneas do caso de regressão; incluem γn.",
    bearingLength: 100,
    bearingWidth: 350,
    bearingHeight: 10,
    loopInternalDiameter: 100,
    supportAnchorLength: 850,
    anchorConfinementArea: 100,
    supportRebarArea: 1000,
    inputsConfirmed: true,
  };
  return p;
}
