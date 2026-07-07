"use client";
import { useState, useEffect } from "react";
import { Icon } from "@/components/Shared/Icons";
import { buildSignoffMarkdown } from "@/lib/markdown-builder";
import type { SignoffData, SignoffPerson, SignoffGroup, StageData } from "@/lib/types";

interface SignoffViewProps {
  data: SignoffData | null | undefined;
  onChange: (updater: ((prev: StageData) => StageData) | StageData) => void;
}

function getManilaTime(): string {
  return new Date().toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function SignoffGroup({
  title,
  group,
  type,
  onUpdate,
}: {
  title: string;
  group: SignoffGroup | undefined;
  type: "reviewer" | "approver";
  onUpdate: (g: SignoffGroup) => void;
}) {
  const g = group ?? { inCall: [], offline: [], callStartedAt: undefined };
  const allNames = [...(g.inCall ?? []), ...(g.offline ?? [])].map((p) => p.name);
  const duplicates = new Set<string>();
  allNames.forEach((n) => {
    if (allNames.filter((x) => x === n).length > 1) duplicates.add(n);
  });

  return (
    <div className="so-group">
      <div className="so-group-title">{title}</div>

      {/* In the call column */}
      <div>
        <div className="so-col-title">In the call</div>
        {(g.inCall ?? []).length > 0 && (
          <div className="so-call-time" style={{ marginBottom: 10 }}>
            <div className="so-live-dot" />
            <span>{g.callStartedAt || getManilaTime()}</span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(g.inCall ?? []).map((p, i) => (
            <div key={i} className="so-person-row">
              <input
                type="text"
                className="so-name-input"
                value={p.name}
                onChange={(e) => {
                  const updated = g.inCall.slice();
                  updated[i] = { ...updated[i], name: e.target.value };
                  onUpdate({ ...g, inCall: updated });
                }}
                placeholder="Name…"
              />
              <button
                className="row-del sm"
                onClick={() => {
                  onUpdate({ ...g, inCall: g.inCall.filter((_, j) => j !== i) });
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          {duplicates.size > 0 && (
            <div className="so-dup-warn">⚠ Duplicate name: {Array.from(duplicates).join(", ")}</div>
          )}
          <button
            className="row-add sm"
            onClick={() => {
              const callTime = g.callStartedAt || getManilaTime();
              onUpdate({
                ...g,
                callStartedAt: callTime,
                inCall: [...(g.inCall ?? []), { name: "", where: "in-call", signedAt: callTime }],
              });
            }}
          >
            <Icon name="plus" size={14} />
            Add {type} in call
          </button>
        </div>
      </div>

      {/* Offline column */}
      <div style={{ marginTop: 14 }}>
        <div className="so-col-title">Offline</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(g.offline ?? []).map((p, i) => (
            <div key={i} className="so-person-row">
              <input
                type="text"
                className="so-name-input"
                value={p.name}
                onChange={(e) => {
                  const updated = g.offline.slice();
                  updated[i] = { ...updated[i], name: e.target.value };
                  onUpdate({ ...g, offline: updated });
                }}
                placeholder="Name…"
              />
              <button
                className="row-del sm"
                onClick={() => {
                  onUpdate({ ...g, offline: g.offline.filter((_, j) => j !== i) });
                }}
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          ))}
          <button
            className="row-add sm"
            onClick={() => {
              onUpdate({
                ...g,
                offline: [...(g.offline ?? []), { name: "", where: "offline" }],
              });
            }}
          >
            <Icon name="plus" size={14} />
            Add offline {type}
          </button>
        </div>
      </div>
    </div>
  );
}

export function SignoffView({ data, onChange }: SignoffViewProps) {
  const d = data ?? { reviewers: { inCall: [], offline: [] }, approvers: { inCall: [], offline: [] } };
  const [liveTime, setLiveTime] = useState(getManilaTime());
  const [showPreview, setShowPreview] = useState(true);
  const previewMd = buildSignoffMarkdown(d);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(getManilaTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const allInCallTimes = [
    ...(d.reviewers?.inCall ?? []).map((p) => p.signedAt).filter((t) => t),
    ...(d.approvers?.inCall ?? []).map((p) => p.signedAt).filter((t) => t),
  ] as string[];

  const firstSignoff = allInCallTimes.length > 0 ? allInCallTimes.sort()[0] : null;
  const lastSignoff = allInCallTimes.length > 0 ? allInCallTimes.sort().reverse()[0] : null;
  const offlineCount =
    (d.reviewers?.offline?.length ?? 0) + (d.approvers?.offline?.length ?? 0);

  return (
    <div className="reveal">
      <div className="so-hero">
        {firstSignoff && (
          <div className="so-stamp">
            <div className="so-stamp-label">First sign-off</div>
            <div className="so-stamp-val">{firstSignoff}</div>
          </div>
        )}
        {lastSignoff && (
          <div className="so-stamp">
            <div className="so-stamp-label">Last sign-off</div>
            <div className="so-stamp-val">{lastSignoff}</div>
          </div>
        )}
        {offlineCount > 0 && (
          <div className="so-stamp">
            <div className="so-stamp-label">Offline signers</div>
            <div className="so-stamp-val">{offlineCount}</div>
          </div>
        )}
      </div>

      <div className="so-groups">
        <SignoffGroup
          title="Reviewers"
          group={d.reviewers}
          type="reviewer"
          onUpdate={(g) => {
            onChange({ ...d, reviewers: g });
          }}
        />
        <SignoffGroup
          title="Approvers"
          group={d.approvers}
          type="approver"
          onUpdate={(g) => {
            onChange({ ...d, approvers: g });
          }}
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <button className={`so-preview-toggle${showPreview ? " open" : ""}`} onClick={() => setShowPreview((v) => !v)}>
          <Icon name="markdown" size={14} />
          Preview in exported artifact
          <span className="chev"><Icon name="chevron-right" size={14} /></span>
        </button>
        {showPreview && (
          previewMd
            ? <div className="md-preview scroll" style={{ marginTop: 10 }}>{previewMd}</div>
            : <div className="so-preview-empty">Sign-off is empty — no Sign-off section will be added to the export.</div>
        )}
      </div>
    </div>
  );
}
