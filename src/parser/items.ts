/** Checkbox extraction (specs/01-note-parsing; FRD D12, D26, D27, D37, D50, D64; plan Q-04, Q-05, Q-15). Pure. */

export interface RawItem {
  /** 1-based absolute file line. */
  line: number;
  done: boolean;
  /** Text after the checkbox, trimmed. Never empty. */
  text: string;
}

export const IGNORED_KINDS = [
  "table row",
  "action line",
  "block quote",
  "code fence",
  "html comment",
  "numbered checkbox",
] as const;
export type IgnoredKind = (typeof IGNORED_KINDS)[number];

export interface IgnoredLine {
  line: number;
  kind: IgnoredKind;
}

export interface ExtractResult {
  items: RawItem[];
  /** Candidate lines that were ignored, with their kind (FRD D26.2, D27). */
  ignored: IgnoredLine[];
  /** Checkbox lines with no text after the checkbox (FRD D50.1). */
  emptyLines: number[];
}

const CHECKBOX_LINE = /^[ \t]*[-*+][ \t]+\[([ xX])\](.*)$/;
const CHECKBOX_LIKE = /\[[ xX]\]/;
const NUMBERED = /^[ \t]*\d+[.)][ \t]+\[[ xX]\]/;
const ACTION = /^[ \t]*(?:[-*+][ \t]+)?ACTION:/i;

/**
 * Finds action items: checkbox lines only (FRD D12, D26.1). Table rows, `ACTION:` lines, numbered
 * checkboxes, block quotes, fenced code and HTML comments are never items. They are reported as
 * ignored, and only checkbox-looking lines inside fences, quotes and comments are counted (plan Q-04).
 * Note text is data and is never executed (NFR-SEC4).
 */
export function extractItems(body: string, firstLine = 1): ExtractResult {
  const items: RawItem[] = [];
  const ignored: IgnoredLine[] = [];
  const emptyLines: number[] = [];
  let fence: string | null = null;
  let inComment = false;

  const lines = body.split("\n");
  lines.forEach((raw, i) => {
    const line = raw.endsWith("\r") ? raw.slice(0, -1) : raw;
    const abs = firstLine + i;
    const checkboxLike = CHECKBOX_LIKE.test(line);
    const trimmed = line.trimStart();

    if (inComment) {
      if (line.includes("-->")) inComment = false;
      if (checkboxLike) ignored.push({ line: abs, kind: "html comment" });
      return;
    }

    if (fence !== null) {
      if (trimmed.startsWith(fence)) fence = null;
      else if (checkboxLike) ignored.push({ line: abs, kind: "code fence" });
      return;
    }

    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      fence = trimmed.slice(0, 3);
      return;
    }

    if (trimmed.startsWith("<!--")) {
      if (!trimmed.includes("-->", 4)) inComment = true;
      if (checkboxLike) ignored.push({ line: abs, kind: "html comment" });
      return;
    }

    if (trimmed.startsWith(">")) {
      if (checkboxLike) ignored.push({ line: abs, kind: "block quote" });
      return;
    }

    if (trimmed.startsWith("|")) {
      ignored.push({ line: abs, kind: "table row" });
      return;
    }

    if (ACTION.test(line)) {
      ignored.push({ line: abs, kind: "action line" });
      return;
    }

    if (NUMBERED.test(line)) {
      ignored.push({ line: abs, kind: "numbered checkbox" });
      return;
    }

    const m = CHECKBOX_LINE.exec(line);
    if (!m) return;
    const text = (m[2] ?? "").trim();
    if (text === "") {
      emptyLines.push(abs);
      return;
    }
    items.push({ line: abs, done: (m[1] ?? " ") !== " ", text });
  });

  return { items, ignored, emptyLines };
}
