import { NextRequest, NextResponse } from "next/server";
import { buildJiraPayload } from "@/lib/jira-export";
import type { EpicData, UserStoryData, AcData } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = buildJiraPayload({
      epic: body.epic as EpicData,
      stories: body.stories as UserStoryData,
      ac: body.ac as AcData,
      jiraConfig: body.jiraConfig,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
