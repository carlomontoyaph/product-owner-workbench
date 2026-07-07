import type {
  BusinessNeedData,
  EpicData,
  UserStoryData,
  AcData,
  ReadinessData,
  SignoffData,
  StageData,
} from "./types";
import type { StageId } from "./types";

export function buildSignoffMarkdown(
  signoff: SignoffData | null | undefined
): string | null {
  if (!signoff) return null;
  const { reviewers, approvers } = signoff;
  const hasReviewers =
    (reviewers?.inCall?.length ?? 0) > 0 || (reviewers?.offline?.length ?? 0) > 0;
  const hasApprovers =
    (approvers?.inCall?.length ?? 0) > 0 || (approvers?.offline?.length ?? 0) > 0;
  if (!hasReviewers && !hasApprovers) return null;

  const L: string[] = [];
  L.push("## Sign-off");
  L.push("");

  if (hasReviewers) {
    L.push("### Reviewers");
    if ((reviewers?.inCall ?? []).length > 0) {
      const callTime = reviewers?.callStartedAt || new Date().toLocaleString(
        "en-PH",
        { timeZone: "Asia/Manila" }
      );
      L.push(`**In the call** (${callTime}):`);
      reviewers.inCall.forEach((p) => L.push(`- ${p.name}`));
    }
    if ((reviewers?.offline ?? []).length > 0) {
      L.push("**Offline:**");
      reviewers.offline.forEach((p) =>
        L.push(`- ${p.name} — Date reviewed: ________`)
      );
    }
    L.push("");
  }

  if (hasApprovers) {
    L.push("### Approvers");
    if ((approvers?.inCall ?? []).length > 0) {
      const callTime = approvers?.callStartedAt || new Date().toLocaleString(
        "en-PH",
        { timeZone: "Asia/Manila" }
      );
      L.push(`**In the call** (${callTime}):`);
      approvers.inCall.forEach((p) => L.push(`- ${p.name}`));
    }
    if ((approvers?.offline ?? []).length > 0) {
      L.push("**Offline:**");
      approvers.offline.forEach((p) =>
        L.push(`- ${p.name} — Date approved: ________`)
      );
    }
  }

  return L.join("\n");
}

// Mirrors buildMarkdown() in stages.jsx
export function buildMarkdown(all: Partial<Record<StageId, StageData>>): string {
  const need = (all["business-need"] as BusinessNeedData) ?? {};
  const epic = (all.epic as EpicData) ?? {};
  const story = (all["user-story"] as UserStoryData) ?? {};
  const ac = (all["acceptance-criteria"] as AcData) ?? {};
  const r = (all.readiness as ReadinessData) ?? {};
  const signoff = (all.signoff as SignoffData) ?? null;

  const L: string[] = [];
  L.push("# Epic: " + (epic.title || "(untitled)"));
  L.push("");
  if (need.businessProblem) {
    L.push("**Business problem** — " + need.businessProblem);
    L.push("");
  }
  if ((need.outcomes ?? []).length) {
    L.push("**Desired outcomes**");
    (need.outcomes ?? []).forEach((o) => L.push("- " + o));
    L.push("");
  }

  const soMd = buildSignoffMarkdown(signoff);
  if (soMd) {
    L.push(soMd);
    L.push("");
  }

  if (epic.description) {
    L.push("## Epic");
    L.push(epic.description);
    (epic.subFeatures ?? []).forEach((f) => L.push("- " + f));
    L.push("");
  }
  if ((story.stories ?? []).length) {
    L.push("## User stories (priority order)");
    (story.stories ?? []).forEach((s, i) =>
      L.push(`${i + 1}. As a ${s.as}, I want ${s.want}, so that ${s.so}.`)
    );
    L.push("");
  }
  if ((ac.rows ?? []).length) {
    L.push("## Acceptance criteria");
    (ac.rows ?? []).forEach((row) => {
      L.push(`### As a ${row.story.as}, I want ${row.story.want}`);
      (row.normal ?? []).forEach((c) => L.push("- **Normal** — " + c));
      (row.abnormal ?? []).forEach((c) => L.push("- **Abnormal** — " + c));
      L.push("");
    });
  }
  if (r.refinementScore != null) {
    L.push("## Readiness");
    L.push(
      `- Refinement: ${r.refinementScore} / 100   ·   Risk: ${r.risk?.level ?? "—"}   ·   Estimate: ${r.estimate?.points != null ? r.estimate.points : "—"} points (suggested)`
    );
    (r.recommendations ?? []).forEach((rc) => L.push("- " + rc));
  }
  return L.join("\n").trim() || "—";
}
