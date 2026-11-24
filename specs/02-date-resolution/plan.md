# Plan: 02 Date resolution

## Goal
Turn due wording in a checkbox item into a calendar date or a flag, decide which due phrase counts when there are several, parse dates typed on the CLI, and compute an item's status from an injected "today". Everything is pure except `clock.ts`, which is already implemented (local-date getters, `fixedClock` exists).

## Scope
In scope (this spec):
- Due-phrase finding in an item's text: introducers, last-resolving-wins, flag rule, removal of the resolved phrase (D48, D49).
- Wording table: ISO, month-name, ordinal, weekday, weekday+date, relative words, EOD/EOM, next week, end of next week, next weekday (D8, D9, D10, D33, D36, D66).
- Year rollover for year-less dates in notes (D34) and on the CLI (D38.1).
- Weekday-versus-date disagreement warning (D33.4).
- `parseCliDate` (D31.6, D38.1) and `statusOf` (D1, D44).

Out of scope, owned elsewhere:
- Meeting date and attendees from the note header (spec 01; D2, D21, D22, D57, D63).
- Owner phrase and "to" split (spec 03; D24, D60, D67). This spec receives the text after the owner.
- Normalising task text for duplicate matching, including trailing-phrase removal for matching (spec 04; D28.2, D36.2, D68).
- Persisting `due`, `dueFlagged`, status (spec 05). `overdue` is never stored (D44.1).
- Turning a warning into exit 1 for ingest (spec 06; D70.1). Flagged display `?` in list (spec 07; D71.1).
- `--today` flag parsing and exit 2 on a bad value (spec 11; D54.1).

## Requirement map

| ID | Rule (one line) | Module / function | Test IDs (testcases.md) |
|---|---|---|---|
| FR-I6, D8.1 | Relative words anchor on the meeting date only | `resolveDue` | TC-01 |
| D8.2 | Weekday = next occurrence strictly after meeting day | `resolveDue` | TC-02, TC-03, TC-04 |
| D8.3 | Supported wording list | `resolveDue` | TC-07 |
| D8.4 | Unresolvable wording: no date, flagged | `resolveDue`, `findDuePhrase` | TC-27, TC-37, TC-38 |
| D9.1 | next week = Monday of following week | `resolveDue` | TC-11 |
| D9.2 | EOD = meeting date | `resolveDue` | TC-06 |
| D9.3, D33.2 | EOM / end of month = last day of meeting month | `resolveDue` | TC-09, TC-10 |
| D10.1 | YYYY-MM-DD, `4 Mar`, `Mar 4`, `4 March 2026` | `resolveDue` | TC-15, TC-16, TC-17 |
| D10.2, D34.1 | Year-less date: meeting year; rolls to next year if more than 6 months before | `resolveDue`, `rollYear` | TC-16, TC-22, TC-23, TC-24 |
| D10.3 | `03/04` never guessed; flagged when introduced by by/due/for | `resolveDue`, `findDuePhrase` | TC-25, TC-26 |
| D31.6, D38.1 | CLI dates: ISO exact; year-less uses today's year, rollover from today | `parseCliDate` | TC-50 to TC-53 |
| D33.1 | Ordinals, weekday+date, from/on forms resolve | `resolveDue` | TC-18, TC-19, TC-21 |
| D33.2 | next <weekday>, end of next week | `resolveDue` | TC-12, TC-13, TC-14 |
| D33.3 | mid-October, for November, sometime: flagged | `resolveDue` | TC-27 |
| D33.4 | Weekday vs explicit date: explicit wins, warning | `resolveDue` | TC-20, TC-70 |
| D36.1 | by/from/on/due introduce due wording | `findDuePhrase` | TC-21 |
| D44.1, D1.1, D1.2 | Exactly one status; due today is open; no due date is never overdue | `statusOf` | TC-43 to TC-47 |
| D1.3, NFR-M2 | Repeatable with injected today; system local date | `statusOf`, `systemClock` | TC-41, TC-42, TC-48 |
| D46.2 | Literal `by <date>` flagged | `resolveDue` | TC-28 |
| D47.1 | Mon..Sun abbreviations as weekdays | `resolveDue` | TC-04 |
| D48.1 | Last resolving phrase is the due date | `findDuePhrase` | TC-31, TC-34 |
| D48.2 | Flag only if by/due/for phrase fails and no later one resolves | `findDuePhrase` | TC-30, TC-31 |
| D48.3 | on/from phrase never flagged | `findDuePhrase` | TC-26, TC-32 |
| D49.1, D49.2 | Resolved phrase and joining dash/comma removed from task | `findDuePhrase` | TC-29, TC-33 |
| D66.1 | Weekday, month, EOD, EOM case-insensitive | `resolveDue` | TC-05 |
| D66.2 | EOD tomorrow = meeting + 1 | `resolveDue` | TC-08 |
| D66.3 | in 3 days, this week, end of week, tomorrow morning: flagged | `resolveDue` | TC-36 |
| NFR-D2 | Stored due is ISO date or null | all date outputs | TC-39 |
| NFR-D3 | Same input gives same output | all pure functions | TC-40 |
| NFR-U3 | Bad CLI date: clear error naming valid forms | `parseCliDate` | TC-54, TC-55, TC-56 |
| NFR-A7 | "Sam to share the VPN guide" has no date and is not overdue | `resolveDue`, `statusOf` | TC-37, TC-45 |
| CLAUDE.md hard rule | Malformed input never crashes; skip and report | `resolveDue`, `findDuePhrase` | TC-38 |

