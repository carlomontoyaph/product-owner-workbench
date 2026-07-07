import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export interface DebugLogRecord {
  ts: string;
  tsMs: number;
  route: string;
  stageKind?: string;
  model?: string;
  reason: "invalid-api-key" | "rate-limited" | "network" | "unknown";
  status?: number;
  message: string;
  retryCount?: number;
}

export interface DebugLogsResponse {
  logs: DebugLogRecord[];
  totalCount: number;
  hasMore: boolean;
  refreshedAt: string;
}

const LOG_FILE = path.join(process.cwd(), "ai-debug.log");
const MAX_RESPONSE_LINES = 200;

function readLogFile(): DebugLogRecord[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }

    const content = fs.readFileSync(LOG_FILE, "utf8");
    const lines = content.split("\n").filter((line) => line.trim());

    return lines
      .map((line) => {
        try {
          return JSON.parse(line) as DebugLogRecord;
        } catch {
          return null;
        }
      })
      .filter((record) => record !== null) as DebugLogRecord[];
  } catch (err) {
    console.error("[debug/logs] failed to read log file:", err);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      limit = 50,
      offset = 0,
      filterRoute,
      filterReason,
      sinceTimestamp,
    } = body as {
      limit?: number;
      offset?: number;
      filterRoute?: string;
      filterReason?: string;
      sinceTimestamp?: number;
    };

    // Validate inputs
    const safeLimit = Math.min(Math.max(1, limit || 50), MAX_RESPONSE_LINES);
    const safeOffset = Math.max(0, offset || 0);

    // Read all logs
    let records = readLogFile();

    // Apply filters
    if (filterRoute) {
      records = records.filter((r) => r.route === filterRoute);
    }
    if (filterReason) {
      records = records.filter((r) => r.reason === filterReason);
    }
    if (sinceTimestamp) {
      records = records.filter((r) => r.tsMs >= sinceTimestamp);
    }

    // Reverse to show most recent first
    records.reverse();

    const totalCount = records.length;
    const paginatedRecords = records.slice(safeOffset, safeOffset + safeLimit);
    const hasMore = safeOffset + safeLimit < totalCount;

    const response: DebugLogsResponse = {
      logs: paginatedRecords,
      totalCount,
      hasMore,
      refreshedAt: new Date().toISOString(),
    };

    return Response.json(response);
  } catch (err) {
    console.error("[debug/logs] error:", err);
    return Response.json(
      { error: "Failed to fetch logs", logs: [], totalCount: 0, hasMore: false, refreshedAt: new Date().toISOString() },
      { status: 500 }
    );
  }
}
