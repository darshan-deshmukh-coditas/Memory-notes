import { describe, it } from "vitest";

// FRD D1, D8, D9, D10, D33, D34, D36, D38. Worked examples come from the FRD.
describe("resolveDue (BR-02, RULE-4, AC-I3)", () => {
  it.todo("weekday resolves strictly after the meeting day; Friday on a Friday gives next Friday (D8.2)");
  it.todo("tomorrow, EOD (meeting date), EOM and end of month (D9, D33.2)");
  it.todo("next week = Monday of following week (D9.1)");
  it.todo("next Tuesday from 2026-10-05 (Mon) = 2026-10-13 (D33.2)");
  it.todo("end of next week from 2026-09-03 (Thu) = 2026-09-11 (D33.2)");
  it.todo("ISO, `4 Mar`, `Mar 4`, `4 March 2026`, ordinals `Oct 3rd` (D10, D33.1)");
  it.todo("by/from/on/due prefixes resolve, e.g. `due 15 October` (D36.1)");
  it.todo("missing year rolls to next year when more than 6 months before the meeting (D34)");
  it.todo("slash dates like 03/04 are flagged, not guessed (D10.3)");
  it.todo("`mid-October`, `for November`, `sometime` are flagged with no date (D33.3)");
  it.todo("weekday vs explicit date disagree: explicit wins and warns (D33.4)");
});

describe("overdue (BR-04, AC-L1)", () => {
  it.todo("open and due before today is overdue; due today is open (D1.1)");
  it.todo("no due date is never overdue (D1.2)");
  it.todo("--today override gives repeatable results (D1.3, NFR-M2)");
});

describe("parseCliDate (D31.6, D38)", () => {
  it.todo("ISO is exact; `Mar 4` uses today's year with the 6-month rollover from today");
});