## Design

Date arithmetic uses integer day numbers (UTC-based civil-date conversion). No `Date` objects with local time, no DST effects, no timezone arithmetic (D1.3). ISO `YYYY-MM-DD` strings compare correctly with `<` and `>`.

Functions and their shape:
- `resolveDue(wording, meetingDate): DueResolution`. Resolves one phrase. Returns `date` (with optional `warning`), `none`, or `flagged`. Never throws on user wording.
- `findDuePhrase(text, meetingDate)` (new export, decision OQ-1). Scans an item's text for due phrases (rules 3 to 7 of the spec). Returns `{ due: IsoDate | null, dueFlagged: boolean, warnings: string[], taskText: string }`. Calls `resolveDue` for each candidate phrase. Pure.
- Private helpers: `civilToDay` / `dayToCivil`, `weekdayOf`, `addDays`, `lastDayOfMonth`, `isValidCivil`, `nextWeekdayAfter(meeting, wd)` (D8.2), `weekdayInFollowingWeek(meeting, wd)` (D33.2), `rollYear(candidate, meeting)` (D34.1).
- `parseCliDate(input, today): IsoDate`. ISO exact. Month-name forms use `today`'s year and roll over from `today`. Anything else throws an `ActiontrackError` subclass whose message names the valid forms (NFR-U3). `cli/index.ts` maps it to exit 2.
- `statusOf(item, today): ItemStatus`. Returns `done` if stored status is `done`; `overdue` if `due !== null && due < today`; else `open`. Does not mutate the item.
- `systemClock` in `clock.ts` already uses local getters. No change; a test pins it (TC-41).

Weekday rule: bare weekday `W` from meeting day `M` is `M + ((W - M + 7) % 7 || 7)` (strictly after). `next W` is the Monday of the following ISO week plus the offset of `W`. Example: meeting Mon 2026-10-05; bare `Tuesday` gives 2026-10-06; `next Tuesday` gives 2026-10-13.

Rollover rule: for a year-less candidate, take the meeting year. If that date is before `meeting minus 6 calendar months`, use year + 1. Exactly 6 months before is not "more than", so it stays. Month-end clamping: decision OQ-12.

Phrase rule (D48): scan introducers `by`, `due`, `on`, `from`, `for <month name>`. Each candidate phrase is resolved with `resolveDue`. The last one that resolves becomes `due`; its phrase and the dash or comma that joined it are removed from `taskText`. Unresolved phrases stay in `taskText`. Flag when a `by`, `due` or `for <month>` phrase fails and no later phrase resolves. An earlier resolved phrase does not cancel the flag (decision OQ-2).

## Error and flag handling
- User wording never throws. Unresolvable wording gives `kind: "flagged"` (in `resolveDue`) or `dueFlagged: true` with `due: null` (in `findDuePhrase`). Stored form is `due = null`, `dueFlagged = true`; the wording itself is not stored (decision OQ-14).
- A weekday that disagrees with an explicit date returns `kind: "date"` with a `warning` string. The explicit date wins. Ingest turns the warning into exit 1 (spec 06).
- Invalid calendar dates (`2026-02-30`, `29 Feb` in a non-leap year) are treated as unresolvable wording (decision OQ-10).
- `parseCliDate` is the only function here that throws. The error is a user error (exit 2 via cli).

## Dependencies
Consumes:
- Spec 01: the meeting date as an `IsoDate` (D2.1, D21) and the checkbox text (D12, D26).
- `src/domain/types.ts`: `IsoDate`, `ItemStatus`, `StoredStatus`. `src/domain/errors.ts`: `ActiontrackError`.
- `src/clock.ts`: `Clock`, `fixedClock`, `systemClock`.
- Spec 03: the owner has already been removed from the text. This spec does not split owners.

