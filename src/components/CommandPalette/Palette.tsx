"use client";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/Shared/Icons";
import { STAGES } from "@/lib/stages";
import type { StageId } from "@/lib/types";

const COMMANDS = [
  { cmd: "/clarify", desc: "Generate clarifying questions", stage: "discovery" as StageId, icon: "help" },
  { cmd: "/discover", desc: "Run discovery on the requirement", stage: "discovery" as StageId, icon: "search" },
  { cmd: "/create-epic", desc: "Generate an epic", stage: "epic" as StageId, icon: "layers" },
  { cmd: "/create-story", desc: "Generate user stories", stage: "user-story" as StageId, icon: "story" },
  { cmd: "/create-ac", desc: "Generate acceptance criteria", stage: "acceptance-criteria" as StageId, icon: "check" },
  { cmd: "/check-refinement", desc: "Score backlog refinement", stage: "readiness" as StageId, icon: "gauge" },
  { cmd: "/check-sprint", desc: "Check sprint readiness", stage: "readiness" as StageId, icon: "rocket" },
];

interface PaletteProps {
  open: boolean;
  onClose: () => void;
  onJump: (id: StageId) => void;
  onRunCmd: (item: { cmd: string; stage: StageId; desc: string }) => void;
}

export function Palette({ open, onClose, onJump, onRunCmd }: PaletteProps) {
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  if (!open) return null;

  const ql = q.toLowerCase().replace(/^\//, "");
  const cmds = COMMANDS.filter((c) => c.cmd.includes(ql) || c.desc.toLowerCase().includes(ql));
  const navs = STAGES.filter((s) => s.name.toLowerCase().includes(ql));
  const flat = [
    ...cmds.map((c) => ({ type: "cmd" as const, ...c })),
    ...navs.map((s) => ({ type: "nav" as const, stage: s })),
  ];

  const choose = (item: (typeof flat)[number]) => {
    if (!item) return;
    if (item.type === "cmd") onRunCmd(item);
    else onJump(item.stage.id);
    onClose();
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); choose(flat[active]); }
    else if (e.key === "Escape") onClose();
  };

  let idx = -1;
  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-input-wrap">
          <Icon name="command" size={17} style={{ color: "var(--muted)" }} />
          <input
            ref={inputRef}
            className="palette-input"
            placeholder="Run a command or jump to a stage…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={onKey}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list scroll">
          {cmds.length > 0 && <div className="palette-group">Commands · post-v1</div>}
          {cmds.map((c) => {
            idx++;
            const a = idx;
            return (
              <div
                key={c.cmd}
                className={`palette-item${active === a ? " active" : ""}`}
                onMouseEnter={() => setActive(a)}
                onClick={() => choose({ type: "cmd", ...c })}
              >
                <span className="pi-ico"><Icon name={c.icon} size={16} /></span>
                <span className="palette-cmd">{c.cmd}</span>
                <span className="palette-desc">{c.desc}</span>
                <span className="palette-tag"><span className="preview-ribbon">preview</span></span>
              </div>
            );
          })}
          {navs.length > 0 && <div className="palette-group">Go to stage</div>}
          {navs.map((s) => {
            idx++;
            const a = idx;
            return (
              <div
                key={s.id}
                className={`palette-item${active === a ? " active" : ""}`}
                onMouseEnter={() => setActive(a)}
                onClick={() => choose({ type: "nav", stage: s })}
              >
                <span className="pi-ico"><Icon name="arrow-right" size={16} /></span>
                <span className="palette-name">{s.name}</span>
                <span className="palette-desc mono" style={{ fontSize: 11 }}>
                  {s.skill !== "—" ? s.skill : ""}
                </span>
              </div>
            );
          })}
          {flat.length === 0 && (
            <div style={{ padding: "24px 14px", textAlign: "center", color: "var(--faint)", fontSize: 13 }}>
              No matches
            </div>
          )}
        </div>
        <div className="palette-foot">
          <span className="k"><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span className="k"><span className="kbd">↵</span> select</span>
          <span className="k" style={{ marginLeft: "auto" }}>Commands chain skills — never modify them</span>
        </div>
      </div>
    </div>
  );
}
