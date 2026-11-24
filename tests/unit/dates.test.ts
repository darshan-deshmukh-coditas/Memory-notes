import { describe, expect, it } from "vitest";
import { findDuePhrase, parseCliDate, resolveDue, statusOf } from "../../src/dates/resolve.js";

// specs/02-date-resolution; FRD D1, D8 to D10, D33, D34, D36, D38, D44, D47, D48, D49, D66.

const MEETING_THU = "2026-09-03"; // Thursday
const MEETING_MON = "2026-10-05"; // Monday

describe("resolveDue (FR-I6, D8, D9, D10)", () => {
  it("bare weekday is the next occurrence strictly after the meeting day (D8.2, D47.1)", () => {
    expect(resolveDue("Friday", "2026-09-04")).toEqual({ kind: "date", date: "2026-09-11" });
    expect(resolveDue("Fri", "2026-09-04")).toEqual({ kind: "date", date: "2026-09-11" });
  });

  it("tomorrow, EOD, EOD tomorrow, EOM (D9.2, D9.3, D66.2)", () => {
    expect(resolveDue("tomorrow", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-04" });
    expect(resolveDue("EOD", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-03" });
    expect(resolveDue("EOD tomorrow", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-04" });
    expect(resolveDue("EOM", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-30" });
  });

  it("next week is Monday of the following ISO week; end of next week is that Friday (D9.1, D33.2)", () => {
    expect(resolveDue("next week", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-07" });
    expect(resolveDue("end of next week", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-11" });
  });

  it("next Tuesday worked example from D33.2", () => {
    expect(resolveDue("next Tuesday", MEETING_MON)).toEqual({ kind: "date", date: "2026-10-13" });
    expect(resolveDue("Tuesday", MEETING_MON)).toEqual({ kind: "date", date: "2026-10-06" });
  });

  it("ISO, month-name, ordinal and weekday-plus-date forms (D10.1, D33.1)", () => {
    expect(resolveDue("2026-10-14", MEETING_THU)).toEqual({ kind: "date", date: "2026-10-14" });
    expect(resolveDue("4 Mar 2026", MEETING_THU)).toEqual({ kind: "date", date: "2026-03-04" });
    expect(resolveDue("Oct 3rd", MEETING_THU)).toEqual({ kind: "date", date: "2026-10-03" });
    expect(resolveDue("Wed 16 Sep", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-16" });
  });

  it("a weekday that disagrees with an explicit date gives the date and a warning (D33.4)", () => {
    const r = resolveDue("Wed 17 Sep", MEETING_THU);
    expect(r.kind).toBe("date");
    if (r.kind === "date") {
      expect(r.date).toBe("2026-09-17");
      expect(r.warning).toBeDefined();
    }
  });

  it("missing year uses the meeting year, rolls over when more than six months earlier (D10.2, D34)", () => {
    expect(resolveDue("5 Jan", "2026-12-01")).toEqual({ kind: "date", date: "2027-01-05" });
    expect(resolveDue("5 Jun", "2026-09-03")).toEqual({ kind: "date", date: "2026-06-05" });
  });

  it("slash dates and vague wording are flagged, never guessed (D10.3, D33.3, D66.3)", () => {
    for (const w of ["03/04", "mid-October", "sometime", "in 3 days", "this week", "end of week", "tomorrow morning"]) {
      expect(resolveDue(w, MEETING_THU).kind).toBe("flagged");
    }
  });

  it("matches case-insensitively (D66.1)", () => {
    expect(resolveDue("by FRIDAY", MEETING_THU).kind).toBe("flagged");
    expect(resolveDue("friday", MEETING_THU)).toEqual({ kind: "date", date: "2026-09-04" });
  });

  it("rejects non-leap Feb 29 and impossible dates (specs/02 OQ-10)", () => {
    expect(resolveDue("2027-02-29", MEETING_THU).kind).toBe("flagged");
    expect(resolveDue("29 Feb", "2027-03-01").kind).toBe("flagged");
  });
});

describe("findDuePhrase (D48, D49)", () => {
  it("removes the resolved phrase and its dash (FRD D49.2)", () => {
    const r = findDuePhrase("send revised quote to Acme — by Friday", MEETING_THU);
    expect(r).toEqual({ task: "send revised quote to Acme", due: "2026-09-04", dueFlagged: false });
  });

  it("the last phrase that resolves is the due date; an unresolved `by 10%` stays (D48.1)", () => {
    const r = findDuePhrase("cut cloud costs by 10% — proposal by 2026-10-09", MEETING_THU);
    expect(r.due).toBe("2026-10-09");
    expect(r.task).toBe("cut cloud costs by 10% — proposal");
    expect(r.dueFlagged).toBe(false);
  });

  it("flags a failed by/due phrase with no later resolved phrase (D48.2)", () => {
    expect(findDuePhrase("publish the report by mid-October", MEETING_THU)).toEqual({
      task: "publish the report by mid-October",
      due: null,
      dueFlagged: true,
    });
  });

  it("keeps an earlier resolved date and flags when only a later by-phrase fails (specs/02 OQ-2)", () => {
    const r = findDuePhrase("send deck by Friday and review by mid-October", MEETING_THU);
    expect(r.due).toBe("2026-09-04");
    expect(r.dueFlagged).toBe(true);
  });

  it("`on` and `from` phrases that do not resolve are plain text and never flag (D48.3)", () => {
    expect(findDuePhrase("walk through the demo on the call", MEETING_THU)).toEqual({
      task: "walk through the demo on the call",
      due: null,
      dueFlagged: false,
    });
    expect(findDuePhrase("follow up from Acme", MEETING_THU).dueFlagged).toBe(false);
  });

  it("`on 2026-10-14` and `due 15 October` resolve (D33.1, D36.1)", () => {
    expect(findDuePhrase("publish on 2026-10-14", MEETING_THU).due).toBe("2026-10-14");
    expect(findDuePhrase("results due 15 October", MEETING_THU)).toEqual({
      task: "results",
      due: "2026-10-15",
      dueFlagged: false,
    });
  });

  it("`for 4 Mar` stays in the task text (specs/02 OQ-7)", () => {
    const r = findDuePhrase("prepare board pack for 4 Mar", MEETING_THU);
    expect(r.due).toBeNull();
    expect(r.task).toBe("prepare board pack for 4 Mar");
  });
});

describe("statusOf (D1, D44)", () => {
  it("due today is open; no date is never overdue; past due is overdue (D1.1, D1.2)", () => {
    expect(statusOf({ status: "open", due: "2026-10-20" }, "2026-10-20")).toBe("open");
    expect(statusOf({ status: "open", due: null }, "2026-10-20")).toBe("open");
    expect(statusOf({ status: "open", due: "2026-10-19" }, "2026-10-20")).toBe("overdue");
  });

  it("done wins over due date (D44.1)", () => {
    expect(statusOf({ status: "done", due: "2026-01-01" }, "2026-10-20")).toBe("done");
  });
});

describe("parseCliDate (D31.6, D38)", () => {
  it("accepts ISO exactly and `Mar 4` with today's year (D38.1)", () => {
    expect(parseCliDate("2026-03-04", "2026-10-20")).toBe("2026-03-04");
    expect(parseCliDate("Mar 4", "2026-03-01")).toBe("2026-03-04");
    expect(parseCliDate("Mar 4", "2026-10-20")).toBe("2027-03-04"); // more than six months before today rolls (D38.1)
  });

  it("rejects impossible dates and unknown forms with a usage error (NFR-U3)", () => {
    expect(() => parseCliDate("2026-02-30", "2026-10-20")).toThrow(/Invalid date/);
    expect(() => parseCliDate("Friday", "2026-10-20")).toThrow(/Invalid date/);
  });
});
