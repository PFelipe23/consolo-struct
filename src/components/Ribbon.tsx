import { useRef } from "react";
import {
  ribbonCommands,
  ribbonGroups,
  ribbonTabs,
  type Action,
  type RibbonTab,
} from "./ribbonCommands";
export type { Action, RibbonTab } from "./ribbonCommands";

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
  onAction: (action: Action) => void;
  active: Partial<Record<Action, boolean>>;
  dark: boolean;
  canDelete: boolean;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  return (
    <div className="ribbon">
      <div className="ribbon-tabs" role="tablist" aria-label="Ferramentas">
        {ribbonTabs.map((t, i) => (
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
              if (e.key === "ArrowRight") j = (i + 1) % ribbonTabs.length;
              else if (e.key === "ArrowLeft")
                j = (i - 1 + ribbonTabs.length) % ribbonTabs.length;
              else if (e.key === "Home") j = 0;
              else if (e.key === "End") j = ribbonTabs.length - 1;
              else return;
              e.preventDefault();
              setTab(ribbonTabs[j]);
              refs.current[j]?.focus();
            }}
          >
            {t}
          </button>
        ))}
        <span className="ribbon-version">CONSOLOSTRUCT 0.7 · DETALHAMENTO</span>
      </div>
      <div
        className={`ribbon-panel ${tab === "Configurações" ? "settings-panel" : ""}`}
        id="ribbon-panel"
        role="tabpanel"
        aria-labelledby={`ribbon-${ribbonTabs.indexOf(tab)}`}
        tabIndex={tab === "Configurações" ? 0 : undefined}
      >
        {ribbonGroups[tab].map((group) => (
          <section
            className="ribbon-group"
            key={group.id}
            aria-label={group.label}
            aria-describedby={
              group.description ? `settings-${group.id}-description` : undefined
            }
          >
            {group.description && (
              <p
                className="ribbon-group-description"
                id={`settings-${group.id}-description`}
              >
                {group.description}
              </p>
            )}
            <div className="ribbon-tools">
              {group.tools.map((tool) => {
                if ("future" in tool) {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.future}
                      className="ribbon-tool small ribbon-future"
                      disabled
                    >
                      <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                      <span>{tool.label}</span>
                      <span className="ribbon-future-status">Em breve</span>
                    </button>
                  );
                }
                const { action, large } = tool;
                const command = ribbonCommands[action];
                const Icon = command.icon;
                const pressed = action === "theme" ? dark : active[action];
                return (
                  <button
                    key={action}
                    data-action={action}
                    className={`ribbon-tool ${large ? "large" : "small"} ${pressed ? "selected" : ""}`}
                    aria-label={command.label}
                    aria-pressed={pressed}
                    disabled={action === "delete" && !canDelete}
                    title={command.tip}
                    onClick={() => onAction(action)}
                  >
                    <Icon
                      size={large ? 27 : 17}
                      strokeWidth={1.5}
                      aria-hidden="true"
                    />
                    <span>{command.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="ribbon-group-label">{group.label}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
