import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { readNote, SKIP_REASONS } from "../../src/parser/note.js";

// E4 and FRD D5, D22, D55, D64, D65 (specs/01-note-parsing rules 3 to 5).

function tmpNote(name: string, content: string | Buffer): string {
  const dir = mkdtempSync(join(tmpdir(), "at-note-"));
  const p = join(dir, name);
  writeFileSync(p, content);
  return p;
}

describe("readNote whole-note skips (E4, FR-I8, FR-I9)", () => {
  it("skips an empty file as `empty file` and never throws (D5.1)", () => {
    const r = readNote(tmpNote("2026-09-09-empty.md", ""));
    expect(r).toEqual({ ok: false, skip: { file: "2026-09-09-empty.md", reason: "empty file" } });
  });

  it("skips a whitespace-only file as `empty file` (D64.1)", () => {
    const r = readNote(tmpNote("2026-09-09-ws.md", "  \n\t\n"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.skip.reason).toBe("empty file");
  });

  it("skips a BOM-only file as `empty file` (Q-17)", () => {
    const r = readNote(tmpNote("2026-09-09-bom.md", Buffer.from([0xef, 0xbb, 0xbf])));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.skip.reason).toBe("empty file");
  });

  it("skips non-UTF-8 bytes as `not valid UTF-8` (D55.3)", () => {
    const r = readNote(tmpNote("scratch.md", Buffer.from([0xff, 0xfe, 0x00, 0x81, 0x80])));
    expect(r).toEqual({ ok: false, skip: { file: "scratch.md", reason: "not valid UTF-8" } });
  });

  it("skips a note with no date and no leading filename date as `missing date` (D22.2)", () => {
    const r = readNote(tmpNote("untitled.md", "- [ ] something\n"));
    expect(r).toEqual({ ok: false, skip: { file: "untitled.md", reason: "missing date" } });
  });

  it("skips an unparseable header date and does NOT fall back to the filename (D22.1)", () => {
    const r = readNote(tmpNote("2026-10-03-sales.md", "Date: sometime last week\n- [ ] x\n"));
    expect(r).toEqual({ ok: false, skip: { file: "2026-10-03-sales.md", reason: "unparseable date" } });
  });

  it("uses the filename date when no date key exists (D22.2)", () => {
    const r = readNote(tmpNote("2026-09-19-offsite.md", "- [ ] x\n"));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.note.meetingDate).toBe("2026-09-19");
  });

  it("treats a lone CR as ordinary content, so the date line is unparseable, without a crash (Q-14)", () => {
    const r = readNote(tmpNote("2026-09-19-cr.md", "Date: 2026-09-19\rstill one line\n"));
    expect(r).toEqual({ ok: false, skip: { file: "2026-09-19-cr.md", reason: "unparseable date" } });
  });

  it("reports a missing file as `unreadable file` without throwing (Q-02)", () => {
    const r = readNote(join(tmpdir(), "definitely-missing-note-xyz.md"));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.skip.reason).toBe(SKIP_REASONS.unreadableFile);
  });
});

describe("readNote encoding and line endings (D55)", () => {
  it("strips a UTF-8 BOM and treats CRLF like LF (D55.1, D55.2)", () => {
    const text = "﻿Date: 2026-09-01\r\n- [ ] crlf item\r\n";
    const r = readNote(tmpNote("crlf.md", Buffer.from(text, "utf8")));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.note.body).not.toContain("\r");
      expect(r.note.body.startsWith("Date:")).toBe(true);
    }
  });
});
