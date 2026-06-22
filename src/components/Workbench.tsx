"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Rail } from "@/components/Pipeline/Rail";
import { StageRenderer } from "@/components/Pipeline/StageRenderer";
import { Inspector } from "@/components/Inspector/Inspector";
import { TopBar } from "@/components/TopBar/TopBar";
import { CopilotPanel } from "@/components/Copilot/CopilotPanel";
import { Palette } from "@/components/CommandPalette/Palette";
import { Toaster } from "@/components/Shared/Toaster";
import { useWorkbench } from "@/hooks/useWorkbench";
import { usePersist } from "@/hooks/usePersist";
import { useToast } from "@/hooks/useToast";
import { STAGES, getStage } from "@/lib/stages";
import { fmtTime } from "@/utils/format";
import type { StageId, StageData } from "@/lib/types";

export function Workbench() {
  const wb = useWorkbench();
  const { st } = wb;
  const { toast, showToast } = useToast();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  usePersist(st);

  const stage = STAGES.find((s) => s.id === st.current) ?? STAGES[0];
  const editing = editingStage === st.current;
  const elapsedStr = fmtTime(st.elapsed);

  // ⌘K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const recalcConfidence = useCallback(
    async (stageId: StageId) => {
      if (!st.live) return;
      const currentData = st.data[stageId];
      if (!currentData) return;
      const stage = getStage(stageId);
      try {
        const res = await fetch(`/api/confidence/${stage.kind}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: currentData }),
        });
        const json = (await res.json()) as { confidence?: number; improvementTips?: string[] };
        if (typeof json.confidence === "number") {
          wb.updateData(
            stageId,
            (prev) =>
              ({
                ...(prev as object),
                confidence: json.confidence,
                improvementTips: json.improvementTips ?? [],
              }) as StageData,
            true
          );
        }
      } catch {
        /* silently ignore */
      }
    },
    [st.live, st.data, wb]
  );

  const handleChange = useCallback(
    (updater: ((prev: StageData) => StageData) | StageData) => {
      wb.updateData(st.current, updater, false, showToast);
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
      recalcTimerRef.current = setTimeout(() => {
        recalcConfidence(st.current);
        recalcTimerRef.current = null;
      }, 1500);
    },
    [wb, st.current, showToast, recalcConfidence]
  );

  const handleRun = useCallback(() => {
    wb.runStage(st.current, showToast);
  }, [wb, st.current, showToast]);

  const handleConfirm = useCallback(() => {
    setEditingStage(null);
    wb.confirmStage(st.current, showToast);
  }, [wb, st.current, showToast]);

  const handleGoTo = useCallback(
    (id: StageId) => {
      wb.goTo(id, showToast);
    },
    [wb, showToast]
  );

  const handleRerun = useCallback(() => {
    setEditingStage(null);
    wb.rerun(st.current, showToast);
  }, [wb, st.current, showToast]);

  const handleRestart = useCallback(() => {
    setEditingStage(null);
    wb.restart();
    showToast("Pipeline restarted", "arrow-left");
  }, [wb, showToast]);

  const handleToggleEdit = useCallback(() => {
    setEditingStage((e) => (e === st.current ? null : st.current));
  }, [st.current]);

  const handleExport = useCallback(
    async (target: { id: string; name: string }) => {
      if (target.id === "md") {
        wb.goTo("export", showToast);
        return;
      }
      if (target.id === "pdf") {
        try {
          const { buildAndDownloadPdf } = await import("@/lib/pdf-builder");
          buildAndDownloadPdf(st.data, wb.epicTitle ?? undefined);
          showToast("PDF downloaded", "download");
        } catch {
          showToast("PDF generation failed", "alert");
        }
        return;
      }
    },
    [wb, st.data, showToast]
  );

  const handleSave = useCallback(async () => {
    try {
      await wb.saveToFile();
      showToast("Session saved", "save");
    } catch {
      showToast("Save failed", "alert");
    }
  }, [wb, showToast]);

  const handleLoad = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = "";
      try {
        await wb.loadFromFile(file);
        showToast("Session restored", "check-circle");
      } catch (err) {
        showToast((err as Error).message || "Invalid session file", "alert");
      }
    },
    [wb, showToast]
  );

  const currentStatus = st.status[st.current];
  const canConfirm = currentStatus === "review";
  const canEdit = currentStatus === "review" || currentStatus === "done";
  const canRerun = currentStatus === "review" || currentStatus === "done";

  return (
    <div className="wb">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      <TopBar
        epicTitle={wb.epicTitle ?? ""}
        elapsedStr={elapsedStr}
        live={st.live}
        onToggleLive={wb.toggleLiveAI}
        onCommand={() => setPaletteOpen(true)}
        onCopilot={() => setCopilotOpen((o) => !o)}
        onExport={() => wb.goTo("export", showToast)}
        exportReachable={wb.exportReachable}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      <div className="wb-body">
        <Rail
          current={st.current}
          status={st.status}
          doneCount={wb.doneCount}
          clarity={wb.clarity}
          goTo={handleGoTo}
          restart={handleRestart}
        />

        <main className="canvas">
          <div className="canvas-head">
            <div>
              <h1 className="canvas-title">{stage.name}</h1>
              <div className="canvas-sub">{stage.purpose}</div>
            </div>
            <div className="canvas-actions">
              {canEdit && (
                <button
                  className={`btn ghost sm${editing ? " active" : ""}`}
                  onClick={handleToggleEdit}
                  title={editing ? "Done editing" : "Edit this stage's data"}
                >
                  {editing ? "Done editing" : "Edit"}
                </button>
              )}
              {canRerun && !editing && (
                <button className="btn ghost sm" onClick={handleRerun} title="Re-run this skill">
                  Re-run
                </button>
              )}
              {canConfirm && !editing && (
                <button className="btn primary sm" onClick={handleConfirm} title="Confirm and advance to the next stage">
                  Confirm →
                </button>
              )}
            </div>
          </div>

          <div className="canvas-body scroll">
            <StageRenderer
              stage={stage}
              status={currentStatus}
              data={st.data[st.current]}
              editing={editing}
              live={st.live}
              allData={st.data}
              onChange={handleChange}
              onReorder={(updater) => wb.updateData(st.current, updater, true)}
              sourceId={st.sourceId}
              setSourceId={wb.setSourceId}
              answers={st.answers}
              setAnswer={wb.setAnswer}
              elapsedStr={elapsedStr}
              onExport={handleExport}
            />
          </div>

          {stage.kind === "inbox" && currentStatus === "ready" && (
            <div className="canvas-foot">
              <button className="btn primary" onClick={handleRun}>
                Analyze requirement →
              </button>
            </div>
          )}
        </main>

        <Inspector
          stage={stage}
          status={currentStatus}
          data={st.data[st.current]}
          onRun={handleRun}
          preserve={st.preserve}
          onTogglePreserve={wb.togglePreserve}
        />
      </div>

      <CopilotPanel
        open={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        stage={st.current}
        contextData={st.data[st.current]}
      />

      <Palette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onJump={(id) => { handleGoTo(id); }}
        onRunCmd={({ stage: stageId }) => { handleGoTo(stageId); showToast("Commands chain skills — coming in v2", "command"); }}
      />

      <Toaster toast={toast} />
    </div>
  );
}
