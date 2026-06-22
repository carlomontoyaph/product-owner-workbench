import type { EpicData, UserStoryData, AcData } from "./types";

function escapeCsv(val: string): string {
  const s = String(val ?? "");
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

export interface CsvExportInput {
  epic?: EpicData;
  stories?: UserStoryData;
  ac?: AcData;
}

export function generateCsv(data: CsvExportInput): { csv: string; filename: string } {
  const rows: string[][] = [];
  rows.push(["Epic", "Priority", "Story (As a / I want / So that)", "Criteria type", "Criterion"]);

  const epicTitle = data.epic?.title ?? "export";
  const stories = data.stories?.stories ?? [];
  const acRows = data.ac?.rows ?? [];

  stories.forEach((story, i) => {
    const storyText = `As a ${story.as}, I want ${story.want}, so that ${story.so}.`;
    const acRow = acRows[i];
    const normalCriteria = acRow?.normal ?? [];
    const abnormalCriteria = acRow?.abnormal ?? [];

    if (!normalCriteria.length && !abnormalCriteria.length) {
      rows.push([epicTitle, `P${i + 1}`, storyText, "", ""]);
    } else {
      normalCriteria.forEach((c, j) => {
        rows.push([
          j === 0 ? epicTitle : "",
          j === 0 ? `P${i + 1}` : "",
          j === 0 ? storyText : "",
          "Normal",
          c,
        ]);
      });
      abnormalCriteria.forEach((c, j) => {
        rows.push([
          j === 0 && !normalCriteria.length ? epicTitle : "",
          j === 0 && !normalCriteria.length ? `P${i + 1}` : "",
          j === 0 && !normalCriteria.length ? storyText : "",
          "Abnormal",
          c,
        ]);
      });
    }
  });

  const csv = rows.map((r) => r.map(escapeCsv).join(",")).join("\n");
  const slug = epicTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const filename = `${slug}-${date}.csv`;
  return { csv, filename };
}
