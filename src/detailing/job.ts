import type { Piece, Project } from "../domain/model";
import { buildDetail, type Detail } from "./model";
import {
  combineDrawings,
  pieceDrawing,
  steelSummaryDrawing,
  type Drawing,
} from "./drawing";
import { entitySvg } from "./exports";

export type DetailSection = {
  id: string;
  name: string;
  y: number;
  width: number;
  height: number;
  markup: string;
};
export type DetailBundle = {
  details: Detail[];
  drawings: Drawing[];
  drawing: Drawing;
  sections: DetailSection[];
};
type CachedPiece = {
  key: string;
  detail: Detail;
  drawing: Drawing;
  markup: string;
};
export class DetailBuilder {
  private cache = new Map<string, CachedPiece>();
  build(project: Project, pieceId: string, scope: "one" | "all"): DetailBundle {
    const pieces =
      scope === "all"
        ? project.pieces
        : [project.pieces.find((p) => p.id === pieceId) ?? project.pieces[0]];
    const metadata = JSON.stringify([
      project.name,
      project.client,
      project.author,
    ]);
    const entries = pieces.map((p: Piece) => {
      const key = metadata + JSON.stringify(p);
      const cached = this.cache.get(p.id);
      if (cached?.key === key) {
        this.cache.delete(p.id);
        this.cache.set(p.id, cached);
        return cached;
      }
      const detail = buildDetail(p),
        drawing = pieceDrawing(project, detail);
      const entry = {
        key,
        detail,
        drawing,
        markup: drawing.entities.map(entitySvg).join(""),
      };
      this.cache.set(p.id, entry);
      while (this.cache.size > 200)
        this.cache.delete(this.cache.keys().next().value!);
      return entry;
    });
    const details = entries.map((e) => e.detail),
      drawings = entries.map((e) => e.drawing);
    const sections: DetailSection[] = [];
    let y = 0;
    entries.forEach((entry, i) => {
      sections.push({
        id: pieces[i].id,
        name: pieces[i].name,
        y,
        width: entry.drawing.width,
        height: entry.drawing.height,
        markup: entry.markup,
      });
      y += entry.drawing.height + 30;
    });
    if (scope === "all") {
      const summary = steelSummaryDrawing(project, details);
      drawings.push(summary);
      sections.push({
        id: "steel-summary",
        name: summary.name,
        y,
        width: summary.width,
        height: summary.height,
        markup: summary.entities.map(entitySvg).join(""),
      });
    }
    return {
      details,
      drawings,
      drawing: drawings.length === 1 ? drawings[0] : combineDrawings(drawings),
      sections,
    };
  }
}
export const detailRequestKey = (
  project: Project,
  pieceId: string,
  scope: "one" | "all",
) =>
  JSON.stringify([
    project.name,
    project.client,
    project.author,
    scope,
    scope === "all"
      ? project.pieces
      : project.pieces.find((p) => p.id === pieceId),
  ]);
