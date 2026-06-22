"use client";
import { Icon } from "@/components/Shared/Icons";
import { STAGES } from "@/lib/stages";
import type { StageId, StageStatus } from "@/lib/types";

interface RailProps {
  current: StageId;
  status: Record<StageId, StageStatus>;
  doneCount: number;
  clarity: number;
  goTo: (id: StageId) => void;
  restart: () => void;
}

export function Rail({ current, status, doneCount, clarity, goTo, restart }: RailProps) {
  return (
    <nav className="rail">
      <div className="rail-head">
        <span className="eyebrow">Pipeline</span>
        <span className="prog-count">{doneCount} / {STAGES.length}</span>
      </div>
      <div className="rail-list scroll" style={{ flex: 1 }}>
        {STAGES.map((s, i) => {
          const st = status[s.id];
          const active = s.id === current;
          return (
            <div
              key={s.id}
              className={`stage${active ? " active" : ""}${st === "locked" ? " locked" : ""}`}
              role="button"
              tabIndex={st === "locked" ? -1 : 0}
              aria-current={active ? "step" : undefined}
              aria-disabled={st === "locked" || undefined}
              onClick={() => goTo(s.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  goTo(s.id);
                }
              }}
            >
              <div className="node-wrap">
                <div className={`node ${st}`}>
                  {st === "done" ? <Icon name="check" size={13} />
                    : st === "running" ? <span className="running-orb spin" style={{ width: 12, height: 12, borderWidth: 2 }} />
                    : st === "review" ? <Icon name="dot" size={9} />
                    : st === "locked" ? <Icon name="lock" size={11} />
                    : <span className="mono" style={{ fontSize: 10 }}>{i}</span>}
                </div>
                <div className={`connector${st === "done" ? " filled" : ""}`} />
              </div>
              <div className="stage-body">
                <div className="stage-name">{s.name}</div>
                {s.skill !== "—" && <div className="stage-skill">{s.skill}</div>}
                {st === "review" && (
                  <div className="stage-flag review">
                    <Icon name="dot" size={8} />needs confirm
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="rail-foot">
        <div className="amb-row">
          <span className="eyebrow">Clarity</span>
          <span className="prog-count">{clarity}%</span>
        </div>
        <div className="amb-track">
          <div className="amb-fill" style={{ width: clarity + "%" }} />
        </div>
        <div className="amb-cap">Ambiguity falls as each step is confirmed.</div>
        <button
          className="btn ghost sm"
          style={{ marginTop: 12, width: "100%", justifyContent: "center" }}
          onClick={restart}
        >
          <Icon name="arrow-left" size={12} />Restart pipeline
        </button>
      </div>
    </nav>
  );
}
