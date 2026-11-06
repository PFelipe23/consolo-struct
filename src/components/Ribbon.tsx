import { useRef } from "react";
import {
  Box,
  MousePointer2,
  Hand,
  Plus,
  Copy,
  PencilLine,
  Trash2,
  FolderOpen,
  Save,
  FilePlus2,
  FileText,
  FileJson,
  Download,
  Ruler,
  Layers3,
  ArrowDownToLine,
  SlidersHorizontal,
  ListChecks,
  Maximize,
  ZoomIn,
  ZoomOut,
  Grid2X2,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Moon,
  Sun,
  Table2,
  Workflow,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

export type RibbonTab =
  | "Arquivo"
  | "Início"
  | "Modelo"
  | "Exibir"
  | "Documentação";
export type Action =
  | "new"
  | "open"
  | "save"
  | "project"
  | "add"
  | "duplicate"
  | "rename"
  | "delete"
  | "select"
  | "pan"
  | "geometry"
  | "loads"
  | "materials"
  | "rebar"
  | "elevation"
  | "section"
  | "three"
  | "fit"
  | "zoomIn"
  | "zoomOut"
  | "calculate"
  | "autodesign"
  | "design"
  | "export"
  | "dimensions"
  | "steel"
  | "forces"
  | "grid"
  | "browser"
  | "properties"
  | "checks"
  | "theme"
  | "pdf"
  | "dxf"
  | "svg"
  | "csv"
  | "report"
  | "details"
  | "pieces";
type Tool = {
  action: Action;
  label: string;
  icon: LucideIcon;
  large?: boolean;
  tip?: string;
};
type Group = { label: string; tools: Tool[] };
const tool = (
  action: Action,
  label: string,
  icon: LucideIcon,
  large = false,
  tip?: string,
): Tool => ({ action, label, icon, large, tip });
const modeling = [
  tool("geometry", "Geometria", Ruler),
  tool("loads", "Ações", ArrowDownToLine),
  tool("materials", "Materiais", Layers3),
  tool("rebar", "Armaduras", Workflow),
];
const navigation = [
  tool(
    "select",
    "Selecionar",
    MousePointer2,
    true,
    "Selecionar elementos e editar cotas",
  ),
  tool(
    "pan",
    "Pan",
    Hand,
    true,
    "Arrastar a vista · botão do meio ou Espaço + arrastar",
  ),
];
const views = [
  tool("elevation", "Elevação", Ruler),
  tool("section", "Seção A–A", Layers3),
  tool("three", "Vista 3D", Box),
  tool(
    "fit",
    "Ajustar à tela",
    Maximize,
    true,
    "Enquadrar todo o desenho · tecla F",
  ),
];
export default function Ribbon({
  tab,
  setTab,
  onAction,
  active,
  dark,
  canDelete,
}: {
  tab: RibbonTab;
  setTab: (tab: RibbonTab) => void;
  onAction: (a: Action) => void;
  active: Partial<Record<Action, boolean>>;
  dark: boolean;
  canDelete: boolean;
}) {
  const tabs: RibbonTab[] = [
    "Arquivo",
    "Início",
    "Modelo",
    "Exibir",
    "Documentação",
  ];
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const groups: Record<RibbonTab, Group[]> = {
    Arquivo: [
      {
        label: "Projeto",
        tools: [
          tool("new", "Novo projeto", FilePlus2, true),
          tool("open", "Abrir", FolderOpen, true),
          tool("save", "Salvar", Save, true),
        ],
      },
      {
        label: "Informações",
        tools: [tool("project", "Dados do projeto", SlidersHorizontal, true)],
      },
      {
        label: "Saída",
        tools: [
          tool("export", "Exportar", Download, true),
          tool("pdf", "Memória PDF", FileText),
          tool("csv", "Quantidades CSV", Table2),
        ],
      },
    ],
    Início: [
      { label: "Navegação", tools: navigation },
      {
        label: "Peças",
        tools: [
          tool("add", "Novo consolo", Plus, true),
          tool("duplicate", "Duplicar", Copy),
          tool("rename", "Identificação", PencilLine),
          tool("delete", "Excluir", Trash2),
        ],
      },
      { label: "Propriedades", tools: modeling },
      { label: "Vistas", tools: views },
      {
        label: "Dimensionamento",
        tools: [
          tool("calculate", "Calcular", ListChecks, true),
          tool("autodesign", "Sugerir armaduras", Layers3),
          tool("design", "Critérios de cálculo", SlidersHorizontal),
        ],
      },
      {
        label: "Documentação",
        tools: [
          tool("details", "Detalhamento", Ruler, true),
          tool("export", "Exportar", Download, true),
        ],
      },
    ],
    Modelo: [
      { label: "Navegação", tools: navigation },
      {
        label: "Parâmetros da peça",
        tools: modeling.map((t) => ({ ...t, large: true })),
      },
      {
        label: "Organização",
        tools: [
          tool("add", "Novo consolo", Plus, true),
          tool("duplicate", "Duplicar", Copy),
          tool("rename", "Identificação", PencilLine),
        ],
      },
      {
        label: "Dimensionamento",
        tools: [
          tool("calculate", "Calcular", ListChecks, true),
          tool("autodesign", "Sugerir armaduras", Layers3),
          tool("design", "Critérios de cálculo", SlidersHorizontal),
        ],
      },
    ],
    Exibir: [
      {
        label: "Vistas",
        tools: [
          tool("elevation", "Elevação", Ruler),
          tool("section", "Seção A–A", Layers3),
          tool("three", "Vista 3D", Box),
        ],
      },
      {
        label: "Navegação",
        tools: [
          ...navigation,
          tool("fit", "Ajustar à tela", Maximize, true),
          tool("zoomIn", "Aumentar zoom", ZoomIn),
          tool("zoomOut", "Diminuir zoom", ZoomOut),
        ],
      },
      {
        label: "Elementos do desenho",
        tools: [
          tool("dimensions", "Cotas", Ruler),
          tool("steel", "Armaduras", Workflow),
          tool("forces", "Cargas", ArrowDownToLine),
          tool("grid", "Grade", Grid2X2),
        ],
      },
      {
        label: "Painéis",
        tools: [
          tool("browser", "Navegador do projeto", PanelLeft),
          tool("properties", "Propriedades", PanelRight),
          tool("checks", "Verificações", PanelBottom),
        ],
      },
      {
        label: "Aparência",
        tools: [
          tool(
            "theme",
            dark ? "Tema claro" : "Tema escuro",
            dark ? Sun : Moon,
            true,
          ),
        ],
      },
    ],
    Documentação: [
      {
        label: "Documentos",
        tools: [
          tool("report", "Memória", BookOpen, true),
          tool("pieces", "Peças do projeto", Table2, true),
          tool("details", "Detalhes e aço", Ruler, true),
        ],
      },
      {
        label: "Exportação",
        tools: [
          tool("pdf", "Memória PDF", FileText, true),
          tool("dxf", "Geometria DXF", Layers3, true),
          tool("svg", "Geometria SVG", Ruler, true),
          tool("csv", "Quantidades CSV", Table2, true),
        ],
      },
      {
        label: "Projeto editável",
        tools: [
          tool("save", "Salvar JSON", FileJson, true),
          tool("project", "Dados do projeto", SlidersHorizontal, true),
        ],
      },
    ],
  };
  return (
    <div className="ribbon">
      <div className="ribbon-tabs" role="tablist" aria-label="Ferramentas">
        {tabs.map((t, i) => (
          <button
            key={t}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`ribbon-${i}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls="ribbon-panel"
            tabIndex={tab === t ? 0 : -1}
            className={`${tab === t ? "active" : ""} ${i === 0 ? "file-tab" : ""}`}
            onClick={() => setTab(t)}
            onKeyDown={(e) => {
              let j = i;
              if (e.key === "ArrowRight") j = (i + 1) % tabs.length;
              else if (e.key === "ArrowLeft")
                j = (i - 1 + tabs.length) % tabs.length;
              else if (e.key === "Home") j = 0;
              else if (e.key === "End") j = tabs.length - 1;
              else return;
              e.preventDefault();
              setTab(tabs[j]);
              refs.current[j]?.focus();
            }}
          >
            {t}
          </button>
        ))}
        <span className="ribbon-version">CONSOLOSTRUCT 0.6 · DETALHAMENTO</span>
      </div>
      <div
        className="ribbon-panel"
        id="ribbon-panel"
        role="tabpanel"
        aria-labelledby={`ribbon-${tabs.indexOf(tab)}`}
      >
        {groups[tab].map((group) => (
          <section
            className="ribbon-group"
            key={group.label}
            aria-label={group.label}
          >
            <div className="ribbon-tools">
              {group.tools.map((t) => (
                <button
                  key={t.action}
                  className={`ribbon-tool ${t.large ? "large" : "small"} ${active[t.action] ? "selected" : ""}`}
                  aria-label={t.label}
                  aria-pressed={
                    t.action in active ? !!active[t.action] : undefined
                  }
                  disabled={t.action === "delete" && !canDelete}
                  title={t.tip ?? t.label}
                  onClick={() => onAction(t.action)}
                >
                  <t.icon size={t.large ? 27 : 17} strokeWidth={1.5} />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
            <div className="ribbon-group-label">{group.label}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
