import { NextRequest, NextResponse } from "next/server";
import { buildJiraPayload, type JiraExportInput } from "@/lib/jira-export";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as JiraExportInput;
    const result = buildJiraPayload(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
