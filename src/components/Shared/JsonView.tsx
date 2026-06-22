"use client";

function JsonLine({ line }: { line: string }) {
  const out: React.ReactNode[] = [];
  let rest = line;
  let key = 0;
  const ws = rest.match(/^\s*/)?.[0] ?? "";
  if (ws) out.push(<span key={key++}>{ws}</span>);
  rest = rest.slice(ws.length);
  const keyMatch = rest.match(/^"([^"]*)"(\s*:)/);
  if (keyMatch) {
    out.push(<span key={key++} className="jk">&quot;{keyMatch[1]}&quot;</span>);
    out.push(<span key={key++} className="jp">{keyMatch[2]}</span>);
    rest = rest.slice(keyMatch[0].length);
  }
  const valRe = /"([^"\\]*(?:\\.[^"\\]*)*)"|(-?\d+\.?\d*)|([\{\}\[\],])|(true|false|null)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = valRe.exec(rest)) !== null) {
    if (m.index > last) out.push(<span key={key++} className="jp">{rest.slice(last, m.index)}</span>);
    if (m[1] !== undefined) out.push(<span key={key++} className="js">&quot;{m[1]}&quot;</span>);
    else if (m[2] !== undefined) out.push(<span key={key++} className="jn">{m[2]}</span>);
    else if (m[3] !== undefined) out.push(<span key={key++} className="jp">{m[3]}</span>);
    else if (m[4] !== undefined) out.push(<span key={key++} className="jn">{m[4]}</span>);
    last = valRe.lastIndex;
  }
  if (last < rest.length) out.push(<span key={key++} className="jp">{rest.slice(last)}</span>);
  return <div>{out}{"\n"}</div>;
}

export function JsonView({ data }: { data: unknown }) {
  const text = JSON.stringify(data, null, 2);
  const lines = text.split("\n");
  return (
    <div className="json-block scroll">
      {lines.map((line, i) => <JsonLine key={i} line={line} />)}
    </div>
  );
}
