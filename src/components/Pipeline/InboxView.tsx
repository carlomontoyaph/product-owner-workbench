"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@/components/Shared/Icons";
import type { InboxData, ContextCard, ContextInsight, ContextCategory } from "@/lib/types";
import { SOURCES } from "@/lib/mocks";

const ACCEPTED = ["pdf", "docx", "xlsx", "csv", "txt", "md", "png", "jpg", "jpeg"];
const MAX_BYTES = 25 * 1024 * 1024;
const MAX_FILES = 10;

const KNOWN: Record<string, string> = {
  need: "Business need",
  feedback: "User feedback",
  evidence: "Supporting evidence",
  risk: "Risk",
  constraint: "Constraint",
};
const KNOWN_ORDER: ContextCategory[] = ["need", "feedback", "evidence", "risk", "constraint"];

function dotClass(catKey: string | undefined): string {
  return KNOWN[catKey as keyof typeof KNOWN] ? (catKey as string) : "custom";
}

function uid(p: string): string {
  return p + Date.now() + "_" + Math.random().toString(36).slice(2, 6);
}

function nowLabel(): string {
  const d = new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `Today · ${h}:${m} ${ap}`;
}

async function readFileText(file: File): Promise<string> {
  return new Promise((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ""));
    r.onerror = () => resolve("");
    r.readAsText(file);
  });
}

async function extractInsights(
  fileName: string,
  content: string,
  liveAiEnabled: boolean
): Promise<{ cards: Array<{ category: string; title: string; insight: string }>; error?: string }> {
  const clip = (content || "").slice(0, 12000).trim();
  if (!clip) return { cards: [], error: "empty" };

  if (!liveAiEnabled) {
    return {
      cards: [
        { category: "evidence", title: "Supporting evidence found", insight: "File contains relevant context for analysis." },
      ],
    };
  }

  try {
    const res = await fetch("/api/inbox/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, content, liveAiEnabled: true }),
    });
    const json = await res.json();
    if (json.success && json.cards) {
      return { cards: json.cards };
    }
    return { cards: [], error: json.error || "Failed to extract" };
  } catch (err) {
    return { cards: [], error: "Network error" };
  }
}

