import OpenAI from "openai";
import fs from "fs";
import path from "path";

export type AiFailureReason = "invalid-api-key" | "rate-limited" | "network" | "unknown";

export interface AiFailureClassification {
  reason: AiFailureReason;
  label: string;
  status?: number;
  message: string;
}

const LOG_FILE = path.join(process.cwd(), "ai-debug.log");
const MAX_LOG_SIZE = 10 * 1024 * 1024; // 10 MB
const ROTATED_LOG_COUNT = 5;

function redact(text: string): string {
  // Redact OpenAI API keys
  text = text.replace(/sk-[A-Za-z0-9_-]{6,}/g, "sk-[REDACTED]");
  // Redact environment variable references
  text = text.replace(/OPENAI_API_KEY/g, "[ENV_VAR_REDACTED]");
  // Redact email-like patterns
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, "[EMAIL_REDACTED]");
  // Redact file paths (Windows and Unix)
  text = text.replace(/[A-Z]:\\[^\s]+|\/[a-z][^\s]*/g, "[PATH_REDACTED]");
  // Redact common secret patterns
  text = text.replace(/(api[_-]?key|secret|token|password)\s*[=:]\s*[^\s,}]+/gi, "$1=[SECRET_REDACTED]");
  return text;
}

function rotateLogsIfNeeded(): void {
  try {
    if (!fs.existsSync(LOG_FILE)) return;
    const stat = fs.statSync(LOG_FILE);
    if (stat.size < MAX_LOG_SIZE) return;

    // Rotate: ai-debug.log → ai-debug.1.log, ai-debug.1.log → ai-debug.2.log, etc.
    for (let i = ROTATED_LOG_COUNT - 1; i >= 1; i--) {
      const oldPath = path.join(path.dirname(LOG_FILE), `ai-debug.${i}.log`);
      const newPath = path.join(path.dirname(LOG_FILE), `ai-debug.${i + 1}.log`);
      if (fs.existsSync(oldPath)) {
        if (i + 1 <= ROTATED_LOG_COUNT) {
          fs.renameSync(oldPath, newPath);
        } else {
          fs.unlinkSync(oldPath);
        }
      }
    }
    const rotateTo = path.join(path.dirname(LOG_FILE), "ai-debug.1.log");
    fs.renameSync(LOG_FILE, rotateTo);
  } catch (rotateErr) {
    console.error("[ai-debug] rotation failed:", rotateErr);
  }
}

export function classifyAiError(err: unknown): AiFailureClassification {
  const message = redact(err instanceof Error ? err.message : String(err));

  if (err instanceof OpenAI.AuthenticationError) {
    return { reason: "invalid-api-key", label: "invalid or expired API key", status: err.status, message };
  }
  if (err instanceof OpenAI.RateLimitError) {
    return { reason: "rate-limited", label: "rate limited", status: err.status, message };
  }
  if (err instanceof OpenAI.APIConnectionError) {
    return { reason: "network", label: "network/connectivity failure", message };
  }
  if (err instanceof OpenAI.APIError) {
    return { reason: "unknown", label: `API error${err.status ? ` (HTTP ${err.status})` : ""}`, status: err.status, message };
  }
  return { reason: "unknown", label: "unknown error", message };
}

export interface LogAiFailureParams {
  route: string;
  stageKind?: string;
  model?: string;
  err: unknown;
  retryCount?: number;
}

export function logAiFailure(params: LogAiFailureParams): AiFailureClassification {
  const classification = classifyAiError(params.err);
  const now = new Date();
  const record = {
    ts: now.toISOString(),
    tsMs: now.getTime(),
    route: params.route,
    stageKind: params.stageKind,
    model: params.model,
    reason: classification.reason,
    status: classification.status,
    message: classification.message,
    retryCount: params.retryCount,
  };

  console.error("[ai-debug]", record);

  // Check rotation before writing (non-blocking)
  rotateLogsIfNeeded();

  // Write asynchronously to avoid blocking the request handler
  fs.appendFile(LOG_FILE, JSON.stringify(record) + "\n", "utf8", (writeErr) => {
    if (writeErr) {
      console.error("[ai-debug] failed to write ai-debug.log:", writeErr);
    }
  });

  return classification;
}

export function clearLogs(): void {
  try {
    if (fs.existsSync(LOG_FILE)) {
      fs.unlinkSync(LOG_FILE);
    }
    // Clean up rotated logs too
    for (let i = 1; i <= ROTATED_LOG_COUNT; i++) {
      const rotatedPath = path.join(path.dirname(LOG_FILE), `ai-debug.${i}.log`);
      if (fs.existsSync(rotatedPath)) {
        fs.unlinkSync(rotatedPath);
      }
    }
  } catch (err) {
    console.error("[ai-debug] failed to clear logs:", err);
  }
}
