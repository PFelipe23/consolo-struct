export type DocumentId =
  | "elevation"
  | "section"
  | "three"
  | "pieces"
  | "report"
  | "details";
export type DocumentState = {
  tabs: DocumentId[];
  active: DocumentId | null;
  visited: DocumentId[];
};
export const initialDocuments: DocumentState = {
  tabs: ["elevation", "section", "three", "pieces", "report", "details"],
  active: "elevation",
  visited: ["elevation"],
};
export type DocumentAction =
  | { type: "open" | "close"; id: DocumentId }
  | { type: "reset" };
export function documentReducer(
  state: DocumentState,
  action: DocumentAction,
): DocumentState {
  if (action.type === "reset")
    return { tabs: ["elevation"], active: "elevation", visited: ["elevation"] };
  if (action.type === "open")
    return {
      tabs: state.tabs.includes(action.id)
        ? state.tabs
        : [...state.tabs, action.id],
      active: action.id,
      visited: state.visited.includes(action.id)
        ? state.visited
        : [...state.visited, action.id],
    };
  const index = state.tabs.indexOf(action.id);
  if (index < 0) return state;
  const tabs = state.tabs.filter((t) => t !== action.id);
  return {
    tabs,
    active:
      state.active === action.id
        ? (tabs[Math.max(0, index - 1)] ?? null)
        : state.active,
    visited: state.visited.filter((t) => t !== action.id),
  };
}