Produces:
- Spec 04: `taskText` with the resolved phrase removed (D49.1). Dedupe uses it for matching (spec 04 says the same).
- Spec 05: `due: IsoDate | null` and `dueFlagged: boolean`. No `overdue` field.
- Spec 06: `warning` strings and flagged counts for the ingest summary.
- Spec 07: `statusOf`, `parseCliDate` for `--due-before`.
- Spec 09: `statusOf` to pick open and overdue items for follow-up (D7.2).
- Spec 11: `Clock` and `--today` value; `parseCliDate` error shape for exit 2.

## Risks
- False flags. `by 10%`, `by email`, `for September board`, `by Acme` all flag by the spec rules (D48.2). Real notes will show `?` often. This is spec-mandated and accepted (decision OQ-20).
- Conflict between D48.1 and D48.2 when a resolved phrase is followed by a failing `by` phrase. Resolved by decision OQ-2: the resolved date is kept and the item is flagged.
- Week-start ambiguity around Sundays. Fixed by decision OQ-3 (ISO week, Monday start).
- Stub signature `resolveDue(wording, meetingDate)` cannot remove phrases from task text. Resolved by decision OQ-1 (new export `findDuePhrase`).
- Timezone: NFR-C4 is still open. The local-date rule of D1.3 is decided for this spec (decision OQ-16).
- Off-by-one at month ends and rollover boundaries. Mitigate with table tests (TC-22, TC-23, TC-10).
- Sample evidence in D47 (`by Mon (2026-09-18)`): the parentheses are read as meeting dates (decision OQ-19).

## Decisions

Each line below is settled for this spec. Record them as D77+ in `docs/FRD.md` in a separate change.

- OQ-1: `resolveDue(wording, meetingDate)` resolves one phrase; `findDuePhrase(text, meetingDate)` is added as a new export for whole-item text.
- OQ-2: An earlier phrase that resolves and a later failing `by`/`due`/`for <month>` phrase in the same task keep the resolved date and flag the item (e.g. `by Friday` and `by mid-October`: store Friday, flagged).
- OQ-3: `next week` is the ISO week (Monday to Sunday) after the meeting's week; for a Sunday meeting 2026-10-11, `next week` is 2026-10-12 and `next Tuesday` is 2026-10-13.
- OQ-4: Bare weekday is the next occurrence strictly after the meeting day; `next <weekday>` is in the following ISO week (Mon 2026-10-05: `Tuesday` is 10-06, `next Tuesday` is 10-13).
- OQ-5: All wording is case-insensitive (`BY Friday`, `Due`, `Tomorrow`, `Next Week`); the owner `to` stays case-sensitive (D67.1).
- OQ-6: Month names accept full English names, three-letter abbreviations, and `Sept`; other spellings are unresolvable.
- OQ-7: Unlisted wording (e.g. `by today`, `tomorrow EOD`, `EOD Friday`, `end of the month`, `2026/10/09`, `10.10.2026`) stores no date and is flagged when introduced by `by`/`due`; `for 4 Mar` stays in the text and is not flagged.
- OQ-8: `03/04` is never guessed; it is flagged when introduced by by/due/for and kept as plain text when introduced by on/from.
- OQ-9: An ordinal suffix must match its number (1st, 2nd, 3rd, 4th, 21st, 31st); `Oct 2th` is unresolvable.
- OQ-10: Invalid or non-leap calendar dates are unresolvable (flagged when introduced by by/due/for); `by 2028-02-29` resolves.
- OQ-11: An explicit ISO date is stored as written, even outside the meeting window (`by 2026-01-05` in a 2026-09-03 meeting stores 2026-01-05).
- OQ-12: The rollover cutoff is the meeting date minus 6 calendar months, clamped to month end (31 Aug minus 6 months = 28 or 29 Feb); a date exactly on the cutoff does not roll.
- OQ-13: Rollover runs before the weekday check (meeting 2026-12-01, `Tue 5 Jan` gives 2027-01-05, a Tuesday, no warning).
- OQ-14: The stored flag is the `dueFlagged` boolean only; unresolved wording is reported by ingest but not stored. Specs 05 and 06 use this form.
- OQ-15: The CLI accepts `4 Mar` and `4 March 2026` (D31.6 via D10); weekday names, `today` and slash dates are errors.
- OQ-16: `today` is the machine's local calendar date (D1.3), via `systemClock`'s local getters. This is decided for this spec; NFR-C4 is still open and is not closed by this decision.
- OQ-17: A year-less date far in the future uses the meeting's year, with no rollback (D34.1).
- OQ-18: The resolved phrase is removed together with one adjoining dash or comma, then spaces are trimmed; the exact output string is fixed by TC-29.
- OQ-19: Parenthesised dates in the D47 sample (`by Mon (2026-09-18)`) are meeting dates, not due dates; check the sample folder before writing acceptance tests.
- OQ-20: `for <month name>` in task text is flagged by D48.2 (e.g. `Prep deck for September board`); this is kept as specified and recorded as a known false-positive class.
