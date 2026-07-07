import { NextRequest } from "next/server";
import { clearLogs } from "@/lib/ai-debug";

export async function POST(req: NextRequest) {
  try {
    clearLogs();
    return Response.json({ ok: true });
  } catch (err) {
    console.error("[debug/logs/clear] error:", err);
    return Response.json({ error: "Failed to clear logs" }, { status: 500 });
  }
}
