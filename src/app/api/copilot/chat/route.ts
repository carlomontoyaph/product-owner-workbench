import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getCopilotSystemPrompt } from "@/lib/prompts";
import { getStage } from "@/lib/stages";
import { logAiFailure } from "@/lib/ai-debug";
import type { StageId } from "@/lib/types";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function encode(obj: object): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj) + "\n");
}

export async function POST(req: NextRequest) {
  const { stage, userMessage, chatHistory } = (await req.json()) as {
    stage: StageId;
    userMessage: string;
    chatHistory: { role: "user" | "assistant"; content: string }[];
  };

  if (!process.env.OPENAI_API_KEY) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encode({ content: "API key not configured. Set OPENAI_API_KEY in .env.local." }));
        controller.enqueue(encode({ done: true }));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  }

  let stageName = "this stage";
  try { stageName = getStage(stage).name; } catch { /* use default */ }

  const systemPrompt = getCopilotSystemPrompt(stageName);
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...chatHistory.map((m) => ({ role: m.role, content: m.content } as OpenAI.Chat.ChatCompletionMessageParam)),
    { role: "user", content: userMessage },
  ];

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiStream = await getClient().chat.completions.create({
          model: "gpt-4o",
          max_tokens: 1024,
          messages,
          stream: true,
        });

        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            controller.enqueue(encode({ content: delta }));
          }
        }
        controller.enqueue(encode({ done: true }));
      } catch (err) {
        const classification = logAiFailure({ route: "copilot", model: "gpt-4o", err });
        controller.enqueue(encode({ content: `\n\nError: ${classification.label}` }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
