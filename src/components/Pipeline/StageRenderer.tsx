"use client";
import { useState, useEffect, useRef } from "react";
import { Icon } from "@/components/Shared/Icons";
import { Badge } from "@/components/Shared/Badge";
import { SecLabel } from "@/components/Shared/SecLabel";
import { getExplanation } from "@/lib/glossary";
import { buildMarkdown } from "@/lib/markdown-builder";
import { SignoffView } from "./SignoffView";
import { InboxView } from "./InboxView";
import { EXPORT_TARGETS } from "@/lib/stages";
import { SOURCES } from "@/lib/mocks";
import { RUN_STEPS } from "@/utils/constants";
import type { StageMetadata } from "@/lib/stages";
import type {
  StageStatus,
  StageData,
  StageId,
  InboxData,
  BusinessNeedData,
  RequirementData,
  DiscoveryData,
  EpicData,
  UserStoryData,
  AcData,
  ReadinessData,
  SignoffData,
  WorkbenchState,
  Story,
} from "@/lib/types";

// ── helpers ───────────────────────────────────────────────────────────────────

function AutoTextarea({ value, onChange, onBlur, className = "", placeholder = "", mono = false }: {
  value: string; onChange: (v: string) => void; onBlur?: () => void; className?: string; placeholder?: string; mono?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const resize = () => { const el = ref.current; if (el) { el.style.height = "auto"; el.style.height = el.scrollHeight + "px"; } };
  useEffect(() => { resize(); }, [value]);
  return (
    <textarea
      ref={ref} rows={1}
      className={`edit-ta${mono ? " mono" : ""}${className ? " " + className : ""}`}
      placeholder={placeholder} value={value || ""}
      onChange={(e) => onChange(e.target.value)} onInput={resize} onBlur={onBlur}
    />
  );
}

function ListEditor({ items, setItems, addLabel = "Add item", qStyle = false, placeholder = "Describe…" }: {
  items: string[]; setItems: (a: string[]) => void; addLabel?: string; qStyle?: boolean; placeholder?: string;
}) {
  return (
    <div className="items">
      {items.map((t, i) => ({ t, i })).map(({ t, i }) => (
        <div key={i} className={`edit-row${qStyle ? " q" : ""}`}>
          <span className="dot" />
          <AutoTextarea value={t} placeholder={placeholder} onChange={(v) => { const a = items.slice(); a[i] = v; setItems(a); }} />
          <button className="row-del" title="Delete" onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="trash" size={14} /></button>
        </div>
      ))}
      <button className="row-add" onClick={() => setItems([...items, ""])}><Icon name="plus" size={14} />{addLabel}</button>
    </div>
  );
}

function ChipsEditor({ items, setItems, icon, addLabel = "Add" }: {
  items: string[]; setItems: (a: string[]) => void; icon?: string; addLabel?: string;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const focusIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (focusIndexRef.current !== null) {
      const idx = focusIndexRef.current;
      focusIndexRef.current = null;
      setTimeout(() => inputRefs.current[idx]?.focus(), 30);
    }
  });

  return (
    <div className="chips">
      {items.map((t, i) => ({ t, i })).map(({ t, i }) => (
        <span key={i} className="chip edit">
          {icon && <span className="ico"><Icon name={icon} size={12} /></span>}
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            className={`chip-input${t.trim() ? "" : " empty"}`}
            value={t}
            placeholder="Name or role…"
            style={{ width: Math.max((t || "").length, t.trim() ? 3 : 13) + "ch" }}
            onChange={(e) => { const a = items.slice(); a[i] = e.target.value; setItems(a); }}
          />
          <button className="chip-del" title="Remove" onClick={() => setItems(items.filter((_, j) => j !== i))}><Icon name="x" size={11} /></button>
        </span>
      ))}
      <button className="chip-add" onClick={() => { focusIndexRef.current = items.length; setItems([...items, ""]); }}><Icon name="plus" size={12} />{addLabel}</button>
    </div>
  );
}

function HelpBtn({ open, setOpen }: { open: boolean; setOpen: (fn: (o: boolean) => boolean) => void }) {
  return (
    <button type="button" className={`help-btn${open ? " open" : ""}`} aria-expanded={open} aria-label={open ? "Hide explanation" : "What does this mean?"} title="What does this mean?" onClick={() => setOpen((o) => !o)}>?</button>
  );
}

function ExplainBox({ text }: { text: string }) {
  return <div className="explain"><span className="explain-ico"><Icon name="bulb" size={12} /></span><span>{text}</span></div>;
}

