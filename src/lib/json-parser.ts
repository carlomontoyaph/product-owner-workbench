// Tolerant JSON extraction — strips prose / code fences, grabs the outermost object.
// Mirrors the prototype's parseJSON() in ai.jsx.

export function parseJSON(txt: string): Record<string, unknown> {
  if (!txt) throw new Error("empty-response");
  let s = String(txt).trim();
  s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const a = s.indexOf("{");
  const b = s.lastIndexOf("}");
  if (a < 0 || b < 0 || b <= a) throw new Error("no-json");
  return JSON.parse(s.slice(a, b + 1));
}
