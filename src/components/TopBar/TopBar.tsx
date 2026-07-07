"use client";
import { Icon } from "@/components/Shared/Icons";
import { DebugPanel } from "./DebugPanel";

interface TopBarProps {
  epicTitle: string;
  elapsedStr: string;
  live: boolean;
  onToggleLive: () => void;
  onCommand: () => void;
  onCopilot: () => void;
  onExport: () => void;
  exportReachable: boolean;
  onSave: () => void;
  onLoad: () => void;
}

export function TopBar({ epicTitle, elapsedStr, live, onToggleLive, onCommand, onCopilot, onExport, exportReachable, onSave, onLoad }: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-mark"><Icon name="layers" size={16} /></span>
          <span className="brand-name">PO Workbench</span>
        </div>
        {epicTitle && (
          <div className="crumb">
            <span className="crumb-sep">/</span>
            <span className="crumb-text">{epicTitle}</span>
          </div>
        )}
      </div>

      <div className="topbar-right">
        <div className="timer-chip">
          <Icon name="clock" size={13} />
          <span className="mono" style={{ fontSize: 12 }}>{elapsedStr}</span>
        </div>

        <div className="session-group" title="Save or load a session file">
          <button className="btn sm session-save" onClick={onSave} title="Save session as JSON — choose where to save">
            <Icon name="save" size={14} />Save
          </button>
          <span className="session-sep" />
          <button className="btn ghost sm" onClick={onLoad} title="Load a previously saved session JSON">
            <Icon name="upload" size={14} />Load
          </button>
        </div>

        <button className="btn ghost sm" onClick={onCommand} title="Command palette (⌘K)">
          <Icon name="command" size={14} />Commands
          <span className="kbd" style={{ fontSize: 10, padding: "1px 5px" }}>⌘K</span>
        </button>

        <button
          className={`btn ghost sm live-toggle${live ? " live" : ""}`}
          onClick={onToggleLive}
          title={live ? "Disable live AI (use mocks)" : "Enable live AI (Anthropic Claude)"}
        >
          <span className={`live-dot${live ? " on" : ""}`} />
          {live ? "Live AI" : "Mock mode"}
        </button>

        <button className="btn ghost sm" onClick={onCopilot} title="Open Copilot">
          <Icon name="sparkles" size={14} />Copilot
        </button>

        <DebugPanel />

        <button
          className={`btn${exportReachable ? " primary" : " ghost"} sm`}
          onClick={onExport}
          disabled={!exportReachable}
          title={exportReachable ? "Export artifact" : "Complete the pipeline to export"}
        >
          <Icon name="download" size={14} />Export
        </button>
      </div>
    </header>
  );
}
