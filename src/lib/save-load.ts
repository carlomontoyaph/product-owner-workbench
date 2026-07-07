import type { WorkbenchState, SignoffData } from "@/lib/types";

export interface WorkbenchSaveFile {
  version: "1";
  format: "po-workbench-session";
  savedAt: string;
  state: WorkbenchState;
}

export function serializeSession(state: WorkbenchState): string {
  const file: WorkbenchSaveFile = {
    version: "1",
    format: "po-workbench-session",
    savedAt: new Date().toISOString(),
    state,
  };
  return JSON.stringify(file, null, 2);
}

export function deserializeSession(raw: string): WorkbenchState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid JSON — could not parse the file.");
  }

  const data = parsed as Record<string, unknown>;

  if (data.format !== "po-workbench-session") {
    throw new Error("Not a PO Workbench session file.");
  }
  if (data.version !== "1") {
    throw new Error(`Unsupported session version: ${String(data.version)}`);
  }

  const state = data.state as WorkbenchState;
  if (!state?.status || typeof state.status !== "object") {
    throw new Error("Session file is corrupted (missing stage status).");
  }

  // Apply the same defensive defaults as loadState() in useWorkbench
  state.data = (state.data ?? {}) as WorkbenchState["data"];
  if (state.live === undefined) state.live = true;
  if (state.preserve === undefined) state.preserve = true;
  if (!state.copilotMessages) state.copilotMessages = [];

  // Migrate: insert signoff status/data for pre-signoff saved sessions
  if (state.status.signoff === undefined) {
    if (state.status.export !== "locked") {
      state.status.signoff = "review";
      state.status.export = "locked";
      state.frozen = false;
      if (state.current === "export") state.current = "signoff";
    } else {
      state.status.signoff = "locked";
    }
  }
  if (!state.data.signoff) state.data.signoff = {} as SignoffData;

  // Migrate: convert freeText → inputs.free for inbox data
  const oldInbox = state.data.inbox as { freeText?: string } | undefined;
  if (oldInbox && !("inputs" in oldInbox)) {
    state.data.inbox = { inputs: { free: oldInbox.freeText ?? "" }, sources: [], cards: [] };
  }
  if (!state.data.inbox) state.data.inbox = { inputs: {}, sources: [], cards: [] };

  return state;
}

function triggerDownload(json: string, filename: string): void {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function saveWithPicker(json: string, suggestedName: string): Promise<void> {
  if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
    try {
      const handle = await (
        window as Window & {
          showSaveFilePicker: (opts: unknown) => Promise<{ createWritable: () => Promise<{ write: (d: string) => Promise<void>; close: () => Promise<void> }> }>;
        }
      ).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: "PO Workbench Session",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      return;
    } catch (err) {
      // User cancelled the picker — don't fall through to download
      if ((err as Error).name === "AbortError") return;
      // Any other error: fall through to download
    }
  }
  triggerDownload(json, suggestedName);
}
