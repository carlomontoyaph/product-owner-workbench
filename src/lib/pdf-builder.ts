import { jsPDF } from "jspdf";
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

const PAGE_WIDTH = 210;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const MAX_Y = 260;

function addHeader(doc: jsPDF, y: number): number {
  const now = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text("PO Workbench — Sprint Artifact", MARGIN_LEFT, y);
  doc.text(now, PAGE_WIDTH - MARGIN_RIGHT - 30, y);
  return y + 8;
}

function addRule(doc: jsPDF, y: number): number {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
  return y + 6;
}

function addHeading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont("Helvetica", "bold");
  doc.text(text, MARGIN_LEFT, y);
  doc.setFont("Helvetica", "normal");
  return y + 7;
}

function addSubheading(doc: jsPDF, text: string, y: number): number {
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.setFont("Helvetica", "bold");
  doc.text(text, MARGIN_LEFT, y);
  doc.setFont("Helvetica", "normal");
  return y + 6;
}

function addBody(doc: jsPDF, text: string, y: number, indent = 0): number {
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const x = MARGIN_LEFT + indent;
  const width = CONTENT_WIDTH - indent;
  const lines = doc.splitTextToSize(text, width);
  doc.text(lines, x, y);
  return y + lines.length * 3.5 + 1;
}

function addBullet(doc: jsPDF, text: string, y: number, indent = 0): number {
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  const x = MARGIN_LEFT + indent;
  const width = CONTENT_WIDTH - indent - 4;
  const bulletText = `• ${text}`;
  const lines = doc.splitTextToSize(bulletText, width);
  doc.text(lines, x, y);
  return y + lines.length * 3.5 + 1;
}

function checkPageBreak(doc: jsPDF, y: number, buffer = 20): number {
  if (y > MAX_Y) {
    doc.addPage();
    return buffer;
  }
  return y;
}

