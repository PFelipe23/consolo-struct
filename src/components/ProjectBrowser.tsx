import { memo, useEffect, useState } from "react";
import {
  Box,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Info,
  Layers3,
  Plus,
  Ruler,
  X,
} from "lucide-react";
import type { Piece, Project } from "../domain/model";
import type { DocumentId } from "../domain/documents";
import QuantityEditor from "./QuantityEditor";
import { ribbonCommands } from "./ribbonCommands";
type Props = {
  project: Project;
  selected: string;
  active: DocumentId | null;
  width: number;
  onSelect: (id: string) => void;
  onView: (id: DocumentId, pieceId?: string) => void;
  onQuantity: (id: string, quantity: number) => void;
  onAdd: () => void;
  onProject: () => void;
  onClose: () => void;
};
const PieceRow = memo(function PieceRow({
  piece,
  selected,
  active,
  expanded,
  toggle,
  onSelect,
  onView,
  onQuantity,
}: {
  piece: Piece;
  selected: boolean;
  active: DocumentId | null;
  expanded: boolean;
  toggle: (id: string) => void;
} & Pick<Props, "onSelect" | "onView" | "onQuantity">) {
  return (
    <div
      className={`tree-item ${selected ? "selected" : ""}`}
      data-piece-id={piece.id}
    >
      <div className="tree-piece-row">
        <button
          className="tree-expander"
          aria-label={`${expanded ? "Recolher" : "Expandir"} ${piece.name}`}
          aria-expanded={expanded}
          onClick={() => toggle(piece.id)}
        >
          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>
        <button
          className={`tree-piece ${selected ? "selected" : ""}`}
          onClick={() => onSelect(piece.id)}
          onDoubleClick={() => onView("elevation", piece.id)}
          title={`${piece.name} · ${piece.description}`}
        >
          <Layers3 size={15} />
          <span>
            {piece.name}
            <small>{piece.description}</small>
          </span>
        </button>
        <QuantityEditor
          name={piece.name}
          value={piece.quantity}
          onChange={(n) => onQuantity(piece.id, n)}
          compact
        />
      </div>
      {expanded && (
        <div className="tree-views">
          {(
            [
              { id: "elevation", title: "Elevação lateral", Icon: Ruler },
              { id: "section", title: "Seção transversal", Icon: Layers3 },
              { id: "three", title: "Vista 3D", Icon: Box },
              { id: "details", title: "Detalhamento", Icon: Ruler },
            ] as const
          ).map(({ id, title, Icon }) => (
            <button
              key={id}
              className={selected && active === id ? "active" : ""}
              onClick={() => onView(id, piece.id)}
            >
              <Icon size={13} />
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
function ProjectBrowser({
  project,
  selected,
  active,
  width,
  onSelect,
  onView,
  onQuantity,
  onAdd,
  onProject,
  onClose,
}: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([project.pieces[0].id]),
  );
  const first = project.pieces[0].id;
  useEffect(
    () =>
      setExpanded((previous) =>
        previous.has(first) ? previous : new Set([...previous, first]),
      ),
    [first],
  );
  const [toggle] = useState(
    () => (id: string) =>
      setExpanded((previous) => {
        const next = new Set(previous);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
  );
  const total = project.pieces.reduce((sum, p) => sum + p.quantity, 0);
  return (
    <aside
      className="project-browser"
      style={{ width }}
      aria-label="Navegador do projeto"
    >
      <div className="dock-heading">
        <strong>Navegador do projeto</strong>
        <button
          className="icon-button"
          aria-label="Fechar navegador do projeto"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>
      <button className="browser-project" onClick={onProject}>
        <FolderOpen size={18} />
        <span>
          {project.name}
          <small>
            {project.pieces.length} tipos · {total} peças
          </small>
        </span>
      </button>
      <div className="browser-section">
        <ChevronDown size={13} />
        <strong>Consolos</strong>
        <button
          className="icon-button"
          aria-label="Adicionar consolo"
          onClick={onAdd}
        >
          <Plus size={14} />
        </button>
      </div>
      <div className="tree-pieces">
        {project.pieces.map((piece) => (
          <PieceRow
            key={piece.id}
            piece={piece}
            selected={piece.id === selected}
            active={piece.id === selected ? active : null}
            expanded={expanded.has(piece.id)}
            toggle={toggle}
            onSelect={onSelect}
            onView={onView}
            onQuantity={onQuantity}
          />
        ))}
      </div>
      <div className="browser-section">
        <ChevronDown size={13} />
        <strong>Documentação</strong>
      </div>
      <nav className="browser-documents" aria-label="Documentos do projeto">
        <button
          className={active === "pieces" ? "active" : ""}
          onClick={() => onView("pieces")}
        >
          <ClipboardList size={15} />
          Peças do projeto
        </button>
        <button
          className={active === "report" ? "active" : ""}
          onClick={() => onView("report")}
        >
          <BookOpen size={15} />
          Memória
        </button>
        <button
          className={active === "details" ? "active" : ""}
          title={ribbonCommands.details.tip}
          onClick={() => onView("details")}
        >
          <Ruler size={15} />
          {ribbonCommands.details.label}
        </button>
      </nav>
      <div className="browser-footer">
        <Info size={14} />
        <span>
          ConsoloStruct
          <br />
          <small>por OPENSTRUCT</small>
        </span>
      </div>
    </aside>
  );
}
export default memo(ProjectBrowser);
