"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { WorkbenchState, StageId, StageData, StageStatus, SignoffData } from "@/lib/types";
import { STAGES, STAGE_IDS, AI_STAGES, stageIndex, nextStageId } from "@/lib/stages";
import { SOURCES } from "@/lib/mocks";
import { buildContext } from "@/lib/context-builder";
import { mergeStageData } from "@/lib/merge";
import { LOCAL_STORAGE_KEY } from "@/utils/constants";
import { serializeSession, deserializeSession, saveWithPicker } from "@/lib/save-load";

// ── initial state ─────────────────────────────────────────────────────────────

function initData(): Partial<Record<StageId, StageData>> {
  return {};
}

function defaultState(): WorkbenchState {
  const status = {} as Record<StageId, WorkbenchState["status"][StageId]>;
  STAGE_IDS.forEach((id, i) => {
    status[id] = i === 0 ? "ready" : "locked";
  });
  return {
    current: "inbox",
    status,
    answers: {},
    data: initData() as WorkbenchState["data"],
    sourceId: "free",
    elapsed: 0,
    frozen: false,
    live: true,
    preserve: true,
    copilotMessages: [],
  };
}

function loadState(): WorkbenchState {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw) as WorkbenchState;
      if (s?.status) {
        s.data = (s.data ?? {}) as WorkbenchState["data"];
        if (s.live === undefined) s.live = true;
        if (s.preserve === undefined) s.preserve = true;
        if (!s.copilotMessages) s.copilotMessages = [];

        // Migrate: insert signoff status/data for pre-signoff saved sessions
        if (s.status.signoff === undefined) {
          if (s.status.export !== "locked") {
            s.status.signoff = "review";
            s.status.export = "locked";
            s.frozen = false;
            if (s.current === "export") s.current = "signoff";
          } else {
            s.status.signoff = "locked";
          }
        }
        if (!s.data.signoff) s.data.signoff = {} as SignoffData;

        // Migrate: convert freeText → inputs.free for inbox data
        const oldInbox = s.data.inbox as { freeText?: string } | undefined;
        if (oldInbox && !("inputs" in oldInbox)) {
          s.data.inbox = { inputs: { free: oldInbox.freeText ?? "" }, sources: [], cards: [] };
        }
        if (!s.data.inbox) s.data.inbox = { inputs: {}, sources: [], cards: [] };

        return s;
      }
    }
  } catch {
    // corrupted storage — start fresh
  }
  return defaultState();
}

// ── hook ──────────────────────────────────────────────────────────────────────

