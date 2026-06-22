import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getConfidenceOnlyPrompt } from "@/lib/prompts";
import { parseJSON } from "@/lib/json-parser";

const MODEL = "gpt-4o";
const MAX_TOKENS = 512;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name: stageKind } = await params;
  try {
    const { data } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ confidence: 85, improvementTips: [] });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const res = await client.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: getConfidenceOnlyPrompt(stageKind, data) }],
    });

    const parsed = parseJSON(res.choices[0]?.message?.content ?? "{}") as Record<
      string,
      unknown
    >;

    const arr = (v: unknown): string[] =>
      Array.isArray(v) ? (v as string[]).filter((x) => x && String(x).trim()) : [];

    return NextResponse.json({
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 85)),
      improvementTips: arr(parsed.improvementTips).slice(0, 3),
    });
  } catch {
    return NextResponse.json({ confidence: 85, improvementTips: [] });
  }
}
