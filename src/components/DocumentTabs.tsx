import { memo } from "react";
import { Box, ClipboardList, FileText, Layers3, Ruler, X } from "lucide-react";
import type { DocumentId, DocumentState } from "../domain/documents";
const titles: Record<DocumentId, string> = {
  elevation: "Elevação",
  section: "Seção A–A",
  three: "Vista 3D",
  pieces: "Peças",
  report: "Memória",
  details: "Detalhamento",
};
const icons = {
  elevation: Ruler,
  section: Layers3,
  three: Box,
  pieces: ClipboardList,
  report: FileText,
  details: Ruler,
};
function DocumentTabs({
  state,
  pieceName,
  open,
  close,
}: {
  state: DocumentState;
  pieceName: string;
  open: (id: DocumentId) => void;
  close: (id: DocumentId) => void;
}) {
  return (
    <>
      {state.tabs.map((id) => {
        const Icon = icons[id];
        return (
          <div
            key={id}
            className={`document-tab ${state.active === id ? "active" : ""}`}
          >
            <button
              className="document-tab-open"
              onClick={() => open(id)}
              aria-current={state.active === id ? "page" : undefined}
            >
              <Icon size={14} />
              <span>
                {id === "elevation" ? `${pieceName} · ` : ""}
                {titles[id]}
              </span>
            </button>
            <button
              className="document-tab-close"
              title={`Fechar ${titles[id]}`}
              aria-label={`Fechar aba ${titles[id]}`}
              onClick={() => close(id)}
            >
              <X size={12} />
            </button>
          </div>
        );
      })}
    </>
  );
}
export default memo(DocumentTabs);