/* ---- insight add/edit pop-up ---- */
function InsightModal({
  insight,
  cardLabel,
  fileNames,
  onSave,
  onCancel,
}: {
  insight: ContextInsight & { _new?: boolean };
  cardLabel: string | undefined;
  fileNames: string[];
  onSave: (data: Omit<ContextInsight, "id">) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(insight.title || "");
  const [desc, setDesc] = useState(insight.insight || "");
  const initSrc = insight.source || "";
  const isFile = initSrc && fileNames.includes(initSrc);
  const [srcMode, setSrcMode] = useState(!initSrc ? "none" : isFile ? "file" : "other");
  const [srcFile, setSrcFile] = useState(isFile ? initSrc : fileNames[0] || "");
  const [srcOther, setSrcOther] = useState(!initSrc || isFile ? "" : initSrc);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 60);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const canSave = title.trim() && desc.trim();
  const resolveSource = (): string | null => {
    if (srcMode === "file") return srcFile || null;
    if (srcMode === "other") return srcOther.trim() || null;
    return null;
  };

  const onSelect = (v: string) => {
    if (v === "__none__") setSrcMode("none");
    else if (v === "__other__") setSrcMode("other");
    else {
      setSrcMode("file");
      setSrcFile(v);
    }
  };

  const selectValue = srcMode === "none" ? "__none__" : srcMode === "other" ? "__other__" : srcFile;

  return (
    <div className="cc-modal-back" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="cc-modal" role="dialog" aria-modal="true">
        <div className="cc-modal-head">
          <div>
            <div className="cc-modal-title">{insight._new ? "Add insight" : "Edit insight"}</div>
            <div className="cc-modal-sub">
              {cardLabel ? (
                <>
                  In <strong>{cardLabel}</strong> ·{" "}
                </>
              ) : null}
              Same editor used for AI-extracted insights.
            </div>
          </div>
          <button className="cc-modal-x" title="Close" onClick={onCancel}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="cc-modal-body">
          <div>
            <span className="cc-modal-label">Title</span>
            <input
              ref={titleRef}
              className="cc-ed-title"
              value={title}
              placeholder="Short, specific title"
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <span className="cc-modal-label">Description</span>
            <textarea
              className="cc-ed-insight"
              value={desc}
              placeholder="1–3 plain sentences describing this context…"
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>
          <div>
            <span className="cc-modal-label">
              Source <span className="cc-opt">Optional</span>
            </span>
            <select className="cc-ed-select" value={selectValue} onChange={(e) => onSelect(e.target.value)}>
              <option value="__none__">No source</option>
              {fileNames.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
              <option value="__other__">Other source…</option>
            </select>
            {srcMode === "other" && (
              <input
                className="cc-ed-srctext"
                value={srcOther}
                placeholder="Name the source — a doc, URL, person…"
                onChange={(e) => setSrcOther(e.target.value)}
              />
            )}
          </div>
        </div>
        <div className="cc-modal-foot">
          <span className="cc-modal-hint">
            <Icon name="sparkles" size={13} />
            Leave title &amp; description empty and close to discard — nothing is saved.
          </span>
          <span className="cc-modal-foot-r">
            <button className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button
              className="btn primary"
              disabled={!canSave}
              onClick={() => onSave({ title: title.trim(), insight: desc.trim(), source: resolveSource() })}
            >
              <Icon name="check" size={14} />
              Save insight
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

/* ---- one insight row ---- */
function InsightRow({
  item,
  onEdit,
  onDelete,
}: {
  item: ContextInsight;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="ccrow">
      <div className="ccrow-main">
        <div className="ccrow-title">{item.title}</div>
        <div className="ccrow-insight">{item.insight}</div>
      </div>
      <div className="ccrow-right">
        {item.source ? (
          <span className="ccrow-src">
            <Icon name="file" size={12} />
            <span className="mono">{item.source}</span>
          </span>
        ) : (
          <span className="ccrow-src manual">
            <Icon name="pencil" size={12} />
            No source
          </span>
        )}
        <span className="ccrow-acts">
          <button className="cc-act" title="Edit" onClick={onEdit}>
            <Icon name="pencil" size={13} />
          </button>
          <button className="cc-act del" title="Delete" onClick={onDelete}>
            <Icon name="trash" size={13} />
          </button>
        </span>
      </div>
    </div>
  );
}

/* ---- a context card (category group) ---- */
function CardGroup({
  card,
  onAddInsight,
  onEditInsight,
  onDeleteInsight,
  onRename,
  onDelete,
  onSaveName,
  onCancelName,
}: {
  card: ContextCard;
  onAddInsight: (cardId: string) => void;
  onEditInsight: (cardId: string, insight: ContextInsight) => void;
  onDeleteInsight: (cardId: string, insightId: string) => void;
  onRename: (card: ContextCard) => void;
  onDelete: (cardId: string) => void;
  onSaveName: (cardId: string, label: string) => void;
  onCancelName: (cardId: string) => void;
}) {
  const [name, setName] = useState(card.label || "");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (card.naming) {
      const t = setTimeout(() => nameRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [card.naming]);

  if (card.naming) {
    return (
      <div className="ccg-group naming">
        <div className="ccg-head naming">
          <span className={`ccg-dot ${dotClass(card.catKey)}`}></span>
          <input
            ref={nameRef}
            className="ccg-nameinput"
            value={name}
            placeholder="Name this category — e.g. Dependencies"
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && name.trim()) onSaveName(card.id, name.trim());
              if (e.key === "Escape") onCancelName(card.id);
            }}
          />
          <span className="ccg-name-actions">
            <button
              className="btn primary sm"
              disabled={!name.trim()}
              onClick={() => onSaveName(card.id, name.trim())}
            >
              <Icon name="check" size={13} />
              Save
            </button>
            <button className="btn sm" onClick={() => onCancelName(card.id)}>
              Cancel
            </button>
          </span>
        </div>
        <div className="ccg-empty-hint">No insights yet — name the category, then add your first insight.</div>
      </div>
    );
  }

  return (
    <div className={`ccg-group${card.fresh ? " fresh" : ""}`}>
      <div className="ccg-head">
        <span className={`ccg-dot ${dotClass(card.catKey)}`}></span>
        <span className="ccg-title">{card.label}</span>
        <span className="ccg-count">{card.insights.length}</span>
        <span className="ccg-head-acts">
          <button className="cc-act" title="Rename category" onClick={() => onRename(card)}>
            <Icon name="pencil" size={13} />
          </button>
          <button className="cc-act del" title="Delete category" onClick={() => onDelete(card.id)}>
            <Icon name="trash" size={13} />
          </button>
        </span>
      </div>
      {card.insights.map((it) => (
        <InsightRow
          key={it.id}
          item={it}
          onEdit={() => onEditInsight(card.id, it)}
          onDelete={() => onDeleteInsight(card.id, it.id)}
        />
      ))}
      <button className="ccg-additem" onClick={() => onAddInsight(card.id)}>
        <Icon name="plus" size={14} />
        Add insight
      </button>
    </div>
  );
}

/* ---- source-history row ---- */
function SourceRow({
  s,
  count,
}: {
  s: { id: string; name: string; time: string; status: string; note?: string };
  count: number;
}) {
  if (s.status === "processing") {
    return (
      <div className="csrc">
        <span className="csrc-ico proc">
          <svg className="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 3a9 9 0 1 0 9 9" />
          </svg>
        </span>
        <span className="csrc-name">{s.name}</span>
        <span className="csrc-time">{s.time}</span>
        <span className="badge">Extracting…</span>
      </div>
    );
  }
  if (s.status === "rejected" || s.status === "error") {
    return (
      <div className="csrc">
        <span className="csrc-ico warn">
          <Icon name="alert" size={16} />
        </span>
        <span className="csrc-name">{s.name}</span>
        <span className="csrc-time">{s.time}</span>
        <span className="badge review">{s.status === "error" ? "Failed" : "Unsupported type"}</span>
        <span className="csrc-note">{s.note}</span>
      </div>
    );
  }
  if (s.status === "empty") {
    return (
      <div className="csrc">
        <span className="csrc-ico ok">
          <Icon name="check" size={16} />
        </span>
        <span className="csrc-name">{s.name}</span>
        <span className="csrc-time">{s.time}</span>
        <span className="badge neutral">0 insights</span>
        <span className="csrc-note" style={{ color: "var(--muted)" }}>
          {s.note}
        </span>
      </div>
    );
  }
  return (
    <div className="csrc">
      <span className="csrc-ico ok">
        <Icon name="check" size={16} />
      </span>
      <span className="csrc-name">{s.name}</span>
      <span className="csrc-time">{s.time}</span>
      <span className="badge ready">
        {count} {count === 1 ? "insight" : "insights"}
      </span>
    </div>
  );
}

/* ---- main InboxView component ---- */
export function InboxView({
  data,
  onChange,
  sourceId,
  setSourceId,
  liveAiEnabled,
}: {
  data: InboxData;
  onChange: (updater: (prev: InboxData) => InboxData) => void;
  sourceId: string;
  setSourceId: (id: string) => void;
  liveAiEnabled: boolean;
}) {
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [modal, setModal] = useState<{ cardId: string; insight: ContextInsight & { _new?: boolean } } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const src = SOURCES.find((s) => s.id === sourceId) || SOURCES[0];
  const inputs = data.inputs ?? {};
  const sources = data.sources ?? [];
  const cards = data.cards ?? [];

  const insightCount = cards.reduce((n, c) => n + c.insights.length, 0);
  const hasInput = Object.values(inputs).some((t) => t.trim()) || insightCount > 0;
  const fileNames = sources.filter((s) => s.status === "ok" || s.status === "empty").map((s) => s.name);
  const acceptedCount = sources.filter((s) => s.status !== "rejected").length;
  const cardInsightCountFor = (name: string) => cards.reduce((n, c) => n + c.insights.filter((it) => it.source === name).length, 0);

  const addInsightsGrouped = useCallback(
    (items: Array<{ catKey: ContextCategory; title: string; insight: string }>, fileName: string) => {
      onChange((prev) => {
        const next = (prev.cards ?? []).map((c) => ({ ...c, insights: c.insights.slice() }));
        items.forEach((it) => {
          let g = next.find((c) => c.catKey === it.catKey && !c.custom);
          if (!g) {
            g = {
              id: uid("g"),
              label: KNOWN[it.catKey] || "Other",
              catKey: it.catKey,
              custom: false,
              naming: false,
              insights: [],
              fresh: true,
            };
            next.push(g);
          }
          g.insights.push({ id: uid("i"), title: it.title, insight: it.insight, source: fileName });
        });
        next.sort((a, b) => {
          const ai = KNOWN_ORDER.indexOf(a.catKey as ContextCategory);
          const bi = KNOWN_ORDER.indexOf(b.catKey as ContextCategory);
          return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi);
        });
        return { ...prev, cards: next };
      });
    },
    [onChange]
  );

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;
      setUploadErr(null);
      let accepted = acceptedCount;

      files.forEach((f) => {
        const ext = (f.name.split(".").pop() || "").toLowerCase();
        const badType = !ACCEPTED.includes(ext);
        const tooBig = f.size > MAX_BYTES;
        const hid = uid("h");

        if (accepted >= MAX_FILES) {
          setUploadErr(`You've reached the limit of ${MAX_FILES} files for this requirement. Remove one to add another.`);
          return;
        }
        if (badType) {
          onChange((prev) => ({
            ...prev,
            sources: [
              ...(prev.sources ?? []),
              {
                id: hid,
                name: f.name,
                time: nowLabel(),
                status: "rejected",
                note: `Rejected — .${ext} isn't an accepted file type. Convert to an accepted format and re-upload.`,
              },
            ],
          }));
          return;
        }
        if (tooBig) {
          onChange((prev) => ({
            ...prev,
            sources: [
              ...(prev.sources ?? []),
              { id: hid, name: f.name, time: nowLabel(), status: "rejected", note: "Rejected — file is larger than 25 MB." },
            ],
          }));
          return;
        }

        accepted++;
        onChange((prev) => ({
          ...prev,
          sources: [...(prev.sources ?? []), { id: hid, name: f.name, time: nowLabel(), status: "processing" }],
        }));

        readFileText(f).then((txt) =>
          extractInsights(f.name, txt, liveAiEnabled).then(({ cards: extractedCards, error: extractError }) => {
            onChange((prev) => ({
              ...prev,
              sources: (prev.sources ?? []).map((s) =>
                s.id === hid
                  ? {
                      ...s,
                      status: extractedCards.length ? "ok" : "empty",
                      note: extractedCards.length
                        ? undefined
                        : extractError === "empty"
                        ? "No readable text found. Binary files (PDF, images, Office docs) can't be read in this prototype — add insights manually, or paste the text."
                        : "No usable product context found in this file.",
                    }
                  : s
              ),
            }));
            if (extractedCards.length) {
              addInsightsGrouped(
                extractedCards.map((c) => ({ catKey: (c.category as ContextCategory) || "evidence", title: c.title, insight: c.insight })),
                f.name
              );
            }
          })
        );
      });
    },
    [acceptedCount, onChange, addInsightsGrouped, liveAiEnabled]
  );

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const openAddInsight = (cardId: string) =>
    setModal({ cardId, insight: { _new: true, id: "", title: "", insight: "", source: null } });
  const openEditInsight = (cardId: string, it: ContextInsight) => setModal({ cardId, insight: it });
  const saveInsight = (data: Omit<ContextInsight, "id">) => {
    if (!modal) return;
    const { cardId, insight } = modal;
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).map((c) => {
        if (c.id !== cardId) return c;
        if (insight._new) {
          return { ...c, insights: [...c.insights, { id: uid("i"), ...data }] };
        }
        return { ...c, insights: c.insights.map((it) => (it.id === insight.id ? { ...it, ...data } : it)) };
      }),
    }));
    setModal(null);
  };
  const deleteInsight = (cardId: string, id: string) =>
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).map((c) => (c.id === cardId ? { ...c, insights: c.insights.filter((it) => it.id !== id) } : c)),
    }));

  const addCategory = () =>
    onChange((prev) => ({
      ...prev,
      cards: [...(prev.cards ?? []), { id: uid("g"), label: "", catKey: "custom", custom: true, naming: true, insights: [] }],
    }));
  const saveName = (id: string, label: string) =>
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).map((c) => (c.id === id ? { ...c, label, naming: false, fresh: true } : c)),
    }));
  const cancelName = (id: string) =>
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).filter((c) => !(c.id === id && c.naming)),
    }));
  const renameCard = (card: ContextCard) =>
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).map((c) => (c.id === card.id ? { ...c, naming: true } : c)),
    }));
  const deleteCard = (id: string) =>
    onChange((prev) => ({
      ...prev,
      cards: (prev.cards ?? []).filter((c) => c.id !== id),
    }));

  const modalCard = modal ? cards.find((c) => c.id === modal.cardId) : null;

  return (
    <div className="reveal">
      {/* REQUIREMENT INPUT */}
      <div className="rq-sec">
        <div className="rq-sec-head">
          <span className="rq-sec-title">Requirement input</span>
          <span className="rq-sec-step">STAKEHOLDER SIGNAL · PRIMARY</span>
        </div>
        <p className="rq-sec-sub">The stakeholder request stays the heart of this requirement. Everything below only helps us interpret it.</p>
        <div className="source-tabs">
          {SOURCES.map((s) => (
            <button
              key={s.id}
              className={`source-tab${sourceId === s.id ? " on" : ""}`}
              onClick={() => setSourceId(s.id)}
            >
              <span className="ico">
                <Icon name={s.icon} size={14} />
              </span>
              {s.label}
            </button>
          ))}
        </div>
        <div className="source-meta">
          <Icon name={src.icon} size={13} />
          {src.hint}
        </div>
        <textarea
          className="inbox inbox-edit"
          aria-label="Requirement input"
          value={inputs[sourceId] ?? ""}
          placeholder={src.placeholder}
          onChange={(e) => onChange((prev) => ({ ...prev, inputs: { ...inputs, [sourceId]: e.target.value } }))}
        />
      </div>

      {/* SUPPORTING CONTEXT */}
      <div className="rq-sec">
        <div className="rq-sec-head">
          <span className="rq-sec-title">Supporting context</span>
          <span className="rq-optional">Optional</span>
        </div>
        <p className="rq-sec-sub">Add evidence and background that helps the AI understand the request — tickets, research, docs, screenshots.</p>
        <div className="rq-tone">
          <Icon name="sparkles" size={16} />
          <span>You can be as messy as you want. We'll help extract and organize the important context — then throw the files away.</span>
        </div>
        <div
          className={`rq-drop${dragging ? " drag" : ""}`}
          style={{ marginTop: 12 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <div className="rq-drop-ico">
            <Icon name="upload" size={20} />
          </div>
          <div className="rq-drop-main">
            <div className="rq-drop-title">
              Drop files here or{" "}
              <span className="rq-link" onClick={() => fileRef.current?.click()}>
                browse
              </span>
            </div>
            <div className="rq-drop-meta">Up to 25&nbsp;MB each · max 10 files · files are used for extraction only, then discarded</div>
            <div className="rq-types">
              {ACCEPTED.map((t) => (
                <span key={t} className="rq-type">
                  {t}
                </span>
              ))}
            </div>
          </div>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" />
            Upload file
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            style={{ display: "none" }}
            onChange={(e) => {
              processFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
        {uploadErr && (
          <div className="rq-uploaderr">
            <Icon name="alert" size={15} />
            {uploadErr}
          </div>
        )}
      </div>

      {/* CONTEXT SOURCES HISTORY */}
      <div className="rq-sec">
        <div className="rq-sec-head">
          <span className="rq-sec-title">Context sources history</span>
          <span className="rq-sec-step">METADATA ONLY · FILES NOT RETAINED</span>
        </div>
        <p className="rq-sec-sub">A record of what was processed. Re-upload a file to regenerate its insights.</p>
        <div className="csrc-list">
          {sources.length === 0 && <div className="csrc-empty">No files processed yet — upload a file to extract context.</div>}
          {sources.map((s) => (
            <SourceRow key={s.id} s={s} count={cardInsightCountFor(s.name)} />
          ))}
          <div className="csrc-foot">
            <Icon name="shield" size={13} />
            Files are processed then permanently discarded — only the insights below persist.
          </div>
        </div>
      </div>

      {/* CONTEXT CARDS */}
      <div className="rq-sec">
        <div className="rq-sec-head">
          <span className="rq-sec-title">Context cards</span>
          <span className="rq-sec-step">
            {insightCount} {insightCount === 1 ? "INSIGHT" : "INSIGHTS"} · {cards.length} {cards.length === 1 ? "CARD" : "CARDS"}
          </span>
        </div>
        <p className="rq-sec-sub">
          The persistent, editable output — grouped by category so a long list stays scannable. Add insights to any card, create your own categories, edit, or delete; each insight
          can cite an uploaded file, another source, or none.
        </p>
        {cards.length === 0 ? (
          <div className="ccg-empty">
            <div className="ccg-empty-title">No context cards yet</div>
            <div className="ccg-empty-sub">Upload a file to auto-extract insights, or add a context card manually to start organizing what you know.</div>
          </div>
        ) : (
          <div className="ccg">
            {cards.map((c) => (
              <CardGroup
                key={c.id}
                card={c}
                onAddInsight={openAddInsight}
                onEditInsight={openEditInsight}
                onDeleteInsight={deleteInsight}
                onRename={renameCard}
                onDelete={deleteCard}
                onSaveName={saveName}
                onCancelName={cancelName}
              />
            ))}
          </div>
        )}
        <button className="ccg-add" style={{ marginTop: 12 }} onClick={addCategory}>
          <Icon name="plus" size={16} />
          Add context card
        </button>
      </div>

      {/* GUARDRAILS */}
      <details className="rq-guard">
        <summary>
          <span className="rq-guard-ico">
            <Icon name="shield" size={16} />
          </span>
          <span className="rq-guard-head">
            <span className="rq-guard-title">Safety — executables &amp; unsupported file types are rejected</span>
            <span className="rq-guard-sub">How we keep uploaded content safe and relevant</span>
          </span>
          <span className="rq-guard-chev">
            <Icon name="chevron-down" size={16} />
          </span>
        </summary>
        <div className="rq-guard-body">
          <span className="rq-guard-item no">
            <Icon name="x" size={14} />
            Executables &amp; scripts are rejected outright
          </span>
          <span className="rq-guard-item no">
            <Icon name="x" size={14} />
            A single file larger than 25&nbsp;MB is rejected
          </span>
          <span className="rq-guard-item no">
            <Icon name="x" size={14} />
            An 11th file is rejected — 10 files max per requirement
          </span>
          <span className="rq-guard-item">
            <Icon name="check" size={14} />
            File contents are treated as data — never executed as code, SQL, or instructions
          </span>
          <span className="rq-guard-item">
            <Icon name="check" size={14} />
            Instructions written inside files are ignored (prompt-injection safe)
          </span>
          <span className="rq-guard-item">
            <Icon name="check" size={14} />
            Secrets — passwords, API keys, tokens — are detected and excluded
          </span>
          <span className="rq-guard-item">
            <Icon name="check" size={14} />
            Off-topic files are flagged; every insight keeps its source
          </span>
        </div>
      </details>

      {modal && (
        <InsightModal
          insight={modal.insight}
          cardLabel={modalCard?.label}
          fileNames={fileNames}
          onSave={saveInsight}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
