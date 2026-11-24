import { describe, it } from "vitest";

// FRD section 3, D2, D5, D11, D12, D21, D22, D26, D27, D29, D37. Replace each todo with a real test.
describe("parseHeader / readNote (BR-01, BR-11, E4)", () => {
  it.todo("reads YAML front matter date and attendees (D21.1)");
  it.todo("reads labelled `Date:` / `Attendees:` lines, case-insensitive (D21.1)");
  it.todo("accepts `9 September 2026` and `Monday, 14 September 2026` (D21.2)");
  it.todo("attendee `Full Name <email>` with optional email (D11.2)");
  it.todo("falls back to the filename date only when NO date is present (D22.2)");
  it.todo("skips a note whose date is present but unparseable, no filename fallback (D22.1)");
  it.todo("skips empty and non-UTF-8 files, never throws (D5.1, NFR-R1)");
});

describe("extractItems (BR-01, FR-I4)", () => {
  it.todo("finds `-`, `*`, `+` bullets with [ ], [x], [X], including nested (D26.1)");
  it.todo("ingests [x] items as done (D12.3)");
  it.todo("ignores table rows and ACTION: lines, counting them (D26.2)");
  it.todo("ignores block quotes, fenced code and HTML comments, reporting them (D27)");
  it.todo("ignores numbered checkboxes `1. [ ]` (D37)");
});

describe("listNoteFiles", () => {
  it.todo("reads top-level .md only; counts .txt and subfolders as ignored (D29)");
  it.todo("no .md files: `No notes found`, exit 2 (D35.3)");
});
