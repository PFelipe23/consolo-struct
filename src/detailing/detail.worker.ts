import { DetailBuilder } from "./job";
import type { Project } from "../domain/model";
const builder = new DetailBuilder();
self.onmessage = (
  e: MessageEvent<{
    id: number;
    project: Project;
    pieceId: string;
    scope: "one" | "all";
  }>,
) => {
  const { id, project, pieceId, scope } = e.data;
  try {
    self.postMessage({ id, bundle: builder.build(project, pieceId, scope) });
  } catch (error) {
    self.postMessage({
      id,
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível preparar os detalhes.",
    });
  }
};