export function buildAndDownloadPdf(
  all: Partial<Record<StageId, StageData>>,
  epicTitle?: string
): void {
  const doc = new jsPDF("p", "mm", "a4");
  const need = (all["business-need"] as BusinessNeedData) ?? {};
  const epic = (all.epic as EpicData) ?? {};
  const story = (all["user-story"] as UserStoryData) ?? {};
  const ac = (all["acceptance-criteria"] as AcData) ?? {};
  const r = (all.readiness as ReadinessData) ?? {};
  const signoff = (all.signoff as SignoffData) ?? null;

  let y = 15;

  y = addHeader(doc, y);
  y += 2;
  y = checkPageBreak(doc, y, 15);
  y = addRule(doc, y);

  y = checkPageBreak(doc, y, 15);
  y = addHeading(doc, "BUSINESS CONTEXT", y);
  y += 3;

  if (need.businessProblem) {
    y = checkPageBreak(doc, y, 15);
    y = addSubheading(doc, "Business need:", y);
    y = addBody(doc, need.businessProblem, y, 0);
    y += 2;
  }

  if ((need.outcomes ?? []).length > 0) {
    y = checkPageBreak(doc, y, 15);
    y = addSubheading(doc, "Desired outcomes:", y);
    for (const outcome of need.outcomes ?? []) {
      y = checkPageBreak(doc, y, 15);
      y = addBullet(doc, outcome, y, 0);
    }
    y += 2;
  }

  if (r.refinementScore != null || r.risk?.level || r.estimate?.points != null) {
    y = checkPageBreak(doc, y, 15);
    const summaryLine = `Refinement: ${r.refinementScore ?? "—"} / 100   ·   Risk: ${r.risk?.level ?? "—"}   ·   Estimate: ${r.estimate?.points ?? "—"} pts`;
    y = addBody(doc, summaryLine, y, 0);
    y += 1;
  }

  if ((r.recommendations ?? []).length > 0) {
    y = checkPageBreak(doc, y, 15);
    y = addSubheading(doc, "Recommendations:", y);
    for (const rec of r.recommendations ?? []) {
      y = checkPageBreak(doc, y, 15);
      y = addBullet(doc, rec, y, 0);
    }
  }

  // Sign-off section
  if (signoff) {
    const { reviewers, approvers } = signoff;
    const hasReviewers =
      (reviewers?.inCall?.length ?? 0) > 0 || (reviewers?.offline?.length ?? 0) > 0;
    const hasApprovers =
      (approvers?.inCall?.length ?? 0) > 0 || (approvers?.offline?.length ?? 0) > 0;

    if (hasReviewers || hasApprovers) {
      y = checkPageBreak(doc, y, 15);
      y += 3;
      y = addRule(doc, y);

      y = checkPageBreak(doc, y, 15);
      y = addHeading(doc, "SIGN-OFF", y);
      y += 2;

      if (hasReviewers) {
        y = checkPageBreak(doc, y, 15);
        y = addSubheading(doc, "Reviewers", y);
        if ((reviewers?.inCall ?? []).length > 0) {
          y = checkPageBreak(doc, y, 15);
          const callTime =
            reviewers?.callStartedAt ||
            new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
          y = addBody(doc, `In the call (${callTime}):`, y, 0);
          for (const p of reviewers.inCall) {
            y = checkPageBreak(doc, y, 15);
            y = addBullet(doc, p.name, y, 2);
          }
        }
        if ((reviewers?.offline ?? []).length > 0) {
          y = checkPageBreak(doc, y, 15);
          y = addBody(doc, "Offline:", y, 0);
          for (const p of reviewers.offline) {
            y = checkPageBreak(doc, y, 15);
            y = addBody(doc, `${p.name} — Date reviewed: ________`, y, 2);
          }
        }
        y += 2;
      }

      if (hasApprovers) {
        y = checkPageBreak(doc, y, 15);
        y = addSubheading(doc, "Approvers", y);
        if ((approvers?.inCall ?? []).length > 0) {
          y = checkPageBreak(doc, y, 15);
          const callTime =
            approvers?.callStartedAt ||
            new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" });
          y = addBody(doc, `In the call (${callTime}):`, y, 0);
          for (const p of approvers.inCall) {
            y = checkPageBreak(doc, y, 15);
            y = addBullet(doc, p.name, y, 2);
          }
        }
        if ((approvers?.offline ?? []).length > 0) {
          y = checkPageBreak(doc, y, 15);
          y = addBody(doc, "Offline:", y, 0);
          for (const p of approvers.offline) {
            y = checkPageBreak(doc, y, 15);
            y = addBody(doc, `${p.name} — Date approved: ________`, y, 2);
          }
        }
      }
    }
  }

  y = checkPageBreak(doc, y, 15);
  y += 3;
  y = addRule(doc, y);

  y = checkPageBreak(doc, y, 15);
  y = addHeading(doc, `EPIC: ${epic.title || "(untitled)"}`, y);
  y += 2;

  if (epic.description) {
    y = checkPageBreak(doc, y, 15);
    y = addBody(doc, epic.description, y, 0);
    y += 2;
  }

  if ((epic.subFeatures ?? []).length > 0) {
    y = checkPageBreak(doc, y, 15);
    for (const feature of epic.subFeatures ?? []) {
      y = checkPageBreak(doc, y, 15);
      y = addBullet(doc, feature, y, 0);
    }
  }

  if ((story.stories ?? []).length > 0) {
    y = checkPageBreak(doc, y, 15);
    y += 3;
    y = addRule(doc, y);

    y = checkPageBreak(doc, y, 15);
    y = addHeading(doc, "USER STORIES", y);
    y += 2;

    for (let i = 0; i < (story.stories ?? []).length; i++) {
      const s = story.stories![i];
      y = checkPageBreak(doc, y, 15);
      y = addBody(doc, `${i + 1}. As a ${s.as}, I want ${s.want}, so that ${s.so}.`, y, 0);
    }
  }

  if ((ac.rows ?? []).length > 0) {
    y = checkPageBreak(doc, y, 15);
    y += 3;
    y = addRule(doc, y);

    y = checkPageBreak(doc, y, 15);
    y = addHeading(doc, "ACCEPTANCE CRITERIA", y);
    y += 2;

    for (const row of ac.rows ?? []) {
      y = checkPageBreak(doc, y, 15);
      y = addSubheading(doc, `As a ${row.story.as}, I want ${row.story.want}`, y);
      y += 1;

      if ((row.normal ?? []).length > 0) {
        y = checkPageBreak(doc, y, 15);
        y = addBody(doc, "Normal:", y, 2);
        for (const criterion of row.normal ?? []) {
          y = checkPageBreak(doc, y, 15);
          y = addBullet(doc, criterion, y, 6);
        }
      }

      if ((row.abnormal ?? []).length > 0) {
        y = checkPageBreak(doc, y, 15);
        y = addBody(doc, "Abnormal:", y, 2);
        for (const criterion of row.abnormal ?? []) {
          y = checkPageBreak(doc, y, 15);
          y = addBullet(doc, criterion, y, 6);
        }
      }

      y += 2;
    }
  }

  const filename = epicTitle
    ? `${epicTitle.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.pdf`
    : "po-workbench-artifact.pdf";

  doc.save(filename);
}
