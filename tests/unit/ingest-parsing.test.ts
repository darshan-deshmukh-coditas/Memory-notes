import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { dateFromFilename, parseAttendees, parseHeader } from "../../src/parser/header.js";
import { IGNORED_KINDS, extractItems } from "../../src/parser/items.js";
import { listNoteFiles } from "../../src/parser/note.js";

// FRD section 3, D2, D11, D12, D21, D22, D26, D27, D29, D37, D57, D63, D64 (specs/01-note-parsing).

describe("parseHeader (BR-01, FR-I7)", () => {
  it("reads YAML front matter date and attendees (D21.1)", () => {
    const h = parseHeader("---\ndate: 2026-09-16\nattendees: [Priya Nair, Anita Desai]\n---\n\n- [ ] x\n");
    expect(h.date).toBe("2026-09-16");
    expect(h.attendees.map((a) => a.name)).toEqual(["Priya Nair", "Anita Desai"]);
  });

  it("reads a YAML block attendee list (D63.2)", () => {
    const h = parseHeader("---\ndate: 2026-09-16\nattendees:\n  - Priya Nair\n  - Sam Okafor\n---\n");
    expect(h.attendees.map((a) => a.name)).toEqual(["Priya Nair", "Sam Okafor"]);
  });

  it("reads labelled Date and Attendees lines, case-insensitive keys (D21.1)", () => {
    const h = parseHeader("# Meeting\nDATE: 2026-09-01\nattendees: Priya Nair, Sam Okafor\n");
    expect(h.date).toBe("2026-09-01");
    expect(h.attendees.map((a) => a.name)).toEqual(["Priya Nair", "Sam Okafor"]);
  });

  it("accepts `9 September 2026` and `Monday, 14 September 2026` (D21.2, D63.3)", () => {
    expect(parseHeader("Date: 9 September 2026\n").date).toBe("2026-09-09");
    expect(parseHeader("Date: Monday, 14 September 2026\n").date).toBe("2026-09-14");
  });

  it("rejects a non-calendar date and a date with a time as unparseable (Q-06, D22.1)", () => {
    expect(parseHeader("Date: 2026-02-30\n").unparseableDate).toBe("2026-02-30");
    expect(parseHeader("Date: 2026-09-09 10:30\n").unparseableDate).toBe("2026-09-09 10:30");
    expect(parseHeader("Date: sometime last week\n").unparseableDate).toBe("sometime last week");
  });

  it("treats a blank Date value as no date (Q-01)", () => {
    const h = parseHeader("Date:\nAttendees: Sam\n");
    expect(h.date).toBeNull();
    expect(h.unparseableDate).toBeUndefined();
  });

  it("ignores a Date line after the first `## ` heading (D63.1)", () => {
    const h = parseHeader("# Notes\n## Discussion\nDate: 2026-09-01\n");
    expect(h.date).toBeNull();
  });

  it("gives an empty attendee list when the key is missing (D11.3)", () => {
    expect(parseHeader("Date: 2026-09-01\n").attendees).toEqual([]);
  });
});

describe("parseAttendees (D11.2, D63.2, Q-09)", () => {
  it("accepts names with and without <email>, drops empty entries", () => {
    expect(parseAttendees("Priya Nair <priya@example.com>, Sam Okafor,, ")).toEqual([
      { name: "Priya Nair", email: "priya@example.com" },
      { name: "Sam Okafor" },
    ]);
  });

  it("drops an email-only entry (Q-09)", () => {
    expect(parseAttendees("<x@y.z>")).toEqual([]);
  });
});

describe("dateFromFilename (D57.1)", () => {
  it("uses a leading real date only", () => {
    expect(dateFromFilename("2026-09-09-standup.md")).toBe("2026-09-09");
    expect(dateFromFilename("untitled.md")).toBeNull();
    expect(dateFromFilename("notes-2026-09-09.md")).toBeNull();
    expect(dateFromFilename("2026-13-01-x.md")).toBeNull();
  });
});

describe("extractItems (BR-01, FR-I4)", () => {
  it("finds `-`, `*`, `+` bullets with [ ], [x], [X], including nested (D26.1, D12.3)", () => {
    const r = extractItems("- [ ] one\n* [x] two\n+ [X] three\n  - [ ] nested four\n");
    expect(r.items.map((i) => [i.line, i.done, i.text])).toEqual([
      [1, false, "one"],
      [2, true, "two"],
      [3, true, "three"],
      [4, false, "nested four"],
    ]);
  });

  it("keeps absolute line numbers from firstLine (Q-08)", () => {
    expect(extractItems("- [ ] a\n", 10).items[0]?.line).toBe(10);
  });

  it("ignores table rows and ACTION: lines, counting them (D26.2)", () => {
    const r = extractItems("| - [ ] x | y |\nACTION: do it\n- [ ] real\n");
    expect(r.items.map((i) => i.text)).toEqual(["real"]);
    expect(r.ignored.map((i) => i.kind)).toEqual(["table row", "action line"]);
  });

  it("ignores block quotes, fenced code and HTML comments, reporting checkbox lines only (D27, Q-04)", () => {
    const body = [
      "> - [ ] quoted",
      "```",
      "- [ ] in fence",
      "plain prose in fence",
      "```",
      "<!--",
      "- [ ] in comment",
      "-->",
      "- [ ] real",
    ].join("\n");
    const r = extractItems(body);
    expect(r.items.map((i) => i.text)).toEqual(["real"]);
    expect(r.ignored.map((i) => i.kind)).toEqual(["block quote", "code fence", "html comment"]);
  });

  it("ignores numbered checkboxes (D37)", () => {
    const r = extractItems("1. [ ] numbered\n- [ ] bullet\n");
    expect(r.items.map((i) => i.text)).toEqual(["bullet"]);
    expect(r.ignored.map((i) => i.kind)).toEqual(["numbered checkbox"]);
  });

  it("treats an indented checkbox as an item, not a code block (D64.3)", () => {
    expect(extractItems("    - [ ] indented\n").items.map((i) => i.text)).toEqual(["indented"]);
  });

  it("skips a checkbox with no text and reports it (D50.1)", () => {
    const r = extractItems("- [ ]\n- [ ] kept\n");
    expect(r.emptyLines).toEqual([1]);
    expect(r.items.map((i) => i.text)).toEqual(["kept"]);
  });

  it("needs a space after the bullet (Q-15)", () => {
    expect(extractItems("-[ ] no space\n").items).toEqual([]);
    expect(extractItems("- [ ]tight\n").items.map((i) => i.text)).toEqual(["tight"]);
  });

  it("exposes the six ignored kinds", () => {
    expect(IGNORED_KINDS).toHaveLength(6);
  });
});

describe("listNoteFiles (D29, Q-03)", () => {
  it("reads top-level .md only, case-insensitively; counts .txt and subfolders as ignored (D29.1)", () => {
    const dir = mkdtempSync(join(tmpdir(), "at-list-"));
    writeFileSync(join(dir, "b.md"), "x");
    writeFileSync(join(dir, "A.MD"), "x");
    writeFileSync(join(dir, "c.txt"), "x");
    mkdirSync(join(dir, "sub.md"));
    mkdirSync(join(dir, "folder"));
    const r = listNoteFiles(dir);
    expect(r.notes).toEqual(["A.MD", "b.md"]);
    expect(r.ignored).toBe(3);
  });

  it("throws an ActiontrackError with exit 2 for a missing folder (D20.3, Q-18)", () => {
    expect(() => listNoteFiles(join(tmpdir(), "definitely-missing-folder-xyz"))).toThrow(/not found/);
  });
});