export function useWorkbench() {
  const [st, setSt] = useState<WorkbenchState>(defaultState);
  const stRef = useRef(st);
  // keep the latest state available to callbacks without re-creating them
  useEffect(() => {
    stRef.current = st;
  });

  // hydrate from localStorage after mount (intentional one-time setState in an
  // effect — reading localStorage during render would cause an SSR mismatch)
  useEffect(() => {
    const saved = loadState();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSt(saved);
  }, []);

  // session clock
  useEffect(() => {
    if (st.frozen) return;
    const t = setInterval(
      () => setSt((p) => (p.frozen ? p : { ...p, elapsed: p.elapsed + 1 })),
      1000
    );
    return () => clearInterval(t);
  }, [st.frozen]);

  const showToast = useCallback((msg: string, ico = "check-circle") => {
    // dispatched up to Workbench via returned fn — not stored in workbench state
    void { msg, ico };
  }, []);

  // ── stage execution ──────────────────────────────────────────────────────

  const runStage = useCallback(
    async (id: StageId, onToast?: (msg: string, ico?: string) => void) => {
      const stage = STAGES.find((s) => s.id === id);
      if (!stage) return;

      setSt((p) => ({ ...p, current: id, status: { ...p.status, [id]: "running" } }));

      const currentState = stRef.current;
      const liveOn = currentState.live && AI_STAGES.has(id);

      if (!liveOn) {
        // sample mode
        await new Promise((r) => setTimeout(r, 1650));
        setSt((p) => ({ ...p, status: { ...p.status, [id]: "review" } }));
        return;
      }

      // live AI mode
      try {
        const ctx = buildContext({ ...stRef.current, current: id });
        const res = await fetch(`/api/stage/${stage.kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stageId: id, liveAiEnabled: true, context: ctx }),
        });
        const json = (await res.json()) as {
          success?: boolean;
          data?: StageData;
          error?: string;
        };
        if (json.success && json.data) {
          const incoming = json.data;
          setSt((p) => {
            const merged = p.preserve
              ? mergeStageData(stage.kind, p.data[id], incoming)
              : incoming;
            const next: WorkbenchState = {
              ...p,
              status: { ...p.status, [id]: "review" },
              data: { ...p.data, [id]: merged },
            };
            if (id === "discovery") next.answers = {};
            return next;
          });
          if (json.error) {
            onToast?.(`AI unavailable — showing sample output (${json.error})`, "alert");
          }
        } else {
          throw new Error(json.error ?? "api-error");
        }
      } catch (err) {
        console.warn("[WB] stage failed, falling back to sample:", id, err);
        setSt((p) => ({ ...p, status: { ...p.status, [id]: "review" } }));
        onToast?.("AI unavailable — showing sample output", "alert");
      }
    },
    []
  );

  const confirmStage = useCallback(
    async (
      id: StageId,
      onToast?: (msg: string, ico?: string) => void
    ) => {
      const i = stageIndex(id);
      const nextId = STAGE_IDS[i + 1] as StageId | undefined;

      setSt((p) => {
        const status = { ...p.status, [id]: "done" as const };
        if (!nextId) return { ...p, status };
        if (nextId === "signoff") {
          status.signoff = "review";
          return { ...p, status, current: "signoff" };
        }
        if (nextId === "export") {
          status.export = "ready";
          return { ...p, status, current: "export", frozen: true };
        }
        return { ...p, status };
      });

      if (nextId && nextId !== "export" && nextId !== "signoff") {
        await runStage(nextId, onToast);
      }
      if (nextId === "signoff") {
        onToast?.("Record reviewers & approvers", "check");
      }
      if (nextId === "export") {
        onToast?.("Sprint-ready artifact assembled", "rocket");
      }
    },
    [runStage]
  );

  const goTo = useCallback(
    (id: StageId, onToast?: (msg: string, ico?: string) => void) => {
      if (stRef.current.status[id] === "locked") {
        onToast?.("Confirm earlier steps to unlock this stage", "lock");
        return;
      }
      setSt((p) => ({ ...p, current: id }));
    },
    []
  );

  const rerun = useCallback(
    async (id: StageId, onToast?: (msg: string, ico?: string) => void) => {
      const i = stageIndex(id);
      setSt((p) => {
        const status = { ...p.status };
        STAGE_IDS.forEach((sid, j) => {
          if (j > i) status[sid] = "locked";
        });
        return { ...p, status, frozen: false };
      });

      if (id === "inbox") {
        setSt((p) => ({ ...p, status: { ...p.status, inbox: "ready" } }));
        onToast?.("Pipeline reset — re-analyze to continue", "settings");
      } else {
        await runStage(id, onToast);
        onToast?.("Re-running — downstream steps reset", "settings");
      }
    },
    [runStage]
  );

  const updateData = useCallback(
    (
      stageId: StageId,
      updater: ((prev: StageData) => StageData) | StageData,
      silent?: boolean,
      onToast?: (msg: string, ico?: string) => void
    ) => {
      const wasDone = stRef.current.status[stageId] === "done";
      if (wasDone && !silent) onToast?.("Edited — later steps reset to re-confirm", "settings");
      setSt((p) => {
        const cur = p.data[stageId];
        const next = typeof updater === "function" ? updater(cur) : updater;
        const data = { ...p.data, [stageId]: next };
        if (!silent && p.status[stageId] === "done") {
          const status = { ...p.status, [stageId]: "review" as const };
          const si = stageIndex(stageId);
          STAGE_IDS.forEach((sid, j) => {
            if (j > si) status[sid] = "locked";
          });
          return { ...p, data, status, frozen: false };
        }
        return { ...p, data };
      });
    },
    []
  );

  const setAnswer = useCallback((qid: string, val: string) => {
    setSt((p) => {
      const answers = { ...p.answers, [qid]: val };
      if (p.status.discovery === "done") {
        const status = { ...p.status, discovery: "review" } as Record<StageId, StageStatus>;
        STAGE_IDS.forEach((sid, j) => {
          if (j > stageIndex("discovery")) status[sid] = "locked";
        });
        return { ...p, answers, status, frozen: false };
      }
      return { ...p, answers };
    });
  }, []);

  const setSourceId = useCallback((id: string) => {
    setSt((p) => ({ ...p, sourceId: id }));
  }, []);

  const restart = useCallback(() => {
    setSt(defaultState());
  }, []);

  const toggleLiveAI = useCallback(() => {
    setSt((p) => ({ ...p, live: !p.live }));
  }, []);

  const togglePreserve = useCallback(() => {
    setSt((p) => ({ ...p, preserve: !p.preserve }));
  }, []);

  const saveToFile = useCallback(async () => {
    const json = serializeSession(stRef.current);
    const epicData = stRef.current.data.epic as { title?: string } | undefined;
    const title = epicData?.title;
    const filename = title
      ? `${title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}.json`
      : "po-workbench-session.json";
    await saveWithPicker(json, filename);
  }, []);

  const loadFromFile = useCallback(async (file: File) => {
    const raw = await file.text();
    const state = deserializeSession(raw); // throws on invalid input
    setSt(state);
  }, []);

  const addCopilotMessage = useCallback(
    (role: "user" | "assistant", content: string, stage?: StageId) => {
      setSt((p) => ({
        ...p,
        copilotMessages: [
          ...p.copilotMessages,
          {
            id: Math.random().toString(36).slice(2),
            role,
            content,
            timestamp: Date.now(),
            stage,
          },
        ],
      }));
    },
    []
  );

  // derived
  const doneCount = STAGE_IDS.filter((id) => st.status[id] === "done").length;
  const clarity = Math.round((doneCount / STAGES.length) * 100);
  const exportReachable = st.status.export !== "locked";
  const epicTitle =
    (st.status.epic === "done" || st.status.epic === "review") &&
    (st.data.epic as { title?: string })?.title
      ? (st.data.epic as { title?: string }).title!
      : null;

  return {
    st,
    doneCount,
    clarity,
    exportReachable,
    epicTitle,
    runStage,
    confirmStage,
    goTo,
    rerun,
    updateData,
    setAnswer,
    setSourceId,
    restart,
    toggleLiveAI,
    togglePreserve,
    addCopilotMessage,
    saveToFile,
    loadFromFile,
  };
}
