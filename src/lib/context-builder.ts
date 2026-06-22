import type { WorkbenchState, StageContext, DiscoveryQuestion } from "./types";
import { SOURCES } from "./mocks";

// Mirrors buildContext() in app.jsx
export function buildContext(state: WorkbenchState): StageContext {
  const d = state.data ?? {};
  const src = SOURCES.find((s) => s.id === state.sourceId) ?? SOURCES[0];
  const inboxData = d.inbox as { freeText?: string } | null;
  const input =
    state.sourceId === "free"
      ? (inboxData?.freeText != null ? inboxData.freeText : src.text)
      : src.text;

  const discoveryData = d.discovery as { questions?: DiscoveryQuestion[] } | null;
  const dq = discoveryData?.questions ?? [];
  const answers = dq.map((q) => ({
    q: q.q,
    a: state.answers[q.id] ?? null,
  }));

  return {
    input,
    need: (d["business-need"] ?? null) as unknown as StageContext["need"],
    requirement: (d["requirement-analysis"] ?? null) as unknown as StageContext["requirement"],
    discovery: { questions: dq, answers },
    epic: (d.epic ?? null) as unknown as StageContext["epic"],
    story: (d["user-story"] ?? null) as unknown as StageContext["story"],
    ac: (d["acceptance-criteria"] ?? null) as unknown as StageContext["ac"],
  };
}
