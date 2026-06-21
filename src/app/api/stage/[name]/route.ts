import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getPrompt, getPerStoryAcPrompt } from "@/lib/prompts";
import { parseJSON } from "@/lib/json-parser";
import { normalizeStage } from "@/lib/normalizers";
import { getMock } from "@/lib/mocks";
import type { StageId, StageContext, UserStoryData } from "@/lib/types";

const MODEL = "gpt-4o";
const MAX_TOKENS = 2048;

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function complete(client: OpenAI, prompt: string): Promise<string> {
  const res = await client.chat.completions.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });
  return res.choices[0]?.message?.content ?? "{}";
}

// stageKind is the prototype's "kind" field (need, requirement, discovery, epic, story, ac, readiness)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: stageKind } = await params;
  try {
    const body = await req.json();
    const { stageId, liveAiEnabled, context } = body as {
      stageId: StageId;
      liveAiEnabled: boolean;
      context: StageContext;
    };

    if (!liveAiEnabled) {
      return NextResponse.json({ success: true, data: getMock(stageId) });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: true,
        data: getMock(stageId),
        error: "No API key — returning sample data",
      });
    }

    const client = getClient();

    // Acceptance criteria: one call per story to stay within token limits
    if (stageKind === "ac") {
      const stories = (context.story as UserStoryData)?.stories ?? [];
      if (!stories.length) {
        return NextResponse.json({ success: false, error: "no-stories-for-ac" }, { status: 400 });
      }
      const rows = [];
      const confidences: number[] = [];
      const allTips = new Set<string>();
      for (const s of stories.slice(0, 6)) {
        const prompt = getPerStoryAcPrompt(s);
        try {
          const txt = await complete(client, prompt);
          const parsed = parseJSON(txt) as {
            normal?: string[];
            abnormal?: string[];
            confidence?: number;
            improvementTips?: string[];
          };
          const arr = (v: unknown) =>
            Array.isArray(v) ? (v as string[]).filter((x) => x && String(x).trim()) : [];
          if (parsed.confidence !== undefined) {
            confidences.push(Math.max(0, Math.min(100, Number(parsed.confidence) || 85)));
          }
          if (Array.isArray(parsed.improvementTips)) {
            parsed.improvementTips.forEach((tip) => {
              if (typeof tip === "string" && tip.trim()) allTips.add(tip);
            });
          }
          rows.push({
            story: { as: s.as, want: s.want, so: s.so },
            normal: arr(parsed.normal),
            abnormal: arr(parsed.abnormal),
          });
        } catch {
          rows.push({ story: { as: s.as, want: s.want, so: s.so }, normal: [], abnormal: [] });
        }
      }
      const confidence = confidences.length ? Math.round(confidences.reduce((a, b) => a + b) / confidences.length) : 85;
      const improvementTips = Array.from(allTips).slice(0, 3);
      return NextResponse.json({ success: true, data: { rows, confidence, improvementTips } });
    }

    const prompt = getPrompt(stageKind, context);
    if (!prompt) {
      return NextResponse.json({ success: false, error: `no-prompt-for-${stageKind}` }, { status: 400 });
    }

    const txt = await complete(client, prompt);
    const parsed = parseJSON(txt);
    const data = normalizeStage(stageKind, parsed);

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[/api/stage]", stageKind, err);
    return NextResponse.json({
      success: true,
      data: getMock(stageKind as StageId),
      error: String(err),
    });
  }
}
