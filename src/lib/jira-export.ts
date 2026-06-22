import type { EpicData, UserStoryData, AcData } from "./types";

export interface JiraExportInput {
  epic?: EpicData;
  stories?: UserStoryData;
  ac?: AcData;
  jiraConfig?: { instanceUrl?: string; projectKey?: string };
}

export function buildJiraPayload(data: JiraExportInput): {
  payload: object;
  instructions: string;
} {
  const projectKey = data.jiraConfig?.projectKey ?? "PROJ";
  const instanceUrl = data.jiraConfig?.instanceUrl ?? "https://your-instance.atlassian.net";
  const epic = data.epic;
  const stories = data.stories?.stories ?? [];
  const acRows = data.ac?.rows ?? [];

  const epicIssue = {
    fields: {
      project: { key: projectKey },
      summary: epic?.title ?? "New Epic",
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: epic?.description ?? "" }],
          },
        ],
      },
      issuetype: { name: "Epic" },
    },
  };

  const storyIssues = stories.map((s, i) => {
    const acRow = acRows[i];
    const acText = [
      ...(acRow?.normal ?? []).map((c: string) => `Normal: ${c}`),
      ...(acRow?.abnormal ?? []).map((c: string) => `Abnormal: ${c}`),
    ].join("\n\n");

    return {
      fields: {
        project: { key: projectKey },
        summary: `As a ${s.as}, I want ${s.want}`,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `As a ${s.as}, I want ${s.want}, so that ${s.so}.\n\n${acText}`,
                },
              ],
            },
          ],
        },
        issuetype: { name: "Story" },
      },
    };
  });

  const payload = { epic: epicIssue, stories: storyIssues };
  const instructions = `POST each issue to ${instanceUrl}/rest/api/3/issue\nHeader: Authorization: Bearer <your-token>\nHeader: Content-Type: application/json\n\nCreate the epic first, then create stories with the epic link.`;

  return { payload, instructions };
}