function HelpRow({ text, qStyle, delay }: { text: string; qStyle?: boolean; delay?: string }) {
  const ex = getExplanation(text);
  const [open, setOpen] = useState(false);
  return (
    <div className="item-wrap">
      <div className={`item${qStyle ? " q" : ""}`} style={delay ? { animationDelay: delay } : undefined}>
        <span className="dot" /><span className="item-body">{text}</span>
        {ex && <HelpBtn open={open} setOpen={setOpen} />}
      </div>
      {ex && open && <ExplainBox text={ex} />}
    </div>
  );
}

function ItemList({ items, qStyle }: { items: string[]; qStyle?: boolean }) {
  return (
    <div className="items">
      {items.filter(t => t.trim()).map((t, i) => <HelpRow key={i} text={t} qStyle={qStyle} delay={(i * 45) + "ms"} />)}
    </div>
  );
}

function HelpChips({ items, icon }: { items: string[]; icon?: string }) {
  const [openIdx, setOpenIdx] = useState(-1);
  const filtered = items.filter(t => t.trim());
  const openText = openIdx >= 0 && openIdx < filtered.length ? filtered[openIdx] : null;
  const openEx = openText ? getExplanation(openText) : null;
  return (
    <div>
      <div className="chips">
        {filtered.map((t, i) => {
          const ex = getExplanation(t);
          return (
            <span key={i} className={`chip${openIdx === i ? " active" : ""}`}>
              {icon && <span className="ico"><Icon name={icon} size={12} /></span>}
              {t}
              {ex && <button type="button" className={`chip-help${openIdx === i ? " open" : ""}`} aria-label="What does this mean?" title="What does this mean?" onClick={() => setOpenIdx((o) => o === i ? -1 : i)}>?</button>}
            </span>
          );
        })}
      </div>
      {openEx && <ExplainBox text={openEx} />}
    </div>
  );
}

