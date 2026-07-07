import { classifyAiError } from "./ai-debug";

export class RetryableError extends Error {
  retryCount: number;
  originalError: unknown;

  constructor(originalError: unknown, retryCount: number) {
    const message = originalError instanceof Error ? originalError.message : String(originalError);
    super(message);
    this.name = "RetryableError";
    this.originalError = originalError;
    this.retryCount = retryCount;
    Object.setPrototypeOf(this, RetryableError.prototype);
  }
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  { tries = 3, route = "unknown", model = "unknown" }: { tries?: number; route?: string; model?: string } = {}
): Promise<T> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      const classification = classifyAiError(e);
      const isTransient = classification.reason === "rate-limited" || classification.reason === "network";
      if (!isTransient || i === tries - 1) {
        throw new RetryableError(e, i);
      }
      const delayMs = 1200 * (i + 1) + Math.random() * 500;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw new Error("unreachable");
}
