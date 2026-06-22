"use client";
import { Icon } from "@/components/Shared/Icons";
import type { StageId } from "@/lib/types";

interface CopilotPanelProps {
  open: boolean;
  onClose: () => void;
  stage: StageId;
  contextData?: unknown;
}

export function CopilotPanel({ open, onClose }: CopilotPanelProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="overlay"
        style={{ background: "oklch(0.3 0.02 262 / 0.18)", backdropFilter: "none", paddingTop: 0 }}
        onMouseDown={onClose}
      />
      <aside className="copilot">
        <div className="copilot-head">
          <div className="copilot-mark"><Icon name="sparkles" size={17} /></div>
          <div style={{ flex: 1 }}>
            <div className="copilot-title">Product Owner Copilot</div>
            <div className="copilot-sub">Stage-aware AI assistant</div>
          </div>
          <button className="icon-btn" onClick={onClose}><Icon name="x" size={17} /></button>
        </div>

        <div className="copilot-thread scroll" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, textAlign: "center" }}>
          <Icon name="sparkles" size={28} />
          <div style={{ fontWeight: 600, fontSize: "1.05em" }}>Coming in a Future Version</div>
          <div style={{ opacity: 0.6, fontSize: "0.9em", lineHeight: 1.4 }}>
            Product Owner Copilot is under development and will be available in an upcoming release.
          </div>
        </div>

        <div className="copilot-foot">
          <div className="copilot-input">
            <input
              placeholder="Available in a future version…"
              disabled
            />
            <button className="copilot-send" disabled>
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