function RunningView({ stage, live }: { stage: StageMetadata; live: boolean }) {
  const steps = RUN_STEPS[stage.id] || ["Running skill"];
  const [activeStep, setActiveStep] = useState(0);
  const runKey = `${stage.id}:${steps.length}`;
  const [prevRunKey, setPrevRunKey] = useState(runKey);
  // restart the step animation whenever the stage (or its step list) changes
  if (runKey !== prevRunKey) {
    setPrevRunKey(runKey);
    setActiveStep(0);
  }
  useEffect(() => {
    const t = setInterval(() => setActiveStep((a) => Math.min(a + 1, steps.length)), 460);
    return () => clearInterval(t);
  }, [stage.id, steps.length]);
  return (
    <div className="running-wrap reveal">
      <div className="running-orb spin" />
      <div className="running-skill mono">{stage.skillName}</div>
      <div className="running-title">{live ? "Analyzing with Claude…" : "Running skill…"}</div>
      <div className="running-steps">
        {steps.map((s, i) => (
          <div key={i} className={`running-step${i <= activeStep ? " on" : ""}`}>
            {i < activeStep
              ? <span style={{ color: "var(--accent)" }}><Icon name="check-circle" size={15} /></span>
              : i === activeStep
                ? <span className="running-orb spin" style={{ width: 14, height: 14, borderWidth: 2 }} />
                : <span style={{ width: 15, height: 15, borderRadius: "50%", border: "1.5px solid var(--border-strong)", display: "inline-block" }} />}
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── features list ──────────────────────────────────────────────────────────────

function FeaturesList({ items, editing, onReorder, onChange, onAdd, onDelete, addLabel }: {
  items: string[]; editing: boolean;
  onReorder: (fn: (items: string[]) => string[]) => void;
  onChange: (i: number, value: string) => void;
  onAdd: () => void; onDelete: (i: number) => void;
  addLabel?: string;
}) {
  const [dragIdx, setDragIdx] = useState(-1);
  const [overIdx, setOverIdx] = useState(-1);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    onReorder((prev) => {
      const a = [...prev];
      const [it] = a.splice(from, 1);
      a.splice(to, 0, it);
      return a;
    });
  };

  const filtered = editing
    ? items.map((item, i) => ({ item, i }))
    : items.map((item, i) => ({ item, i })).filter(({ item }) => item.trim());

  return (
    <div className="features-list">
      {filtered.map(({ item, i }) => (
        <div
          key={i}
          className={`feature-item${dragIdx === i ? " dragging" : ""}${overIdx === i && dragIdx !== i && dragIdx >= 0 ? " dropring" : ""}`}
          draggable={!editing}
          onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIdx !== i) setOverIdx(i); }}
          onDragLeave={() => setOverIdx((o) => (o === i ? -1 : o))}
          onDrop={(e) => { e.preventDefault(); if (dragIdx >= 0) move(dragIdx, i); setDragIdx(-1); setOverIdx(-1); }}
          onDragEnd={() => { setDragIdx(-1); setOverIdx(-1); }}
        >
          {!editing && <span className="feature-grip" title="Drag to reorder"><Icon name="grip" size={16} /></span>}
          {editing
            ? <AutoTextarea className="feature-body" value={item} placeholder="Describe a sub-feature…" onChange={(v) => onChange(i, v)} onBlur={() => { if (!item.trim()) onDelete(i); }} />
            : <div className="feature-body">{item}</div>}

          <div className="feature-moves">
            <button className="move-btn" disabled={i === 0} title="Move up" aria-label="Move up" onClick={() => move(i, i - 1)}><Icon name="arrow-up" size={16} /></button>
            <button className="move-btn" disabled={i === items.length - 1} title="Move down" aria-label="Move down" onClick={() => move(i, i + 1)}><Icon name="arrow-down" size={16} /></button>
            <span className="feature-moves-sep" />
            <button className="move-btn del" title="Delete feature" onClick={() => onDelete(i)}><Icon name="trash" size={14} /></button>
          </div>
        </div>
      ))}
      {editing && (
        <button className="feature-add-btn" onClick={onAdd}>
          <Icon name="plus" size={14} />{addLabel ?? "Add sub-feature"}
        </button>
      )}
    </div>
  );
}

// ── story board ───────────────────────────────────────────────────────────────

function StoryBoard({ stories, editing, onReorder, onContent, onAdd, onDelete }: {
  stories: Story[]; editing: boolean;
  onReorder: (fn: (d: UserStoryData) => UserStoryData) => void;
  onContent: (fn: (d: UserStoryData) => UserStoryData) => void;
  onAdd: () => void; onDelete: (i: number) => void;
}) {
  const [dragIdx, setDragIdx] = useState(-1);
  const [overIdx, setOverIdx] = useState(-1);
  const [editIdx, setEditIdx] = useState(-1);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= stories.length || from === to) return;
    onReorder((o) => { const a = [...o.stories]; const [it] = a.splice(from, 1); a.splice(to, 0, it); return { stories: a }; });
  };

  return (
    <div className="storyboard">
      {stories.map((s, i) => {
        const rowEditing = editing || editIdx === i;
        const isEmpty = !s.as && !s.want && !s.so;
        return (
          <div
            key={i}
            className={`story-item${dragIdx === i ? " dragging" : ""}${overIdx === i && dragIdx !== i && dragIdx >= 0 ? " dropring" : ""}${rowEditing ? " editing" : ""}`}
            draggable={!rowEditing}
            onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = "move"; }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (overIdx !== i) setOverIdx(i); }}
            onDragLeave={() => setOverIdx((o) => (o === i ? -1 : o))}
            onDrop={(e) => { e.preventDefault(); if (dragIdx >= 0) move(dragIdx, i); setDragIdx(-1); setOverIdx(-1); }}
            onDragEnd={() => { setDragIdx(-1); setOverIdx(-1); }}
          >
            <div className="story-head">
              {!rowEditing && <span className="story-grip" title="Drag to reorder"><Icon name="grip" size={16} /></span>}
              <span className="story-pri">P{i + 1}</span>
              <div className="story-moves">
                <button className="move-btn" disabled={i === 0} title="Move up" aria-label="Move up" onClick={() => move(i, i - 1)}><Icon name="arrow-up" size={16} /></button>
                <button className="move-btn" disabled={i === stories.length - 1} title="Move down" aria-label="Move down" onClick={() => move(i, i + 1)}><Icon name="arrow-down" size={16} /></button>
                <span className="story-moves-sep" />
                {!editing && <button className={`move-btn${editIdx === i ? " active" : ""}`} onClick={() => setEditIdx((o) => (o === i ? -1 : i))}><Icon name={editIdx === i ? "check" : "pencil"} size={14} /></button>}
                <button className="move-btn del" title="Delete story" onClick={() => onDelete(i)}><Icon name="trash" size={14} /></button>
              </div>
            </div>
            <div className="story-body">
              {rowEditing ? (
                <div className="story-edit">
                  <div className="story-edit-row"><span className="story-kw">As a</span><AutoTextarea value={s.as} onChange={(v) => onContent((o) => { const st = [...o.stories]; st[i] = { ...st[i], as: v }; return { stories: st }; })} placeholder="user role…" /></div>
                  <div className="story-edit-row"><span className="story-kw">I want</span><AutoTextarea value={s.want} onChange={(v) => onContent((o) => { const st = [...o.stories]; st[i] = { ...st[i], want: v }; return { stories: st }; })} placeholder="capability…" /></div>
                  <div className="story-edit-row"><span className="story-kw">So that</span><AutoTextarea value={s.so} onChange={(v) => onContent((o) => { const st = [...o.stories]; st[i] = { ...st[i], so: v }; return { stories: st }; })} placeholder="benefit…" /></div>
                </div>
              ) : isEmpty ? (
                <div className="story-empty">Empty story — use the pencil to fill in As-a / I-want / So-that.</div>
              ) : (
                <>
                  <div className="story-line"><span className="story-kw">As a</span> {s.as}</div>
                  <div className="story-line"><span className="story-kw">I want</span> {s.want}</div>
                  <div className="story-line"><span className="story-kw">So that</span> {s.so}</div>
                </>
              )}
            </div>
          </div>
        );
      })}
      <button className="row-add" onClick={onAdd}><Icon name="plus" size={14} />Add story</button>
    </div>
  );
}

