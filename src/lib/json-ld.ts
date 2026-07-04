// JSON.stringify alone doesn't escape "</script>" inside string values (e.g.
// a product name containing that literal text) — the browser's HTML parser
// still treats it as the closing tag, letting whatever follows run as raw
// markup/script. Escaping "<" as < keeps the JSON valid while making
// that impossible. Applies to any JSON-LD built from admin-editable fields
// (product name, address, breadcrumb labels, etc).
export function jsonLdScript(json: unknown): string {
  return JSON.stringify(json).replace(/</g, "\\u003c");
}
