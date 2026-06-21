"use client";
import { useState, useEffect } from "react";
import { Icon } from "@/components/Shared/Icons";
import { JsonView } from "@/components/Shared/JsonView";
import { Meter } from "@/components/Shared/Meter";
import { Tooltip } from "@/components/Shared/Tooltip";
import type { StageMetadata } from "@/lib/stages";
import type { StageStatus, StageData, ReadinessData } from "@/lib/types";

interface InspectorProps {
  stage: StageMetadata;
  status: StageStatus;
  data: StageData;
  onRun: () => void;
}

function ReadinessSignals({ data }: { data: ReadinessData }) {
  const score = data.refinementScore ?? 70;
  const pts = data.estimate?.points ?? null;
  const deps = data.dependencies ?? { internal: [], external: [] };
  const depCount = (deps.internal?.length ?? 0) + (deps.external?.length ?? 0);
  const risk = data.risk ?? { level: "Medium" };
  const checks = [
    { label: "Testable acceptance criteria exist", pass: true },
    { label: "Small enough for one sprint", pass: pts == null || pts <= 13, note: pts != null && pts > 13 ? "Large estimate — consider splitting" : null },
    { label: "Dependencies identified", pass: depCount > 0, note: depCount === 0 ? "None surfaced yet" : null },
    { label: "Risks understood & owned", pass: risk.level !== "High", note: risk.level === "High" ? "High risk — assign an owner" : null },
  ];
  return (
    <div className="insp-block">
      <div className="insp-block-title"><div className="eyebrow">Sprint readiness</div></div>
      <Meter label="Refinement score" value={score} suffix=" / 100" tone={score >= 80 ? "green" : "amber"} />
      <div className="check-list" style={{ marginTop: 14 }}>
        {checks.map((c, i) => (
          <div key={i} className={`check ${c.pass ? "pass" : "fail"}`}>
            <span className="cico"><Icon name={c.pass ? "check-circle" : "x-circle"} size={15} /></span>
            <span>
              {c.label}
              {c.note && (
                <span style={{ display: "block", color: "var(--faint)", fontSize: 11.5, lineHeight: 1.4, marginTop: 2 }}>
                  {c.note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Inspector({ stage, status, data, onRun }: InspectorProps) {
  const [showJson, setShowJson] = useState(false);
  useEffect(() => { setShowJson(false); }, [stage.id]);

  const produced = status === "review" || status === "done";
  const isInbox = stage.kind === "inbox";
  const isExport = stage.kind === "export";
  const contract = produced && data ? data : null;
  const aiConf = produced && data ? (data as { confidence?: number; improvementTips?: string[] }) : null;

  const runLabel = status === "ready"
    ? (isInbox ? "Analyze requirement" : "Run skill")
    : produced ? "Re-run skill" : "Run skill";

  return (
    <div className="inspector">
      <div className="insp-head">
        <div className="eyebrow">{isInbox ? "Intake" : isExport ? "Output" : "Active skill"}</div>
      </div>
      <div className="insp-scroll scroll">
        <div className="skill-card">
          <div className="skill-top">
            <div className="skill-name">
              <Icon name={isExport ? "download" : isInbox ? "inbox" : "command"} size={14} />
              {stage.skillName}
            </div>
            <div className="skill-purpose">{stage.purpose}</div>
          </div>
          <div className="skill-io">
            <div className="io-row"><span className="io-tag in">IN</span><span className="io-desc">{stage.io.in}</span></div>
            <div className="io-row"><span className="io-tag out">OUT</span><span className="io-desc">{stage.io.out}</span></div>
          </div>
          {!isInbox && !isExport && (
            <>
              <button
                className={`json-toggle${showJson ? " open" : ""}`}
                onClick={() => setShowJson((v) => !v)}
              >
                <Icon name="code" size={13} />output contract (JSON)
                <span className="chev"><Icon name="chevron-right" size={13} /></span>
              </button>
              {showJson && <JsonView data={contract} />}
            </>
          )}
        </div>

        {!isExport && (
          <button
            className={`btn ${status === "ready" ? "primary" : ""} lg`}
            style={{ width: "100%", justifyContent: "center", marginTop: 14 }}
            onClick={onRun}
          >
            <Icon name={status === "ready" ? "play" : "settings"} size={14} />{runLabel}
          </button>
        )}

        {produced && aiConf?.confidence != null && (
          <div className="insp-block">
            <div className="insp-block-title"><div className="eyebrow">Extraction confidence<Tooltip text="How accurately the AI identified and extracted relevant content from your inputs for this stage." /></div></div>
            <Meter label="Model confidence" tooltip="The AI model's certainty about the quality of its output (0–100%). Scores ≥ 85% indicate high confidence (green); below 85% warrants closer review (amber)." value={aiConf.confidence} suffix="%" tone={aiConf.confidence >= 85 ? "green" : "amber"} />
            {aiConf.improvementTips?.length ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: aiConf.confidence >= 85 ? "var(--faint)" : "var(--amber)", marginBottom: 6 }}>
                  {aiConf.confidence >= 85 ? "To reach 100%:" : "To increase confidence:"}
                </div>
                <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "var(--muted)", lineHeight: 1.6 }}>
                  {aiConf.improvementTips.map((tip, i) => <li key={i}>{tip}</li>)}
                </ul>
                {status === "review" && (
                  <button
                    onClick={onRun}
                    style={{
                      marginTop: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      fontSize: 11.5,
                      color: "var(--accent)",
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  >
                    <Icon name="settings" size={12} />
                    Applied a tip? Re-run to recalculate
                  </button>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 8 }}>
                A skill output, not a decision. Review before confirming.
              </div>
            )}
          </div>
        )}

        {stage.kind === "readiness" && produced && data && (
          <ReadinessSignals data={data as ReadinessData} />
        )}

        {isExport && (
          <div className="insp-block">
            <div className="insp-block-title"><div className="eyebrow">Artifact</div></div>
            <div className="check-list">
              {["Business Need", "Requirement", "Epic", "Story", "Acceptance Criteria", "Refinement & Risk"].map((x) => (
                <div key={x} className="check pass">
                  <span className="cico"><Icon name="check-circle" size={15} /></span>{x}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--faint)", marginTop: 12 }}>
              Each section is structured data from a skill — ready to serialize.
            </div>
          </div>
        )}

        {isInbox && (
          <div className="insp-block">
            <div className="insp-block-title"><div className="eyebrow">Orchestration</div></div>
            <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6 }}>
              The workbench is the orchestrator. It runs each skill in order and passes{" "}
              <span className="mono" style={{ fontSize: 11.5, color: "var(--ink-2)" }}>
                structured JSON
              </span>{" "}
              between them — never free-form text. Skills never call each other.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