// ── main stage renderer ───────────────────────────────────────────────────────

interface StageRendererProps {
  stage: StageMetadata;
  status: StageStatus;
  data: StageData;
  editing: boolean;
  live: boolean;
  allData: WorkbenchState["data"];
  onChange: (updater: ((prev: StageData) => StageData) | StageData) => void;
  onReorder: (updater: ((prev: StageData) => StageData) | StageData) => void;
  sourceId: string;
  setSourceId: (id: string) => void;
  answers: Record<string, string>;
  setAnswer: (qid: string, val: string) => void;
  elapsedStr: string;
  onExport: (target: { id: string; name: string }) => void;
}

export function StageRenderer(props: StageRendererProps) {
  const { stage, status, data, editing, live, allData, onChange, onReorder, sourceId, setSourceId, answers, setAnswer, elapsedStr, onExport } = props;

  if (status === "locked") {
    return (
      <div className="locked-wrap">
        <div className="locked-ico"><Icon name="lock" size={20} /></div>
        <div style={{ fontWeight: 600, color: "var(--ink-2)" }}>{stage.name} is locked</div>
        <div style={{ maxWidth: 320 }}>
          Confirm the previous step to run <span className="mono" style={{ fontSize: 12 }}>{stage.skillName}</span> and unlock this stage.
        </div>
      </div>
    );
  }
  if (status === "running") return <RunningView stage={stage} live={live} />;

  const d = data ?? {};
  const mutate = (fn: (o: Record<string, unknown>) => void) => {
    onChange((prev) => {
      const n = JSON.parse(JSON.stringify(prev ?? {}));
      fn(n);
      return n;
    });
  };
  const reorderMutate = (fn: (o: Record<string, unknown>) => void) => {
    onReorder((prev) => {
      const n = JSON.parse(JSON.stringify(prev ?? {}));
      fn(n);
      return n;
    });
  };
  const setField = (key: string, val: unknown) => {
    onChange((prev) => ({ ...(prev as object), [key]: val } as StageData));
  };

  switch (stage.kind) {
    /* ── INBOX ── */
    case "inbox":
      return (
        <InboxView
          data={d as InboxData}
          onChange={(updater: (prev: InboxData) => InboxData) => onChange((prev: StageData) => updater(prev as InboxData) as StageData)}
          sourceId={sourceId}
          setSourceId={setSourceId}
          liveAiEnabled={live}
        />
      );

    /* ── BUSINESS NEED ── */
    case "need": {
      const nd = d as BusinessNeedData;
      return (
        <div className="stack reveal">
          <div>
            <SecLabel icon="flag">Business problem</SecLabel>
            {editing
              ? <div className="card pad edit-card"><AutoTextarea value={nd.businessProblem} onChange={(v) => setField("businessProblem", v)} placeholder="State the underlying business problem…" /></div>
              : <div className="card pad" style={{ fontSize: 15, lineHeight: 1.6, color: "var(--ink)" }}>{nd.businessProblem}</div>}
          </div>
          <div>
            <SecLabel icon="target" count={(nd.outcomes ?? []).filter(o => o.trim()).length}>Desired outcomes</SecLabel>
            {editing
              ? <ListEditor items={nd.outcomes ?? []} setItems={(a) => setField("outcomes", a)} addLabel="Add outcome" placeholder="Describe a desired outcome…" />
              : <ItemList items={nd.outcomes ?? []} />}
          </div>
        </div>
      );
    }

    /* ── REQUIREMENT ANALYSIS ── */
    case "requirement": {
      const rd = d as RequirementData;
      return (
        <div className="stack reveal">
          <div><SecLabel icon="users" count={(rd.users ?? []).filter(u => u.trim()).length}>Users</SecLabel>{editing ? <ChipsEditor items={rd.users ?? []} setItems={(a) => setField("users", a)} icon="users" addLabel="Add user" /> : <HelpChips items={rd.users ?? []} icon="users" />}</div>
          <div><SecLabel icon="target" count={(rd.goals ?? []).length}>Goals</SecLabel>{editing ? <ListEditor items={rd.goals ?? []} setItems={(a) => setField("goals", a)} addLabel="Add goal" /> : <ItemList items={rd.goals ?? []} />}</div>
          <div><SecLabel icon="bulb" count={(rd.assumptions ?? []).length}>Assumptions</SecLabel>{editing ? <ListEditor items={rd.assumptions ?? []} setItems={(a) => setField("assumptions", a)} addLabel="Add assumption" /> : <ItemList items={rd.assumptions ?? []} />}</div>
          <div><SecLabel icon="shield" count={(rd.constraints ?? []).length}>Constraints</SecLabel>{editing ? <ListEditor items={rd.constraints ?? []} setItems={(a) => setField("constraints", a)} addLabel="Add constraint" /> : <ItemList items={rd.constraints ?? []} />}</div>
          <div>
            <SecLabel icon="help" count={(rd.openQuestions ?? []).length}>Open questions</SecLabel>
            {editing
              ? <ListEditor items={rd.openQuestions ?? []} setItems={(a) => setField("openQuestions", a)} addLabel="Add open question" qStyle />
              : <>
                  <ItemList items={rd.openQuestions ?? []} qStyle />
                  <div className="hint-row"><Icon name="compass" size={13} /><span>You don&apos;t answer these here. The <strong>Discovery</strong> step turns each open question into a clarifying question you&apos;ll answer — and the pipeline can&apos;t continue until they&apos;re all answered.</span></div>
                </>}
          </div>
        </div>
      );
    }

    /* ── DISCOVERY ── */
    case "discovery": {
      const dd = d as DiscoveryData;
      const dq = dd.questions ?? [];
      const answered = dq.filter((q) => answers[q.id]).length;
      return (
        <div className="reveal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <SecLabel icon="compass" count={dq.length}>Clarifying questions</SecLabel>
            {!editing && <span className="badge accent">{answered} / {dq.length} answered</span>}
          </div>
          {!editing && <div className="hint-row" style={{ marginTop: 0, marginBottom: 16 }}><Icon name="bulb" size={13} /><span>These resolve the open questions raised in <strong>Requirement Analysis</strong>, plus edge cases the skill surfaced. Answer each one — you can&apos;t confirm this step until all are answered.</span></div>}
          <div className="stack">
            {dq.map((q, i) => (
              <div key={q.id} className="card q-card">
                {editing ? (
                  <div className="q-edit">
                    <div className="q-edit-head">
                      <span className="q-num">Q{i + 1}</span>
                      <AutoTextarea value={q.q} onChange={(v) => mutate((o) => { (o as unknown as DiscoveryData).questions[i].q = v; })} placeholder="Clarifying question…" />
                      <button className="row-del" onClick={() => mutate((o) => { (o as unknown as DiscoveryData).questions.splice(i, 1); })}><Icon name="trash" size={14} /></button>
                    </div>
                  </div>
                ) : (
                  <>
                    {q.origin && <div className="q-prov">{q.origin === "edge" ? <Badge variant="neutral" icon="bulb">Edge case surfaced by the skill</Badge> : <Badge variant="info" icon="compass">Resolves an open question</Badge>}</div>}
                    <div className="q-text"><span className="q-num">Q{i + 1}</span><span>{q.q}</span></div>
                    {q.why && (
                      <div className="q-why">{q.why}</div>
                    )}
                    {(q.examples ?? []).length > 0 && (
                      <div className="q-opts" style={{ marginBottom: 10 }}>
                        <span className="q-examples-label" style={{ alignSelf: "center" }}>e.g.</span>
                        {(q.examples ?? []).map((opt, j) => {
                          const val = answers[q.id] ?? "";
                          const filled = val.trim().length > 0;
                          return (
                            <button
                              key={j}
                              className={`q-opt${val === opt ? " sel" : ""}`}
                              disabled={filled && val !== opt}
                              onClick={() => !filled && setAnswer(q.id, opt)}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="q-answer-wrap">
                      <AutoTextarea value={answers[q.id] ?? ""} onChange={(v) => setAnswer(q.id, v)} placeholder="Type your answer…" />
                    </div>
                  </>
                )}
              </div>
            ))}
            {editing && (
              <button className="row-add" onClick={() => mutate((o) => { (o as unknown as DiscoveryData).questions.push({ id: "q" + Date.now(), q: "", opts: [], origin: "open" }); })}>
                <Icon name="plus" size={14} />Add question
              </button>
            )}
          </div>
        </div>
      );
    }

    /* ── SIGN-OFF ── */
    case "signoff":
      return <SignoffView data={d as SignoffData} onChange={onChange} />;

    /* ── EPIC ── */
    case "epic": {
      const ed = d as EpicData;
      return (
        <div className="stack reveal">
          <div className="card pad">
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}><Badge variant="accent" icon="layers">Epic</Badge></div>
            {editing ? (
              <div className="stack-sm">
                <AutoTextarea className="epic-title-input" value={ed.title} onChange={(v) => setField("title", v)} placeholder="Epic title…" />
                <AutoTextarea value={ed.description} onChange={(v) => setField("description", v)} placeholder="Epic description…" />
              </div>
            ) : (
              <>
                <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 8 }}>{ed.title}</div>
                <div style={{ color: "var(--ink-2)", lineHeight: 1.6 }}>{ed.description}</div>
              </>
            )}
          </div>
          <div>
            <SecLabel icon="list" count={(ed.subFeatures ?? []).length}>Sub-features</SecLabel>
            {!editing && <div className="hint-row" style={{ marginTop: 0 }}><Icon name="grip" size={13} /><span>Drag an item — or use ↑ ↓ — to set priority.</span></div>}
            <FeaturesList
              items={ed.subFeatures ?? []}
              editing={editing}
              onReorder={(fn) => setField("subFeatures", fn(ed.subFeatures ?? []))}
              onChange={(i, v) => { const a = [...(ed.subFeatures ?? [])]; a[i] = v; setField("subFeatures", a); }}
              onAdd={() => setField("subFeatures", [...(ed.subFeatures ?? []), ""])}
              onDelete={(i) => setField("subFeatures", (ed.subFeatures ?? []).filter((_, j) => j !== i))}
            />
          </div>
        </div>
      );
    }

    /* ── USER STORY ── */
    case "story": {
      const sd = d as UserStoryData;
      return (
        <div className="stack reveal">
          <SecLabel icon="story" count={(sd.stories ?? []).length}>User stories</SecLabel>
          {!editing && <div className="hint-row" style={{ marginTop: 0 }}><Icon name="grip" size={13} /><span>Drag a card — or use ↑ ↓ — to rank by priority (<strong>P1</strong> is highest).</span></div>}
          <StoryBoard
            stories={sd.stories ?? []}
            editing={editing}
            onReorder={(fn) => onReorder((prev) => fn(prev as UserStoryData))}
            onContent={(fn) => onChange((prev) => fn(prev as UserStoryData))}
            onAdd={() => onChange((prev) => { const p = prev as UserStoryData; return { stories: [...(p.stories ?? []), { as: "", want: "", so: "" }] }; })}
            onDelete={(i) => onChange((prev) => { const p = prev as UserStoryData; return { stories: (p.stories ?? []).filter((_, j) => j !== i) }; })}
          />
        </div>
      );
    }

    /* ── ACCEPTANCE CRITERIA ── */
    case "ac": {
      const acd = d as AcData;
      const rows = acd.rows ?? [];
      return (
        <div className="reveal">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <SecLabel icon="check" count={rows.length}>Acceptance criteria by story</SecLabel>
          </div>
          <div className="ac-table-wrap scroll">
            <table className="ac-table">
              <thead>
                <tr>
                  <th className="ac-col-story">User story</th>
                  <th className="ac-col-norm"><span className="ac-h ok"><Icon name="check-circle" size={13} />Normal case</span></th>
                  <th className="ac-col-edge"><span className="ac-h edge"><Icon name="alert" size={13} />Abnormal case</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div className="ac-story-head"><span className="story-pri">P{i + 1}</span></div>
                      <div className="ac-story-body">
                        <div className="story-line"><span className="story-kw">As a</span> {row.story.as}</div>
                        <div className="story-line"><span className="story-kw">I want</span> {row.story.want}</div>
                        <div className="story-line"><span className="story-kw">So that</span> {row.story.so}</div>
                      </div>
                    </td>
                    <td>
                      {editing ? (
                        <div className="crit-edit">
                          {row.normal.map((c, j) => (
                            <div key={j} className="crit-row">
                              <AutoTextarea value={c} onChange={(v) => mutate((o) => { (o as unknown as AcData).rows[i].normal[j] = v; })} placeholder="Given … when … then …" />
                              <button className="row-del sm" onClick={() => mutate((o) => { (o as unknown as AcData).rows[i].normal.splice(j, 1); })}><Icon name="x" size={12} /></button>
                            </div>
                          ))}
                          <button className="row-add sm" onClick={() => mutate((o) => { (o as unknown as AcData).rows[i].normal.push(""); })}><Icon name="plus" size={12} />Add normal criterion</button>
                        </div>
                      ) : row.normal.length ? (
                        <ul className="ac-list ok">{row.normal.map((c, j) => <li key={j}>{c}</li>)}</ul>
                      ) : <span className="ac-empty">—</span>}
                    </td>
                    <td>
                      {editing ? (
                        <div className="crit-edit">
                          {row.abnormal.map((c, j) => (
                            <div key={j} className="crit-row">
                              <AutoTextarea value={c} onChange={(v) => mutate((o) => { (o as unknown as AcData).rows[i].abnormal[j] = v; })} placeholder="Given … when … then …" />
                              <button className="row-del sm" onClick={() => mutate((o) => { (o as unknown as AcData).rows[i].abnormal.splice(j, 1); })}><Icon name="x" size={12} /></button>
                            </div>
                          ))}
                          <button className="row-add sm" onClick={() => mutate((o) => { (o as unknown as AcData).rows[i].abnormal.push(""); })}><Icon name="plus" size={12} />Add abnormal criterion</button>
                        </div>
                      ) : row.abnormal.length ? (
                        <ul className="ac-list edge">{row.abnormal.map((c, j) => <li key={j}>{c}</li>)}</ul>
                      ) : <span className="ac-empty">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!editing && <div className="hint-row"><Icon name="bulb" size={13} /><span>One row per user story. <strong>Normal</strong> is the happy path; <strong>abnormal</strong> covers edge cases. Use <strong>Edit</strong> to add or change criteria.</span></div>}
        </div>
      );
    }

    /* ── READINESS ── */
    case "readiness": {
      const rd = d as ReadinessData;
      const riskVariant = rd.risk?.level === "High" ? "risk-high" : rd.risk?.level === "Low" ? "risk-low" : "risk-med";
      const clampNum = (v: string, min: number, max: number) => {
        let n = parseInt(v, 10); if (isNaN(n)) n = min; return Math.max(min, Math.min(max, n));
      };
      return (
        <div className="stack reveal">
          <div className="signal-grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="signal">
              <div className="signal-cap"><Icon name="gauge" size={12} />Refinement</div>
              {editing
                ? <input className="signal-num-input" type="number" min="0" max="100" value={rd.refinementScore} onChange={(e) => setField("refinementScore", clampNum(e.target.value, 0, 100))} />
                : <div className="signal-val" style={{ color: "var(--ready)" }}>{rd.refinementScore}</div>}
              <div className="signal-sub">out of 100</div>
            </div>
            <div className="signal">
              <div className="signal-cap"><Icon name="alert" size={12} />Risk</div>
              {editing
                ? <select className="signal-sel" value={rd.risk?.level} onChange={(e) => mutate((o) => { (o as unknown as ReadinessData).risk.level = e.target.value as "Low" | "Medium" | "High"; })}><option>Low</option><option>Medium</option><option>High</option></select>
                : <div className="signal-val" style={{ fontSize: 17, color: "var(--risk-ink)", paddingTop: 2 }}>{rd.risk?.level}</div>}
              <div className="signal-sub">delivery risk</div>
            </div>
            <div className="signal">
              <div className="signal-cap"><Icon name="layers" size={12} />Estimate</div>
              {editing
                ? <input className="signal-num-input" type="number" min="0" max="999" value={rd.estimate?.points} onChange={(e) => mutate((o) => { (o as unknown as ReadinessData).estimate.points = clampNum(e.target.value, 0, 999); })} />
                : <div className="signal-val">{rd.estimate?.points}<span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 500 }}> points</span></div>}
              <div className="signal-sub">suggested only</div>
            </div>
          </div>

          <div>
            <SecLabel icon="bulb" count={(rd.recommendations ?? []).length}>Refinement recommendations</SecLabel>
            {editing
              ? <ListEditor items={rd.recommendations ?? []} setItems={(a) => setField("recommendations", a)} addLabel="Add recommendation" />
              : <div className="card pad"><div className="rec-list">{(rd.recommendations ?? []).map((rc, i) => <div key={i} className="rec"><span className="ri"><Icon name="arrow-right" size={13} /></span><span>{rc}</span></div>)}</div></div>}
          </div>

          <div>
            <SecLabel icon="git">Dependencies</SecLabel>
            <div className="stack-sm" style={{ marginTop: 8 }}>
              <div>
                <div className="eyebrow" style={{ marginBottom: 7 }}>Internal</div>
                <FeaturesList
                  items={rd.dependencies?.internal ?? []}
                  editing={editing}
                  addLabel="Add internal dependency"
                  onReorder={(fn) => setField("dependencies", { ...rd.dependencies, internal: fn(rd.dependencies?.internal ?? []) })}
                  onChange={(i, v) => { const a = [...(rd.dependencies?.internal ?? [])]; a[i] = v; setField("dependencies", { ...rd.dependencies, internal: a }); }}
                  onAdd={() => setField("dependencies", { ...rd.dependencies, internal: [...(rd.dependencies?.internal ?? []), ""] })}
                  onDelete={(i) => setField("dependencies", { ...rd.dependencies, internal: (rd.dependencies?.internal ?? []).filter((_, j) => j !== i) })}
                />
              </div>
              <div>
                <div className="eyebrow" style={{ marginBottom: 7 }}>External</div>
                <FeaturesList
                  items={rd.dependencies?.external ?? []}
                  editing={editing}
                  addLabel="Add external dependency"
                  onReorder={(fn) => setField("dependencies", { ...rd.dependencies, external: fn(rd.dependencies?.external ?? []) })}
                  onChange={(i, v) => { const a = [...(rd.dependencies?.external ?? [])]; a[i] = v; setField("dependencies", { ...rd.dependencies, external: a }); }}
                  onAdd={() => setField("dependencies", { ...rd.dependencies, external: [...(rd.dependencies?.external ?? []), ""] })}
                  onDelete={(i) => setField("dependencies", { ...rd.dependencies, external: (rd.dependencies?.external ?? []).filter((_, j) => j !== i) })}
                />
              </div>
            </div>
          </div>

          <div>
            <SecLabel icon="alert">Risk reasons</SecLabel>
            <div className="card pad">
              <div style={{ marginBottom: 11 }}><Badge variant={riskVariant} icon="alert">{rd.risk?.level} risk</Badge></div>
              {editing
                ? <ListEditor items={rd.risk?.reasons ?? []} setItems={(a) => mutate((o) => { (o as unknown as ReadinessData).risk.reasons = a; })} addLabel="Add reason" qStyle />
                : <ItemList items={rd.risk?.reasons ?? []} qStyle />}
            </div>
          </div>

          {editing ? (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{ color: "var(--muted)", paddingTop: 9 }}><Icon name="bulb" size={14} /></span>
              <div style={{ flex: 1 }}>
                <div className="eyebrow" style={{ marginBottom: 6 }}>Estimate rationale</div>
                <AutoTextarea value={rd.estimate?.rationale ?? ""} onChange={(v) => mutate((o) => { (o as unknown as ReadinessData).estimate.rationale = v; })} placeholder="Why this estimate…" />
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start", color: "var(--muted)", fontSize: 12.5 }}>
              <Icon name="bulb" size={14} /><span>The estimate is a suggestion ({rd.estimate?.rationale}). Developers still own the final number.</span>
            </div>
          )}
        </div>
      );
    }

    /* ── EXPORT ── */
    case "export":
      return (
        <div className="stack reveal">
          <div className="card pad" style={{ background: "var(--accent-tint)", borderColor: "var(--accent-line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, background: "var(--surface)", display: "grid", placeItems: "center", color: "var(--accent-strong)" }}><Icon name="rocket" size={19} /></span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "var(--accent-ink)" }}>Sprint-ready in {elapsedStr}</div>
                <div style={{ fontSize: 12.5, color: "var(--accent-ink)", opacity: 0.85 }}>From messy input to a refined, testable artifact — against a 15:00 target.</div>
              </div>
            </div>
          </div>
          <div>
            <SecLabel icon="download">Export to</SecLabel>
            <div className="export-targets">
              {EXPORT_TARGETS.map((t) => (
                <button key={t.id} className="export-target" onClick={() => onExport(t)}>
                  <span className="et-ico"><Icon name={t.icon} size={18} /></span>
                  <span><div className="et-name">{t.name}</div><div className="et-sub">{t.sub}</div></span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <SecLabel icon="markdown">Markdown preview</SecLabel>
            <div className="md-preview scroll">{buildMarkdown(allData)}</div>
          </div>
        </div>
      );

    default:
      return <div className="locked-wrap">Nothing here yet.</div>;
  }
}
