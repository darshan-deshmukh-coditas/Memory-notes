import { describe, it } from "vitest";

// BRD section 8: edge cases E1 to E4 (NFR-M4). One block each.
describe("E1 duplicates across meetings (BR-08, FR-E1)", () => {
  it.todo("same owner + normalised task merge into one item (D28.1)");
  it.todo("normalisation drops `by ...`, a/an/the, punctuation, extra spaces (D28.2, D36.2)");
  it.todo("'first' vs 'updated' wireframes stay separate (D28.3, NFR-D5)");
  it.todo("merged item keeps all sources, latest due date, stays done if any copy is done (D3)");
  it.todo("no-owner and group items merge within their label; ambiguous only on same first name (D40)");
  it.todo("re-ingest is idempotent: same ids and statuses (D13, NFR-A9)");
});

describe("E2 no owner or no date (BR-09, FR-E2)", () => {
  it.todo("Someone/TBD become (no owner); Everyone/Team become (group) (D25)");
  it.todo("undated items are captured, listed, and never overdue (D1.2)");
  it.todo("`--due-before` excludes undated items (D31.2)");
  it.todo("followup --all skips special-label items and prints the count (D16.3)");
});

describe("E3 same first name (BR-10, FR-E3)", () => {
  it.todo("bare first name with two matching attendees is ambiguous (D4.2)");
  it.todo("`Priya N.` resolves by surname initial (D24.1)");
  it.todo("no attendees: unique roster match resolves, several stay ambiguous (D23)");
  it.todo("--owner / followup with an ambiguous first name errors and lists choices (D4.4, D31.3)");
  it.todo("`Anita & Rahul` creates one item per person; `Lena (with Priya)` is Lena (D24)");
});

describe("E4 malformed notes (BR-11, FR-E4)", () => {
  it.todo("malformed notes are skipped and reported by file with a reason (D30.1)");
  it.todo("bad action lines are skipped at line level; rest of note is processed (D5.2)");
  it.todo("exit code is 1 when anything was skipped (D20.2, D30.3)");
});
