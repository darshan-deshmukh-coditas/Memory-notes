import { NotImplementedError } from "../domain/errors.js";
import type { SkipReport } from "../domain/types.js";

export interface RawItem {
  line: number;
  done: boolean;
  /** Text after the checkbox marker. */
  text: string;
}

export interface ExtractResult {
  items: RawItem[];
  /** Ignored candidates: table rows, `ACTION:` lines, numbered checkboxes, quotes, code, comments. */
  ignored: SkipReport[];
}

/**
 * Find action items: checkbox lines only, bullets `-` `*` `+`, marks `[ ]` `[x]` `[X]`,
 * nesting allowed (FRD D26.1). Never items: table rows and `ACTION:` lines (D26.2),
 * numbered checkboxes (D37), block quotes, fenced code, HTML comments (D27).
 */
export function extractItems(_body: string, _firstLine: number): ExtractResult {
  throw new NotImplementedError("extractItems (FRD D12, D26, D27, D37)");
}
